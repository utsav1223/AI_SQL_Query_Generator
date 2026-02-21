const mongoose = require("mongoose");
const Query = require("../models/Query");
const User = require("../models/User");
const { FREE_CREDIT_LIMIT, resetDailyUsageIfNeeded } = require("../utils/usageManager");

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

exports.getUserQueries = async (req, res) => {
  try {
    const queries = await Query.find({ userId: req.user.userId }).sort({
      pinned: -1,
      createdAt: -1
    });

    return res.json(queries);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch history" });
  }
};

exports.deleteQuery = async (req, res) => {
  try {
    const deleted = await Query.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!deleted) {
      return res.status(404).json({ message: "Query not found" });
    }

    return res.json({ message: "Deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Delete failed" });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const userId = toObjectId(req.user.userId);

    const [total, modes] = await Promise.all([
      Query.countDocuments({ userId }),
      Query.aggregate([
        { $match: { userId } },
        { $group: { _id: "$mode", count: { $sum: 1 } } }
      ])
    ]);

    return res.json({ total, modes });
  } catch (error) {
    return res.status(500).json({ message: "Analytics failed" });
  }
};

exports.getAdvancedAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.plan !== "pro") {
      return res.status(403).json({ message: "Pro plan required" });
    }

    const userId = toObjectId(req.user.userId);

    const [totalQueries, modeStats, dailyStats] = await Promise.all([
      Query.countDocuments({ userId }),
      Query.aggregate([
        { $match: { userId } },
        { $group: { _id: "$mode", count: { $sum: 1 } } }
      ]),
      Query.aggregate([
        { $match: { userId } },
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
      Query.countDocuments({ userId, createdAt: { $gte: sevenDaysAgo } }),
      Query.countDocuments({
        userId,
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
      })
    ]);

    const growth =
      lastWeekQueries > 0
        ? (((weeklyQueries - lastWeekQueries) / lastWeekQueries) * 100).toFixed(1)
        : weeklyQueries > 0
        ? "100.0"
        : "0.0";

    const avgPerDay =
      dailyStats.length > 0
        ? (dailyStats.reduce((sum, day) => sum + day.count, 0) / dailyStats.length).toFixed(1)
        : "0.0";

    const peakDay =
      dailyStats.length > 0
        ? dailyStats.reduce((max, day) => (day.count > max.count ? day : max))
        : null;

    const mostActiveTool =
      modeStats.length > 0
        ? modeStats.reduce((max, mode) => (mode.count > max.count ? mode : max))._id
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

    return res.json({
      totalQueries,
      modeStats,
      dailyStats,
      weeklyQueries,
      lastWeekQueries,
      growth,
      avgPerDay,
      peakDay,
      mostActiveTool,
      optimizerUsagePercent,
      userLevel
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Analytics failed" });
  }
};

exports.togglePin = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);

    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    if (String(query.userId) !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    query.pinned = !query.pinned;
    await query.save();

    return res.json({ message: "Pin updated", pinned: query.pinned });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update pin" });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const userId = toObjectId(req.user.userId);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await resetDailyUsageIfNeeded(user);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalQueries, todayQueries, recentQueries] = await Promise.all([
      Query.countDocuments({ userId }),
      Query.countDocuments({
        userId,
        createdAt: { $gte: todayStart }
      }),
      Query.find({ userId }).sort({ createdAt: -1 }).limit(5)
    ]);

    if (user.plan === "free") {
      const usedCredits = user.dailyUsage || 0;
      const remainingCredits = Math.max(FREE_CREDIT_LIMIT - usedCredits, 0);

      return res.json({
        plan: "free",
        totalQueries,
        todayQueries,
        freeCreditsUsed: usedCredits,
        freeCreditsLimit: FREE_CREDIT_LIMIT,
        remainingCredits,
        // Backward compatible keys consumed by existing frontend components.
        usedToday: usedCredits,
        dailyLimit: FREE_CREDIT_LIMIT,
        remainingToday: remainingCredits,
        recentQueries
      });
    }

    const [modeStats, dailyStats] = await Promise.all([
      Query.aggregate([
        { $match: { userId } },
        { $group: { _id: "$mode", count: { $sum: 1 } } }
      ]),
      Query.aggregate([
        { $match: { userId } },
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

    return res.json({
      plan: "pro",
      totalQueries,
      todayQueries,
      modeStats,
      dailyStats,
      recentQueries
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Overview failed" });
  }
};
