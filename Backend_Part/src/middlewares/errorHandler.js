const sendResponse = require("../utils/sendResponse");

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Something went wrong on the server";
  const responseData = error.data || {};

  if (process.env.NODE_ENV !== "production" && error.stack) {
    responseData.stack = error.stack;
  }

  if (statusCode >= 500) {
    console.error(error);
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
