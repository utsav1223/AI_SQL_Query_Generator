const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const { paymentLimiter } = require("../middlewares/rateLimit.middleware");
const {
  createOrder,
  createPaymentLink,
  verifyPayment,
  verifyPaymentLink,
  getInvoices,
  downgradePlan
} = require("../controllers/payment.controller");

router.post("/create-order", auth, paymentLimiter, createOrder);
router.post("/create-payment-link", auth, paymentLimiter, createPaymentLink);
router.post("/verify", auth, paymentLimiter, verifyPayment);
router.post("/verify-payment-link", auth, paymentLimiter, verifyPaymentLink);
router.post("/downgrade", auth, paymentLimiter, downgradePlan);
router.get("/invoices", auth, getInvoices);
module.exports = router;
