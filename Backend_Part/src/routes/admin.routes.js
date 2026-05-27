const router = require("express").Router();
const adminAuth = require("../middlewares/adminAuth.middleware");
const { adminLoginLimiter } = require("../middlewares/rateLimit.middleware");
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

router.post("/login", adminLoginLimiter, adminLogin);
router.post("/logout", adminLogout);
router.get("/me", adminAuth, getAdminMe);
router.get("/overview", adminAuth, getAdminOverview);
router.get("/users", adminAuth, getAdminUsers);
router.post("/users/:userId/moderate", adminAuth, moderateUserByAdmin);
router.get("/feedback", adminAuth, getAdminFeedback);
router.patch("/feedback/:feedbackId/status", adminAuth, updateFeedbackStatusByAdmin);
router.get("/security-events", adminAuth, getAdminSecurityEvents);
router.patch("/security-events/:eventId/status", adminAuth, updateSecurityEventStatusByAdmin);

module.exports = router;
