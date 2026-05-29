const jwt = require("jsonwebtoken");
const { getAuth } = require("@clerk/express");

const AppError = require("../utils/AppError");
const { ADMIN_AUTH_COOKIE, getCookieValue } = require("../utils/sessionCookies");

const getAdminJwtSecret = () => process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

const getConfiguredClerkAdminIds = () =>
  String(process.env.CLERK_ADMIN_USER_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

const hasAdminClaim = (auth) => {
  const claims = auth?.sessionClaims || {};
  const metadataRole =
    claims.metadata?.role ||
    claims.publicMetadata?.role ||
    claims.privateMetadata?.role ||
    claims.role;

  return metadataRole === "admin" || claims.admin === true;
};

const authenticateClerkAdmin = (req) => {
  try {
    const auth = getAuth(req);
    const allowedAdminIds = getConfiguredClerkAdminIds();

    if (!auth?.isAuthenticated || !auth.userId) {
      return null;
    }

    if (allowedAdminIds.includes(auth.userId) || hasAdminClaim(auth)) {
      return {
        adminId: auth.userId,
        role: "admin",
        authType: "clerk"
      };
    }
  } catch {
    return null;
  }

  return null;
};

module.exports = (req, res, next) => {
  const clerkAdmin = authenticateClerkAdmin(req);
  if (clerkAdmin) {
    req.admin = clerkAdmin;
    return next();
  }

  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : "";
  const cookieToken = getCookieValue(req, ADMIN_AUTH_COOKIE);
  const token = bearerToken || cookieToken;

  if (!token) {
    return next(new AppError(401, "Authorization token is required"));
  }

  try {
    const decoded = jwt.verify(token, getAdminJwtSecret());
    if (decoded.role !== "admin") {
      return next(new AppError(403, "Admin access required"));
    }

    req.admin = decoded;
    return next();
  } catch {
    return next(new AppError(401, "Invalid token"));
  }
};
