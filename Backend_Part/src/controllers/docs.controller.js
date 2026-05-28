const asyncHandler = require("../middlewares/asyncHandler");
const openApiDocument = require("../docs/openapi");

exports.getOpenApiDocument = asyncHandler(async (req, res) => {
  return res.status(200).json(openApiDocument);
});
