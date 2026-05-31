const test = require("node:test");
const assert = require("node:assert/strict");

const { validateEnv } = require("../src/config/env");

const ORIGINAL_ENV = { ...process.env };

const restoreEnv = () => {
  process.env = { ...ORIGINAL_ENV };
};

test.afterEach(restoreEnv);

test("production env validation fails fast for missing required settings", () => {
  process.env = {
    NODE_ENV: "production"
  };

  assert.throws(
    () => validateEnv(),
    /JWT_SECRET is required[\s\S]*MONGO_URI is required[\s\S]*ADMIN_USER_ID is required/
  );
});

test("production env validation accepts required core settings", () => {
  process.env = {
    NODE_ENV: "production",
    JWT_SECRET: "a".repeat(32),
    ADMIN_JWT_SECRET: "b".repeat(32),
    MONGO_URI: "mongodb://127.0.0.1:27017/sql-studio",
    CLERK_PUBLISHABLE_KEY: "pk_test_clerk",
    CLERK_SECRET_KEY: "sk_test_clerk",
    CLERK_WEBHOOK_SECRET: "whsec_test_clerk",
    ADMIN_USER_ID: "platform-admin",
    ADMIN_PASSWORD: "StrongAdminPassword123!",
    FRONTEND_URL: "https://example.com",
    CORS_ORIGIN: "https://example.com",
    GEMINI_API_KEY: "gemini-test-key"
  };

  assert.doesNotThrow(() => validateEnv());
});

test("production env validation rejects weak admin password", () => {
  process.env = {
    NODE_ENV: "production",
    JWT_SECRET: "a".repeat(32),
    ADMIN_JWT_SECRET: "b".repeat(32),
    MONGO_URI: "mongodb://127.0.0.1:27017/sql-studio",
    ADMIN_USER_ID: "platform-admin",
    ADMIN_PASSWORD: "short",
    FRONTEND_URL: "https://example.com",
    CORS_ORIGIN: "https://example.com",
    GEMINI_API_KEY: "gemini-test-key"
  };

  assert.throws(
    () => validateEnv(),
    /ADMIN_PASSWORD must be at least 12 characters in production/
  );
});

test("production env validation rejects documented placeholder secrets", () => {
  process.env = {
    NODE_ENV: "production",
    JWT_SECRET: "generate-a-random-32-plus-character-secret",
    ADMIN_JWT_SECRET: "generate-a-random-32-plus-character-secret",
    MONGO_URI: "mongodb://127.0.0.1:27017/sql-studio",
    ADMIN_USER_ID: "replace-with-production-admin-id",
    ADMIN_PASSWORD: "use-a-strong-12-plus-character-password-or-bcrypt-hash",
    FRONTEND_URL: "https://example.com",
    CORS_ORIGIN: "https://example.com",
    GEMINI_API_KEY: "gemini-test-key"
  };

  assert.throws(
    () => validateEnv(),
    /JWT_SECRET must be replaced[\s\S]*ADMIN_USER_ID must be replaced[\s\S]*ADMIN_PASSWORD must be replaced/
  );
});

test("production env validation requires https public origins", () => {
  process.env = {
    NODE_ENV: "production",
    JWT_SECRET: "a".repeat(32),
    ADMIN_JWT_SECRET: "b".repeat(32),
    MONGO_URI: "mongodb://127.0.0.1:27017/sql-studio",
    CLERK_PUBLISHABLE_KEY: "pk_test_clerk",
    CLERK_SECRET_KEY: "sk_test_clerk",
    CLERK_WEBHOOK_SECRET: "whsec_test_clerk",
    ADMIN_USER_ID: "platform-admin",
    ADMIN_PASSWORD: "StrongAdminPassword123!",
    FRONTEND_URL: "http://example.com",
    CORS_ORIGIN: "https://app.example.com,http://api.example.com",
    GEMINI_API_KEY: "gemini-test-key"
  };

  assert.throws(
    () => validateEnv(),
    /FRONTEND_URL must use https in production[\s\S]*CORS_ORIGIN must use https in production/
  );
});

test("production env validation requires Razorpay webhook secret when payments are configured", () => {
  process.env = {
    NODE_ENV: "production",
    JWT_SECRET: "a".repeat(32),
    ADMIN_JWT_SECRET: "b".repeat(32),
    MONGO_URI: "mongodb://127.0.0.1:27017/sql-studio",
    CLERK_PUBLISHABLE_KEY: "pk_test_clerk",
    CLERK_SECRET_KEY: "sk_test_clerk",
    CLERK_WEBHOOK_SECRET: "whsec_test_clerk",
    ADMIN_USER_ID: "platform-admin",
    ADMIN_PASSWORD: "StrongAdminPassword123!",
    FRONTEND_URL: "https://example.com",
    CORS_ORIGIN: "https://example.com",
    GEMINI_API_KEY: "gemini-test-key",
    RAZORPAY_KEY_ID: "rzp_test_key",
    RAZORPAY_SECRET: "rzp_test_secret"
  };

  assert.throws(
    () => validateEnv(),
    /Razorpay webhook secret is required/
  );
});

test("integration validation catches partial secrets", () => {
  process.env = {
    NODE_ENV: "development",
    RAZORPAY_KEY_ID: "payment-key"
  };

  assert.throws(
    () => validateEnv(),
    /Razorpay payments requires RAZORPAY_KEY_ID and RAZORPAY_SECRET/
  );
});
