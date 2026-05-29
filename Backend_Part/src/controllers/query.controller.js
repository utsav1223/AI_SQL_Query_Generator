const asyncHandler = require("../middlewares/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const queryService = require("../services/query.service");

exports.getUserQueries = asyncHandler(async (req, res) => {
  const result = await queryService.getUserQueries(req.user, req.query);

  return sendResponse(res, {
    message: "Query history fetched successfully",
    data: result
  });
});

exports.deleteQuery = asyncHandler(async (req, res) => {
  await queryService.deleteUserQuery(req.user, req.params.id);

  return sendResponse(res, {
    message: "Query deleted successfully"
  });
});

exports.getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await queryService.getUserAnalytics(req.user);

  return sendResponse(res, {
    message: "Analytics fetched successfully",
    data: analytics
  });
});

exports.getAdvancedAnalytics = asyncHandler(async (req, res) => {
  const analytics = await queryService.getAdvancedUserAnalytics(req.user);

  return sendResponse(res, {
    message: "Advanced analytics fetched successfully",
    data: analytics
  });
});

exports.togglePin = asyncHandler(async (req, res) => {
  const result = await queryService.togglePinnedQuery(req.user, req.params.id);

  return sendResponse(res, {
    message: "Pin status updated successfully",
    data: result
  });
});

exports.toggleFavorite = asyncHandler(async (req, res) => {
  const result = await queryService.toggleFavoriteQuery(req.user, req.params.id);

  return sendResponse(res, {
    message: "Favorite status updated successfully",
    data: result
  });
});

exports.updateTags = asyncHandler(async (req, res) => {
  const result = await queryService.updateQueryTags(req.user, req.params.id, req.body.tags);

  return sendResponse(res, {
    message: "Query tags updated successfully",
    data: result
  });
});

exports.trackAction = asyncHandler(async (req, res) => {
  const result = await queryService.trackQueryAction(req.user, req.params.id, req.body.action);

  return sendResponse(res, {
    message: "Query action tracked successfully",
    data: result
  });
});

exports.getOverview = asyncHandler(async (req, res) => {
  const overview = await queryService.getUserOverview(req.user);

  return sendResponse(res, {
    message: "Overview fetched successfully",
    data: overview
  });
});
