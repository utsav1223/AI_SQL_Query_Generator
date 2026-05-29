const User = require("../models/User");
const AppError = require("./AppError");
const { isPaidPlan } = require("./planAccess");

const FREE_CREDIT_LIMIT = 5;

const resetDailyUsageIfNeeded = async (user) => {
  // Free credits no longer reset daily. Keep function for backward compatibility
  // with existing call sites.
  if (!user) {
    return false;
  }
  return false;
};

const assertUsageAvailable = async (userId, effectivePlan = null) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (isPaidPlan(effectivePlan || user)) {
    return;
  }

  if ((user.dailyUsage || 0) >= FREE_CREDIT_LIMIT) {
    throw new AppError(
      403,
      "Free 5-credit limit reached. Upgrade to a paid plan to continue.",
      "LIMIT"
    );
  }
};

const reserveUsage = async (userId, effectivePlan = null) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (isPaidPlan(effectivePlan || user)) {
    return {
      reserved: false,
      user
    };
  }

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      $or: [
        { dailyUsage: { $lt: FREE_CREDIT_LIMIT } },
        { dailyUsage: { $exists: false } }
      ]
    },
    {
      $inc: { dailyUsage: 1 }
    },
    { new: true }
  );

  if (!updatedUser) {
    throw new AppError(
      403,
      "Free 5-credit limit reached. Upgrade to a paid plan to continue.",
      "LIMIT"
    );
  }

  return {
    reserved: true,
    user: updatedUser
  };
};

const refundUsage = async (userId) => {
  await User.findOneAndUpdate(
    {
      _id: userId,
      dailyUsage: { $gt: 0 }
    },
    {
      $inc: { dailyUsage: -1 }
    }
  );
};

module.exports = {
  FREE_CREDIT_LIMIT,
  resetDailyUsageIfNeeded,
  assertUsageAvailable,
  refundUsage,
  reserveUsage
};
