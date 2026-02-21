const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { createFeedback, getMyFeedback } = require("../controllers/feedback.controller");

router.post("/", auth, createFeedback);
router.get("/mine", auth, getMyFeedback);

module.exports = router;
