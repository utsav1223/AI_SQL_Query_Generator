const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    type: {
      type: String,
      enum: ["announcement", "general", "maintenance", "billing", "security", "product"],
      default: "announcement",
      index: true
    },
    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal",
      index: true
    },
    audience: {
      type: String,
      enum: ["all", "free", "paid"],
      default: "all",
      index: true
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true
    },
    createdBy: {
      type: String,
      default: "admin",
      trim: true
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

notificationSchema.index({ status: 1, audience: 1, publishedAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
