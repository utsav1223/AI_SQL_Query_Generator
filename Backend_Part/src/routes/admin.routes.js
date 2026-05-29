const router = require("express").Router();
const adminAuth = require("../middlewares/adminAuth.middleware");
const { adminLoginLimiter } = require("../middlewares/rateLimit.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  adminLogin,
  adminLogout,
  getAdminMe,
  getAdminOverview,
  getAdminUsers,
  moderateUserByAdmin,
  getAdminFeedback,
  updateFeedbackStatusByAdmin,
  getAdminSecurityEvents,
  updateSecurityEventStatusByAdmin
} = require("../controllers/admin.controller");
const {
  adminLoginRules,
  adminFeedbackQueryRules,
  adminSecurityEventsQueryRules,
  adminUsersQueryRules,
  feedbackStatusRules,
  moderationRules,
  securityEventStatusRules
} = require("../validators/api.validator");

router.post("/login", adminLoginLimiter, adminLoginRules, validate, adminLogin);
router.post("/logout", adminLogout);
router.get("/me", adminAuth, getAdminMe);
router.get("/overview", adminAuth, getAdminOverview);
router.get("/users", adminAuth, adminUsersQueryRules, validate, getAdminUsers);
router.post("/users/:userId/moderate", adminAuth, moderationRules, validate, moderateUserByAdmin);
router.get("/feedback", adminAuth, adminFeedbackQueryRules, validate, getAdminFeedback);
router.patch("/feedback/:feedbackId/status", adminAuth, feedbackStatusRules, validate, updateFeedbackStatusByAdmin);
router.get("/security-events", adminAuth, adminSecurityEventsQueryRules, validate, getAdminSecurityEvents);
router.patch("/security-events/:eventId/status", adminAuth, securityEventStatusRules, validate, updateSecurityEventStatusByAdmin);

module.exports = router;
