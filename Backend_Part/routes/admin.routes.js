const router = require("express").Router();
const adminAuth = require("../middleware/adminAuth.middleware");
const {
  adminLogin,
  getAdminMe,
  getAdminOverview,
  getAdminUsers,
  updateUserPlanByAdmin,
  deleteUserByAdmin,
  getAdminFeedback,
  updateFeedbackStatusByAdmin
} = require("../controllers/admin.controller");

router.post("/login", adminLogin);
router.get("/me", adminAuth, getAdminMe);
router.get("/overview", adminAuth, getAdminOverview);
router.get("/users", adminAuth, getAdminUsers);
router.patch("/users/:userId/plan", adminAuth, updateUserPlanByAdmin);
router.delete("/users/:userId", adminAuth, deleteUserByAdmin);
router.get("/feedback", adminAuth, getAdminFeedback);
router.patch("/feedback/:feedbackId/status", adminAuth, updateFeedbackStatusByAdmin);

module.exports = router;
