const { body, param, query } = require("express-validator");

const SQL_DIALECTS = ["standard", "postgresql", "mysql", "sqlite", "sqlserver", "oracle"];
const AI_MODES = ["generate", "optimize", "validate", "explain", "format", "schema"];
const QUERY_MODES = ["all", ...AI_MODES];
const MODERATION_ACTIONS = [
  "set_pro",
  "set_free",
  "approve_access",
  "reject_access",
  "suspend",
  "unsuspend",
  "delete"
];
const ACCESS_APPEAL_STATUSES = ["all", "new", "in_review", "resolved", "closed"];

const mongoIdParam = (name) =>
  param(name).isMongoId().withMessage(`${name} must be a valid MongoDB id`);

const paginationQuery = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("limit must be between 1 and 50")
];

const queryHistoryRules = [
  ...paginationQuery,
  query("mode").optional().isIn(QUERY_MODES).withMessage("mode is invalid"),
  query("search").optional().isString().trim().isLength({ max: 120 }).withMessage("search is too long"),
  query("sort").optional().isIn(["newest", "oldest"]).withMessage("sort is invalid")
];

const aiRequestRules = [
  body("mode").isIn(AI_MODES).withMessage("mode is invalid"),
  body("prompt").optional().isString().trim().isLength({ max: 10000 }).withMessage("prompt is too long"),
  body("sql").optional().isString().trim().isLength({ max: 20000 }).withMessage("sql is too long"),
  body("dialect").optional().isIn(SQL_DIALECTS).withMessage("dialect is invalid")
];

const schemaSaveRules = [
  body("clear").optional().isBoolean().withMessage("clear must be a boolean"),
  body("schemaText")
    .custom((value, { req }) => {
      if (req.body.clear === true || req.body.clear === "true") {
        return true;
      }

      const text = String(value || "").trim();
      if (!text || text.length > 20000) {
        throw new Error("schemaText must be between 1 and 20000 characters");
      }

      return true;
    })
];

const tagsRules = [
  mongoIdParam("id"),
  body("tags").isArray({ max: 8 }).withMessage("tags must be an array with up to 8 items"),
  body("tags.*").isString().trim().isLength({ min: 1, max: 40 }).withMessage("tags must be 1 to 40 characters")
];

const queryActionRules = [
  mongoIdParam("id"),
  body("action").isIn(["copy", "export"]).withMessage("action is invalid")
];

const feedbackCreateRules = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be between 1 and 5"),
  body("topic").isString().trim().isLength({ min: 1, max: 100 }).withMessage("topic must be 1 to 100 characters"),
  body("message").isString().trim().isLength({ min: 10, max: 3000 }).withMessage("message must be 10 to 3000 characters")
];

const accessAppealCreateRules = [
  body("message")
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("message must be 10 to 2000 characters")
];

const adminLoginRules = [
  body("userId").isString().trim().isLength({ min: 1, max: 120 }).withMessage("userId is required"),
  body("password").isString().isLength({ min: 1, max: 200 }).withMessage("password is required")
];

const adminUsersQueryRules = [
  ...paginationQuery,
  query("plan").optional().isIn(["all", "free", "pro", "team", "business"]).withMessage("plan is invalid"),
  query("status").optional().isIn(["all", "active", "suspended"]).withMessage("status is invalid"),
  query("accessStatus").optional().isIn(["all", "approved", "pending", "rejected"]).withMessage("access status is invalid"),
  query("search").optional().isString().trim().isLength({ max: 120 }).withMessage("search is too long")
];

const adminFeedbackQueryRules = [
  ...paginationQuery,
  query("status").optional().isIn(["all", "new", "reviewed", "resolved"]).withMessage("status is invalid"),
  query("search").optional().isString().trim().isLength({ max: 120 }).withMessage("search is too long")
];

const adminSecurityEventsQueryRules = [
  ...paginationQuery,
  query("severity").optional().isIn(["all", "low", "medium", "high", "critical"]).withMessage("severity is invalid"),
  query("status").optional().isIn(["all", "new", "reviewed", "resolved"]).withMessage("status is invalid"),
  query("search").optional().isString().trim().isLength({ max: 120 }).withMessage("search is too long")
];

const adminAccessAppealsQueryRules = [
  ...paginationQuery,
  query("status").optional().isIn(ACCESS_APPEAL_STATUSES).withMessage("status is invalid"),
  query("search").optional().isString().trim().isLength({ max: 120 }).withMessage("search is too long")
];

const moderationRules = [
  mongoIdParam("userId"),
  body("action").isIn(MODERATION_ACTIONS).withMessage("moderation action is invalid"),
  body("reason").isString().trim().isLength({ min: 1, max: 1000 }).withMessage("reason is required")
];

const feedbackStatusRules = [
  mongoIdParam("feedbackId"),
  body("status").isIn(["new", "reviewed", "resolved"]).withMessage("status is invalid"),
  body("adminNote").optional().isString().trim().isLength({ max: 1000 }).withMessage("adminNote is too long")
];

const securityEventStatusRules = [
  mongoIdParam("eventId"),
  body("status").isIn(["new", "reviewed", "resolved"]).withMessage("status is invalid")
];

const accessAppealStatusRules = [
  mongoIdParam("appealId"),
  body("status").isIn(ACCESS_APPEAL_STATUSES.filter((status) => status !== "all")).withMessage("status is invalid"),
  body("adminNote").optional().isString().trim().isLength({ max: 1000 }).withMessage("adminNote is too long")
];

const paymentVerifyRules = [
  body("razorpay_order_id").isString().trim().isLength({ min: 1, max: 120 }).withMessage("razorpay_order_id is required"),
  body("razorpay_payment_id").isString().trim().isLength({ min: 1, max: 120 }).withMessage("razorpay_payment_id is required"),
  body("razorpay_signature").isString().trim().isLength({ min: 20, max: 500 }).withMessage("razorpay_signature is required")
];

const paymentLinkVerifyRules = [
  body("razorpay_payment_link_id").isString().trim().isLength({ min: 1, max: 120 }).withMessage("razorpay_payment_link_id is required"),
  body("razorpay_payment_link_reference_id").isString().trim().isLength({ min: 1, max: 120 }).withMessage("razorpay_payment_link_reference_id is required"),
  body("razorpay_payment_link_status").equals("paid").withMessage("payment link status must be paid"),
  body("razorpay_payment_id").isString().trim().isLength({ min: 1, max: 120 }).withMessage("razorpay_payment_id is required"),
  body("razorpay_signature").isString().trim().isLength({ min: 20, max: 500 }).withMessage("razorpay_signature is required")
];

module.exports = {
  accessAppealCreateRules,
  accessAppealStatusRules,
  adminAccessAppealsQueryRules,
  adminLoginRules,
  adminFeedbackQueryRules,
  adminSecurityEventsQueryRules,
  adminUsersQueryRules,
  aiRequestRules,
  feedbackCreateRules,
  feedbackStatusRules,
  mongoIdParam,
  moderationRules,
  paginationQuery,
  paymentLinkVerifyRules,
  paymentVerifyRules,
  queryActionRules,
  queryHistoryRules,
  schemaSaveRules,
  securityEventStatusRules,
  tagsRules
};
