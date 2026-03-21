const Razorpay = require("razorpay");
const crypto = require("crypto");

const User = require("../models/User");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const AppError = require("../utils/AppError");
const {
  sendEmail,
  buildSubscriptionActivatedEmail,
  generateInvoice
} = require("../utils/sendEmail");
const {
  SUBSCRIPTION_AMOUNT_INR,
  SUBSCRIPTION_AMOUNT_PAISE,
  getNextRenewalDate,
  activateProPlan
} = require("./subscription.service");

let razorpayClient = null;

const buildInvoiceNumber = () => `INV-${Date.now()}`;

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

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

const createBillingRecords = async ({ user, paymentId, orderId }) => {
  const invoiceNumber = buildInvoiceNumber();

  await Payment.create({
    userId: user._id,
    paymentId,
    orderId,
    amount: SUBSCRIPTION_AMOUNT_INR,
    currency: "INR",
    invoiceNumber,
    status: "success"
  });

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
    console.error("Failed to send subscription confirmation email:", error);
  }
};

const verifySignature = (payload, signature) => {
  if (!process.env.RAZORPAY_SECRET) {
    throw new AppError(503, "Payment verification is not configured.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(payload)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new AppError(400, "Invalid signature");
  }
};

const finalizeSuccessfulPayment = async ({ user, paymentId, orderId }) => {
  const existingInvoice = await Invoice.findOne({ paymentId });

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
    orderId
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

const createOrder = async () => {
  const razorpay = getRazorpayClient();

  return razorpay.orders.create({
    amount: SUBSCRIPTION_AMOUNT_PAISE,
    currency: "INR",
    receipt: `receipt_${Date.now()}`
  });
};

const createPaymentLink = async ({ userId, callbackUrl }) => {
  if (!callbackUrl) {
    throw new AppError(400, "callbackUrl is required");
  }

  const razorpay = getRazorpayClient();
  const user = await getCurrentUser(userId);

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
    reference_id: `REF${Date.now()}`,
    notes: {
      userId: String(user._id)
    }
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

  return finalizeSuccessfulPayment({
    user,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id
  });
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

  return finalizeSuccessfulPayment({
    user,
    paymentId: razorpay_payment_id,
    orderId: razorpay_payment_link_id
  });
};

const getInvoicesForUser = async (userId) => {
  return Invoice.find({ userId }).sort({ createdAt: -1 });
};

module.exports = {
  createOrder,
  createPaymentLink,
  verifyOrderPayment,
  verifyHostedPaymentLink,
  getInvoicesForUser
};
