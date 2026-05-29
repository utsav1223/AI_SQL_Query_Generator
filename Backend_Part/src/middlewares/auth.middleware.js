const jwt = require("jsonwebtoken");
const { clerkClient, getAuth } = require("@clerk/express");

const User = require("../models/User");
const asyncHandler = require("./asyncHandler");
const AppError = require("../utils/AppError");
const { hasPlan } = require("../utils/planAccess");
const { getEffectivePlanForActor } = require("../utils/effectivePlan");
const { createSecurityEvent } = require("../utils/securityMonitor");
const { USER_AUTH_COOKIE, getCookieValue } = require("../utils/sessionCookies");
const { getOrCreateUserFromClerkId } = require("../services/clerkSync.service");
const { getAccountRestrictionForUser } = require("../services/accountRestriction.service");

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
};

const getOrgPermissions = (authDetails = {}) => {
  return toArray(
    authDetails.orgPermissions ||
      authDetails.organizationPermissions ||
      authDetails.sessionClaims?.org_permissions ||
      authDetails.sessionClaims?.organization_permissions
  );
};

const attachUser = async (req, user, authDetails = {}) => {
  if (!user) {
    throw new AppError(401, "User not found");
  }

  if (user.status === "suspended") {
    const accountRestriction = await getAccountRestrictionForUser(user);

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

    throw new AppError(
      403,
      accountRestriction?.message || "Your account has been suspended.",
      accountRestriction?.code || "ACCOUNT_SUSPENDED",
      { accountRestriction }
    );
  }

  req.user = {
    userId: String(user._id),
    clerkId: user.clerkId || authDetails.clerkId || null,
    orgId: authDetails.orgId || null,
    orgRole: authDetails.orgRole || null,
    orgSlug: authDetails.orgSlug || null,
    orgPermissions: getOrgPermissions(authDetails),
    role: user.role,
    plan: user.plan || "free",
    accessStatus: user.accessStatus || "approved"
  };
};

const getClerkAuth = (req) => {
  try {
    return getAuth(req);
  } catch {
    return null;
  }
};

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  return authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : "";
};

const isLegacyJwtAuthEnabled = () =>
  String(process.env.ENABLE_LEGACY_JWT_AUTH || "").toLowerCase() === "true";

const authenticateWithClerk = async (req) => {
  const auth = getClerkAuth(req);

  if (!auth?.isAuthenticated || !auth.userId) {
    return false;
  }

  const user = await getOrCreateUserFromClerkId(auth.userId);
  const orgPermissions = getOrgPermissions(auth);

  if (
    auth.orgId &&
    (
      user.clerkOrgId !== auth.orgId ||
      user.clerkOrgRole !== auth.orgRole ||
      JSON.stringify(user.clerkOrgPermissions || []) !== JSON.stringify(orgPermissions)
    )
  ) {
    user.clerkOrgId = auth.orgId;
    user.clerkOrgRole = auth.orgRole || null;
    user.clerkOrgPermissions = orgPermissions;
    await user.save();
  }

  await attachUser(req, user, {
    clerkId: auth.userId,
    orgId: auth.orgId || null,
    orgRole: auth.orgRole || null,
    orgSlug: auth.orgSlug || null,
    orgPermissions,
    sessionClaims: auth.sessionClaims
  });

  return true;
};

const authenticateWithClerkApiKey = async (req) => {
  const bearerToken = getBearerToken(req);

  if (!bearerToken) {
    return false;
  }

  let apiKey;

  try {
    apiKey = await clerkClient.apiKeys.verify(bearerToken);
  } catch {
    return false;
  }

  if (!apiKey || apiKey.revoked || apiKey.expired) {
    throw new AppError(401, "API key is invalid", "API_KEY_INVALID");
  }

  const subject = String(apiKey.subject || "");
  const clerkUserId = subject.startsWith("user_") ? subject : apiKey.createdBy;
  const orgId = subject.startsWith("org_") ? subject : null;

  if (!clerkUserId) {
    throw new AppError(401, "API key is missing a user owner", "API_KEY_INVALID");
  }

  const user = await getOrCreateUserFromClerkId(clerkUserId);

  const effectivePlan = await getEffectivePlanForActor(
    {
      userId: user._id,
      orgId
    },
    user
  );

  if (!hasPlan(effectivePlan, "pro")) {
    throw new AppError(403, "API keys require a paid plan.", "AUTH_FORBIDDEN");
  }

  await attachUser(req, user, {
    clerkId: clerkUserId,
    orgId,
    orgRole: null,
    orgPermissions: apiKey.scopes || []
  });

  req.user.authType = "api_key";
  req.user.apiKeyId = apiKey.id;

  return true;
};

const authenticateWithLegacyJwt = async (req) => {
  const bearerToken = getBearerToken(req);
  const cookieToken = getCookieValue(req, USER_AUTH_COOKIE);
  const token = bearerToken || cookieToken;

  if (!token) {
    throw new AppError(401, "Authorization token is required");
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError(401, "Invalid token");
  }

  const user = await User.findById(decodedToken.userId).select(
    "_id status accessStatus email role plan clerkId"
  );

  await attachUser(req, user);
};

module.exports = asyncHandler(async (req, res, next) => {
  if (await authenticateWithClerk(req)) {
    return next();
  }

  if (await authenticateWithClerkApiKey(req)) {
    return next();
  }

  if (isLegacyJwtAuthEnabled()) {
    await authenticateWithLegacyJwt(req);
    return next();
  }

  throw new AppError(401, "A valid Clerk session or API key is required.");

});
