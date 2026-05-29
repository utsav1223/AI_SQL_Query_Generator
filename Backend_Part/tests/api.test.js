process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
process.env.ADMIN_USER_ID = process.env.ADMIN_USER_ID || "test-admin";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "TestAdmin@123";
process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "test-webhook-secret";

require("dotenv").config();

const assert = require("node:assert/strict");
const crypto = require("crypto");
const { after, before, beforeEach, describe, it } = require("node:test");
const mongoose = require("mongoose");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const User = require("../src/models/User");
const Query = require("../src/models/Query");
const Schema = require("../src/models/Schema");
const Feedback = require("../src/models/Feedback");
const Payment = require("../src/models/Payment");
const Invoice = require("../src/models/Invoice");
const OrganizationSubscription = require("../src/models/OrganizationSubscription");
const SecurityEvent = require("../src/models/SecurityEvent");
const AccessAppeal = require("../src/models/AccessAppeal");
const Notification = require("../src/models/Notification");
const NotificationRead = require("../src/models/NotificationRead");

describe("API validation and auth guards", () => {
  it("does not expose legacy password auth endpoints after Clerk migration", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@example.com", password: "weak" });
    const forgotResponse = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "test@example.com" });

    assert.equal(registerResponse.status, 404);
    assert.equal(forgotResponse.status, 404);
  });

  it("rejects protected routes without a session", async () => {
    const response = await request(app).get("/api/auth/me");

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
  });

  it("does not accept legacy app JWTs unless migration mode is explicitly enabled", async () => {
    const token = jwt.sign(
      {
        userId: "507f1f77bcf86cd799439011",
        role: "user"
      },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 401);
    assert.match(response.body.message, /Clerk session or API key/i);
  });

  it("rejects cookie-backed mutation requests from untrusted browser origins", async () => {
    const response = await request(app)
      .post("/api/admin/logout")
      .set("Origin", "https://evil.example")
      .set("Cookie", "sql_studio_admin_token=fake-token")
      .send({});

    assert.equal(response.status, 403);
    assert.equal(response.body.data.code, "CORS_ORIGIN_DENIED");
  });

  it("validates public admin login payloads before credential checks", async () => {
    const response = await request(app)
      .post("/api/admin/login")
      .send({ userId: "", password: "" });

    assert.equal(response.status, 400);
    assert.equal(response.body.data.errors.length > 0, true);
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

describe("Razorpay webhook security", () => {
  const signWebhookBody = (body) => {
    return crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");
  };

  it("rejects webhook requests with an invalid signature", async () => {
    const body = JSON.stringify({ event: "payment_link.paid" });

    const response = await request(app)
      .post("/api/payment/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", "invalid-signature")
      .send(body);

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.match(response.body.message, /signature/i);
  });

  it("accepts signed webhook requests and ignores unsupported events safely", async () => {
    const body = JSON.stringify({ event: "payment.failed" });

    const response = await request(app)
      .post("/api/payment/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", signWebhookBody(body))
      .send(body);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.ignored, true);
    assert.equal(response.body.data.event, "payment.failed");
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
      OrganizationSubscription.deleteMany({}),
      SecurityEvent.deleteMany({}),
      AccessAppeal.deleteMany({}),
      Notification.deleteMany({}),
      NotificationRead.deleteMany({})
    ]);
  });

  after(async () => {
    await mongoose.disconnect();
  });

  it("keeps password recovery out of the backend because Clerk owns it", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "unknown@example.com" });

    assert.equal(response.status, 404);
  });
});
