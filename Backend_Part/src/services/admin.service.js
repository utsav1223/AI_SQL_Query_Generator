const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");

const User = require("../models/User");
const Query = require("../models/Query");
const Schema = require("../models/Schema");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Feedback = require("../models/Feedback");
const SecurityEvent = require("../models/SecurityEvent");
const AdminAuditLog = require("../models/AdminAuditLog");
const AccessAppeal = require("../models/AccessAppeal");
const Notification = require("../models/Notification");
const AppError = require("../utils/AppError");
const { createSecurityEvent } = require("../utils/securityMonitor");
const accessAppealService = require("./accessAppeal.service");
const notificationService = require("./notification.service");
const { getNextRenewalDate } = require("./subscription.service");
const { createTTLCache } = require("../dsa/cache/ttlCache");
const { buildRegexSearchFilter, normalizeSearchText } = require("../dsa/search/querySearch");
const { getOffsetPagination, buildPaginationMeta } = require("../dsa/pagination/cursorPagination");

const SYSTEM_ADMIN_PROFILE = {
  role: "admin",
  name: "System Administrator"
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ADMIN_USER_ACTIONS = {
  setPro: "set_pro",
  setFree: "set_free",
  approveAccess: "approve_access",
  rejectAccess: "reject_access",
  suspend: "suspend",
  unsuspend: "unsuspend",
  delete: "delete"
};

const MODERATION_ACTIONS = new Set(Object.values(ADMIN_USER_ACTIONS));
const adminOverviewCache = createTTLCache({ ttlMs: 15000, maxEntries: 4 });

const invalidateAdminOverviewCache = () => adminOverviewCache.delete("overview");

const monthKey = (year, month) => `${year}-${String(month).padStart(2, "0")}`;

const generateAdminToken = (adminId) => {
  return jwt.sign(
    {
      adminId,
      role: "admin"
    },
    process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
};

const getAdminCredentials = () => {
  const userId = String(process.env.ADMIN_USER_ID || "").trim();
  const password = String(process.env.ADMIN_PASSWORD || "").trim();

  if (!userId || !password) {
    throw new AppError(
      503,
      "Admin login is not configured. Set ADMIN_USER_ID and ADMIN_PASSWORD."
    );
  }

  return {
    userId,
    password
  };
};

const verifyPassword = async (inputPassword, storedPassword) => {
  if (!storedPassword) {
    return false;
  }

  if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$")) {
    return bcrypt.compare(inputPassword, storedPassword);
  }

  const inputBuffer = Buffer.from(String(inputPassword));
  const storedBuffer = Buffer.from(String(storedPassword));

  return (
    inputBuffer.length === storedBuffer.length &&
    crypto.timingSafeEqual(inputBuffer, storedBuffer)
  );
};

const getRecentMonthBuckets = (count = 6) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const buckets = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(
      currentMonthStart.getFullYear(),
      currentMonthStart.getMonth() - index,
      1
    );

    buckets.push({
      key: monthKey(date.getFullYear(), date.getMonth() + 1),
      label: MONTH_LABELS[date.getMonth()]
    });
  }

  return buckets;
};

const normalizeReason = (reason) => String(reason || "").trim();

const snapshotUserState = (user) => {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    status: user.status,
    accessStatus: user.accessStatus || "approved",
    plan: user.plan,
    billingRenewal: user.billingRenewal,
    riskScore: user.riskScore || 0,
    riskFlags: Array.isArray(user.riskFlags) ? [...user.riskFlags] : []
  };
};

const createAdminAuditLog = async ({
  adminId,
  requestMeta,
  action,
  reason,
  targetUser,
  previousState,
  nextState
}) => {
  return AdminAuditLog.create({
    adminId: adminId || "admin",
    action,
    targetUserId: targetUser?._id || null,
    targetEmailSnapshot: targetUser?.email || "",
    reason,
    previousState,
    nextState,
    ...requestMeta
  });
};

const deleteUserOwnedData = async ({ userId, session = null }) => {
  const queryOptions = session ? { session } : {};

  await Query.deleteMany({ userId }, queryOptions);
  await Schema.deleteMany({ userId }, queryOptions);
  await Payment.deleteMany({ userId }, queryOptions);
  await Invoice.deleteMany({ userId }, queryOptions);
  await Feedback.deleteMany({ userId }, queryOptions);
  await User.findByIdAndDelete(userId, queryOptions);
};

const isTransactionUnsupportedError = (error) => {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("transaction numbers are only allowed") ||
    message.includes("replica set member") ||
    message.includes("transactions are not supported")
  );
};

const deleteUserOwnedDataSafely = async (userId) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await deleteUserOwnedData({ userId, session });
    });
  } catch (error) {
    if (!isTransactionUnsupportedError(error)) {
      throw error;
    }

    await deleteUserOwnedData({ userId });
  } finally {
    await session.endSession();
  }
};

const runModerationAction = async ({ adminId, requestMeta, user, action, reason }) => {
  const previousState = snapshotUserState(user);

  if (action === ADMIN_USER_ACTIONS.setPro) {
    user.plan = "pro";
    if (!user.billingRenewal || user.billingRenewal < new Date()) {
      user.billingRenewal = getNextRenewalDate();
    }
    await user.save();
  } else if (action === ADMIN_USER_ACTIONS.setFree) {
    user.plan = "free";
    user.billingRenewal = null;
    await user.save();
  } else if (action === ADMIN_USER_ACTIONS.approveAccess) {
    user.accessStatus = "approved";
    await user.save();
  } else if (action === ADMIN_USER_ACTIONS.rejectAccess) {
    user.accessStatus = "rejected";
    await user.save();
  } else if (action === ADMIN_USER_ACTIONS.suspend) {
    user.status = "suspended";
    await user.save();
  } else if (action === ADMIN_USER_ACTIONS.unsuspend) {
    user.status = "active";
    await user.save();
  } else if (action === ADMIN_USER_ACTIONS.delete) {
    await deleteUserOwnedDataSafely(user._id);
  }

  const nextState =
    action === ADMIN_USER_ACTIONS.delete ? { deleted: true } : snapshotUserState(user);

  await createAdminAuditLog({
    adminId,
    requestMeta,
    action,
    reason,
    targetUser: user,
    previousState,
    nextState
  });

  const severity =
    action === ADMIN_USER_ACTIONS.delete || action === ADMIN_USER_ACTIONS.suspend
      ? "high"
      : "medium";

  await createSecurityEvent({
    userId: user._id,
    emailSnapshot: user.email,
    type: "admin_user_moderation_action",
    severity,
    source: "admin",
    message: `Admin action "${action}" applied. Reason: ${reason}`,
    metadata: {
      action,
      reason,
      adminId: adminId || "admin"
    },
    riskDelta: action === ADMIN_USER_ACTIONS.suspend ? 20 : 0,
    riskFlag: action === ADMIN_USER_ACTIONS.suspend ? "suspended_by_admin" : "",
    ...requestMeta
  });

  return nextState;
};

const executeModeration = async ({ adminId, requestMeta, userId, action, reason }) => {
  const cleanReason = normalizeReason(reason);

  if (!MODERATION_ACTIONS.has(action)) {
    throw new AppError(400, "Invalid moderation action");
  }

  if (!cleanReason) {
    throw new AppError(400, "Reason is required for moderation actions");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.role === "admin") {
    throw new AppError(403, "Admin users cannot be moderated from this panel");
  }

  const nextState = await runModerationAction({
    adminId,
    requestMeta,
    user,
    action,
    reason: cleanReason
  });
  invalidateAdminOverviewCache();

  const messageMap = {
    [ADMIN_USER_ACTIONS.setPro]: "User upgraded to pro",
    [ADMIN_USER_ACTIONS.setFree]: "User moved to free plan",
    [ADMIN_USER_ACTIONS.approveAccess]: "User access approved",
    [ADMIN_USER_ACTIONS.rejectAccess]: "User access rejected",
    [ADMIN_USER_ACTIONS.suspend]: "User suspended",
    [ADMIN_USER_ACTIONS.unsuspend]: "User unsuspended",
    [ADMIN_USER_ACTIONS.delete]: "User and related records deleted successfully"
  };

  return {
    message: messageMap[action] || "Moderation action applied",
    action,
    user: nextState
  };
};

const loginAdmin = async ({ userId, password, requestMeta }) => {
  if (!userId || !password) {
    throw new AppError(400, "User ID and password are required");
  }

  const adminCredentials = getAdminCredentials();
  const userMatches = userId === adminCredentials.userId;
  const passwordMatches = await verifyPassword(password, adminCredentials.password);

  if (!userMatches || !passwordMatches) {
    await createSecurityEvent({
      emailSnapshot: userId,
      type: "admin_login_failed",
      severity: "high",
      source: "auth",
      message: "Invalid admin login attempt.",
      metadata: { attemptedUserId: userId },
      ...requestMeta
    });

    throw new AppError(401, "Invalid admin credentials");
  }

  return {
    token: generateAdminToken(adminCredentials.userId),
    admin: {
      id: adminCredentials.userId,
      ...SYSTEM_ADMIN_PROFILE
    }
  };
};

const getAdminProfile = (adminId) => {
  return {
    id: adminId,
    ...SYSTEM_ADMIN_PROFILE
  };
};

const getAdminOverview = async () => {
  const cachedOverview = adminOverviewCache.get("overview");

  if (cachedOverview) {
    return cachedOverview;
  }

  const trendStart = new Date();
  trendStart.setDate(1);
  trendStart.setHours(0, 0, 0, 0);
  trendStart.setMonth(trendStart.getMonth() - 5);

  const [
    totalUsers,
    proUsers,
    totalQueries,
    totalInvoices,
    totalFeedback,
    revenueSummary,
    feedbackSummary,
    revenueTrendAgg,
    signupTrendAgg,
    feedbackStatusAgg,
    recentUsers,
    recentInvoices,
    recentFeedback,
    pendingSecurityEvents,
    recentHighSeverityEvents,
    recentSecurityEvents,
    riskyUsers,
    recentAdminActions,
    pendingAccessAppeals,
    recentAccessAppeals,
    publishedNotifications,
    recentNotifications
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ plan: { $in: ["pro", "team", "business"] } }),
    Query.countDocuments({}),
    Invoice.countDocuments({ status: "paid" }),
    Feedback.countDocuments({}),
    Invoice.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ]),
    Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "new"] }, 1, 0]
            }
          }
        }
      }
    ]),
    Invoice.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: trendStart }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$amount" },
          invoices: { $sum: 1 }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      }
    ]),
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: trendStart }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          signups: { $sum: 1 }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      }
    ]),
    Feedback.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]),
    User.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .select("name email plan role accessStatus createdAt"),
    Invoice.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .select("invoiceNumber amount currency paymentId createdAt userId")
      .populate("userId", "name email"),
    Feedback.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .select("rating topic message status createdAt userId")
      .populate("userId", "name email"),
    SecurityEvent.countDocuments({ status: "new" }),
    SecurityEvent.countDocuments({
      severity: { $in: ["high", "critical"] },
      createdAt: { $gte: trendStart }
    }),
    SecurityEvent.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .select("type severity status message createdAt userId emailSnapshot metadata")
      .populate("userId", "name email status riskScore"),
    User.find({
      $or: [{ riskScore: { $gt: 0 } }, { status: "suspended" }]
    })
      .sort({ riskScore: -1, updatedAt: -1 })
      .limit(8)
      .select("name email status plan riskScore riskFlags lastSecurityEventAt createdAt"),
    AdminAuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .select("action reason targetUserId targetEmailSnapshot adminId createdAt")
      .populate("targetUserId", "name email status"),
    AccessAppeal.countDocuments({ status: "new" }),
    AccessAppeal.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name email status accessStatus plan"),
    Notification.countDocuments({ status: "published" }),
    Notification.find({})
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  const totalRevenue = revenueSummary[0]?.totalRevenue || 0;
  const averageRating = Number(feedbackSummary[0]?.avgRating || 0);
  const pendingFeedback = feedbackSummary[0]?.pendingCount || 0;
  const freeUsers = Math.max(totalUsers - proUsers, 0);

  const revenueByMonth = new Map(
    revenueTrendAgg.map((entry) => [
      monthKey(entry._id.year, entry._id.month),
      {
        revenue: entry.revenue || 0,
        invoices: entry.invoices || 0
      }
    ])
  );

  const signupsByMonth = new Map(
    signupTrendAgg.map((entry) => [
      monthKey(entry._id.year, entry._id.month),
      entry.signups || 0
    ])
  );

  const monthlyBusiness = getRecentMonthBuckets(6).map((bucket) => {
    const revenueEntry = revenueByMonth.get(bucket.key) || { revenue: 0, invoices: 0 };
    const signups = signupsByMonth.get(bucket.key) || 0;

    return {
      month: bucket.label,
      revenue: revenueEntry.revenue,
      invoices: revenueEntry.invoices,
      signups
    };
  });

  const feedbackStatusCounts = { new: 0, reviewed: 0, resolved: 0 };
  feedbackStatusAgg.forEach((entry) => {
    if (Object.hasOwn(feedbackStatusCounts, entry._id)) {
      feedbackStatusCounts[entry._id] = entry.count || 0;
    }
  });

  const overview = {
    stats: {
      totalUsers,
      proUsers,
      freeUsers,
      totalQueries,
      totalInvoices,
      totalRevenue,
      totalFeedback,
      avgFeedbackRating: Number(averageRating.toFixed(2)),
      pendingFeedback,
      pendingSecurityEvents,
      recentHighSeverityEvents,
      pendingAccessAppeals,
      publishedNotifications
    },
    charts: {
      monthlyBusiness,
      feedbackStatus: [
        { status: "New", count: feedbackStatusCounts.new },
        { status: "Reviewed", count: feedbackStatusCounts.reviewed },
        { status: "Resolved", count: feedbackStatusCounts.resolved }
      ],
      planDistribution: [
        { name: "Paid", value: proUsers },
        { name: "Free", value: freeUsers }
      ]
    },
    recentUsers,
    recentInvoices,
    recentFeedback,
    recentSecurityEvents,
    riskyUsers,
    recentAdminActions,
    recentAccessAppeals,
    recentNotifications
  };

  adminOverviewCache.set("overview", overview);
  return overview;
};

const getAdminUsers = async ({ page, limit, search, plan, status, accessStatus }) => {
  const { page: safePage, limit: safeLimit, skip } = getOffsetPagination({ page, limit, maxLimit: 50 });
  const searchText = normalizeSearchText(search);
  const planFilter = String(plan || "all").trim().toLowerCase();
  const statusFilter = String(status || "all").trim().toLowerCase();
  const accessStatusFilter = String(accessStatus || "all").trim().toLowerCase();

  const filter = {};

  if (["free", "pro", "team", "business"].includes(planFilter)) {
    filter.plan = planFilter;
  }

  if (["active", "suspended"].includes(statusFilter)) {
    filter.status = statusFilter;
  }

  if (["approved", "pending", "rejected"].includes(accessStatusFilter)) {
    filter.accessStatus = accessStatusFilter;
  }

  if (searchText) {
    Object.assign(filter, buildRegexSearchFilter(searchText, ["name", "email"]));
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .select(
        "name email role status accessStatus plan billingRenewal createdAt dailyUsage usageDate riskScore riskFlags lastSecurityEventAt"
      ),
    User.countDocuments(filter)
  ]);

  return {
    users,
    pagination: buildPaginationMeta({ total, page: safePage, limit: safeLimit })
  };
};

const moderateUserByAdmin = async ({ adminId, requestMeta, userId, action, reason }) => {
  return executeModeration({
    adminId,
    requestMeta,
    userId,
    action: String(action || "").trim().toLowerCase(),
    reason
  });
};

const getAdminFeedback = async ({ page, limit, status, search }) => {
  const { page: safePage, limit: safeLimit, skip } = getOffsetPagination({ page, limit, maxLimit: 50 });
  const statusFilter = String(status || "all");
  const searchText = normalizeSearchText(search);

  const filter = {};

  if (statusFilter !== "all" && ["new", "reviewed", "resolved"].includes(statusFilter)) {
    filter.status = statusFilter;
  }

  if (searchText) {
    Object.assign(filter, buildRegexSearchFilter(searchText, ["topic", "message"]));
  }

  const [feedback, total] = await Promise.all([
    Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("userId", "name email"),
    Feedback.countDocuments(filter)
  ]);

  return {
    feedback,
    pagination: buildPaginationMeta({ total, page: safePage, limit: safeLimit })
  };
};

const updateFeedbackStatus = async ({ feedbackId, status, adminNote }) => {
  if (!["new", "reviewed", "resolved"].includes(status)) {
    throw new AppError(400, "Invalid feedback status");
  }

  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    throw new AppError(404, "Feedback not found");
  }

  feedback.status = status;
  if (typeof adminNote === "string") {
    feedback.adminNote = adminNote.trim();
  }

  await feedback.save();
  invalidateAdminOverviewCache();
  return feedback;
};

const getAdminAccessAppeals = async (query) => {
  return accessAppealService.getAdminAccessAppeals(query);
};

const updateAccessAppealStatus = async (payload) => {
  const result = await accessAppealService.updateAccessAppealStatus(payload);
  invalidateAdminOverviewCache();
  return result;
};

const createNotification = async (payload) => {
  const result = await notificationService.createNotification(payload);
  invalidateAdminOverviewCache();
  return result;
};

const getAdminNotifications = async (query) => {
  return notificationService.getAdminNotifications(query);
};

const updateNotificationStatus = async (payload) => {
  const result = await notificationService.updateNotificationStatus(payload);
  invalidateAdminOverviewCache();
  return result;
};

const getAdminSecurityEvents = async ({ page, limit, severity, status, search }) => {
  const { page: safePage, limit: safeLimit, skip } = getOffsetPagination({ page, limit, maxLimit: 50 });
  const severityFilter = String(severity || "all").trim().toLowerCase();
  const statusFilter = String(status || "all").trim().toLowerCase();
  const searchText = normalizeSearchText(search);

  const filter = {};

  if (["low", "medium", "high", "critical"].includes(severityFilter)) {
    filter.severity = severityFilter;
  }

  if (["new", "reviewed", "resolved"].includes(statusFilter)) {
    filter.status = statusFilter;
  }

  if (searchText) {
    Object.assign(filter, buildRegexSearchFilter(searchText, ["type", "message", "emailSnapshot"]));
  }

  const [events, total] = await Promise.all([
    SecurityEvent.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("userId", "name email status riskScore riskFlags"),
    SecurityEvent.countDocuments(filter)
  ]);

  return {
    events,
    pagination: buildPaginationMeta({ total, page: safePage, limit: safeLimit })
  };
};

const updateSecurityEventStatus = async ({ adminId, eventId, status }) => {
  if (!["new", "reviewed", "resolved"].includes(status)) {
    throw new AppError(400, "Invalid security event status");
  }

  const event = await SecurityEvent.findById(eventId);
  if (!event) {
    throw new AppError(404, "Security event not found");
  }

  event.status = status;
  event.reviewedBy = adminId || "admin";
  event.reviewedAt = new Date();
  await event.save();
  invalidateAdminOverviewCache();

  return event;
};

module.exports = {
  loginAdmin,
  getAdminProfile,
  getAdminOverview,
  getAdminUsers,
  moderateUserByAdmin,
  getAdminFeedback,
  updateFeedbackStatus,
  getAdminAccessAppeals,
  updateAccessAppealStatus,
  createNotification,
  getAdminNotifications,
  updateNotificationStatus,
  getAdminSecurityEvents,
  updateSecurityEventStatus
};
