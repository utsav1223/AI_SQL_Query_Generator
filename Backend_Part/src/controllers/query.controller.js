const asyncHandler = require("../middlewares/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const queryService = require("../services/query.service");

exports.getUserQueries = asyncHandler(async (req, res) => {
  const result = await queryService.getUserQueries(req.user.userId, req.query);

  return sendResponse(res, {
    message: "Query history fetched successfully",
    data: result
  });
});

exports.deleteQuery = asyncHandler(async (req, res) => {
  await queryService.deleteUserQuery(req.user.userId, req.params.id);

  return sendResponse(res, {
    message: "Query deleted successfully"
  });
});

exports.getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await queryService.getUserAnalytics(req.user.userId);

  return sendResponse(res, {
    message: "Analytics fetched successfully",
    data: analytics
  });
});

exports.getAdvancedAnalytics = asyncHandler(async (req, res) => {
  const analytics = await queryService.getAdvancedUserAnalytics(req.user.userId);

  return sendResponse(res, {
    message: "Advanced analytics fetched successfully",
    data: analytics
  });
});

exports.togglePin = asyncHandler(async (req, res) => {
  const result = await queryService.togglePinnedQuery(req.user.userId, req.params.id);

  return sendResponse(res, {
    message: "Pin status updated successfully",
    data: result
  });
});

exports.getOverview = asyncHandler(async (req, res) => {
  const overview = await queryService.getUserOverview(req.user.userId);

  return sendResponse(res, {
    message: "Overview fetched successfully",
    data: overview
  });
});
