export const PAID_PLANS = new Set(["pro", "team", "business"]);

export const PLAN_ORDER = {
  free: 0,
  pro: 1,
  team: 2,
  business: 3
};

export const PLAN_LABELS = {
  free: "Free",
  pro: "Professional",
  team: "Team",
  business: "Business"
};

export function normalizePlan(plan) {
  const normalized = String(plan || "free").trim().toLowerCase();
  return Object.hasOwn(PLAN_LABELS, normalized) ? normalized : "free";
}

export function isPaidPlan(plan) {
  return PAID_PLANS.has(normalizePlan(plan));
}

export function hasPlan(plan, minimumPlan = "pro") {
  return PLAN_ORDER[normalizePlan(plan)] >= PLAN_ORDER[normalizePlan(minimumPlan)];
}

export function getPlanLabel(plan) {
  return PLAN_LABELS[normalizePlan(plan)];
}
