const asyncHandler = require("../middlewares/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const notificationService = require("../services/notification.service");

exports.getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user, req.query);

  return sendResponse(res, {
    message: "Notifications fetched successfully",
    data: result
  });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markNotificationRead(req.user, req.params.notificationId);

  return sendResponse(res, {
    message: "Notification marked as read",
    data: result
  });
});

exports.markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsRead(req.user);

  return sendResponse(res, {
    message: "Notifications marked as read",
    data: result
  });
});
