const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { clerkMiddleware } = require("@clerk/express");

const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const createCsrfProtection = require("./middlewares/csrf.middleware");
const AppError = require("./utils/AppError");
const authRoutes = require("./routes/auth.routes");
const queryRoutes = require("./routes/query.routes");
const aiRoutes = require("./routes/ai.routes");
const schemaRoutes = require("./routes/schema.routes");
const paymentRoutes = require("./routes/payment.routes");
const paymentWebhookRoutes = require("./routes/paymentWebhook.routes");
const clerkWebhookRoutes = require("./routes/clerkWebhook.routes");
const adminRoutes = require("./routes/admin.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const docsRoutes = require("./routes/docs.routes");
const {
  tinyJson,
  standardJson,
  schemaJson,
  aiJson,
  razorpayWebhookRaw
} = require("./middlewares/bodyLimit.middleware");

require("./utils/subscription.cron");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const localDevelopmentOrigins = isProduction
  ? []
  : ["http://localhost:5173", "http://127.0.0.1:5173"];
const configuredOrigins = [
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL
]
  .flatMap((value) => (value ? value.split(",") : []))
  .map((value) => value.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...localDevelopmentOrigins, ...configuredOrigins])];

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new AppError(403, `Origin ${origin} is not allowed by CORS`, "CORS_ORIGIN_DENIED")
      );
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "svix-id", "svix-timestamp", "svix-signature"]
  })
);
if (process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
  app.use(
    clerkMiddleware({
      authorizedParties: allowedOrigins
    })
  );
}
app.use(createCsrfProtection(allowedOrigins));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "OK",
    data: {
      uptime: process.uptime()
    }
  });
});

app.use("/api/docs", docsRoutes);
app.use("/api/webhooks/clerk", express.raw({ type: "application/json", limit: "1mb" }), clerkWebhookRoutes);
app.use("/api/auth", standardJson, authRoutes);
app.use("/api/payment/webhook", razorpayWebhookRaw, paymentWebhookRoutes);
app.use("/api/payment", tinyJson, paymentRoutes);
app.use("/api/schema", schemaJson, schemaRoutes);
app.use("/api/ai", aiJson, aiRoutes);
app.use("/api/admin", standardJson, adminRoutes);
app.use("/api/feedback", standardJson, feedbackRoutes);
app.use("/api/queries", standardJson, queryRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
