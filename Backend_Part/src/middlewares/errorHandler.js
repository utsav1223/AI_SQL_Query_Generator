const sendResponse = require("../utils/sendResponse");
const logger = require("../utils/logger");

const errorHandler = (error, req, res, next) => {
  const isCastError = error.name === "CastError";
  const isDuplicateKeyError = error.code === 11000;
  const statusCode = isCastError ? 400 : isDuplicateKeyError ? 409 : error.statusCode || 500;
  const message = isCastError
    ? "Invalid resource identifier"
    : isDuplicateKeyError
    ? "Resource already exists"
    : error.message || "Something went wrong on the server";
  const responseData = error.data || {};

  if (process.env.NODE_ENV !== "production" && error.stack) {
    responseData.stack = error.stack;
  }

  if (statusCode >= 500) {
    logger.error("Unhandled API error", error, {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      userId: req.user?.userId
    });
  }

  return sendResponse(res, {
    statusCode,
    success: false,
    message,
    data: {
      ...responseData,
      ...(error.code ? { code: error.code } : {})
    }
  });
};

module.exports = errorHandler;
