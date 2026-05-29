const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    scope: {
      type: String,
      enum: ["personal", "organization"],
      default: "personal",
      index: true
    },
    plan: {
      type: String,
      enum: ["pro", "team"],
      default: "pro",
      index: true
    },
    clerkOrgId: {
      type: String,
      default: null,
      index: true
    },
    paymentId: String,
    orderId: String,
    paymentLinkId: String,
    referenceId: String,
    amount: Number,
    currency: String,
    invoiceNumber: String,
    status: { type: String, default: "success" }
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, paymentLinkId: 1, referenceId: 1 });
paymentSchema.index({ scope: 1, plan: 1, createdAt: -1 });
paymentSchema.index({ clerkOrgId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ paymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ orderId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ paymentLinkId: 1, referenceId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
