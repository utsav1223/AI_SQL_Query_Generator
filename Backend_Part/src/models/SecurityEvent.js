const mongoose = require("mongoose");

const securityEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    emailSnapshot: {
      type: String,
      default: "",
      trim: true,
      lowercase: true
    },
    type: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
      index: true
    },
    source: {
      type: String,
      enum: ["auth", "admin", "billing", "ai", "system"],
      default: "system",
      index: true
    },
    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000
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
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "resolved"],
      default: "new",
      index: true
    },
    reviewedBy: {
      type: String,
      default: "",
      trim: true
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

securityEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model("SecurityEvent", securityEventSchema);
