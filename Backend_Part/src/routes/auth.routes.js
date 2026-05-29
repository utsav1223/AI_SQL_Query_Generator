const router = require("express").Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { authLimiter } = require("../middlewares/rateLimit.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  logout,
  getMe,
  submitAccessAppeal
} = require("../controllers/auth.controller");
const { accessAppealCreateRules } = require("../validators/api.validator");

router.post("/logout", logout);
router.post("/access-appeal", authLimiter, accessAppealCreateRules, validate, submitAccessAppeal);

router.get("/me", authMiddleware, getMe);

module.exports = router;
