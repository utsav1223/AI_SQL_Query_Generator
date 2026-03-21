const jwt = require("jsonwebtoken");

const AppError = require("../utils/AppError");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, "Authorization token is required"));
  }

  const token = authHeader.split(" ")[1];

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
