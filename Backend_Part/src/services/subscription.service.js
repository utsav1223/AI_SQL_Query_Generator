const User = require("../models/User");

const SUBSCRIPTION_AMOUNT_INR = 499;
const SUBSCRIPTION_AMOUNT_PAISE = SUBSCRIPTION_AMOUNT_INR * 100;

const getNextRenewalDate = (baseDate = new Date()) => {
  const renewalDate = new Date(baseDate);
  renewalDate.setMonth(renewalDate.getMonth() + 1);
  return renewalDate;
};

const activateProPlan = async (user, renewalDate = getNextRenewalDate()) => {
  user.plan = "pro";
  user.billingRenewal = renewalDate;
  await user.save();
  return user;
};

const downgradeUserToFree = async (user) => {
  user.plan = "free";
  user.billingRenewal = null;
  await user.save();
  return user;
};

const downgradeExpiredUserIfNeeded = async (user) => {
  if (!user) {
    return user;
  }

  const hasExpiredPlan =
    user.plan === "pro" &&
    user.billingRenewal &&
    new Date(user.billingRenewal) < new Date();

  if (hasExpiredPlan) {
    await downgradeUserToFree(user);
  }

  return user;
};

const downgradeExpiredProUsers = async () => {
  const now = new Date();
  const expiredUsers = await User.find({
    plan: "pro",
    billingRenewal: { $lt: now }
  });

  for (const user of expiredUsers) {
    await downgradeUserToFree(user);
  }

  return expiredUsers.length;
};

module.exports = {
  SUBSCRIPTION_AMOUNT_INR,
  SUBSCRIPTION_AMOUNT_PAISE,
  getNextRenewalDate,
  activateProPlan,
  downgradeUserToFree,
  downgradeExpiredUserIfNeeded,
  downgradeExpiredProUsers
};
