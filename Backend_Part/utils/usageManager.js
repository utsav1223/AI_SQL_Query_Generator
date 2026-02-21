const User = require("../models/User");

const FREE_CREDIT_LIMIT = 5;

const resetDailyUsageIfNeeded = async (user) => {
  // Free credits no longer reset daily. Keep function for backward compatibility
  // with existing call sites.
  if (!user) {
    return false;
  }
  return false;
};

const checkAndUpdateUsage = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (user.plan === "pro") {
    return;
  }

  if ((user.dailyUsage || 0) >= FREE_CREDIT_LIMIT) {
    throw new Error("FREE_LIMIT_REACHED");
  }

  user.dailyUsage = (user.dailyUsage || 0) + 1;
  await user.save();
};

module.exports = {
  FREE_CREDIT_LIMIT,
  resetDailyUsageIfNeeded,
  checkAndUpdateUsage
};
