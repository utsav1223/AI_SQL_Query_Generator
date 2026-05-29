const mongoose = require("mongoose");

const organizationSubscriptionSchema = new mongoose.Schema(
  {
    clerkOrgId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    plan: {
      type: String,
      enum: ["free", "team", "business"],
      default: "free",
      index: true
    },
    status: {
      type: String,
      default: "free",
      trim: true,
      index: true
    },
    billingProvider: {
      type: String,
      enum: ["razorpay", "clerk", "manual"],
      default: "manual"
    },
    providerCustomerId: {
      type: String,
      default: null,
      index: true
    },
    providerSubscriptionId: {
      type: String,
      default: null,
      index: true
    },
    providerPaymentId: {
      type: String,
      default: null,
      index: true
    },
    providerOrderId: {
      type: String,
      default: null,
      index: true
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
      index: true
    },
    seatsIncluded: {
      type: Number,
      default: 5,
      min: 1
    },
    seatsUsed: {
      type: Number,
      default: 1,
      min: 0
    },
    createdByClerkUserId: {
      type: String,
      default: null,
      index: true
    },
    lastWebhookEventId: {
      type: String,
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

organizationSubscriptionSchema.index({ clerkOrgId: 1, plan: 1 });
organizationSubscriptionSchema.index({ plan: 1, currentPeriodEnd: 1 });
organizationSubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

module.exports = mongoose.model("OrganizationSubscription", organizationSubscriptionSchema);
