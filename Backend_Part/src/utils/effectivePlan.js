const User = require("../models/User");
const OrganizationSubscription = require("../models/OrganizationSubscription");
const { hasPlan, normalizePlan } = require("./planAccess");
const { normalizeActor } = require("./workspaceScope");

const ACTIVE_BILLING_STATUSES = new Set(["active", "trialing", "paid"]);

const isFutureDate = (value) => {
  if (!value) {
    return true;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date >= new Date();
};

const isOrganizationSubscriptionActive = (subscription) => {
  if (!subscription) {
    return false;
  }

  return (
    hasPlan(subscription.plan, "team") &&
    ACTIVE_BILLING_STATUSES.has(String(subscription.status || "").toLowerCase()) &&
    isFutureDate(subscription.currentPeriodEnd)
  );
};

const isUserTeamEntitlementActive = (user) => (
  hasPlan(user?.plan, "team") &&
  ACTIVE_BILLING_STATUSES.has(String(user?.billingStatus || "active").toLowerCase()) &&
  isFutureDate(user?.billingRenewal)
);

const getOrganizationEffectivePlan = async (clerkOrgId, userDoc = null) => {
  if (!clerkOrgId) {
    return {
      scope: "organization",
      plan: "free",
      status: "free",
      source: "none",
      subscription: null
    };
  }

  const subscription = await OrganizationSubscription.findOne({ clerkOrgId });

  if (!isOrganizationSubscriptionActive(subscription)) {
    if (isUserTeamEntitlementActive(userDoc)) {
      return {
        scope: "organization",
        plan: "team",
        status: userDoc.billingStatus || "active",
        source: "personal_team_entitlement",
        subscription: null,
        renewal: userDoc.billingRenewal || null
      };
    }

    return {
      scope: "organization",
      plan: "free",
      status: subscription?.status || "free",
      source: "none",
      subscription
    };
  }

  return {
    scope: "organization",
    plan: normalizePlan(subscription.plan),
    status: subscription.status || "active",
    source: "organization_subscription",
    subscription
  };
};

const getEffectivePlanForActor = async (actorOrUserId, userDoc = null) => {
  const actor = normalizeActor(actorOrUserId);
  const user = userDoc || (actor.userId ? await User.findById(actor.userId) : null);

  if (actor.orgId) {
    const orgState = await getOrganizationEffectivePlan(actor.orgId, user);
    return orgState.plan;
  }

  return normalizePlan(user?.plan);
};

const buildBillingStateForActor = async (actorOrUserId, userDoc = null) => {
  const actor = normalizeActor(actorOrUserId);
  const user = userDoc || (actor.userId ? await User.findById(actor.userId) : null);

  if (actor.orgId) {
    const orgState = await getOrganizationEffectivePlan(actor.orgId, user);
    const subscription = orgState.subscription;

    return {
      scope: "organization",
      clerkOrgId: actor.orgId,
      plan: orgState.plan,
      status: orgState.status,
      source: orgState.source,
      renewal: subscription?.currentPeriodEnd || orgState.renewal || null,
      seatsIncluded: subscription?.seatsIncluded || 5,
      seatsUsed: subscription?.seatsUsed || 1
    };
  }

  return {
    scope: "personal",
    clerkOrgId: null,
    plan: normalizePlan(user?.plan),
    status: user?.billingStatus || user?.plan || "free",
    source: "personal_subscription",
    renewal: user?.billingRenewal || null,
    seatsIncluded: hasPlan(user?.plan, "team") ? 5 : 1,
    seatsUsed: 1
  };
};

module.exports = {
  ACTIVE_BILLING_STATUSES,
  isOrganizationSubscriptionActive,
  getOrganizationEffectivePlan,
  getEffectivePlanForActor,
  buildBillingStateForActor
};
