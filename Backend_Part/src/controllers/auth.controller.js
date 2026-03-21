const asyncHandler = require("../middlewares/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const { getRequestMeta } = require("../utils/request");
const authService = require("../services/auth.service");

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);

  return sendResponse(res, {
    statusCode: 201,
    message: "Registration successful",
    data: result
  });
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser({
    ...req.body,
    requestMeta: getRequestMeta(req)
  });

  return sendResponse(res, {
    message: "Login successful",
    data: result
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  await authService.sendPasswordResetOtp({
    email: req.body.email,
    requestMeta: getRequestMeta(req)
  });

  return sendResponse(res, {
    message: "OTP sent to your email"
  });
});

exports.verifyOTPAndReset = asyncHandler(async (req, res) => {
  await authService.resetPasswordWithOtp({
    ...req.body,
    requestMeta: getRequestMeta(req)
  });

  return sendResponse(res, {
    message: "Password reset successful"
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUserProfile(req.user.userId);

  return sendResponse(res, {
    message: "User fetched successfully",
    data: user
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateUserProfile(req.user.userId, req.body);

  return sendResponse(res, {
    message: "Profile updated successfully",
    data: user
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  await authService.changeUserPassword(req.user.userId, req.body);

  return sendResponse(res, {
    message: "Password changed successfully"
  });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  await authService.deleteUserAccount(req.user.userId);

  return sendResponse(res, {
    message: "Account deleted successfully"
  });
});
