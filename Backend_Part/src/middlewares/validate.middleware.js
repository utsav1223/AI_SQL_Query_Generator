const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

module.exports = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new AppError(400, "Validation failed", null, {
        errors: errors.array().map((error) => error.msg)
      })
    );
  }

  next();
};
