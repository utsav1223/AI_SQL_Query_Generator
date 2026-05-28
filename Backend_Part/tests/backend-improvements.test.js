process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
process.env.ADMIN_USER_ID = process.env.ADMIN_USER_ID || "test-admin";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "TestAdmin@123";

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const request = require("supertest");

const app = require("../src/app");
const User = require("../src/models/User");
const Query = require("../src/models/Query");
const Feedback = require("../src/models/Feedback");
const Invoice = require("../src/models/Invoice");
const Payment = require("../src/models/Payment");
const SecurityEvent = require("../src/models/SecurityEvent");
const AdminAuditLog = require("../src/models/AdminAuditLog");

const hasIndex = (model, expectedFields) => {
  return model.schema.indexes().some(([fields]) => {
    return JSON.stringify(fields) === JSON.stringify(expectedFields);
  });
};

describe("Backend documentation", () => {
  it("serves an OpenAPI document for the public API contract", async () => {
    const response = await request(app).get("/api/docs/openapi.json");

    assert.equal(response.status, 200);
    assert.equal(response.body.openapi, "3.0.3");
    assert.equal(response.body.info.title, "AI SQL Studio API");
    assert.ok(response.body.paths["/ai"]);
    assert.ok(response.body.paths["/payment/webhook"]);
    assert.ok(response.body.components.securitySchemes.userCookie);
  });
});

describe("MongoDB query indexes", () => {
  it("defines indexes for high-traffic dashboard and admin reads", () => {
    assert.equal(hasIndex(User, { plan: 1, billingRenewal: 1 }), true);
    assert.equal(hasIndex(User, { createdAt: -1 }), true);
    assert.equal(hasIndex(User, { riskScore: -1, updatedAt: -1 }), true);

    assert.equal(hasIndex(Query, { userId: 1, createdAt: -1 }), true);
    assert.equal(hasIndex(Feedback, { userId: 1, createdAt: -1 }), true);
    assert.equal(hasIndex(Feedback, { status: 1, createdAt: -1 }), true);

    assert.equal(hasIndex(Invoice, { userId: 1, createdAt: -1 }), true);
    assert.equal(hasIndex(Invoice, { status: 1, createdAt: -1 }), true);

    assert.equal(hasIndex(Payment, { orderId: 1 }), true);
    assert.equal(hasIndex(Payment, { paymentLinkId: 1, referenceId: 1 }), true);

    assert.equal(hasIndex(SecurityEvent, { status: 1, createdAt: -1 }), true);
    assert.equal(hasIndex(SecurityEvent, { severity: 1, status: 1, createdAt: -1 }), true);
    assert.equal(hasIndex(AdminAuditLog, { targetUserId: 1, createdAt: -1 }), true);
  });
});
