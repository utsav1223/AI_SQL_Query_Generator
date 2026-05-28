const mongoose = require("mongoose");

const Query = require("../models/Query");
const User = require("../models/User");
const SchemaModel = require("../models/Schema");
const AppError = require("../utils/AppError");
const { FREE_CREDIT_LIMIT, resetDailyUsageIfNeeded } = require("../utils/usageManager");

const FREE_HISTORY_LIMIT = 10;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MODE_TIME_SAVED_MINUTES = {
  generate: 10,
  optimize: 5,
  validate: 5,
  explain: 5,
  format: 2
};

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const escapeRegex = (value) => {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeTags = (tags = []) => {
  const tagList = Array.isArray(tags) ? tags : String(tags || "").split(",");

  return [...new Set(
    tagList
      .map((tag) => String(tag || "").trim().toLowerCase().replace(/\s+/g, "-"))
      .filter(Boolean)
      .slice(0, 8)
  )];
};

const buildModeMap = (modeStats = []) => {
  return modeStats.reduce((acc, item) => {
    acc[item._id || "generate"] = item.count || 0;
    return acc;
  }, {});
};

const extractReferencedTables = (sqlText = "") => {
  const tableMatches = [];
  const tablePattern = /\b(?:from|join|update|into)\s+([A-Za-z_][\w.]*|"[^"]+"|`[^`]+`|\[[^\]]+\])/gi;
  let match = tablePattern.exec(String(sqlText || ""));

  while (match) {
    const tableName = String(match[1] || "")
      .replace(/^[`"\[]|[`"\]]$/g, "")
      .split(".")
      .pop()
      .trim();

    if (tableName) {
      tableMatches.push(tableName);
    }

    match = tablePattern.exec(String(sqlText || ""));
  }

  return tableMatches;
};

const assessSqlQuality = (queries = []) => {
  const issueCounters = {
    selectStar: 0,
    missingWhere: 0,
    joinWithoutCondition: 0,
    destructiveStatements: 0
  };
  const riskDistribution = {
    low: 0,
    medium: 0,
    high: 0
  };

  queries.forEach((query) => {
    const sql = String(query.generatedSQL || "");
    const normalizedSql = sql.replace(/\s+/g, " ").trim();
    const hasSelect = /\bselect\b/i.test(normalizedSql);
    const hasJoin = /\bjoin\b/i.test(normalizedSql);
    const hasWhere = /\bwhere\b/i.test(normalizedSql);
    const hasJoinCondition = /\bon\b/i.test(normalizedSql) || /\busing\s*\(/i.test(normalizedSql);
    const hasSelectStar = /\bselect\s+\*/i.test(normalizedSql);
    const hasDestructiveStatement = /\b(drop|truncate|alter|delete)\b/i.test(normalizedSql);

    let risk = "low";

    if (hasSelectStar) {
      issueCounters.selectStar += 1;
      risk = "medium";
    }

    if (hasSelect && !hasWhere && !/\blimit\b/i.test(normalizedSql)) {
      issueCounters.missingWhere += 1;
      risk = "medium";
    }

    if (hasJoin && !hasJoinCondition) {
      issueCounters.joinWithoutCondition += 1;
      risk = "high";
    }

    if (hasDestructiveStatement) {
      issueCounters.destructiveStatements += 1;
      risk = "high";
    }

    riskDistribution[risk] += 1;
  });

  const totalIssues = Object.values(issueCounters).reduce((sum, count) => sum + count, 0);
  const qualityScore =
    queries.length > 0
      ? Math.max(35, Math.round(100 - (totalIssues / queries.length) * 12))
      : 100;

  return {
    issueCounters,
    riskDistribution,
    qualityScore
  };
};

const buildTopTables = (queries = []) => {
  const tableCounts = new Map();

  queries.forEach((query) => {
    extractReferencedTables(query.generatedSQL).forEach((tableName) => {
      tableCounts.set(tableName, (tableCounts.get(tableName) || 0) + 1);
    });
  });

  return [...tableCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
};

const getUserQueries = async (userId, options = {}) => {
  const ownerId = toObjectId(userId);
  const safePage = Math.max(parseInt(options.page || "1", 10), 1);
  const safeLimit = Math.min(Math.max(parseInt(options.limit || "10", 10), 1), 50);
  const mode = String(options.mode || "all").trim().toLowerCase();
  const search = String(options.search || "").trim().slice(0, 120);
  const sortOrder = String(options.sort || "newest").trim().toLowerCase();
  const skip = (safePage - 1) * safeLimit;
  const user = await User.findById(ownerId).select("plan");
  const isPro = user?.plan === "pro";

  const filter = {
    userId: ownerId
  };

  let freeAccessibleIds = [];

  if (!isPro) {
    freeAccessibleIds = await Query.find({ userId: ownerId })
      .sort({ createdAt: -1 })
      .limit(FREE_HISTORY_LIMIT)
      .select("_id")
      .lean();

    filter._id = { $in: freeAccessibleIds.map((query) => query._id) };
  }

  if (["generate", "optimize", "validate", "explain", "format"].includes(mode)) {
    filter.mode = mode;
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { prompt: { $regex: safeSearch, $options: "i" } },
      { generatedSQL: { $regex: safeSearch, $options: "i" } }
    ];
  }

  const sort = {
    pinned: -1,
    createdAt: sortOrder === "oldest" ? 1 : -1
  };

  const [queries, total] = await Promise.all([
    Query.find(filter).sort(sort).skip(skip).limit(safeLimit),
    Query.countDocuments(filter)
  ]);

  const allHistoryCount = isPro
    ? total
    : await Query.countDocuments({ userId: ownerId });

  return {
    queries,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.max(Math.ceil(total / safeLimit), 1)
    },
    accessPolicy: {
      fullHistory: isPro,
      visibleLimit: isPro ? null : FREE_HISTORY_LIMIT,
      hiddenCount: isPro ? 0 : Math.max(allHistoryCount - FREE_HISTORY_LIMIT, 0)
    }
  };
};

const deleteUserQuery = async (userId, queryId) => {
  const deletedQuery = await Query.findOneAndDelete({
    _id: queryId,
    userId
  });

  if (!deletedQuery) {
    throw new AppError(404, "Query not found");
  }
};

const getUserAnalytics = async (userId) => {
  const ownerId = toObjectId(userId);

  const [total, modes] = await Promise.all([
    Query.countDocuments({ userId: ownerId }),
    Query.aggregate([
      { $match: { userId: ownerId } },
      { $group: { _id: "$mode", count: { $sum: 1 } } }
    ])
  ]);

  return {
    total,
    modes
  };
};

const getAdvancedUserAnalytics = async (userId) => {
  const ownerId = toObjectId(userId);

  const [totalQueries, modeStats, dailyStats, queries, schemaData] = await Promise.all([
    Query.countDocuments({ userId: ownerId }),
    Query.aggregate([
      { $match: { userId: ownerId } },
      { $group: { _id: "$mode", count: { $sum: 1 } } }
    ]),
    Query.aggregate([
      { $match: { userId: ownerId } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Query.find({ userId: ownerId }).sort({ createdAt: -1 }).lean(),
    SchemaModel.findOne({ userId: ownerId }).lean()
  ]);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [weeklyQueries, lastWeekQueries] = await Promise.all([
    Query.countDocuments({ userId: ownerId, createdAt: { $gte: sevenDaysAgo } }),
    Query.countDocuments({
      userId: ownerId,
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
    })
  ]);

  const growth =
    lastWeekQueries > 0
      ? (((weeklyQueries - lastWeekQueries) / lastWeekQueries) * 100).toFixed(1)
      : weeklyQueries > 0
      ? "100.0"
      : "0.0";

  const averageQueriesPerDay =
    dailyStats.length > 0
      ? (dailyStats.reduce((sum, day) => sum + day.count, 0) / dailyStats.length).toFixed(1)
      : "0.0";

  const peakDay =
    dailyStats.length > 0
      ? dailyStats.reduce((maxDay, day) => (day.count > maxDay.count ? day : maxDay))
      : null;

  const mostActiveTool =
    modeStats.length > 0
      ? modeStats.reduce((maxMode, mode) => (mode.count > maxMode.count ? mode : maxMode))._id
      : null;

  const optimizeCount = modeStats.find((mode) => mode._id === "optimize")?.count || 0;
  const validateCount = modeStats.find((mode) => mode._id === "validate")?.count || 0;
  const optimizerUsagePercent =
    totalQueries > 0 ? ((optimizeCount / totalQueries) * 100).toFixed(1) : "0.0";
  const modeMap = buildModeMap(modeStats);
  const estimatedMinutesSaved = queries.reduce(
    (sum, query) => sum + (MODE_TIME_SAVED_MINUTES[query.mode] || 4),
    0
  );
  const copiedQueries = queries.filter((query) => (query.copyCount || 0) > 0).length;
  const exportedQueries = queries.filter((query) => (query.exportCount || 0) > 0).length;
  const pinnedQueries = queries.filter((query) => query.pinned).length;
  const favoriteQueries = queries.filter((query) => query.favorite).length;
  const taggedQueries = queries.filter((query) => query.tags?.length > 0).length;
  const validationChangedCount = queries.filter((query) => {
    if (query.mode !== "validate") {
      return false;
    }

    const originalSql = String(query.prompt || "").replace(/\s+/g, " ").trim().toLowerCase();
    const finalSql = String(query.generatedSQL || "").replace(/\s+/g, " ").trim().toLowerCase();
    return Boolean(originalSql && finalSql && originalSql !== finalSql);
  }).length;
  const validationPassRate =
    validateCount > 0
      ? (((validateCount - validationChangedCount) / validateCount) * 100).toFixed(1)
      : "N/A";
  const topTables = buildTopTables(queries);
  const sqlQuality = assessSqlQuality(queries);
  const schemaText = String(schemaData?.schemaText || "").trim();
  const schemaHints = [];

  if (!schemaText) {
    schemaHints.push("Add schema context to improve generated joins and column accuracy.");
  }

  if (topTables[0]) {
    schemaHints.push(`Keep ${topTables[0].name} relationships and indexes documented because it appears most often.`);
  }

  if (sqlQuality.issueCounters.joinWithoutCondition > 0) {
    schemaHints.push("Review join relationships in schema context to reduce join-condition risk.");
  }

  if (sqlQuality.issueCounters.selectStar > 0) {
    schemaHints.push("Ask for exact output columns to avoid broad SELECT * queries.");
  }

  const insights = [
    estimatedMinutesSaved > 0
      ? `Estimated ${Math.round(estimatedMinutesSaved / 60)} hours saved across your SQL workflow.`
      : "Run your first Pro workflow to start measuring time saved.",
    optimizeCount > 0
      ? `Optimizer reviewed ${optimizeCount} queries.`
      : "Use Optimize to get performance-focused rewrite suggestions.",
    validateCount > 0
      ? `Validator changed ${validationChangedCount} of ${validateCount} reviewed queries.`
      : "Use Validate before running important SQL.",
    topTables[0]
      ? `${topTables[0].name} is your most referenced table.`
      : "Generated SQL will reveal your most-used tables here."
  ];

  let userLevel = "Starter";
  if (totalQueries > 500) {
    userLevel = "SQL Expert";
  } else if (totalQueries > 200) {
    userLevel = "Power User";
  }

  return {
    totalQueries,
    modeStats,
    dailyStats,
    weeklyQueries,
    lastWeekQueries,
    growth,
    avgPerDay: averageQueriesPerDay,
    peakDay,
    mostActiveTool,
    optimizerUsagePercent,
    userLevel,
    productivity: {
      estimatedMinutesSaved,
      estimatedHoursSaved: (estimatedMinutesSaved / 60).toFixed(1),
      averageMinutesSaved:
        totalQueries > 0 ? (estimatedMinutesSaved / totalQueries).toFixed(1) : "0.0",
      copiedQueries,
      exportedQueries,
      pinnedQueries,
      favoriteQueries,
      taggedQueries
    },
    quality: {
      score: sqlQuality.qualityScore,
      validationPassRate,
      validationRuns: validateCount,
      queriesFixed: validationChangedCount,
      issueCounters: sqlQuality.issueCounters,
      riskDistribution: sqlQuality.riskDistribution
    },
    schemaCoverage: {
      topTables,
      totalTablesReferenced: topTables.reduce((sum, table) => sum + table.count, 0),
      schemaSaved: Boolean(schemaText),
      hints: schemaHints.slice(0, 4)
    },
    workflow: {
      modeMap,
      generateToReviewCount:
        (modeMap.optimize || 0) + (modeMap.validate || 0) + (modeMap.explain || 0),
      copiedQueries,
      exportedQueries,
      pinnedQueries,
      favoriteQueries
    },
    reliability: {
      model: GEMINI_MODEL,
      lastSuccessfulGeneration: queries[0]?.createdAt || null
    },
    insights
  };
};

const togglePinnedQuery = async (userId, queryId) => {
  const query = await Query.findById(queryId);

  if (!query) {
    throw new AppError(404, "Query not found");
  }

  if (String(query.userId) !== String(userId)) {
    throw new AppError(403, "You can only update your own queries");
  }

  query.pinned = !query.pinned;
  await query.save();

  return {
    pinned: query.pinned
  };
};

const toggleFavoriteQuery = async (userId, queryId) => {
  const query = await Query.findById(queryId);

  if (!query) {
    throw new AppError(404, "Query not found");
  }

  if (String(query.userId) !== String(userId)) {
    throw new AppError(403, "You can only update your own queries");
  }

  query.favorite = !query.favorite;
  await query.save();

  return {
    favorite: query.favorite
  };
};

const updateQueryTags = async (userId, queryId, tags = []) => {
  const query = await Query.findById(queryId);

  if (!query) {
    throw new AppError(404, "Query not found");
  }

  if (String(query.userId) !== String(userId)) {
    throw new AppError(403, "You can only update your own queries");
  }

  query.tags = normalizeTags(tags);
  await query.save();

  return {
    tags: query.tags
  };
};

const trackQueryAction = async (userId, queryId, action) => {
  const fieldMap = {
    copy: { countField: "copyCount", dateField: "copiedAt" },
    export: { countField: "exportCount", dateField: "exportedAt" }
  };
  const actionFields = fieldMap[String(action || "").trim().toLowerCase()];

  if (!actionFields) {
    throw new AppError(400, "Invalid query action");
  }

  const updatedQuery = await Query.findOneAndUpdate(
    {
      _id: queryId,
      userId
    },
    {
      $inc: { [actionFields.countField]: 1 },
      $set: { [actionFields.dateField]: new Date() }
    },
    { new: true }
  );

  if (!updatedQuery) {
    throw new AppError(404, "Query not found");
  }

  return {
    action,
    copyCount: updatedQuery.copyCount,
    exportCount: updatedQuery.exportCount
  };
};

const getUserOverview = async (userId) => {
  const ownerId = toObjectId(userId);
  const user = await User.findById(ownerId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  await resetDailyUsageIfNeeded(user);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalQueries, todayQueries, recentQueries] = await Promise.all([
    Query.countDocuments({ userId: ownerId }),
    Query.countDocuments({
      userId: ownerId,
      createdAt: { $gte: todayStart }
    }),
    Query.find({ userId: ownerId }).sort({ createdAt: -1 }).limit(5)
  ]);

  if (user.plan === "free") {
    const usedCredits = user.dailyUsage || 0;
    const remainingCredits = Math.max(FREE_CREDIT_LIMIT - usedCredits, 0);

    return {
      plan: "free",
      totalQueries,
      todayQueries,
      freeCreditsUsed: usedCredits,
      freeCreditsLimit: FREE_CREDIT_LIMIT,
      remainingCredits,
      usedToday: usedCredits,
      dailyLimit: FREE_CREDIT_LIMIT,
      remainingToday: remainingCredits,
      recentQueries
    };
  }

  const [modeStats, dailyStats] = await Promise.all([
    Query.aggregate([
      { $match: { userId: ownerId } },
      { $group: { _id: "$mode", count: { $sum: 1 } } }
    ]),
    Query.aggregate([
      { $match: { userId: ownerId } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  return {
    plan: "pro",
    totalQueries,
    todayQueries,
    modeStats,
    dailyStats,
    recentQueries
  };
};

module.exports = {
  getUserQueries,
  deleteUserQuery,
  getUserAnalytics,
  getAdvancedUserAnalytics,
  togglePinnedQuery,
  toggleFavoriteQuery,
  updateQueryTags,
  trackQueryAction,
  getUserOverview
};
