const PLACEHOLDER_VALUES = new Set([
  "replace-with-a-secure-secret",
  "replace-with-a-strong-admin-password-or-bcrypt-hash",
  "admin",
  "Admin@123",
  "changeme",
  "password",
  "secret"
]);

const isProduction = () => process.env.NODE_ENV === "production";

const read = (key) => String(process.env[key] || "").trim();

const hasValue = (key) => Boolean(read(key));

const addMissing = (errors, key, label = key) => {
  if (!hasValue(key)) {
    errors.push(`${label} is required`);
  }
};

const addPairValidation = (errors, keys, label) => {
  const presentCount = keys.filter(hasValue).length;

  if (presentCount > 0 && presentCount < keys.length) {
    errors.push(`${label} requires ${keys.join(" and ")}`);
  }
};

const addMissingAny = (errors, keys, label) => {
  if (!keys.some(hasValue)) {
    errors.push(`${label} is required (${keys.join(" or ")})`);
  }
};

const assertUrl = (errors, key, { allowList = false } = {}) => {
  const rawValue = read(key);
  if (!rawValue) return;

  const values = allowList ? rawValue.split(",").map((value) => value.trim()).filter(Boolean) : [rawValue];

  values.forEach((value) => {
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) {
        errors.push(`${key} must use http or https: ${value}`);
      }
    } catch {
      errors.push(`${key} must be a valid URL: ${value}`);
    }
  });
};

const assertNoPlaceholder = (errors, key) => {
  const value = read(key);
  if (value && PLACEHOLDER_VALUES.has(value)) {
    errors.push(`${key} must be replaced with a production value`);
  }
};

const assertJwtSecret = (errors) => {
  const value = read("JWT_SECRET");

  if (!value) return;

  if (!isProduction()) {
    return;
  }

  assertNoPlaceholder(errors, "JWT_SECRET");

  if (value.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters in production");
  }
};

const assertAdminPassword = (errors) => {
  const value = read("ADMIN_PASSWORD");

  if (!value || !isProduction()) {
    return;
  }

  assertNoPlaceholder(errors, "ADMIN_PASSWORD");

  const isBcryptHash = value.startsWith("$2a$") || value.startsWith("$2b$");

  if (!isBcryptHash && value.length < 12) {
    errors.push("ADMIN_PASSWORD must be at least 12 characters in production");
  }
};

const validateEnv = () => {
  const errors = [];

  if (isProduction()) {
    [
      "JWT_SECRET",
      "MONGO_URI",
      "ADMIN_USER_ID",
      "ADMIN_PASSWORD",
      "FRONTEND_URL",
      "CORS_ORIGIN"
    ].forEach((key) => addMissing(errors, key));

    ["JWT_SECRET", "ADMIN_USER_ID", "ADMIN_PASSWORD"].forEach((key) => {
      assertNoPlaceholder(errors, key);
    });

    addMissingAny(errors, ["GEMINI_API_KEY", "GOOGLE_API_KEY"], "Gemini API key");
  }

  assertJwtSecret(errors);
  assertAdminPassword(errors);
  assertUrl(errors, "FRONTEND_URL");
  assertUrl(errors, "CORS_ORIGIN", { allowList: true });

  addPairValidation(errors, ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"], "Google OAuth");
  addPairValidation(errors, ["RAZORPAY_KEY_ID", "RAZORPAY_SECRET"], "Razorpay payments");

  const emailProvider = read("EMAIL_PROVIDER").toLowerCase();
  if (emailProvider && !["smtp", "resend"].includes(emailProvider)) {
    errors.push("EMAIL_PROVIDER must be either smtp or resend");
  }

  if (emailProvider === "resend" || hasValue("RESEND_API_KEY")) {
    addMissing(errors, "RESEND_API_KEY", "Resend email API key");
  }

  if (emailProvider === "smtp" || hasValue("EMAIL_USER") || hasValue("EMAIL_PASS")) {
    addPairValidation(errors, ["EMAIL_USER", "EMAIL_PASS"], "SMTP email");
  }

  const port = read("PORT");
  if (port && (!Number.isInteger(Number(port)) || Number(port) <= 0)) {
    errors.push("PORT must be a positive integer");
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join("\n- ")}`);
  }
};

module.exports = {
  validateEnv
};
