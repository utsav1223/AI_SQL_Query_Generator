const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { createSecurityEvent } = require("../utils/securityMonitor");

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header)
    return res.status(401).json({ message: "Unauthorized" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("_id status email");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
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

      return res.status(403).json({ message: "Account suspended. Contact support." });
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
