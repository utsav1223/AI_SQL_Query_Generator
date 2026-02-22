const User = require("../models/User");
const SecurityEvent = require("../models/SecurityEvent");

const clampRiskScore = (value) => Math.min(Math.max(value, 0), 100);

const normalizeFlag = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "_");

const applyRiskUpdate = async ({ userId, riskDelta = 0, riskFlag = "" }) => {
  if (!userId) return;
  if (!riskDelta && !riskFlag) return;

  const user = await User.findById(userId);
  if (!user) return;

  if (riskDelta) {
    user.riskScore = clampRiskScore((user.riskScore || 0) + riskDelta);
  }

  const normalizedFlag = normalizeFlag(riskFlag);
  if (normalizedFlag) {
    const existingFlags = Array.isArray(user.riskFlags) ? user.riskFlags : [];
    if (!existingFlags.includes(normalizedFlag)) {
      existingFlags.push(normalizedFlag);
      user.riskFlags = existingFlags;
    }
  }

  user.lastSecurityEventAt = new Date();
  await user.save();
};

exports.createSecurityEvent = async ({
  userId = null,
  emailSnapshot = "",
  type,
  severity = "low",
  source = "system",
  message = "",
  ipAddress = "",
  userAgent = "",
  metadata = {},
  riskDelta = 0,
  riskFlag = ""
}) => {
  if (!type) return null;

  try {
    const event = await SecurityEvent.create({
      userId,
      emailSnapshot: emailSnapshot || "",
      type,
      severity,
      source,
      message,
      ipAddress,
      userAgent,
      metadata
    });

    await applyRiskUpdate({ userId, riskDelta, riskFlag });
    return event;
  } catch (error) {
    console.error("Failed to create security event:", error.message);
    return null;
  }
};
