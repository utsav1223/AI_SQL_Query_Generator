const { body } = require("express-validator");

const {
  PASSWORD_POLICY_MESSAGE,
  validatePassword
} = require("../utils/passwordPolicy");

const passwordPolicy = (fieldName) => {
  return body(fieldName)
    .custom((value) => validatePassword(value))
    .withMessage(PASSWORD_POLICY_MESSAGE);
};

exports.registerValidator = [
  body("name")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters")
    .matches(/^[A-Za-z ]+$/)
    .withMessage("Name can contain only letters and spaces"),
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  passwordPolicy("password")
];

exports.loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
];

exports.forgotPasswordValidator = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
];

exports.verifyOtpValidator = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("otp")
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("OTP must be a 6 digit code"),
  passwordPolicy("password")
];

exports.updateProfileValidator = [
  body("name")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters")
    .matches(/^[A-Za-z ]+$/)
    .withMessage("Name can contain only letters and spaces")
];

exports.changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  passwordPolicy("newPassword")
];
