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
  getAdminAccessAppeals,
  updateAccessAppealStatusByAdmin,
  createNotificationByAdmin,
  getAdminNotifications,
  updateNotificationStatusByAdmin,
  getAdminFeedback,
  updateFeedbackStatusByAdmin,
  getAdminSecurityEvents,
  updateSecurityEventStatusByAdmin
} = require("../controllers/admin.controller");
const {
  adminLoginRules,
  adminFeedbackQueryRules,
  adminAccessAppealsQueryRules,
  adminNotificationsQueryRules,
  adminSecurityEventsQueryRules,
  adminUsersQueryRules,
  feedbackStatusRules,
  moderationRules,
  accessAppealStatusRules,
  notificationCreateRules,
  notificationStatusRules,
  securityEventStatusRules
} = require("../validators/api.validator");

router.post("/login", adminLoginLimiter, adminLoginRules, validate, adminLogin);
router.post("/logout", adminLogout);
router.get("/me", adminAuth, getAdminMe);
router.get("/overview", adminAuth, getAdminOverview);
router.get("/users", adminAuth, adminUsersQueryRules, validate, getAdminUsers);
router.post("/users/:userId/moderate", adminAuth, moderationRules, validate, moderateUserByAdmin);
router.get("/access-appeals", adminAuth, adminAccessAppealsQueryRules, validate, getAdminAccessAppeals);
router.patch("/access-appeals/:appealId/status", adminAuth, accessAppealStatusRules, validate, updateAccessAppealStatusByAdmin);
router.get("/notifications", adminAuth, adminNotificationsQueryRules, validate, getAdminNotifications);
router.post("/notifications", adminAuth, notificationCreateRules, validate, createNotificationByAdmin);
router.patch("/notifications/:notificationId/status", adminAuth, notificationStatusRules, validate, updateNotificationStatusByAdmin);
router.get("/feedback", adminAuth, adminFeedbackQueryRules, validate, getAdminFeedback);
router.patch("/feedback/:feedbackId/status", adminAuth, feedbackStatusRules, validate, updateFeedbackStatusByAdmin);
router.get("/security-events", adminAuth, adminSecurityEventsQueryRules, validate, getAdminSecurityEvents);
router.patch("/security-events/:eventId/status", adminAuth, securityEventStatusRules, validate, updateSecurityEventStatusByAdmin);

module.exports = router;
