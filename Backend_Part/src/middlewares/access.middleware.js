const asyncHandler = require("./asyncHandler");
const AppError = require("../utils/AppError");
const { getAccountRestrictionForUserId } = require("../services/accountRestriction.service");

const WAITLIST_ENABLED = String(process.env.CLERK_WAITLIST_MODE || "").toLowerCase() === "true";

const ADMIN_ROLES = new Set(["org:admin", "admin"]);

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const hasWorkspaceRole = (req, allowedRoles = []) => {
  const activeRole = normalizeRole(req.user?.orgRole);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  return normalizedAllowedRoles.includes(activeRole) || ADMIN_ROLES.has(activeRole);
};

const hasWorkspacePermission = (req, permission) => {
  if (!permission) {
    return true;
  }

  const permissions = Array.isArray(req.user?.orgPermissions)
    ? req.user.orgPermissions
    : [];

  return permissions.includes(permission);
};

const requireApprovedAccess = asyncHandler(async (req, res, next) => {
  if (req.user?.role === "admin") {
    return next();
  }

  const accessStatus = req.user?.accessStatus || "approved";

  if (accessStatus === "approved") {
    return next();
  }

  if (accessStatus === "pending" && !WAITLIST_ENABLED) {
    return next();
  }

  const accountRestriction = await getAccountRestrictionForUserId(req.user?.userId);

  throw new AppError(
    403,
    accountRestriction?.message || "Your account is waiting for approval.",
    accountRestriction?.code || "WAITLIST_PENDING",
    { accountRestriction }
  );
});

const requireWorkspacePermission = (permission, allowedRoles = []) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user?.orgId) {
      return next();
    }

    if (hasWorkspacePermission(req, permission) || hasWorkspaceRole(req, allowedRoles)) {
      return next();
    }

    throw new AppError(
      403,
      "You do not have permission to perform this action in this workspace.",
      "AUTH_FORBIDDEN"
    );
  });

module.exports = {
  requireApprovedAccess,
  requireWorkspacePermission
};
