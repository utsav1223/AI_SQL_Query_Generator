const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const { requireApprovedAccess } = require("../middlewares/access.middleware");
const validate = require("../middlewares/validate.middleware");
const { createFeedback, getMyFeedback } = require("../controllers/feedback.controller");
const { feedbackCreateRules } = require("../validators/api.validator");

router.post("/", auth, requireApprovedAccess, feedbackCreateRules, validate, createFeedback);
router.get("/mine", auth, requireApprovedAccess, getMyFeedback);

module.exports = router;
