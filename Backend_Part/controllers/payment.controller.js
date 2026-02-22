const Razorpay = require("razorpay");
const crypto = require("crypto");

const User = require("../models/User");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const { sendEmail, buildSubscriptionActivatedEmail } = require("../utils/sendEmail");

const SUBSCRIPTION_AMOUNT_INR = 499;
const SUBSCRIPTION_AMOUNT_PAISE = SUBSCRIPTION_AMOUNT_INR * 100;

let razorpayClient = null;

const isRazorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_SECRET);

const getRazorpayClient = () => {
  if (!isRazorpayConfigured()) {
    return null;
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET
    });
  }

  return razorpayClient;
};

const ensureRazorpayConfigured = (res) => {
  const client = getRazorpayClient();
  if (!client) {
    res.status(503).json({ message: "Payment service is not configured on server." });
    return null;
  }

  return client;
};

const getRenewalDate = () => {
  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + 1);
  return renewalDate;
};

const buildInvoiceNumber = () => `INV-${Date.now()}`;

const upgradeUserToPro = async (user, renewalDate) => {
  user.plan = "pro";
  user.billingRenewal = renewalDate;
  await user.save();
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
    const pdfBuffer = await exports.generateInvoice(user, paymentId, renewalDate);

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
    console.log(`Confirmation email sent with invoice to ${user.email}`);
  } catch (error) {
    console.error("Failed to send subscription confirmation email:", error);
  }
};

exports.createOrder = async (req, res) => {
  try {
    const razorpay = ensureRazorpayConfigured(res);
    if (!razorpay) return;

    const order = await razorpay.orders.create({
      amount: SUBSCRIPTION_AMOUNT_PAISE,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    });

    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Order creation failed" });
  }
};

exports.createPaymentLink = async (req, res) => {
  try {
    const razorpay = ensureRazorpayConfigured(res);
    if (!razorpay) return;

    const { callbackUrl } = req.body;

    if (!callbackUrl) {
      return res.status(400).json({ message: "callbackUrl is required" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const referenceId = `REF${Date.now()}`;
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

    return res.json({
      id: paymentLink.id,
      short_url: paymentLink.short_url,
      reference_id: paymentLink.reference_id
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Payment link creation failed" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_SECRET) {
      return res.status(503).json({ message: "Payment verification is not configured." });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment payload" });
    }

    const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(signaturePayload)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingInvoice = await Invoice.findOne({ paymentId: razorpay_payment_id });
    if (existingInvoice) {
      return res.json({
        message: "Payment already verified",
        invoiceNumber: existingInvoice.invoiceNumber
      });
    }

    const renewalDate = getRenewalDate();
    await upgradeUserToPro(user, renewalDate);

    const invoice = await createBillingRecords({
      user,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });

    await sendSubscriptionConfirmation({
      user,
      invoiceNumber: invoice.invoiceNumber,
      renewalDate
    });

    return res.json({
      message: "Payment successful. Plan upgraded.",
      invoiceNumber: invoice.invoiceNumber
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

exports.verifyPaymentLink = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_SECRET) {
      return res.status(503).json({ message: "Payment verification is not configured." });
    }

    const {
      razorpay_payment_link_id,
      razorpay_payment_link_reference_id,
      razorpay_payment_link_status,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const hasRequiredFields =
      razorpay_payment_link_id &&
      razorpay_payment_link_reference_id &&
      razorpay_payment_link_status &&
      razorpay_payment_id &&
      razorpay_signature;

    if (!hasRequiredFields) {
      return res.status(400).json({ message: "Invalid payment link callback payload" });
    }

    const signaturePayload = [
      razorpay_payment_link_id,
      razorpay_payment_link_reference_id,
      razorpay_payment_link_status,
      razorpay_payment_id
    ].join("|");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(signaturePayload)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    if (razorpay_payment_link_status !== "paid") {
      return res.status(400).json({ message: "Payment is not marked as paid" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingInvoice = await Invoice.findOne({ paymentId: razorpay_payment_id });
    if (existingInvoice) {
      return res.json({
        message: "Payment already verified",
        invoiceNumber: existingInvoice.invoiceNumber
      });
    }

    const renewalDate = getRenewalDate();
    await upgradeUserToPro(user, renewalDate);

    const invoice = await createBillingRecords({
      user,
      paymentId: razorpay_payment_id,
      orderId: razorpay_payment_link_id
    });

    await sendSubscriptionConfirmation({
      user,
      invoiceNumber: invoice.invoiceNumber,
      renewalDate
    });

    return res.json({
      message: "Payment link verified. Plan upgraded.",
      invoiceNumber: invoice.invoiceNumber
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Payment link verification failed" });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    return res.json(invoices);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch invoices" });
  }
};
