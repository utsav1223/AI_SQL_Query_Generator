class AppError extends Error {
  constructor(statusCode, message, code = null, data = null) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
    this.isOperational = true;
  }
}

module.exports = AppError;
