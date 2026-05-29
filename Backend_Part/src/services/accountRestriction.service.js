const User = require("../models/User");
const AdminAuditLog = require("../models/AdminAuditLog");

const RESTRICTION_ACTIONS = {
  suspended: ["suspend"],
  rejected: ["reject_access"],
  deleted: ["delete"]
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const getLatestAuditLog = async ({ userId, email, actions }) => {
  const orFilters = [];

  if (userId) {
    orFilters.push({ targetUserId: userId });
  }

  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    orFilters.push({ targetEmailSnapshot: normalizedEmail });
  }

  if (orFilters.length === 0) {
    return null;
  }

  return AdminAuditLog.findOne({
    action: { $in: actions },
    $or: orFilters
  })
    .sort({ createdAt: -1 })
    .lean();
};

const buildRestriction = ({ code, status, title, fallbackMessage, auditLog }) => {
  const reason = String(auditLog?.reason || "").trim();

  return {
    code,
    status,
    title,
    message: reason ? `${fallbackMessage} Reason: ${reason}` : fallbackMessage,
    reason,
    action: auditLog?.action || "",
    createdAt: auditLog?.createdAt || null
  };
};

const getSuspendedRestriction = async (user) => {
  const auditLog = await getLatestAuditLog({
    userId: user?._id,
    email: user?.email,
    actions: RESTRICTION_ACTIONS.suspended
  });

  return buildRestriction({
    code: "ACCOUNT_SUSPENDED",
    status: "suspended",
    title: "Account suspended",
    fallbackMessage: "Your account has been suspended.",
    auditLog
  });
};

const getRejectedRestriction = async (user) => {
  const auditLog = await getLatestAuditLog({
    userId: user?._id,
    email: user?.email,
    actions: RESTRICTION_ACTIONS.rejected
  });

  return buildRestriction({
    code: "ACCOUNT_REJECTED",
    status: "rejected",
    title: "Access rejected",
    fallbackMessage: "Your account access has been rejected.",
    auditLog
  });
};

const getPendingRestriction = () => ({
  code: "WAITLIST_PENDING",
  status: "pending",
  title: "Access pending",
  message: "Your account is waiting for workspace approval.",
  reason: "",
  action: "",
  createdAt: null
});

const getDeletedAccountRestrictionByEmail = async (email) => {
  const auditLog = await getLatestAuditLog({
    email,
    actions: RESTRICTION_ACTIONS.deleted
  });

  if (!auditLog) {
    return null;
  }

  return buildRestriction({
    code: "ACCOUNT_DELETED",
    status: "deleted",
    title: "Account deleted",
    fallbackMessage: "Your account was deleted by an administrator.",
    auditLog
  });
};

const getAccountRestrictionForUser = async (user) => {
  if (!user) {
    return null;
  }

  if (user.status === "suspended") {
    return getSuspendedRestriction(user);
  }

  if ((user.accessStatus || "approved") === "rejected") {
    return getRejectedRestriction(user);
  }

  if ((user.accessStatus || "approved") === "pending") {
    return getPendingRestriction();
  }

  return null;
};

const getAccountRestrictionForUserId = async (userId) => {
  if (!userId) {
    return null;
  }

  const user = await User.findById(userId).select("_id email status accessStatus");
  return getAccountRestrictionForUser(user);
};

module.exports = {
  getAccountRestrictionForUser,
  getAccountRestrictionForUserId,
  getDeletedAccountRestrictionByEmail
};
