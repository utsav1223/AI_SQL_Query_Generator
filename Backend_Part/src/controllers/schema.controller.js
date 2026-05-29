const asyncHandler = require("../middlewares/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const schemaService = require("../services/schema.service");

exports.saveSchema = asyncHandler(async (req, res) => {
  const result = await schemaService.saveSchemaForUser({
    actor: req.user,
    schemaText: req.body.schemaText,
    clear: req.body.clear,
    clearQuery: req.query?.clear
  });

  return sendResponse(res, {
    message: result.message,
    data: result.data
  });
});

exports.getSchema = asyncHandler(async (req, res) => {
  const schema = await schemaService.getSchemaForUser(req.user);

  return sendResponse(res, {
    message: "Schema fetched successfully",
    data: schema
  });
});

exports.deleteSchema = asyncHandler(async (req, res) => {
  const result = await schemaService.deleteSchemaForUser(req.user);

  return sendResponse(res, {
    message: "Schema deleted successfully",
    data: result
  });
});
