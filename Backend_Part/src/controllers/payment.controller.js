const asyncHandler = require("../middlewares/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const paymentService = require("../services/payment.service");

exports.createOrder = asyncHandler(async (req, res) => {
  const order = await paymentService.createOrder();

  return sendResponse(res, {
    message: "Payment order created successfully",
    data: order
  });
});

exports.createPaymentLink = asyncHandler(async (req, res) => {
  const paymentLink = await paymentService.createPaymentLink({
    userId: req.user.userId
  });

  return sendResponse(res, {
    message: "Payment link created successfully",
    data: paymentLink
  });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyOrderPayment({
    userId: req.user.userId,
    ...req.body
  });

  return sendResponse(res, {
    message: result.alreadyVerified
      ? "Payment already verified"
      : "Payment successful. Plan upgraded.",
    data: {
      invoiceNumber: result.invoiceNumber
    }
  });
});

exports.verifyPaymentLink = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyHostedPaymentLink({
    userId: req.user.userId,
    ...req.body
  });

  return sendResponse(res, {
    message: result.alreadyVerified
      ? "Payment already verified"
      : "Payment link verified. Plan upgraded.",
    data: {
      invoiceNumber: result.invoiceNumber
    }
  });
});

exports.getInvoices = asyncHandler(async (req, res) => {
  const invoices = await paymentService.getInvoicesForUser(req.user.userId);

  return sendResponse(res, {
    message: "Invoices fetched successfully",
    data: invoices
  });
});

exports.downgradePlan = asyncHandler(async (req, res) => {
  const result = await paymentService.downgradePlanForUser(req.user.userId);

  return sendResponse(res, {
    message: result.alreadyFree
      ? "Account is already on the free plan."
      : "Plan downgraded to free.",
    data: result
  });
});
