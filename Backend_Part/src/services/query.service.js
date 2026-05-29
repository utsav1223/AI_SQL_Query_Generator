const Query = require("../models/Query");
const User = require("../models/User");
const SchemaModel = require("../models/Schema");
const AppError = require("../utils/AppError");
const { FREE_CREDIT_LIMIT, resetDailyUsageIfNeeded } = require("../utils/usageManager");
const { hasPlan } = require("../utils/planAccess");
const { getEffectivePlanForActor } = require("../utils/effectivePlan");
const {
  normalizeActor,
  withWorkspaceScope
} = require("../utils/workspaceScope");

const FREE_HISTORY_LIMIT = 10;
const ADVANCED_ANALYTICS_QUERY_SAMPLE_LIMIT = 500;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MODE_TIME_SAVED_MINUTES = {
  generate: 10,
  optimize: 5,
  validate: 5,
  explain: 5,
  format: 2,
  schema: 8
};

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

const getUserQueries = async (actorOrUserId, options = {}) => {
  const actor = normalizeActor(actorOrUserId);
  const safePage = Math.max(parseInt(options.page || "1", 10), 1);
  const safeLimit = Math.min(Math.max(parseInt(options.limit || "10", 10), 1), 50);
  const mode = String(options.mode || "all").trim().toLowerCase();
  const search = String(options.search || "").trim().slice(0, 120);
  const sortOrder = String(options.sort || "newest").trim().toLowerCase();
  const skip = (safePage - 1) * safeLimit;
  const user = await User.findById(actor.userId).select("plan");
  const effectivePlan = await getEffectivePlanForActor(actor, user);
  const hasFullHistory = hasPlan(effectivePlan, "pro");
  const extraFilter = {};

  let freeAccessibleIds = [];

  if (!hasFullHistory) {
    freeAccessibleIds = await Query.find(withWorkspaceScope(actor))
      .sort({ createdAt: -1 })
      .limit(FREE_HISTORY_LIMIT)
      .select("_id")
      .lean();

    extraFilter._id = { $in: freeAccessibleIds.map((query) => query._id) };
  }

  if (["generate", "optimize", "validate", "explain", "format", "schema"].includes(mode)) {
    extraFilter.mode = mode;
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    extraFilter.$or = [
      { prompt: { $regex: safeSearch, $options: "i" } },
      { generatedSQL: { $regex: safeSearch, $options: "i" } }
    ];
  }

  const filter = withWorkspaceScope(actor, extraFilter);

  const sort = {
    pinned: -1,
    createdAt: sortOrder === "oldest" ? 1 : -1
  };

  const [queries, total] = await Promise.all([
    Query.find(filter).sort(sort).skip(skip).limit(safeLimit),
    Query.countDocuments(filter)
  ]);

  const allHistoryCount = hasFullHistory
    ? total
    : await Query.countDocuments(withWorkspaceScope(actor));

  return {
    queries,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.max(Math.ceil(total / safeLimit), 1)
    },
    accessPolicy: {
      fullHistory: hasFullHistory,
      visibleLimit: hasFullHistory ? null : FREE_HISTORY_LIMIT,
      hiddenCount: hasFullHistory ? 0 : Math.max(allHistoryCount - FREE_HISTORY_LIMIT, 0)
    }
  };
};

const deleteUserQuery = async (actorOrUserId, queryId) => {
  const actor = normalizeActor(actorOrUserId);
  const deletedQuery = await Query.findOneAndDelete(
    withWorkspaceScope(actor, { _id: queryId })
  );

  if (!deletedQuery) {
    throw new AppError(404, "Query not found");
  }
};

const getUserAnalytics = async (actorOrUserId) => {
  const actor = normalizeActor(actorOrUserId);
  const workspaceFilter = withWorkspaceScope(actor);

  const [total, modes] = await Promise.all([
    Query.countDocuments(workspaceFilter),
    Query.aggregate([
      { $match: workspaceFilter },
      { $group: { _id: "$mode", count: { $sum: 1 } } }
    ])
  ]);

  return {
    total,
    modes
  };
};

const getAdvancedUserAnalytics = async (actorOrUserId) => {
  const actor = normalizeActor(actorOrUserId);
  const workspaceFilter = withWorkspaceScope(actor);

  const [totalQueries, modeStats, dailyStats, queries, schemaData] = await Promise.all([
    Query.countDocuments(workspaceFilter),
    Query.aggregate([
      { $match: workspaceFilter },
      { $group: { _id: "$mode", count: { $sum: 1 } } }
    ]),
    Query.aggregate([
      { $match: workspaceFilter },
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
    Query.find(workspaceFilter)
      .sort({ createdAt: -1 })
      .limit(ADVANCED_ANALYTICS_QUERY_SAMPLE_LIMIT)
      .select("mode prompt generatedSQL copyCount exportCount pinned favorite tags createdAt")
      .lean(),
    SchemaModel.findOne(workspaceFilter).lean()
  ]);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [weeklyQueries, lastWeekQueries] = await Promise.all([
    Query.countDocuments(withWorkspaceScope(actor, { createdAt: { $gte: sevenDaysAgo } })),
    Query.countDocuments(withWorkspaceScope(actor, {
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
    }))
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
      sampleSize: queries.length,
      sampleLimit: ADVANCED_ANALYTICS_QUERY_SAMPLE_LIMIT,
      lastSuccessfulGeneration: queries[0]?.createdAt || null
    },
    insights
  };
};

const togglePinnedQuery = async (actorOrUserId, queryId) => {
  const actor = normalizeActor(actorOrUserId);
  const query = await Query.findOne(withWorkspaceScope(actor, { _id: queryId }));

  if (!query) {
    throw new AppError(404, "Query not found");
  }

  query.pinned = !query.pinned;
  await query.save();

  return {
    pinned: query.pinned
  };
};

const toggleFavoriteQuery = async (actorOrUserId, queryId) => {
  const actor = normalizeActor(actorOrUserId);
  const query = await Query.findOne(withWorkspaceScope(actor, { _id: queryId }));

  if (!query) {
    throw new AppError(404, "Query not found");
  }

  query.favorite = !query.favorite;
  await query.save();

  return {
    favorite: query.favorite
  };
};

const updateQueryTags = async (actorOrUserId, queryId, tags = []) => {
  const actor = normalizeActor(actorOrUserId);
  const query = await Query.findOne(withWorkspaceScope(actor, { _id: queryId }));

  if (!query) {
    throw new AppError(404, "Query not found");
  }

  query.tags = normalizeTags(tags);
  await query.save();

  return {
    tags: query.tags
  };
};

const trackQueryAction = async (actorOrUserId, queryId, action) => {
  const actor = normalizeActor(actorOrUserId);
  const fieldMap = {
    copy: { countField: "copyCount", dateField: "copiedAt" },
    export: { countField: "exportCount", dateField: "exportedAt" }
  };
  const actionFields = fieldMap[String(action || "").trim().toLowerCase()];

  if (!actionFields) {
    throw new AppError(400, "Invalid query action");
  }

  const updatedQuery = await Query.findOneAndUpdate(
    withWorkspaceScope(actor, { _id: queryId }),
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

const getUserOverview = async (actorOrUserId) => {
  const actor = normalizeActor(actorOrUserId);
  const user = await User.findById(actor.userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  await resetDailyUsageIfNeeded(user);
  const effectivePlan = await getEffectivePlanForActor(actor, user);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalQueries, todayQueries, recentQueries] = await Promise.all([
    Query.countDocuments(withWorkspaceScope(actor)),
    Query.countDocuments(withWorkspaceScope(actor, { createdAt: { $gte: todayStart } })),
    Query.find(withWorkspaceScope(actor)).sort({ createdAt: -1 }).limit(5)
  ]);

  if (!hasPlan(effectivePlan, "pro")) {
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
      { $match: withWorkspaceScope(actor) },
      { $group: { _id: "$mode", count: { $sum: 1 } } }
    ]),
    Query.aggregate([
      { $match: withWorkspaceScope(actor) },
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
    plan: effectivePlan || "pro",
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
