const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

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

    invoiceNumber: {
      type: String,
      required: true,
      unique: true
    },

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    paymentId: {
      type: String,
      required: true
    },

    orderId: {
      type: String,
      required: true
    },

    status: {
      type: String,
      default: "paid"
    }
  },
  { timestamps: true }
);

invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ clerkOrgId: 1, createdAt: -1 });
invoiceSchema.index({ scope: 1, plan: 1, createdAt: -1 });
invoiceSchema.index({ status: 1, createdAt: -1 });
invoiceSchema.index({ paymentId: 1 }, { unique: true });
invoiceSchema.index({ orderId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
