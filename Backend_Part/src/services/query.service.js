const mongoose = require("mongoose");

const Query = require("../models/Query");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { FREE_CREDIT_LIMIT, resetDailyUsageIfNeeded } = require("../utils/usageManager");

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const escapeRegex = (value) => {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getUserQueries = async (userId, options = {}) => {
  const ownerId = toObjectId(userId);
  const safePage = Math.max(parseInt(options.page || "1", 10), 1);
  const safeLimit = Math.min(Math.max(parseInt(options.limit || "10", 10), 1), 50);
  const mode = String(options.mode || "all").trim().toLowerCase();
  const search = String(options.search || "").trim().slice(0, 120);
  const sortOrder = String(options.sort || "newest").trim().toLowerCase();
  const skip = (safePage - 1) * safeLimit;

  const filter = {
    userId: ownerId
  };

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

  return {
    queries,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.max(Math.ceil(total / safeLimit), 1)
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

  const [totalQueries, modeStats, dailyStats] = await Promise.all([
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
    ])
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
  const optimizerUsagePercent =
    totalQueries > 0 ? ((optimizeCount / totalQueries) * 100).toFixed(1) : "0.0";

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
    userLevel
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
  getUserOverview
};
