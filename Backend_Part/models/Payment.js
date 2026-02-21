const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paymentId: String,
    orderId: String,
    amount: Number,
    currency: String,
    invoiceNumber: String,
    status: { type: String, default: "success" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
