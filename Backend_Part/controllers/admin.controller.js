const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Query = require("../models/Query");
const Schema = require("../models/Schema");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Feedback = require("../models/Feedback");

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
      recentFeedback
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
        .populate("userId", "name email")
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
        pendingFeedback
      },
      charts: {
        monthlyBusiness,
        feedbackStatus,
        planDistribution
      },
      recentUsers,
      recentInvoices,
      recentFeedback
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
        .select("name email role plan billingRenewal createdAt dailyUsage usageDate"),
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

exports.updateUserPlanByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;

    if (!["free", "pro"].includes(plan)) {
      return res.status(400).json({ message: "Plan must be free or pro" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.plan = plan;
    if (plan === "pro") {
      if (!user.billingRenewal || user.billingRenewal < new Date()) {
        const renewalDate = new Date();
        renewalDate.setMonth(renewalDate.getMonth() + 1);
        user.billingRenewal = renewalDate;
      }
    } else {
      user.billingRenewal = null;
    }

    await user.save();

    return res.json({
      message: "User plan updated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        billingRenewal: user.billingRenewal
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update user plan" });
  }
};

exports.deleteUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin users cannot be deleted from this panel" });
    }

    await Promise.all([
      Query.deleteMany({ userId }),
      Schema.deleteMany({ userId }),
      Payment.deleteMany({ userId }),
      Invoice.deleteMany({ userId }),
      Feedback.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    return res.json({ message: "User and related records deleted successfully" });
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
