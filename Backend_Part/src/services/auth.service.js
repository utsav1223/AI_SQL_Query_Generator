const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const Query = require("../models/Query");
const Schema = require("../models/Schema");
const Feedback = require("../models/Feedback");
const AppError = require("../utils/AppError");
const { generateUserToken, getPublicUser } = require("../utils/auth");
const { sendEmail, buildPasswordResetOtpEmail } = require("../utils/sendEmail");
const { createSecurityEvent } = require("../utils/securityMonitor");
const {
  PASSWORD_POLICY_MESSAGE,
  validatePassword
} = require("../utils/passwordPolicy");
const { downgradeExpiredUserIfNeeded } = require("./subscription.service");

const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const registerUser = async ({ name, email, password }) => {
  if (!validatePassword(password)) {
    throw new AppError(400, PASSWORD_POLICY_MESSAGE);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    plan: "free",
    dailyUsage: 0
  });

  return {
    token: generateUserToken(user),
    user: getPublicUser(user)
  };
};

const loginUser = async ({ email, password, requestMeta }) => {
  const user = await User.findOne({ email });

  if (!user || !user.password) {
    await createSecurityEvent({
      emailSnapshot: email,
      type: "user_login_failed",
      severity: "medium",
      source: "auth",
      message: "Login failed due to invalid credentials.",
      metadata: { reason: "user_not_found_or_password_missing" },
      ...requestMeta
    });

    throw new AppError(400, "Invalid credentials");
  }

  if (user.status === "suspended") {
    await createSecurityEvent({
      userId: user._id,
      emailSnapshot: user.email,
      type: "suspended_user_login_attempt",
      severity: "high",
      source: "auth",
      message: "Suspended user attempted login.",
      riskDelta: 5,
      riskFlag: "suspended_login_attempt",
      ...requestMeta
    });

    throw new AppError(403, "Account suspended. Contact support.");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    await createSecurityEvent({
      userId: user._id,
      emailSnapshot: user.email,
      type: "user_login_failed",
      severity: "medium",
      source: "auth",
      message: "Login failed due to invalid password.",
      riskDelta: 4,
      riskFlag: "repeated_login_failure",
      ...requestMeta
    });

    throw new AppError(400, "Invalid credentials");
  }

  return {
    token: generateUserToken(user),
    user: getPublicUser(user)
  };
};

const sendPasswordResetOtp = async ({ email, requestMeta }) => {
  const user = await User.findOne({ email });

  if (!user) {
    await createSecurityEvent({
      emailSnapshot: email,
      type: "password_reset_unknown_email",
      severity: "low",
      source: "auth",
      message: "Password reset requested for non-existing email.",
      ...requestMeta
    });

    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOTP = hashOtp(otp);
  user.resetOTPExpire = Date.now() + 10 * 60 * 1000;
  user.resetOTPAttempts = 0;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Password Reset OTP",
    html: buildPasswordResetOtpEmail({ name: user.name, otp })
  });
};

const resetPasswordWithOtp = async ({ email, otp, password, requestMeta }) => {
  if (!email || !otp || !password) {
    throw new AppError(400, "Email, OTP and password are required");
  }

  if (!validatePassword(password)) {
    throw new AppError(400, PASSWORD_POLICY_MESSAGE);
  }

  const user = await User.findOne({ email });
  if (!user || !user.resetOTP) {
    throw new AppError(400, "Invalid request");
  }

  if (user.resetOTPExpire < Date.now()) {
    throw new AppError(400, "OTP expired");
  }

  if (user.resetOTPAttempts >= 5) {
    await createSecurityEvent({
      userId: user._id,
      emailSnapshot: user.email,
      type: "password_reset_otp_limit_hit",
      severity: "high",
      source: "auth",
      message: "OTP attempt limit exceeded for password reset.",
      riskDelta: 10,
      riskFlag: "otp_abuse_pattern",
      ...requestMeta
    });

    throw new AppError(400, "Too many attempts");
  }

  if (hashOtp(otp) !== user.resetOTP) {
    user.resetOTPAttempts += 1;
    await user.save();

    await createSecurityEvent({
      userId: user._id,
      emailSnapshot: user.email,
      type: "password_reset_otp_failed",
      severity: user.resetOTPAttempts >= 3 ? "medium" : "low",
      source: "auth",
      message: "Invalid OTP submitted for password reset.",
      riskDelta: 2,
      riskFlag: "otp_failure",
      ...requestMeta
    });

    throw new AppError(400, "Invalid OTP");
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetOTP = undefined;
  user.resetOTPExpire = undefined;
  user.resetOTPAttempts = 0;
  await user.save();
};

const getCurrentUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  await downgradeExpiredUserIfNeeded(user);
  return getPublicUser(user);
};

const updateUserProfile = async (userId, { name }) => {
  if (!name || !name.trim()) {
    throw new AppError(400, "Name is required");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { name: name.trim() },
    { new: true }
  );

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return getPublicUser(user);
};

const changeUserPassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    throw new AppError(400, "All fields are required");
  }

  if (!validatePassword(newPassword)) {
    throw new AppError(400, PASSWORD_POLICY_MESSAGE);
  }

  const user = await User.findById(userId);
  if (!user || !user.password) {
    throw new AppError(404, "User not found");
  }

  const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordCorrect) {
    throw new AppError(400, "Current password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
};

const deleteUserAccount = async (userId) => {
  await Promise.all([
    Query.deleteMany({ userId }),
    Schema.deleteMany({ userId }),
    Feedback.deleteMany({ userId }),
    User.findByIdAndDelete(userId)
  ]);
};

module.exports = {
  registerUser,
  loginUser,
  sendPasswordResetOtp,
  resetPasswordWithOtp,
  getCurrentUserProfile,
  updateUserProfile,
  changeUserPassword,
  deleteUserAccount
};
