const asyncHandler = require("../middlewares/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const { getRequestMeta } = require("../utils/request");
const adminService = require("../services/admin.service");

exports.adminLogin = asyncHandler(async (req, res) => {
  const result = await adminService.loginAdmin({
    ...req.body,
    requestMeta: getRequestMeta(req)
  });

  return sendResponse(res, {
    message: "Admin login successful",
    data: result
  });
});

exports.getAdminMe = asyncHandler(async (req, res) => {
  const admin = adminService.getAdminProfile(req.admin.adminId);

  return sendResponse(res, {
    message: "Admin profile fetched successfully",
    data: admin
  });
});

exports.getAdminOverview = asyncHandler(async (req, res) => {
  const overview = await adminService.getAdminOverview();

  return sendResponse(res, {
    message: "Admin overview fetched successfully",
    data: overview
  });
});

exports.getAdminUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getAdminUsers(req.query);

  return sendResponse(res, {
    message: "Users fetched successfully",
    data: users
  });
});

exports.moderateUserByAdmin = asyncHandler(async (req, res) => {
  const result = await adminService.moderateUserByAdmin({
    adminId: req.admin?.adminId,
    requestMeta: getRequestMeta(req),
    userId: req.params.userId,
    action: req.body?.action,
    reason: req.body?.reason || req.query?.reason
  });

  return sendResponse(res, {
    message: result.message,
    data: {
      action: result.action,
      user: result.user
    }
  });
});

exports.updateUserPlanByAdmin = asyncHandler(async (req, res) => {
  const result = await adminService.updateUserPlanByAdmin({
    adminId: req.admin?.adminId,
    requestMeta: getRequestMeta(req),
    userId: req.params.userId,
    plan: req.body?.plan,
    reason: req.body?.reason || req.query?.reason
  });

  return sendResponse(res, {
    message: result.message,
    data: {
      action: result.action,
      user: result.user
    }
  });
});

exports.deleteUserByAdmin = asyncHandler(async (req, res) => {
  const result = await adminService.deleteUserByAdmin({
    adminId: req.admin?.adminId,
    requestMeta: getRequestMeta(req),
    userId: req.params.userId,
    reason: req.body?.reason || req.query?.reason
  });

  return sendResponse(res, {
    message: result.message,
    data: {
      action: result.action,
      user: result.user
    }
  });
});

exports.getAdminFeedback = asyncHandler(async (req, res) => {
  const feedback = await adminService.getAdminFeedback(req.query);

  return sendResponse(res, {
    message: "Feedback fetched successfully",
    data: feedback
  });
});

exports.updateFeedbackStatusByAdmin = asyncHandler(async (req, res) => {
  const feedback = await adminService.updateFeedbackStatus({
    feedbackId: req.params.feedbackId,
    status: req.body?.status,
    adminNote: req.body?.adminNote
  });

  return sendResponse(res, {
    message: "Feedback updated successfully",
    data: {
      feedback
    }
  });
});

exports.getAdminSecurityEvents = asyncHandler(async (req, res) => {
  const events = await adminService.getAdminSecurityEvents(req.query);

  return sendResponse(res, {
    message: "Security events fetched successfully",
    data: events
  });
});

exports.updateSecurityEventStatusByAdmin = asyncHandler(async (req, res) => {
  const event = await adminService.updateSecurityEventStatus({
    adminId: req.admin?.adminId,
    eventId: req.params.eventId,
    status: req.body?.status
  });

  return sendResponse(res, {
    message: "Security event status updated successfully",
    data: {
      event
    }
  });
});
