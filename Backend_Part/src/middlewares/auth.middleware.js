const jwt = require("jsonwebtoken");

const User = require("../models/User");
const asyncHandler = require("./asyncHandler");
const AppError = require("../utils/AppError");
const { createSecurityEvent } = require("../utils/securityMonitor");

module.exports = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "Authorization token is required");
  }

  let decodedToken;

  try {
    const token = authHeader.split(" ")[1];
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError(401, "Invalid token");
  }

  const user = await User.findById(decodedToken.userId).select("_id status email role");

  if (!user) {
    throw new AppError(401, "User not found");
  }

  if (user.status === "suspended") {
    await createSecurityEvent({
      userId: user._id,
      emailSnapshot: user.email,
      type: "suspended_user_blocked_request",
      severity: "medium",
      source: "auth",
      message: "Suspended account attempted authenticated request.",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      riskDelta: 2,
      riskFlag: "suspended_access_attempt"
    });

    throw new AppError(403, "Account suspended. Contact support.");
  }

  req.user = {
    userId: String(user._id),
    role: user.role
  };

  next();
});
