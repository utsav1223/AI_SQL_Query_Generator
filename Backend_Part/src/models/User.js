const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    clerkId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      index: true
    },
    clerkOrgId: {
      type: String,
      default: null,
      index: true
    },
    billingStatus: {
      type: String,
      default: "free",
      trim: true
    },
    accessStatus: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
      index: true
    },
    avatarUrl: {
      type: String,
      default: null,
      trim: true
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user"
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      index: true
    },
    plan: {
      type: String,
      enum: ["free", "pro", "team", "business"],
      default: "free"
    },
    clerkOrgRole: {
      type: String,
      default: null,
      trim: true
    },
    clerkOrgPermissions: {
      type: [String],
      default: []
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    riskFlags: {
      type: [String],
      default: []
    },
    lastSecurityEventAt: {
      type: Date,
      default: null
    },
    dailyUsage: {
      type: Number,
      default: 0
    },
    usageDate: {
      type: Date,
      default: Date.now
    },
    billingRenewal: {
      type: Date,
      default: null
    },
    teamSize: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

userSchema.index({ plan: 1 });
userSchema.index({ plan: 1, billingRenewal: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ riskScore: -1, updatedAt: -1 });
userSchema.index({ clerkId: 1 }, { sparse: true });
userSchema.index({ accessStatus: 1, createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
