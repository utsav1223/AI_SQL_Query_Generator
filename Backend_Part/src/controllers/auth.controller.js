const asyncHandler = require("../middlewares/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const authService = require("../services/auth.service");
const accessAppealService = require("../services/accessAppeal.service");
const paymentService = require("../services/payment.service");
const { getRequestMeta } = require("../utils/request");
const {
  clearUserAuthCookie
} = require("../utils/sessionCookies");

exports.logout = asyncHandler(async (req, res) => {
  clearUserAuthCookie(res);

  return sendResponse(res, {
    message: "Logout successful"
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUserProfile(req.user.userId);
  const billing = await paymentService.getCurrentBillingState(req.user);
  const personalPlan = user.plan || "free";

  return sendResponse(res, {
    message: "User fetched successfully",
    data: {
      ...user,
      personalPlan,
      plan: billing.plan,
      billing,
      activeWorkspace: {
        orgId: req.user.orgId || null,
        orgRole: req.user.orgRole || null,
        orgPermissions: req.user.orgPermissions || [],
        plan: billing.plan,
        billing
      }
    }
  });
});

exports.submitAccessAppeal = asyncHandler(async (req, res) => {
  const appeal = await accessAppealService.createAccessAppeal({
    req,
    message: req.body?.message,
    requestMeta: getRequestMeta(req)
  });

  return sendResponse(res, {
    message: "Your request has been sent to the admin team.",
    data: {
      appeal
    }
  });
});
