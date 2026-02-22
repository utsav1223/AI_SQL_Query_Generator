const router = require("express").Router();
const adminAuth = require("../middleware/adminAuth.middleware");
const {
  adminLogin,
  getAdminMe,
  getAdminOverview,
  getAdminUsers,
  moderateUserByAdmin,
  updateUserPlanByAdmin,
  deleteUserByAdmin,
  getAdminFeedback,
  updateFeedbackStatusByAdmin,
  getAdminSecurityEvents,
  updateSecurityEventStatusByAdmin
} = require("../controllers/admin.controller");

router.post("/login", adminLogin);
router.get("/me", adminAuth, getAdminMe);
router.get("/overview", adminAuth, getAdminOverview);
router.get("/users", adminAuth, getAdminUsers);
router.post("/users/:userId/moderate", adminAuth, moderateUserByAdmin);
router.patch("/users/:userId/plan", adminAuth, updateUserPlanByAdmin);
router.delete("/users/:userId", adminAuth, deleteUserByAdmin);
router.get("/feedback", adminAuth, getAdminFeedback);
router.patch("/feedback/:feedbackId/status", adminAuth, updateFeedbackStatusByAdmin);
router.get("/security-events", adminAuth, getAdminSecurityEvents);
router.patch("/security-events/:eventId/status", adminAuth, updateSecurityEventStatusByAdmin);

module.exports = router;
