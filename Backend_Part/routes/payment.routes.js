const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const {
  createOrder,
  createPaymentLink,
  verifyPayment,
  verifyPaymentLink,
  getInvoices
} = require("../controllers/payment.controller");

router.post("/create-order", auth, createOrder);
router.post("/create-payment-link", auth, createPaymentLink);
router.post("/verify", auth, verifyPayment);
router.post("/verify-payment-link", auth, verifyPaymentLink);
router.get("/invoices", auth, getInvoices);
module.exports = router;
