process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
process.env.ADMIN_USER_ID = process.env.ADMIN_USER_ID || "test-admin";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "TestAdmin@123";

require("dotenv").config();

const assert = require("node:assert/strict");
const { after, before, beforeEach, describe, it } = require("node:test");
const mongoose = require("mongoose");
const request = require("supertest");

const app = require("../src/app");
const User = require("../src/models/User");
const Query = require("../src/models/Query");
const Schema = require("../src/models/Schema");
const Feedback = require("../src/models/Feedback");
const Payment = require("../src/models/Payment");
const Invoice = require("../src/models/Invoice");
const SecurityEvent = require("../src/models/SecurityEvent");

describe("API validation and auth guards", () => {
  it("rejects weak registration passwords before controller logic", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "weak"
      });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.match(response.body.message, /validation/i);
  });

  it("rejects invalid forgot-password email format", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "not-an-email" });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
  });

  it("rejects protected routes without a session", async () => {
    const response = await request(app).get("/api/auth/me");

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
  });
});

describe("public user payload", () => {
  it("includes Google avatar URL when one is saved", () => {
    const { getPublicUser } = require("../src/utils/auth");
    const publicUser = getPublicUser({
      _id: "507f1f77bcf86cd799439011",
      name: "Google User",
      email: "google@example.com",
      role: "user",
      status: "active",
      plan: "free",
      avatarUrl: "https://lh3.googleusercontent.com/a/profile-photo"
    });

    assert.equal(
      publicUser.avatarUrl,
      "https://lh3.googleusercontent.com/a/profile-photo"
    );
  });
});

const mongoUri = process.env.MONGO_URI_TEST;
const dbDescribe = mongoUri ? describe : describe.skip;

dbDescribe("Database-backed auth integration", () => {
  before(async () => {
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Query.deleteMany({}),
      Schema.deleteMany({}),
      Feedback.deleteMany({}),
      Payment.deleteMany({}),
      Invoice.deleteMany({}),
      SecurityEvent.deleteMany({})
    ]);
  });

  after(async () => {
    await mongoose.disconnect();
  });

  it("registers, logs in with an httpOnly cookie, and loads current user", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Cookie User",
        email: "cookie@example.com",
        password: "CookieUser@123"
      });

    assert.equal(registerResponse.status, 201);
    assert.equal(registerResponse.body.data.token, undefined);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "cookie@example.com",
        password: "CookieUser@123"
      });

    assert.equal(loginResponse.status, 200);
    assert.equal(loginResponse.body.data.token, undefined);

    const cookie = loginResponse.headers["set-cookie"]?.join("; ");
    assert.match(cookie || "", /sql_studio_token=/);
    assert.match(cookie || "", /HttpOnly/i);

    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie);

    assert.equal(meResponse.status, 200);
    assert.equal(meResponse.body.data.email, "cookie@example.com");
  });

  it("does not reveal whether a forgot-password email exists", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "unknown@example.com" });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, "OTP sent to your email");
  });
});
