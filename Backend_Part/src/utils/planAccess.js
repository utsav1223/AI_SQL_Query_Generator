const PLAN_ORDER = {
  free: 0,
  pro: 1,
  team: 2,
  business: 3
};

const normalizePlan = (plan) => {
  const normalized = String(plan || "free").trim().toLowerCase();
  return Object.hasOwn(PLAN_ORDER, normalized) ? normalized : "free";
};

const planRank = (plan) => PLAN_ORDER[normalizePlan(plan)];

const hasPlan = (userOrPlan, minimumPlan = "pro") => {
  const plan =
    typeof userOrPlan === "string"
      ? userOrPlan
      : userOrPlan?.plan || "free";

  return planRank(plan) >= planRank(minimumPlan);
};

const isPaidPlan = (userOrPlan) => hasPlan(userOrPlan, "pro");

module.exports = {
  PLAN_ORDER,
  normalizePlan,
  hasPlan,
  isPaidPlan
};
