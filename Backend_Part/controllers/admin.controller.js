const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Query = require("../models/Query");
const Schema = require("../models/Schema");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Feedback = require("../models/Feedback");
const SecurityEvent = require("../models/SecurityEvent");
const AdminAuditLog = require("../models/AdminAuditLog");
const { createSecurityEvent } = require("../utils/securityMonitor");

const generateAdminToken = (adminId) =>
  jwt.sign(
    {
      adminId,
      role: "admin"
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

const getAdminCredentials = () => ({
  userId: process.env.ADMIN_USER_ID || "admin",
  password: process.env.ADMIN_PASSWORD || "Admin@123"
});

const verifyPassword = async (inputPassword, storedPassword) => {
  if (!storedPassword) return false;

  // Support either plain text env password or bcrypt hash.
  if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$")) {
    return bcrypt.compare(inputPassword, storedPassword);
  }

  return inputPassword === storedPassword;
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const monthKey = (year, month) => `${year}-${String(month).padStart(2, "0")}`;

const getRecentMonthBuckets = (count = 6) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const buckets = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - i, 1);
    buckets.push({
      key: monthKey(d.getFullYear(), d.getMonth() + 1),
      label: MONTH_LABELS[d.getMonth()]
    });
  }

  return buckets;
};

const ADMIN_USER_ACTIONS = {
  setPro: "set_pro",
  setFree: "set_free",
  suspend: "suspend",
  unsuspend: "unsuspend",
  delete: "delete"
};

const MODERATION_ACTIONS = new Set(Object.values(ADMIN_USER_ACTIONS));

const normalizeReason = (reason) => String(reason || "").trim();

const snapshotUserState = (user) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  status: user.status,
  plan: user.plan,
  billingRenewal: user.billingRenewal,
  riskScore: user.riskScore || 0,
  riskFlags: Array.isArray(user.riskFlags) ? [...user.riskFlags] : []
});

const getRequestMeta = (req) => ({
  ipAddress: req.ip || "",
  userAgent: req.get("user-agent") || ""
});

const createAdminAuditLog = async ({
  req,
  action,
  reason,
  targetUser,
  previousState,
  nextState
}) =>
  AdminAuditLog.create({
    adminId: req.admin?.adminId || "admin",
    action,
    targetUserId: targetUser?._id || null,
    targetEmailSnapshot: targetUser?.email || "",
    reason,
    previousState,
    nextState,
    ...getRequestMeta(req)
  });

const runModerationAction = async ({ user, action, reason, req }) => {
  const previousState = snapshotUserState(user);

  if (action === ADMIN_USER_ACTIONS.setPro) {
    user.plan = "pro";
    if (!user.billingRenewal || user.billingRenewal < new Date()) {
      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1);
      user.billingRenewal = renewalDate;
    }
    await user.save();
  } else if (action === ADMIN_USER_ACTIONS.setFree) {
    user.plan = "free";
    user.billingRenewal = null;
    await user.save();
  } else if (action === ADMIN_USER_ACTIONS.suspend) {
    user.status = "suspended";
    await user.save();
  } else if (action === ADMIN_USER_ACTIONS.unsuspend) {
    user.status = "active";
    await user.save();
  } else if (action === ADMIN_USER_ACTIONS.delete) {
    await Promise.all([
      Query.deleteMany({ userId: user._id }),
      Schema.deleteMany({ userId: user._id }),
      Payment.deleteMany({ userId: user._id }),
      Invoice.deleteMany({ userId: user._id }),
      Feedback.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(user._id)
    ]);
  }

  const nextState =
    action === ADMIN_USER_ACTIONS.delete ? { deleted: true } : snapshotUserState(user);

  await createAdminAuditLog({
    req,
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
    ...getRequestMeta(req),
    metadata: {
      action,
      reason,
      adminId: req.admin?.adminId || "admin"
    },
    riskDelta: action === ADMIN_USER_ACTIONS.suspend ? 20 : 0,
    riskFlag: action === ADMIN_USER_ACTIONS.suspend ? "suspended_by_admin" : ""
  });

  return { previousState, nextState };
};

exports.adminLogin = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: "User ID and password are required" });
    }

    const adminCreds = getAdminCredentials();
    const userMatches = userId === adminCreds.userId;
    const passwordMatches = await verifyPassword(password, adminCreds.password);

    if (!userMatches || !passwordMatches) {
      await createSecurityEvent({
        emailSnapshot: userId,
        type: "admin_login_failed",
        severity: "high",
        source: "auth",
        message: "Invalid admin login attempt.",
        ...getRequestMeta(req),
        metadata: { attemptedUserId: userId }
      });

      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = generateAdminToken(adminCreds.userId);

    return res.json({
      token,
      admin: {
        id: adminCreds.userId,
        role: "admin",
        name: "System Administrator"
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Admin login failed" });
  }
};

exports.getAdminMe = async (req, res) => {
  return res.json({
    id: req.admin.adminId,
    role: "admin",
    name: "System Administrator"
  });
};

exports.getAdminOverview = async (req, res) => {
  try {
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
      recentAdminActions
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ plan: "pro" }),
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
        .select("name email plan role createdAt"),
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
        .populate("targetUserId", "name email status")
    ]);

    const totalRevenue = revenueSummary[0]?.totalRevenue || 0;
    const avgRating = Number(feedbackSummary[0]?.avgRating || 0);
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

    const feedbackStatus = [
      { status: "New", count: feedbackStatusCounts.new },
      { status: "Reviewed", count: feedbackStatusCounts.reviewed },
      { status: "Resolved", count: feedbackStatusCounts.resolved }
    ];

    const planDistribution = [
      { name: "Pro", value: proUsers },
      { name: "Free", value: freeUsers }
    ];

    return res.json({
      stats: {
        totalUsers,
        proUsers,
        freeUsers,
        totalQueries,
        totalInvoices,
        totalRevenue,
        totalFeedback,
        avgFeedbackRating: Number(avgRating.toFixed(2)),
        pendingFeedback,
        pendingSecurityEvents,
        recentHighSeverityEvents
      },
      charts: {
        monthlyBusiness,
        feedbackStatus,
        planDistribution
      },
      recentUsers,
      recentInvoices,
      recentFeedback,
      recentSecurityEvents,
      riskyUsers,
      recentAdminActions
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch admin overview" });
  }
};

exports.getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
    const search = String(req.query.search || "").trim();

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "name email role status plan billingRenewal createdAt dailyUsage usageDate riskScore riskFlags lastSecurityEventAt"
        ),
      User.countDocuments(filter)
    ]);

    return res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.max(Math.ceil(total / limit), 1)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

const executeModeration = async ({ req, res, action }) => {
  const { userId } = req.params;
  const reason = normalizeReason(req.body?.reason || req.query?.reason);

  if (!MODERATION_ACTIONS.has(action)) {
    return res.status(400).json({ message: "Invalid moderation action" });
  }

  if (!reason) {
    return res.status(400).json({ message: "Reason is required for moderation actions" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role === "admin") {
    return res.status(403).json({ message: "Admin users cannot be moderated from this panel" });
  }

  const { nextState } = await runModerationAction({
    user,
    action,
    reason,
    req
  });

  const messageMap = {
    [ADMIN_USER_ACTIONS.setPro]: "User upgraded to pro",
    [ADMIN_USER_ACTIONS.setFree]: "User moved to free plan",
    [ADMIN_USER_ACTIONS.suspend]: "User suspended",
    [ADMIN_USER_ACTIONS.unsuspend]: "User unsuspended",
    [ADMIN_USER_ACTIONS.delete]: "User and related records deleted successfully"
  };

  return res.json({
    message: messageMap[action] || "Moderation action applied",
    action,
    user: nextState
  });
};

exports.moderateUserByAdmin = async (req, res) => {
  try {
    const action = String(req.body?.action || "").trim().toLowerCase();
    return await executeModeration({ req, res, action });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to moderate user" });
  }
};

exports.updateUserPlanByAdmin = async (req, res) => {
  try {
    const plan = String(req.body?.plan || "").trim().toLowerCase();
    if (!["free", "pro"].includes(plan)) {
      return res.status(400).json({ message: "Plan must be free or pro" });
    }

    const action = plan === "pro" ? ADMIN_USER_ACTIONS.setPro : ADMIN_USER_ACTIONS.setFree;
    return await executeModeration({ req, res, action });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update user plan" });
  }
};

exports.deleteUserByAdmin = async (req, res) => {
  try {
    return await executeModeration({
      req,
      res,
      action: ADMIN_USER_ACTIONS.delete
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
};

exports.getAdminFeedback = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
    const status = String(req.query.status || "all");
    const search = String(req.query.search || "").trim();
    const skip = (page - 1) * limit;

    const filter = {};

    if (status !== "all" && ["new", "reviewed", "resolved"].includes(status)) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { topic: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } }
      ];
    }

    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email"),
      Feedback.countDocuments(filter)
    ]);

    return res.json({
      feedback,
      pagination: {
        total,
        page,
        limit,
        pages: Math.max(Math.ceil(total / limit), 1)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch feedback" });
  }
};

exports.updateFeedbackStatusByAdmin = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { status, adminNote } = req.body;

    if (!["new", "reviewed", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid feedback status" });
    }

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    feedback.status = status;
    if (typeof adminNote === "string") {
      feedback.adminNote = adminNote.trim();
    }

    await feedback.save();

    return res.json({
      message: "Feedback updated",
      feedback
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update feedback status" });
  }
};

exports.getAdminSecurityEvents = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
    const severity = String(req.query.severity || "all").trim().toLowerCase();
    const status = String(req.query.status || "all").trim().toLowerCase();
    const search = String(req.query.search || "").trim();
    const skip = (page - 1) * limit;

    const filter = {};

    if (["low", "medium", "high", "critical"].includes(severity)) {
      filter.severity = severity;
    }

    if (["new", "reviewed", "resolved"].includes(status)) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { type: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
        { emailSnapshot: { $regex: search, $options: "i" } }
      ];
    }

    const [events, total] = await Promise.all([
      SecurityEvent.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email status riskScore riskFlags"),
      SecurityEvent.countDocuments(filter)
    ]);

    return res.json({
      events,
      pagination: {
        total,
        page,
        limit,
        pages: Math.max(Math.ceil(total / limit), 1)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch security events" });
  }
};

exports.updateSecurityEventStatusByAdmin = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;

    if (!["new", "reviewed", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid security event status" });
    }

    const event = await SecurityEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Security event not found" });
    }

    event.status = status;
    event.reviewedBy = req.admin?.adminId || "admin";
    event.reviewedAt = new Date();
    await event.save();

    return res.json({
      message: "Security event status updated",
      event
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update security event status" });
  }
};
