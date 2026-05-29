const mongoose = require("mongoose");

const webhookAuditLogSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: "clerk",
      index: true
    },
    eventId: {
      type: String,
      default: null,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    clerkUserId: {
      type: String,
      default: null,
      index: true
    },
    clerkOrgId: {
      type: String,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ["processed", "ignored", "failed"],
      required: true,
      index: true
    },
    payloadSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    errorMessage: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

webhookAuditLogSchema.index({ provider: 1, eventId: 1 }, { sparse: true });
webhookAuditLogSchema.index({ eventType: 1, createdAt: -1 });
webhookAuditLogSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("WebhookAuditLog", webhookAuditLogSchema);
