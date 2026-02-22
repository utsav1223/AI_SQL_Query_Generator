const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    targetEmailSnapshot: {
      type: String,
      default: "",
      trim: true,
      lowercase: true
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    nextState: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
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

adminAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);
