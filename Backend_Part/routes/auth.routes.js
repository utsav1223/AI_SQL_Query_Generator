const router = require("express").Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

const ensureGoogleOAuthConfigured = (req, res, next) => {
  if (!passport._strategy("google")) {
    return res.status(503).json({ message: "Google OAuth is not configured on server." });
  }

  return next();
};

const authMiddleware = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { registerValidator, loginValidator } = require("../validators/auth.validator");
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
    const token = jwt.sign(
      {
        userId: req.user._id,
        role: req.user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const user = {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role,
      status: req.user.status || "active",
      plan: req.user.plan || "free",
      dailyUsage: req.user.dailyUsage || 0
    };

    const encodedUser = encodeURIComponent(JSON.stringify(user));
    res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}&user=${encodedUser}`);
  }
);

module.exports = router;
