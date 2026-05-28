const router = require("express").Router();

const { paymentWebhookLimiter } = require("../middlewares/rateLimit.middleware");
const { handleRazorpayWebhook } = require("../controllers/payment.controller");

router.post("/", paymentWebhookLimiter, handleRazorpayWebhook);

module.exports = router;
