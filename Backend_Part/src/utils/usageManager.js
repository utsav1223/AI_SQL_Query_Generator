const User = require("../models/User");
const AppError = require("./AppError");

const FREE_CREDIT_LIMIT = 5;

const resetDailyUsageIfNeeded = async (user) => {
  // Free credits no longer reset daily. Keep function for backward compatibility
  // with existing call sites.
  if (!user) {
    return false;
  }
  return false;
};

const assertUsageAvailable = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.plan === "pro") {
    return;
  }

  if ((user.dailyUsage || 0) >= FREE_CREDIT_LIMIT) {
    throw new AppError(
      403,
      "Free 5-credit limit reached. Upgrade to Pro to continue.",
      "LIMIT"
    );
  }
};

const incrementUsage = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.plan === "pro") {
    return;
  }

  user.dailyUsage = (user.dailyUsage || 0) + 1;
  await user.save();
};

module.exports = {
  FREE_CREDIT_LIMIT,
  resetDailyUsageIfNeeded,
  assertUsageAvailable,
  incrementUsage
};
