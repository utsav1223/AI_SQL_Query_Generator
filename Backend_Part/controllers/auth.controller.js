const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const Query = require("../models/Query");
const Schema = require("../models/Schema");
const Feedback = require("../models/Feedback");
const { sendEmail, buildPasswordResetOtpEmail } = require("../utils/sendEmail");

const generateToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  plan: user.plan || "free",
  dailyUsage: user.dailyUsage || 0
});

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      plan: "free",
      dailyUsage: 0
    });

    return res.status(201).json({
      token: generateToken(user),
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    return res.json({
      token: generateToken(user),
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login failed" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetOTP = hashedOTP;
    user.resetOTPExpire = Date.now() + 10 * 60 * 1000;
    user.resetOTPAttempts = 0;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Password Reset OTP",
      html: buildPasswordResetOtpEmail({ name: user.name, otp })
    });

    return res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Email sending failed" });
  }
};

exports.verifyOTPAndReset = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ message: "Email, OTP and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOTP) {
      return res.status(400).json({ message: "Invalid request" });
    }

    if (user.resetOTPExpire < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (user.resetOTPAttempts >= 5) {
      return res.status(400).json({ message: "Too many attempts" });
    }

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
    if (hashedOTP !== user.resetOTP) {
      user.resetOTPAttempts += 1;
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;
    user.resetOTPAttempts = 0;
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Password reset failed" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Auto-downgrade expired pro subscriptions when account is refreshed.
    if (
      user.plan === "pro" &&
      user.billingRenewal &&
      new Date(user.billingRenewal) < new Date()
    ) {
      user.plan = "free";
      user.billingRenewal = null;
      await user.save();
    }

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name: name.trim() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Profile update failed" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(req.user.userId);
    if (!user || !user.password) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Password change failed" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    await Promise.all([
      Query.deleteMany({ userId }),
      Schema.deleteMany({ userId }),
      Feedback.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    return res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Account deletion failed" });
  }
};
