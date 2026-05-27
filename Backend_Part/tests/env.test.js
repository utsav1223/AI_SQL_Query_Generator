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
    MONGO_URI: "mongodb://127.0.0.1:27017/sql-studio",
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

test("integration validation catches partial secrets", () => {
  process.env = {
    NODE_ENV: "development",
    GOOGLE_CLIENT_ID: "client-id",
    RAZORPAY_KEY_ID: "payment-key"
  };

  assert.throws(
    () => validateEnv(),
    /Google OAuth requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET[\s\S]*Razorpay payments requires RAZORPAY_KEY_ID and RAZORPAY_SECRET/
  );
});
