const { clerkClient, getAuth } = require("@clerk/express");

const AccessAppeal = require("../models/AccessAppeal");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { createSecurityEvent } = require("../utils/securityMonitor");
const { mapClerkUser } = require("./clerkSync.service");
const {
  getAccountRestrictionForUser,
  getDeletedAccountRestrictionByEmail
} = require("./accountRestriction.service");

const APPEAL_STATUSES = ["new", "in_review", "resolved", "closed"];

const normalizeMessage = (message) => String(message || "").trim();

const getClerkIdentity = async (req) => {
  let auth;

  try {
    auth = getAuth(req);
  } catch {
    auth = null;
  }

  if (!auth?.isAuthenticated || !auth.userId) {
    throw new AppError(401, "A valid Clerk session is required.");
  }

  const clerkUser = await clerkClient.users.getUser(auth.userId);
  const mappedUser = mapClerkUser(clerkUser);

  if (!mappedUser.email) {
    throw new AppError(400, "Your account does not have a verified email address.");
  }

  return {
    clerkId: auth.userId,
    name: mappedUser.name || "Workspace member",
    email: mappedUser.email.toLowerCase()
  };
};

const getRestrictedAccountContext = async ({ clerkId, email }) => {
  const user = await User.findOne({
    $or: [{ clerkId }, { email }]
  });

  const accountRestriction = user
    ? await getAccountRestrictionForUser(user)
    : await getDeletedAccountRestrictionByEmail(email);

  if (!accountRestriction) {
    throw new AppError(400, "This account is not currently restricted.");
  }

  return {
    user,
    accountRestriction
  };
};

const createAccessAppeal = async ({ req, message, requestMeta = {} }) => {
  const cleanMessage = normalizeMessage(message);

  if (!cleanMessage) {
    throw new AppError(400, "Message is required.");
  }

  const identity = await getClerkIdentity(req);
  const { user, accountRestriction } = await getRestrictedAccountContext(identity);
  const appeal = await AccessAppeal.create({
    userId: user?._id || null,
    clerkId: identity.clerkId,
    name: identity.name,
    email: identity.email,
    restrictionStatus: accountRestriction.status || "blocked",
    restrictionCode: accountRestriction.code || "",
    restrictionReason: accountRestriction.reason || "",
    message: cleanMessage,
    ...requestMeta
  });

  await createSecurityEvent({
    userId: user?._id || null,
    emailSnapshot: identity.email,
    type: "restricted_account_appeal_submitted",
    severity: "medium",
    source: "auth",
    message: "Restricted account submitted an admin contact request.",
    metadata: {
      appealId: String(appeal._id),
      restrictionStatus: appeal.restrictionStatus,
      restrictionCode: appeal.restrictionCode
    },
    ...requestMeta
  });

  return {
    id: appeal._id,
    status: appeal.status,
    createdAt: appeal.createdAt
  };
};

const getAdminAccessAppeals = async ({ page, limit, status, search }) => {
  const safePage = Math.max(parseInt(page || "1", 10), 1);
  const safeLimit = Math.min(Math.max(parseInt(limit || "10", 10), 1), 50);
  const statusFilter = String(status || "new").trim().toLowerCase();
  const searchText = String(search || "").trim().slice(0, 120);
  const skip = (safePage - 1) * safeLimit;
  const filter = {};

  if (APPEAL_STATUSES.includes(statusFilter)) {
    filter.status = statusFilter;
  } else if (statusFilter !== "all") {
    filter.status = "new";
  }

  if (searchText) {
    const safeSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
      { message: { $regex: safeSearch, $options: "i" } }
    ];
  }

  const [appeals, total] = await Promise.all([
    AccessAppeal.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("userId", "name email status accessStatus plan riskScore"),
    AccessAppeal.countDocuments(filter)
  ]);

  return {
    appeals,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.max(Math.ceil(total / safeLimit), 1)
    }
  };
};

const updateAccessAppealStatus = async ({ appealId, status, adminNote, adminId }) => {
  const nextStatus = String(status || "").trim().toLowerCase();

  if (!APPEAL_STATUSES.includes(nextStatus)) {
    throw new AppError(400, "Invalid appeal status");
  }

  const appeal = await AccessAppeal.findById(appealId);

  if (!appeal) {
    throw new AppError(404, "Access appeal not found");
  }

  appeal.status = nextStatus;
  if (typeof adminNote === "string") {
    appeal.adminNote = adminNote.trim();
  }
  appeal.reviewedBy = adminId || "admin";
  appeal.reviewedAt = new Date();
  await appeal.save();

  return appeal;
};

module.exports = {
  APPEAL_STATUSES,
  createAccessAppeal,
  getAdminAccessAppeals,
  updateAccessAppealStatus
};
