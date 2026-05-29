const Razorpay = require("razorpay");
const crypto = require("crypto");

const User = require("../models/User");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const AppError = require("../utils/AppError");
const { getPublicUser } = require("../utils/auth");
const { buildBillingStateForActor } = require("../utils/effectivePlan");
const logger = require("../utils/logger");
const { hasPlan } = require("../utils/planAccess");
const {
  sendEmail,
  buildSubscriptionActivatedEmail,
  generateInvoice
} = require("../utils/sendEmail");
const {
  getPlanAmountPaise,
  getPlanPriceInr,
  getNextRenewalDate,
  activateOrganizationTeam,
  activateProPlan,
  activateTeamPlan,
  downgradeOrganizationToFree,
  downgradeUserToFree
} = require("./subscription.service");

let razorpayClient = null;

const buildInvoiceNumber = () => `INV-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

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

const normalizeCheckoutScope = (scope, actor = {}) => {
  const normalized = String(scope || "").trim().toLowerCase();

  if (["personal", "organization"].includes(normalized)) {
    return normalized;
  }

  return actor.orgId ? "organization" : "personal";
};

const normalizeCheckoutPlan = (plan, scope) => {
  const normalized = String(plan || "").trim().toLowerCase();

  if (["pro", "team"].includes(normalized)) {
    return normalized;
  }

  return scope === "organization" ? "team" : "pro";
};

const buildCheckoutContext = async ({ userId, actor = {}, plan, scope }) => {
  const user = await getCurrentUser(userId);
  const requestedPlan = normalizeCheckoutPlan(plan, normalizeCheckoutScope(scope, actor));
  const checkoutScope = requestedPlan === "team" && !actor.orgId
    ? "personal"
    : normalizeCheckoutScope(scope, actor);
  const checkoutPlan = requestedPlan;

  if (checkoutScope === "personal" && !["pro", "team"].includes(checkoutPlan)) {
    throw new AppError(400, "Personal checkout supports Pro or Team only.");
  }

  if (checkoutScope === "organization" && checkoutPlan !== "team") {
    throw new AppError(400, "Organization checkout only supports the Team plan.");
  }

  if (checkoutScope === "organization" && !actor.orgId) {
    throw new AppError(400, "Switch to an organization workspace before buying Team for an organization.");
  }

  const amount = getPlanPriceInr(checkoutPlan);
  if (!amount) {
    throw new AppError(400, "Unsupported billing plan.");
  }

  return {
    user,
    scope: checkoutScope,
    plan: checkoutPlan,
    clerkOrgId: checkoutScope === "organization" ? actor.orgId : null,
    amount,
    amountPaise: getPlanAmountPaise(checkoutPlan)
  };
};

const getCheckoutDescription = ({ plan, scope }) => {
  if (plan === "team" || scope === "organization") {
    return "SQL Studio Team Monthly Subscription";
  }

  return "SQL Studio Pro Monthly Subscription";
};

const createBillingRecords = async ({
  user,
  paymentId,
  orderId,
  pendingPayment = null,
  plan,
  scope,
  clerkOrgId,
  amount
}) => {
  const invoiceNumber = buildInvoiceNumber();

  if (pendingPayment) {
    await Payment.findOneAndUpdate(
      {
        _id: pendingPayment._id,
        status: "pending"
      },
      {
        $set: {
          paymentId,
          orderId,
          invoiceNumber,
          status: "success",
          plan,
          scope,
          clerkOrgId,
          amount
        }
      },
      { new: true }
    );
  } else {
    await Payment.findOneAndUpdate(
      { paymentId },
      {
        $setOnInsert: {
          userId: user._id,
          scope,
          plan,
          clerkOrgId,
          paymentId,
          orderId,
          amount,
          currency: "INR",
          invoiceNumber,
          status: "success"
        }
      },
      { new: true, upsert: true }
    );
  }

  const invoiceResult = await Invoice.findOneAndUpdate(
    { paymentId, userId: user._id },
    {
      $setOnInsert: {
        userId: user._id,
        scope,
        plan,
        clerkOrgId,
        invoiceNumber,
        amount,
        currency: "INR",
        paymentId,
        orderId,
        status: "paid"
      }
    },
    {
      new: true,
      upsert: true,
      includeResultMetadata: true
    }
  );

  return {
    invoice: invoiceResult.value || invoiceResult,
    inserted: Boolean(invoiceResult.lastErrorObject?.upserted)
  };
};

const sendSubscriptionConfirmation = async ({
  user,
  invoiceNumber,
  renewalDate,
  paymentId,
  plan,
  amount
}) => {
  try {
    const pdfBuffer = await generateInvoice(user, paymentId, renewalDate);

    await sendEmail({
      to: user.email,
      subject: `SQL Studio ${plan === "team" ? "Team" : "Pro"} Subscription Activated`,
      html: buildSubscriptionActivatedEmail({
        name: user.name,
        invoiceNumber,
        amount,
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

const isDuplicateKeyError = (error) => error?.code === 11000;

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

const activatePaidPlanForPayment = async ({
  user,
  plan,
  scope,
  clerkOrgId,
  renewalDate,
  paymentId,
  orderId
}) => {
  if (scope === "organization") {
    await activateOrganizationTeam({
      clerkOrgId,
      renewalDate,
      providerPaymentId: paymentId,
      providerOrderId: orderId,
      createdByClerkUserId: user.clerkId || null
    });
    return;
  }

  if (plan === "team") {
    await activateTeamPlan(user, renewalDate);
    return;
  }

  await activateProPlan(user, renewalDate);
};

const buildPaymentContextFromRecord = (paymentRecord = {}) => {
  const scope = paymentRecord.scope || "personal";
  const plan = paymentRecord.plan || (scope === "organization" ? "team" : "pro");
  const amount = paymentRecord.amount || getPlanPriceInr(plan);

  return {
    scope,
    plan,
    clerkOrgId: paymentRecord.clerkOrgId || null,
    amount
  };
};

const needsPersonalPlanActivation = (user, paymentContext) => (
  paymentContext.scope === "personal" &&
  (
    !hasPlan(user?.plan, paymentContext.plan) ||
    String(user?.billingStatus || "").toLowerCase() !== "active" ||
    !user?.billingRenewal
  )
);

const finalizeSuccessfulPayment = async ({
  user,
  paymentId,
  orderId,
  pendingPayment = null
}) => {
  const paymentContext = buildPaymentContextFromRecord(pendingPayment);
  const existingInvoice = await Invoice.findOne({ paymentId });

  if (existingInvoice) {
    if (needsPersonalPlanActivation(user, paymentContext)) {
      await activatePaidPlanForPayment({
        user,
        ...paymentContext,
        renewalDate: getNextRenewalDate(),
        paymentId,
        orderId
      });
    }

    return {
      invoiceNumber: existingInvoice.invoiceNumber,
      alreadyVerified: true
    };
  }

  const renewalDate = getNextRenewalDate();

  let billingResult;

  try {
    billingResult = await createBillingRecords({
      user,
      paymentId,
      orderId,
      pendingPayment,
      ...paymentContext
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const duplicateInvoice = await Invoice.findOne({ paymentId });
    if (!duplicateInvoice) {
      throw error;
    }

    if (needsPersonalPlanActivation(user, paymentContext)) {
      await activatePaidPlanForPayment({
        user,
        ...paymentContext,
        renewalDate: getNextRenewalDate(),
        paymentId,
        orderId
      });
    }

    return {
      invoiceNumber: duplicateInvoice.invoiceNumber,
      alreadyVerified: true
    };
  }

  await activatePaidPlanForPayment({
    user,
    ...paymentContext,
    renewalDate,
    paymentId,
    orderId
  });
  const { invoice, inserted } = billingResult;

  if (inserted) {
    void sendSubscriptionConfirmation({
      user,
      invoiceNumber: invoice.invoiceNumber,
      renewalDate,
      paymentId,
      plan: paymentContext.plan,
      amount: paymentContext.amount
    });
  }

  return {
    invoiceNumber: invoice.invoiceNumber,
    alreadyVerified: !inserted
  };
};

const createOrder = async ({ userId, actor = {}, plan, scope }) => {
  const razorpay = getRazorpayClient();
  const checkout = await buildCheckoutContext({ userId, actor, plan, scope });
  const { user } = checkout;

  const order = await razorpay.orders.create({
    amount: checkout.amountPaise,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
    notes: {
      userId: String(user._id),
      clerkOrgId: checkout.clerkOrgId || "",
      scope: checkout.scope,
      plan: checkout.plan
    }
  });

  await Payment.create({
    userId: user._id,
    scope: checkout.scope,
    plan: checkout.plan,
    clerkOrgId: checkout.clerkOrgId,
    orderId: order.id,
    amount: checkout.amount,
    currency: "INR",
    status: "pending"
  });

  return order;
};

const createPaymentLink = async ({ userId, actor = {}, plan, scope }) => {
  const razorpay = getRazorpayClient();
  const checkout = await buildCheckoutContext({ userId, actor, plan, scope });
  const { user } = checkout;
  const callbackUrl = buildPaymentCallbackUrl();
  const referenceId = `REF${Date.now()}${String(user._id).slice(-6)}${checkout.plan.toUpperCase()}`;

  const paymentLink = await razorpay.paymentLink.create({
    amount: checkout.amountPaise,
    currency: "INR",
    accept_partial: false,
    description: getCheckoutDescription(checkout),
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
      userId: String(user._id),
      clerkOrgId: checkout.clerkOrgId || "",
      scope: checkout.scope,
      plan: checkout.plan
    }
  });

  await Payment.create({
    userId: user._id,
    scope: checkout.scope,
    plan: checkout.plan,
    clerkOrgId: checkout.clerkOrgId,
    paymentLinkId: paymentLink.id,
    referenceId: paymentLink.reference_id,
    amount: checkout.amount,
    currency: "INR",
    status: "pending"
  });

  return {
    id: paymentLink.id,
    short_url: paymentLink.short_url,
    reference_id: paymentLink.reference_id,
    plan: checkout.plan,
    scope: checkout.scope,
    amount: checkout.amount
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

const getCurrentBillingState = async (actor) => {
  const user = await getCurrentUser(actor.userId);
  const billingState = await buildBillingStateForActor(actor, user);

  return {
    ...billingState,
    personalPlan: user.plan || "free",
    canManageBilling:
      !actor.orgId ||
      ["org:admin", "admin"].includes(String(actor.orgRole || "").toLowerCase()) ||
      (Array.isArray(actor.orgPermissions) &&
        actor.orgPermissions.includes("org:billing:manage")) ||
      (Array.isArray(actor.orgPermissions) &&
        actor.orgPermissions.includes("org:billing"))
  };
};

const getInvoicesForUser = async (actorOrUserId) => {
  const actor = typeof actorOrUserId === "object"
    ? actorOrUserId
    : { userId: actorOrUserId, orgId: null };
  const user = await getCurrentUser(actor.userId);
  const billingState = await buildBillingStateForActor(actor, user);
  if (billingState.source === "personal_team_entitlement") {
    return Invoice.find({ userId: actor.userId, scope: "personal", plan: "team" }).sort({ createdAt: -1 });
  }

  const filter = actor.orgId
    ? { clerkOrgId: actor.orgId, scope: "organization" }
    : { userId: actor.userId, scope: "personal" };

  return Invoice.find(filter).sort({ createdAt: -1 });
};

const downgradePlanForUser = async (actorOrUserId) => {
  const actor = typeof actorOrUserId === "object"
    ? actorOrUserId
    : { userId: actorOrUserId, orgId: null };
  const user = await getCurrentUser(actor.userId);

  if (actor.orgId) {
    const beforeState = await getCurrentBillingState(actor);
    if (beforeState.source === "personal_team_entitlement") {
      await downgradeUserToFree(user);

      return {
        alreadyFree: false,
        billing: await getCurrentBillingState(actor),
        user: getPublicUser(user)
      };
    }

    await downgradeOrganizationToFree(actor.orgId);

    return {
      alreadyFree: beforeState.plan === "free",
      billing: await getCurrentBillingState(actor),
      user: getPublicUser(user)
    };
  }

  if (!hasPlan(user.plan, "pro")) {
    return {
      alreadyFree: true,
      billing: await getCurrentBillingState(actor),
      user: getPublicUser(user)
    };
  }

  await downgradeUserToFree(user);

  return {
    alreadyFree: false,
    billing: await getCurrentBillingState(actor),
    user: getPublicUser(user)
  };
};

module.exports = {
  createOrder,
  createPaymentLink,
  verifyOrderPayment,
  verifyHostedPaymentLink,
  handleRazorpayWebhook,
  getCurrentBillingState,
  getInvoicesForUser,
  downgradePlanForUser
};
