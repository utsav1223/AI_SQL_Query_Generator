const User = require("../models/User");
const AppError = require("../utils/AppError");
const { getPublicUser } = require("../utils/auth");
const { downgradeExpiredUserIfNeeded } = require("./subscription.service");
const { getAccountRestrictionForUser } = require("./accountRestriction.service");

const getCurrentUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  await downgradeExpiredUserIfNeeded(user);
  const publicUser = getPublicUser(user);
  const accountRestriction = await getAccountRestrictionForUser(user);

  if (accountRestriction) {
    publicUser.accountRestriction = accountRestriction;
  }

  return publicUser;
};

module.exports = {
  getCurrentUserProfile
};
