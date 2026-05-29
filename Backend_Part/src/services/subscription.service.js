const User = require("../models/User");
const OrganizationSubscription = require("../models/OrganizationSubscription");
const { isPaidPlan } = require("../utils/planAccess");

const PLAN_PRICES_INR = {
  pro: 499,
  team: 1499
};
const PLAN_SEATS_INCLUDED = {
  pro: 1,
  team: 5
};
const SUBSCRIPTION_AMOUNT_INR = PLAN_PRICES_INR.pro;
const SUBSCRIPTION_AMOUNT_PAISE = SUBSCRIPTION_AMOUNT_INR * 100;

const getPlanPriceInr = (plan) => PLAN_PRICES_INR[plan] || 0;

const getPlanAmountPaise = (plan) => getPlanPriceInr(plan) * 100;

const getNextRenewalDate = (baseDate = new Date()) => {
  const renewalDate = new Date(baseDate);
  renewalDate.setMonth(renewalDate.getMonth() + 1);
  return renewalDate;
};

const activateUserPlan = async (user, plan, renewalDate = getNextRenewalDate()) => {
  user.plan = plan;
  user.billingStatus = "active";
  user.billingRenewal = renewalDate;
  user.teamSize = PLAN_SEATS_INCLUDED[plan] || 1;
  await user.save();
  return user;
};

const activateProPlan = (user, renewalDate = getNextRenewalDate()) =>
  activateUserPlan(user, "pro", renewalDate);

const activateTeamPlan = (user, renewalDate = getNextRenewalDate()) =>
  activateUserPlan(user, "team", renewalDate);

const downgradeUserToFree = async (user) => {
  user.plan = "free";
  user.billingStatus = "free";
  user.billingRenewal = null;
  user.teamSize = 1;
  await user.save();
  return user;
};

const activateOrganizationTeam = async ({
  clerkOrgId,
  renewalDate = getNextRenewalDate(),
  providerPaymentId = null,
  providerOrderId = null,
  providerSubscriptionId = null,
  providerCustomerId = null,
  createdByClerkUserId = null,
  lastWebhookEventId = null
}) => {
  return OrganizationSubscription.findOneAndUpdate(
    { clerkOrgId },
    {
      $set: {
        plan: "team",
        status: "active",
        billingProvider: "razorpay",
        providerPaymentId,
        providerOrderId,
        providerSubscriptionId,
        providerCustomerId,
        currentPeriodEnd: renewalDate,
        seatsIncluded: PLAN_SEATS_INCLUDED.team,
        createdByClerkUserId,
        lastWebhookEventId
      },
      $setOnInsert: {
        seatsUsed: 1
      }
    },
    {
      new: true,
      upsert: true
    }
  );
};

const downgradeOrganizationToFree = async (clerkOrgId) => {
  if (!clerkOrgId) {
    return null;
  }

  return OrganizationSubscription.findOneAndUpdate(
    { clerkOrgId },
    {
      $set: {
        plan: "free",
        status: "free",
        currentPeriodEnd: null
      }
    },
    { new: true }
  );
};

const downgradeExpiredUserIfNeeded = async (user) => {
  if (!user) {
    return user;
  }

  const hasExpiredPlan =
    isPaidPlan(user) &&
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
    plan: { $in: ["pro", "team", "business"] },
    billingRenewal: { $lt: now }
  });

  for (const user of expiredUsers) {
    await downgradeUserToFree(user);
  }

  return expiredUsers.length;
};

const downgradeExpiredOrganizationSubscriptions = async () => {
  const now = new Date();
  const expiredSubscriptions = await OrganizationSubscription.find({
    plan: { $in: ["team", "business"] },
    currentPeriodEnd: { $lt: now }
  });

  for (const subscription of expiredSubscriptions) {
    await downgradeOrganizationToFree(subscription.clerkOrgId);
  }

  return expiredSubscriptions.length;
};

const downgradeExpiredSubscriptions = async () => {
  const [users, organizations] = await Promise.all([
    downgradeExpiredProUsers(),
    downgradeExpiredOrganizationSubscriptions()
  ]);

  return {
    users,
    organizations
  };
};

module.exports = {
  PLAN_PRICES_INR,
  PLAN_SEATS_INCLUDED,
  SUBSCRIPTION_AMOUNT_INR,
  SUBSCRIPTION_AMOUNT_PAISE,
  getPlanPriceInr,
  getPlanAmountPaise,
  getNextRenewalDate,
  activateUserPlan,
  activateProPlan,
  activateTeamPlan,
  activateOrganizationTeam,
  downgradeUserToFree,
  downgradeOrganizationToFree,
  downgradeExpiredUserIfNeeded,
  downgradeExpiredProUsers,
  downgradeExpiredOrganizationSubscriptions,
  downgradeExpiredSubscriptions
};
