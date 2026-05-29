const User = require("../models/User");
const AppError = require("../utils/AppError");
const { getPublicUser } = require("../utils/auth");
const { downgradeExpiredUserIfNeeded } = require("./subscription.service");

const getCurrentUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  await downgradeExpiredUserIfNeeded(user);
  return getPublicUser(user);
};

module.exports = {
  getCurrentUserProfile
};
