const jwt = require("jsonwebtoken");

const AppError = require("../utils/AppError");
const { ADMIN_AUTH_COOKIE, getCookieValue } = require("../utils/sessionCookies");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : "";
  const cookieToken = getCookieValue(req, ADMIN_AUTH_COOKIE);
  const token = bearerToken || cookieToken;

  if (!token) {
    return next(new AppError(401, "Authorization token is required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return next(new AppError(403, "Admin access required"));
    }

    req.admin = decoded;
    return next();
  } catch {
    return next(new AppError(401, "Invalid token"));
  }
};
