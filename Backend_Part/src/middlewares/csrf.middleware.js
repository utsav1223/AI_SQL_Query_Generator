const AppError = require("../utils/AppError");

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const getOriginFromReferer = (referer = "") => {
  if (!referer) {
    return "";
  }

  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
};

const hasSessionCookie = (req) => {
  const cookieHeader = String(req.headers.cookie || "");
  return /(?:^|;\s*)sql_studio_(?:token|admin_token)=/.test(cookieHeader);
};

const createCsrfProtection = (allowedOrigins = []) => {
  const allowedOriginSet = new Set(allowedOrigins.filter(Boolean));

  return (req, res, next) => {
    if (!UNSAFE_METHODS.has(req.method)) {
      return next();
    }

    const origin = req.get("origin") || getOriginFromReferer(req.get("referer"));

    if (origin && allowedOriginSet.has(origin)) {
      return next();
    }

    if (!origin && !hasSessionCookie(req)) {
      return next();
    }

    return next(
      new AppError(
        403,
        "Request origin is not allowed.",
        "CSRF_ORIGIN_DENIED"
      )
    );
  };
};

module.exports = createCsrfProtection;
