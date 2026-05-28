const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ paymentLinkId: 1, referenceId: 1 });
paymentSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
