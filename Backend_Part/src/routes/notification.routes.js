const router = require("express").Router();

const auth = require("../middlewares/auth.middleware");
const { requireApprovedAccess } = require("../middlewares/access.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead
} = require("../controllers/notification.controller");
const {
  notificationListRules,
  notificationReadRules
} = require("../validators/api.validator");

router.get("/", auth, requireApprovedAccess, notificationListRules, validate, getMyNotifications);
router.patch("/read-all", auth, requireApprovedAccess, markAllNotificationsRead);
router.patch("/:notificationId/read", auth, requireApprovedAccess, notificationReadRules, validate, markNotificationRead);

module.exports = router;
