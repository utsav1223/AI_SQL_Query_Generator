const router = require("express").Router();
const passport = require("passport");

const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { registerValidator, loginValidator } = require("../validators/auth.validator");
const { generateUserToken, getPublicUser } = require("../utils/auth");
const sendResponse = require("../utils/sendResponse");
const {
  register,
  login,
  forgotPassword,
  verifyOTPAndReset,
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

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTPAndReset);

router.get("/me", authMiddleware, getMe);
router.put("/update-profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);
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
    const encodedUser = encodeURIComponent(JSON.stringify(getPublicUser(req.user)));
    res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}&user=${encodedUser}`);
  }
);

module.exports = router;
