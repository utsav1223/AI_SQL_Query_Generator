const User = require("../models/User");

const asyncHandler = require("./asyncHandler");
const AppError = require("../utils/AppError");

exports.requirePro = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.plan !== "pro") {
    throw new AppError(403, "This feature is available for Pro users only.");
  }

  return next();
});
