const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "AI SQL Studio API",
    version: "1.0.0",
    description:
      "Express API for authentication, AI SQL tools, query history, schema storage, billing, feedback, and admin operations."
  },
  servers: [
    {
      url: "/api",
      description: "Current API host"
    }
  ],
  tags: [
    { name: "Auth" },
    { name: "AI" },
    { name: "Queries" },
    { name: "Schema" },
    { name: "Payments" },
    { name: "Feedback" },
    { name: "Admin" }
  ],
  components: {
    securitySchemes: {
      userCookie: {
        type: "apiKey",
        in: "cookie",
        name: "sql_studio_token"
      },
      adminCookie: {
        type: "apiKey",
        in: "cookie",
        name: "sql_studio_admin_token"
      }
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object" }
        }
      },
      AuthCredentials: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 }
        }
      },
      AIRequest: {
        type: "object",
        required: ["mode"],
        properties: {
          mode: {
            type: "string",
            enum: ["generate", "optimize", "validate", "explain", "format"]
          },
          prompt: { type: "string" },
          sql: { type: "string" },
          dialect: {
            type: "string",
            enum: ["standard", "postgresql", "mysql", "sqlite", "sqlserver", "oracle"]
          }
        }
      },
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" },
          pages: { type: "integer" }
        }
      }
    },
    responses: {
      Unauthorized: {
        description: "Authentication is required"
      },
      Forbidden: {
        description: "The current account cannot access this resource"
      },
      RateLimited: {
        description: "Too many requests"
      }
    }
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/AuthCredentials" },
                  {
                    type: "object",
                    required: ["name"],
                    properties: {
                      name: { type: "string" }
                    }
                  }
                ]
              }
            }
          }
        },
        responses: {
          201: { description: "Registration successful" },
          400: { description: "Validation failed" },
          429: { $ref: "#/components/responses/RateLimited" }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and set the httpOnly user session cookie",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthCredentials" }
            }
          }
        },
        responses: {
          200: { description: "Login successful" },
          401: { description: "Invalid credentials" },
          429: { $ref: "#/components/responses/RateLimited" }
        }
      }
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Clear the user session cookie",
        responses: {
          200: { description: "Logout successful" }
        }
      }
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current user profile",
        security: [{ userCookie: [] }],
        responses: {
          200: { description: "User profile" },
          401: { $ref: "#/components/responses/Unauthorized" }
        }
      }
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Send a password reset OTP",
        responses: {
          200: { description: "OTP sent when the request is accepted" },
          429: { $ref: "#/components/responses/RateLimited" }
        }
      }
    },
    "/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP and reset password",
        responses: {
          200: { description: "Password reset successful" }
        }
      }
    },
    "/auth/google": {
      get: {
        tags: ["Auth"],
        summary: "Start Google OAuth login",
        responses: {
          302: { description: "Redirects to Google OAuth" },
          503: { description: "Google OAuth is not configured" }
        }
      }
    },
    "/ai": {
      post: {
        tags: ["AI"],
        summary: "Run an AI SQL tool",
        security: [{ userCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AIRequest" }
            }
          }
        },
        responses: {
          200: { description: "AI result" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          429: { $ref: "#/components/responses/RateLimited" }
        }
      }
    },
    "/queries": {
      get: {
        tags: ["Queries"],
        summary: "List query history with pagination, search, mode filter, and sort",
        security: [{ userCookie: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50 } },
          { name: "mode", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "oldest"] } }
        ],
        responses: {
          200: { description: "Query history" },
          401: { $ref: "#/components/responses/Unauthorized" }
        }
      }
    },
    "/queries/overview": {
      get: {
        tags: ["Queries"],
        summary: "Get user dashboard query overview",
        security: [{ userCookie: [] }],
        responses: {
          200: { description: "Overview metrics" }
        }
      }
    },
    "/queries/{id}": {
      delete: {
        tags: ["Queries"],
        summary: "Delete a saved query",
        security: [{ userCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Query deleted" },
          404: { description: "Query not found" }
        }
      }
    },
    "/queries/{id}/pin": {
      patch: {
        tags: ["Queries"],
        summary: "Toggle a Pro user's pinned query",
        security: [{ userCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Pin state updated" },
          403: { $ref: "#/components/responses/Forbidden" }
        }
      }
    },
    "/queries/{id}/favorite": {
      patch: {
        tags: ["Queries"],
        summary: "Toggle a Pro user's favorite query",
        security: [{ userCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Favorite state updated" },
          403: { $ref: "#/components/responses/Forbidden" }
        }
      }
    },
    "/queries/{id}/tags": {
      patch: {
        tags: ["Queries"],
        summary: "Update a Pro user's query tags",
        security: [{ userCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Tags updated" },
          403: { $ref: "#/components/responses/Forbidden" }
        }
      }
    },
    "/queries/{id}/action": {
      post: {
        tags: ["Queries"],
        summary: "Track copy or export activity for analytics",
        security: [{ userCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Query action tracked" },
          400: { description: "Invalid action" }
        }
      }
    },
    "/schema": {
      get: {
        tags: ["Schema"],
        summary: "Get saved schema context",
        security: [{ userCookie: [] }],
        responses: { 200: { description: "Saved schema" } }
      },
      post: {
        tags: ["Schema"],
        summary: "Save schema context",
        security: [{ userCookie: [] }],
        responses: { 200: { description: "Schema saved" } }
      }
    },
    "/payment/create-payment-link": {
      post: {
        tags: ["Payments"],
        summary: "Create a Razorpay hosted payment link",
        security: [{ userCookie: [] }],
        responses: {
          200: { description: "Payment link created" },
          503: { description: "Payment service not configured" }
        }
      }
    },
    "/payment/verify-payment-link": {
      post: {
        tags: ["Payments"],
        summary: "Verify hosted payment link callback",
        security: [{ userCookie: [] }],
        responses: { 200: { description: "Payment link verified" } }
      }
    },
    "/payment/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Process a signed Razorpay webhook",
        responses: {
          200: { description: "Webhook processed or safely ignored" },
          400: { description: "Invalid webhook signature or payload" }
        }
      }
    },
    "/payment/invoices": {
      get: {
        tags: ["Payments"],
        summary: "List the current user's invoices",
        security: [{ userCookie: [] }],
        responses: { 200: { description: "Invoice list" } }
      }
    },
    "/payment/downgrade": {
      post: {
        tags: ["Payments"],
        summary: "Downgrade the current user to Free",
        security: [{ userCookie: [] }],
        responses: { 200: { description: "Plan downgraded" } }
      }
    },
    "/feedback": {
      get: {
        tags: ["Feedback"],
        summary: "List current user's recent feedback",
        security: [{ userCookie: [] }],
        responses: { 200: { description: "Feedback history" } }
      },
      post: {
        tags: ["Feedback"],
        summary: "Submit feedback",
        security: [{ userCookie: [] }],
        responses: { 201: { description: "Feedback submitted" } }
      }
    },
    "/admin/login": {
      post: {
        tags: ["Admin"],
        summary: "Login admin and set admin session cookie",
        responses: {
          200: { description: "Admin login successful" },
          401: { description: "Invalid admin credentials" }
        }
      }
    },
    "/admin/overview": {
      get: {
        tags: ["Admin"],
        summary: "Get admin dashboard overview",
        security: [{ adminCookie: [] }],
        responses: { 200: { description: "Admin overview" } }
      }
    },
    "/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List users with pagination and search",
        security: [{ adminCookie: [] }],
        responses: { 200: { description: "User list" } }
      }
    },
    "/admin/users/{userId}/moderate": {
      patch: {
        tags: ["Admin"],
        summary: "Apply a moderated user action with a reason",
        security: [{ adminCookie: [] }],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Moderation action applied" } }
      }
    },
    "/admin/feedback": {
      get: {
        tags: ["Admin"],
        summary: "List feedback for triage",
        security: [{ adminCookie: [] }],
        responses: { 200: { description: "Feedback list" } }
      }
    },
    "/admin/security-events": {
      get: {
        tags: ["Admin"],
        summary: "List security events for review",
        security: [{ adminCookie: [] }],
        responses: { 200: { description: "Security event list" } }
      }
    }
  }
};

module.exports = openApiDocument;
