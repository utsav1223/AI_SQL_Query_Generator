const asyncHandler = require("../middlewares/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const { getRequestMeta } = require("../utils/request");
const aiService = require("../services/ai.service");

exports.handleAI = asyncHandler(async (req, res) => {
  const result = await aiService.runAiRequest({
    userId: req.user.userId,
    mode: req.body.mode,
    prompt: req.body.prompt,
    sql: req.body.sql,
    dialect: req.body.dialect,
    requestMeta: getRequestMeta(req)
  });

  return sendResponse(res, {
    message:
      req.body.mode === "format"
        ? "SQL formatted successfully"
        : "AI request completed successfully",
    data: result
  });
});
