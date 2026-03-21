const asyncHandler = require("../middlewares/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const feedbackService = require("../services/feedback.service");

exports.createFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.createFeedbackForUser(req.user.userId, req.body);

  return sendResponse(res, {
    statusCode: 201,
    message: "Feedback submitted successfully",
    data: feedback
  });
});

exports.getMyFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.getUserFeedbackHistory(req.user.userId);

  return sendResponse(res, {
    message: "Feedback history fetched successfully",
    data: feedback
  });
});
