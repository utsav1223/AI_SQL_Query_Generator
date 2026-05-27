const router = require("express").Router();
const passport = require("passport");

const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  authLimiter,
  passwordResetLimiter
} = require("../middlewares/rateLimit.middleware");
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyOtpValidator,
  updateProfileValidator,
  changePasswordValidator
} = require("../validators/auth.validator");
const { generateUserToken } = require("../utils/auth");
const { setUserAuthCookie } = require("../utils/sessionCookies");
const sendResponse = require("../utils/sendResponse");
const {
  register,
  login,
  forgotPassword,
  verifyOTPAndReset,
  logout,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount
} = require("../controllers/auth.controller");

const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

const ensureGoogleOAuthConfigured = (req, res, next) => {
  if (!passport._strategy("google")) {
    return sendResponse(res, {
      statusCode: 503,
      success: false,
      message: "Google OAuth is not configured on server."
    });
  }

  return next();
};

router.post("/register", authLimiter, registerValidator, validate, register);
router.post("/login", authLimiter, loginValidator, validate, login);
router.post("/logout", logout);
router.post("/forgot-password", passwordResetLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post("/verify-otp", passwordResetLimiter, verifyOtpValidator, validate, verifyOTPAndReset);

router.get("/me", authMiddleware, getMe);
router.put("/update-profile", authMiddleware, updateProfileValidator, validate, updateProfile);
router.put("/change-password", authMiddleware, changePasswordValidator, validate, changePassword);
router.delete("/delete-account", authMiddleware, deleteAccount);

router.get(
  "/google",
  ensureGoogleOAuthConfigured,
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

router.get(
  "/google/callback",
  ensureGoogleOAuthConfigured,
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = generateUserToken(req.user);
    setUserAuthCookie(res, token);
    res.redirect(`${FRONTEND_URL}/oauth-success`);
  }
);

module.exports = router;
