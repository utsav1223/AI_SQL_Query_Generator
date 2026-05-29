const { Webhook } = require("svix");

const asyncHandler = require("../middlewares/asyncHandler");
const AppError = require("../utils/AppError");
const sendResponse = require("../utils/sendResponse");
const {
  upsertUserFromClerkUser,
  deleteUserFromClerkId
} = require("../services/clerkSync.service");
const { activateOrganizationTeam } = require("../services/subscription.service");
const User = require("../models/User");
const WebhookAuditLog = require("../models/WebhookAuditLog");
const { hasPlan } = require("../utils/planAccess");

const parseBody = (body) => {
  if (Buffer.isBuffer(body)) {
    return body.toString("utf8");
  }

  return typeof body === "string" ? body : JSON.stringify(body);
};

const verifyWebhook = (req) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new AppError(503, "Clerk webhook secret is not configured");
  }

  const headers = {
    "svix-id": req.headers["svix-id"],
    "svix-timestamp": req.headers["svix-timestamp"],
    "svix-signature": req.headers["svix-signature"]
  };

  try {
    return new Webhook(webhookSecret).verify(parseBody(req.body), headers);
  } catch {
    throw new AppError(400, "Invalid Clerk webhook signature");
  }
};

const getAuditIdentity = (event) => {
  const data = event.data || {};

  return {
    clerkUserId:
      data.id?.startsWith?.("user_") ? data.id :
      data.user_id ||
      data.userId ||
      data.created_by ||
      data.createdBy ||
      data.public_user_data?.user_id ||
      data.publicUserData?.userId ||
      null,
    clerkOrgId:
      data.id?.startsWith?.("org_") ? data.id :
      data.organization?.id ||
      data.organization_id ||
      data.organizationId ||
      data.org_id ||
      data.orgId ||
      null
  };
};

const buildPayloadSummary = (event) => {
  const data = event.data || {};

  return {
    object: data.object || data.type || null,
    status: data.status || null,
    email:
      data.email_addresses?.[0]?.email_address ||
      data.emailAddresses?.[0]?.emailAddress ||
      data.primary_email_address?.email_address ||
      null,
    hasOrganization: Boolean(data.organization || data.organization_id || data.organizationId),
    receivedAt: new Date().toISOString()
  };
};

const createWebhookAuditLog = async ({ event, status, errorMessage = "" }) => {
  const identity = getAuditIdentity(event);

  await WebhookAuditLog.create({
    provider: "clerk",
    eventId: event.id || null,
    eventType: event.type,
    status,
    ...identity,
    payloadSummary: buildPayloadSummary(event),
    errorMessage
  });
};

const getOrganizationCreatorId = (data = {}) =>
  data.created_by ||
  data.createdBy ||
  data.created_by_user_id ||
  data.createdByUserId ||
  null;

const activateTeamOrganizationForCreator = async (data = {}) => {
  const clerkOrgId = data.id;
  const creatorClerkUserId = getOrganizationCreatorId(data);

  if (!clerkOrgId || !creatorClerkUserId) {
    return false;
  }

  const creator = await User.findOne({ clerkId: creatorClerkUserId });

  if (!hasPlan(creator?.plan, "team")) {
    return false;
  }

  await activateOrganizationTeam({
    clerkOrgId,
    renewalDate: creator.billingRenewal || undefined,
    createdByClerkUserId: creatorClerkUserId
  });

  return true;
};

exports.handleClerkWebhook = asyncHandler(async (req, res) => {
  const event = verifyWebhook(req);
  let status = "ignored";

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      await upsertUserFromClerkUser(event.data);
      status = "processed";
    }

    if (event.type === "user.deleted") {
      await deleteUserFromClerkId(event.data.id);
      status = "processed";
    }

    if (event.type === "organization.created") {
      await activateTeamOrganizationForCreator(event.data);
      status = "processed";
    }

    if (event.type.startsWith("organization.") || event.type.startsWith("membership.")) {
      status = "processed";
    }

    await createWebhookAuditLog({ event, status });
  } catch (error) {
    await createWebhookAuditLog({
      event,
      status: "failed",
      errorMessage: error.message || "Webhook processing failed"
    });
    throw error;
  }

  return sendResponse(res, {
    message: "Clerk webhook processed"
  });
});
