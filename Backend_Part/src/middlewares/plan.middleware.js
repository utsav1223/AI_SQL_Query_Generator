const User = require("../models/User");

const asyncHandler = require("./asyncHandler");
const AppError = require("../utils/AppError");
const { hasPlan } = require("../utils/planAccess");
const { getEffectivePlanForActor } = require("../utils/effectivePlan");

exports.requirePro = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const effectivePlan = await getEffectivePlanForActor(req.user, user);

  if (!hasPlan(effectivePlan, "pro")) {
    throw new AppError(403, "This feature is available for paid plans only.");
  }

  return next();
});

exports.requirePlan = (minimumPlan = "pro") =>
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const effectivePlan = await getEffectivePlanForActor(req.user, user);

    if (!hasPlan(effectivePlan, minimumPlan)) {
      throw new AppError(403, `This feature requires the ${minimumPlan} plan or higher.`);
    }

    return next();
  });

exports.requireTeamForOrganizationWorkspace = asyncHandler(async (req, res, next) => {
  if (!req.user?.orgId) {
    return next();
  }

  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const effectivePlan = await getEffectivePlanForActor(req.user, user);

  if (!hasPlan(effectivePlan, "team")) {
    throw new AppError(
      403,
      "Organization workspaces require the Team plan. Switch to personal workspace or upgrade to Team.",
      "TEAM_PLAN_REQUIRED"
    );
  }

  return next();
});
