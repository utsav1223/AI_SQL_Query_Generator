const { rateLimit } = require("express-rate-limit");

const sendResponse = require("../utils/sendResponse");

const buildRateLimitHandler = (message) => (req, res) => {
  return sendResponse(res, {
    statusCode: 429,
    success: false,
    message,
    data: {
      code: "RATE_LIMIT_EXCEEDED"
    }
  });
};

const createLimiter = ({ windowMs, max, message }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: buildRateLimitHandler(message)
  });
};

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many authentication attempts. Please try again later."
});

const passwordResetLimiter = createLimiter({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: "Too many password reset attempts. Please try again later."
});

const adminLoginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many admin login attempts. Please try again later."
});

const aiLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: "Too many AI requests. Please wait before trying again."
});

const paymentLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many payment requests. Please try again later."
});

module.exports = {
  authLimiter,
  passwordResetLimiter,
  adminLoginLimiter,
  aiLimiter,
  paymentLimiter
};
