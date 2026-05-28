const Razorpay = require("razorpay");
const crypto = require("crypto");

const User = require("../models/User");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const AppError = require("../utils/AppError");
const { getPublicUser } = require("../utils/auth");
const logger = require("../utils/logger");
const {
  sendEmail,
  buildSubscriptionActivatedEmail,
  generateInvoice
} = require("../utils/sendEmail");
const {
  SUBSCRIPTION_AMOUNT_INR,
  SUBSCRIPTION_AMOUNT_PAISE,
  getNextRenewalDate,
  activateProPlan,
  downgradeUserToFree
} = require("./subscription.service");

let razorpayClient = null;

const buildInvoiceNumber = () => `INV-${Date.now()}`;

const buildPaymentCallbackUrl = () => {
  const frontendUrl = String(process.env.FRONTEND_URL || "").trim().replace(/\/+$/, "");

  if (!frontendUrl) {
    throw new AppError(503, "Frontend URL is not configured on server.");
  }

  return `${frontendUrl}/billingsuccess`;
};

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
    throw new AppError(503, "Payment service is not configured on server.");
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET
    });
  }

  return razorpayClient;
};

const getRazorpayWebhookSecret = () => {
  const secret = String(process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();

  if (!secret) {
    throw new AppError(503, "Razorpay webhook verification is not configured.");
  }

  return secret;
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

const createBillingRecords = async ({ user, paymentId, orderId, pendingPayment = null }) => {
  const invoiceNumber = buildInvoiceNumber();

  if (pendingPayment) {
    pendingPayment.paymentId = paymentId;
    pendingPayment.orderId = orderId;
    pendingPayment.invoiceNumber = invoiceNumber;
    pendingPayment.status = "success";
    await pendingPayment.save();
  } else {
    await Payment.create({
      userId: user._id,
      paymentId,
      orderId,
      amount: SUBSCRIPTION_AMOUNT_INR,
      currency: "INR",
      invoiceNumber,
      status: "success"
    });
  }

  return Invoice.create({
    userId: user._id,
    invoiceNumber,
    amount: SUBSCRIPTION_AMOUNT_INR,
    currency: "INR",
    paymentId,
    orderId,
    status: "paid"
  });
};

const sendSubscriptionConfirmation = async ({ user, invoiceNumber, renewalDate, paymentId }) => {
  try {
    const pdfBuffer = await generateInvoice(user, paymentId, renewalDate);

    await sendEmail({
      to: user.email,
      subject: "SQL Studio Pro Subscription Activated",
      html: buildSubscriptionActivatedEmail({
        name: user.name,
        invoiceNumber,
        amount: SUBSCRIPTION_AMOUNT_INR,
        renewalDate
      }),
      attachments: [
        {
          filename: `Invoice_${invoiceNumber}.pdf`,
          content: pdfBuffer
        }
      ]
    });
  } catch (error) {
    logger.error("Failed to send subscription confirmation email", error, {
      userId: user._id,
      invoiceNumber
    });
  }
};

const timingSafeEqualString = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};

const verifySignature = (payload, signature) => {
  if (!process.env.RAZORPAY_SECRET) {
    throw new AppError(503, "Payment verification is not configured.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(payload)
    .digest("hex");

  if (!signature || !timingSafeEqualString(expectedSignature, signature)) {
    throw new AppError(400, "Invalid signature");
  }
};

const verifyWebhookSignature = ({ rawBody, signature }) => {
  const webhookSecret = getRazorpayWebhookSecret();
  const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ""));
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  if (!signature || !timingSafeEqualString(expectedSignature, signature)) {
    throw new AppError(400, "Invalid Razorpay webhook signature");
  }
};

const parseWebhookPayload = (rawBody) => {
  try {
    const source = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody || "");
    return JSON.parse(source);
  } catch {
    throw new AppError(400, "Invalid Razorpay webhook payload");
  }
};

const finalizeSuccessfulPayment = async ({
  user,
  paymentId,
  orderId,
  pendingPayment = null
}) => {
  const existingInvoice = await Invoice.findOne({ paymentId, userId: user._id });

  if (existingInvoice) {
    return {
      invoiceNumber: existingInvoice.invoiceNumber,
      alreadyVerified: true
    };
  }

  const renewalDate = getNextRenewalDate();
  await activateProPlan(user, renewalDate);

  const invoice = await createBillingRecords({
    user,
    paymentId,
    orderId,
    pendingPayment
  });

  void sendSubscriptionConfirmation({
    user,
    invoiceNumber: invoice.invoiceNumber,
    renewalDate,
    paymentId
  });

  return {
    invoiceNumber: invoice.invoiceNumber,
    alreadyVerified: false
  };
};

const createOrder = async ({ userId }) => {
  const razorpay = getRazorpayClient();
  const user = await getCurrentUser(userId);

  const order = await razorpay.orders.create({
    amount: SUBSCRIPTION_AMOUNT_PAISE,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
    notes: {
      userId: String(user._id)
    }
  });

  await Payment.create({
    userId: user._id,
    orderId: order.id,
    amount: SUBSCRIPTION_AMOUNT_INR,
    currency: "INR",
    status: "pending"
  });

  return order;
};

const createPaymentLink = async ({ userId }) => {
  const razorpay = getRazorpayClient();
  const user = await getCurrentUser(userId);
  const callbackUrl = buildPaymentCallbackUrl();
  const referenceId = `REF${Date.now()}${String(user._id).slice(-6)}`;

  const paymentLink = await razorpay.paymentLink.create({
    amount: SUBSCRIPTION_AMOUNT_PAISE,
    currency: "INR",
    accept_partial: false,
    description: "SQL Studio Pro Monthly Subscription",
    customer: {
      name: user.name || "SQL Studio User",
      email: user.email
    },
    notify: {
      email: true,
      sms: false
    },
    reminder_enable: true,
    callback_url: callbackUrl,
    callback_method: "get",
    reference_id: referenceId,
    notes: {
      userId: String(user._id)
    }
  });

  await Payment.create({
    userId: user._id,
    paymentLinkId: paymentLink.id,
    referenceId: paymentLink.reference_id,
    amount: SUBSCRIPTION_AMOUNT_INR,
    currency: "INR",
    status: "pending"
  });

  return {
    id: paymentLink.id,
    short_url: paymentLink.short_url,
    reference_id: paymentLink.reference_id
  };
};

const verifyOrderPayment = async ({
  userId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
}) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError(400, "Invalid payment payload");
  }

  verifySignature(`${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature);
  const user = await getCurrentUser(userId);
  const paymentRecord = await Payment.findOne({
    userId: user._id,
    orderId: razorpay_order_id
  });

  return finalizeSuccessfulPayment({
    user,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    pendingPayment: paymentRecord?.status === "pending" ? paymentRecord : null
  });
};

const getVerifiedPaymentLinkRecord = async ({
  userId,
  razorpay_payment_link_id,
  razorpay_payment_link_reference_id,
  razorpay_payment_id
}) => {
  const paymentRecord = await Payment.findOne({
    userId,
    paymentLinkId: razorpay_payment_link_id,
    referenceId: razorpay_payment_link_reference_id
  });

  if (!paymentRecord) {
    throw new AppError(400, "Payment link does not belong to this user.");
  }

  if (paymentRecord.status === "success") {
    if (paymentRecord.paymentId !== razorpay_payment_id) {
      throw new AppError(400, "Payment link was already verified with a different payment.");
    }

    return paymentRecord;
  }

  if (paymentRecord.status !== "pending") {
    throw new AppError(400, "Payment link is not pending verification.");
  }

  return paymentRecord;
};

const verifyHostedPaymentLink = async ({
  userId,
  razorpay_payment_link_id,
  razorpay_payment_link_reference_id,
  razorpay_payment_link_status,
  razorpay_payment_id,
  razorpay_signature
}) => {
  const hasRequiredFields =
    razorpay_payment_link_id &&
    razorpay_payment_link_reference_id &&
    razorpay_payment_link_status &&
    razorpay_payment_id &&
    razorpay_signature;

  if (!hasRequiredFields) {
    throw new AppError(400, "Invalid payment link callback payload");
  }

  verifySignature(
    [
      razorpay_payment_link_id,
      razorpay_payment_link_reference_id,
      razorpay_payment_link_status,
      razorpay_payment_id
    ].join("|"),
    razorpay_signature
  );

  if (razorpay_payment_link_status !== "paid") {
    throw new AppError(400, "Payment is not marked as paid");
  }

  const user = await getCurrentUser(userId);
  const paymentRecord = await getVerifiedPaymentLinkRecord({
    userId: user._id,
    razorpay_payment_link_id,
    razorpay_payment_link_reference_id,
    razorpay_payment_id
  });

  return finalizeSuccessfulPayment({
    user,
    paymentId: razorpay_payment_id,
    orderId: razorpay_payment_link_id,
    pendingPayment: paymentRecord.status === "pending" ? paymentRecord : null
  });
};

const processPaymentLinkPaidWebhook = async (webhookPayload) => {
  const paymentLink = webhookPayload?.payload?.payment_link?.entity || {};
  const payment = webhookPayload?.payload?.payment?.entity || {};
  const paymentLinkId = paymentLink.id;
  const referenceId = paymentLink.reference_id;
  const paymentStatus = paymentLink.status;
  const paymentId = payment.id || paymentLink.payment_id;

  if (!paymentLinkId || !referenceId || !paymentId) {
    throw new AppError(400, "Invalid Razorpay payment-link webhook payload");
  }

  if (paymentStatus !== "paid") {
    return {
      event: webhookPayload.event,
      ignored: true,
      reason: `Payment link status is ${paymentStatus || "unknown"}`
    };
  }

  const paymentRecord = await Payment.findOne({
    paymentLinkId,
    referenceId
  });

  if (!paymentRecord) {
    logger.warn("Razorpay payment-link webhook did not match a local payment record", {
      paymentLinkId,
      referenceId
    });

    return {
      event: webhookPayload.event,
      ignored: true,
      reason: "Payment link record not found"
    };
  }

  if (paymentRecord.status === "success") {
    if (paymentRecord.paymentId && paymentRecord.paymentId !== paymentId) {
      throw new AppError(400, "Payment link was already processed with a different payment.");
    }

    return {
      event: webhookPayload.event,
      paymentId,
      paymentLinkId,
      alreadyVerified: true
    };
  }

  if (paymentRecord.status !== "pending") {
    throw new AppError(400, "Payment link is not pending verification.");
  }

  const user = await getCurrentUser(paymentRecord.userId);
  const result = await finalizeSuccessfulPayment({
    user,
    paymentId,
    orderId: paymentLinkId,
    pendingPayment: paymentRecord
  });

  return {
    event: webhookPayload.event,
    paymentId,
    paymentLinkId,
    ...result
  };
};

const processCapturedPaymentWebhook = async (webhookPayload) => {
  const payment = webhookPayload?.payload?.payment?.entity || {};
  const paymentId = payment.id;
  const orderId = payment.order_id;
  const paymentStatus = payment.status;

  if (!paymentId) {
    throw new AppError(400, "Invalid Razorpay payment webhook payload");
  }

  if (!orderId) {
    return {
      event: webhookPayload.event,
      ignored: true,
      reason: "Payment is not tied to a Razorpay order"
    };
  }

  if (paymentStatus !== "captured") {
    return {
      event: webhookPayload.event,
      ignored: true,
      reason: `Payment status is ${paymentStatus || "unknown"}`
    };
  }

  const paymentRecord = await Payment.findOne({ orderId });

  if (!paymentRecord) {
    logger.warn("Razorpay captured-payment webhook did not match a local order", {
      paymentId,
      orderId
    });

    return {
      event: webhookPayload.event,
      ignored: true,
      reason: "Payment order record not found"
    };
  }

  if (paymentRecord.status === "success") {
    if (paymentRecord.paymentId && paymentRecord.paymentId !== paymentId) {
      throw new AppError(400, "Payment order was already processed with a different payment.");
    }

    return {
      event: webhookPayload.event,
      paymentId,
      orderId,
      alreadyVerified: true
    };
  }

  if (paymentRecord.status !== "pending") {
    throw new AppError(400, "Payment order is not pending verification.");
  }

  const user = await getCurrentUser(paymentRecord.userId);
  const result = await finalizeSuccessfulPayment({
    user,
    paymentId,
    orderId,
    pendingPayment: paymentRecord
  });

  return {
    event: webhookPayload.event,
    paymentId,
    orderId,
    ...result
  };
};

const handleRazorpayWebhook = async ({ rawBody, signature }) => {
  verifyWebhookSignature({ rawBody, signature });

  const webhookPayload = parseWebhookPayload(rawBody);
  const event = String(webhookPayload.event || "");

  if (event === "payment_link.paid") {
    return processPaymentLinkPaidWebhook(webhookPayload);
  }

  if (event === "payment.captured") {
    return processCapturedPaymentWebhook(webhookPayload);
  }

  logger.info("Ignored Razorpay webhook event", { event });

  return {
    event,
    ignored: true
  };
};

const getInvoicesForUser = async (userId) => {
  return Invoice.find({ userId }).sort({ createdAt: -1 });
};

const downgradePlanForUser = async (userId) => {
  const user = await getCurrentUser(userId);

  if (user.plan !== "pro") {
    return {
      alreadyFree: true,
      user: getPublicUser(user)
    };
  }

  await downgradeUserToFree(user);

  return {
    alreadyFree: false,
    user: getPublicUser(user)
  };
};

module.exports = {
  createOrder,
  createPaymentLink,
  verifyOrderPayment,
  verifyHostedPaymentLink,
  handleRazorpayWebhook,
  getInvoicesForUser,
  downgradePlanForUser
};
