const asyncHandler = require("../middlewares/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const { getRequestMeta } = require("../utils/request");
const aiService = require("../services/ai.service");

exports.handleAI = asyncHandler(async (req, res) => {
  const result = await aiService.runAiRequest({
    actor: req.user,
    mode: req.body.mode,
    prompt: req.body.prompt,
    sql: req.body.sql,
    dialect: req.body.dialect,
    requestMeta: getRequestMeta(req)
  });

  const message =
    req.body.mode === "format"
      ? "SQL formatted successfully"
      : req.body.mode === "schema"
        ? "Schema generated successfully"
        : "AI request completed successfully";

  return sendResponse(res, {
    message,
    data: result
  });
});
