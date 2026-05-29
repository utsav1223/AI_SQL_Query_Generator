const mongoose = require("mongoose");

const accessAppealSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    clerkId: {
      type: String,
      default: "",
      trim: true,
      index: true
    },
    name: {
      type: String,
      default: "",
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    restrictionStatus: {
      type: String,
      enum: ["blocked", "deleted", "pending", "rejected", "suspended"],
      default: "blocked",
      index: true
    },
    restrictionCode: {
      type: String,
      default: "",
      trim: true
    },
    restrictionReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ["new", "in_review", "resolved", "closed"],
      default: "new",
      index: true
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000
    },
    reviewedBy: {
      type: String,
      default: "",
      trim: true
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    ipAddress: {
      type: String,
      default: "",
      trim: true
    },
    userAgent: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

accessAppealSchema.index({ status: 1, createdAt: -1 });
accessAppealSchema.index({ email: 1, createdAt: -1 });
accessAppealSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("AccessAppeal", accessAppealSchema);
