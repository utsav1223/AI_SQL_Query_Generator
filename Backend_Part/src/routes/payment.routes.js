const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  requireApprovedAccess,
  requireWorkspacePermission
} = require("../middlewares/access.middleware");
const { paymentLimiter } = require("../middlewares/rateLimit.middleware");
const {
  createOrder,
  createPaymentLink,
  verifyPayment,
  verifyPaymentLink,
  getInvoices,
  downgradePlan,
  getCurrentBilling
} = require("../controllers/payment.controller");
const {
  paymentLinkVerifyRules,
  paymentVerifyRules
} = require("../validators/api.validator");

const canManageBilling = requireWorkspacePermission("org:billing:manage", [
  "org:admin",
  "org:billing"
]);

router.get("/current", auth, requireApprovedAccess, getCurrentBilling);
router.post("/create-order", auth, requireApprovedAccess, canManageBilling, paymentLimiter, createOrder);
router.post("/create-payment-link", auth, requireApprovedAccess, canManageBilling, paymentLimiter, createPaymentLink);
router.post("/verify", auth, requireApprovedAccess, canManageBilling, paymentLimiter, paymentVerifyRules, validate, verifyPayment);
router.post("/verify-payment-link", auth, requireApprovedAccess, canManageBilling, paymentLimiter, paymentLinkVerifyRules, validate, verifyPaymentLink);
router.post("/downgrade", auth, requireApprovedAccess, canManageBilling, paymentLimiter, downgradePlan);
router.get("/invoices", auth, requireApprovedAccess, canManageBilling, getInvoices);
module.exports = router;
