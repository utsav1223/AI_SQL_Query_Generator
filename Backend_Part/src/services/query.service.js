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
const { accumulateQueryAnalytics } = require("../dsa/analytics/queryAccumulator");
const { getOffsetPagination, buildPaginationMeta } = require("../dsa/pagination/cursorPagination");
const { buildRegexSearchFilter } = require("../dsa/search/querySearch");

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

const getUserQueries = async (actorOrUserId, options = {}) => {
  const actor = normalizeActor(actorOrUserId);
  const { page: safePage, limit: safeLimit, skip } = getOffsetPagination({
    page: options.page,
    limit: options.limit,
    maxLimit: 50
  });
  const mode = String(options.mode || "all").trim().toLowerCase();
  const search = String(options.search || "").trim().slice(0, 120);
  const sortOrder = String(options.sort || "newest").trim().toLowerCase();
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
    Object.assign(extraFilter, buildRegexSearchFilter(search, ["prompt", "generatedSQL"]));
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
    pagination: buildPaginationMeta({ total, page: safePage, limit: safeLimit }),
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
  const analytics = accumulateQueryAnalytics(queries, {
    modeTimeSavedMinutes: MODE_TIME_SAVED_MINUTES,
    topTableLimit: 6
  });
  const {
    estimatedMinutesSaved,
    copiedQueries,
    exportedQueries,
    pinnedQueries,
    favoriteQueries,
    taggedQueries,
    validationChangedCount,
    topTables,
    sqlQuality
  } = analytics;
  const validationPassRate =
    validateCount > 0
      ? (((validateCount - validationChangedCount) / validateCount) * 100).toFixed(1)
      : "N/A";
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
