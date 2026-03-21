const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const passport = require("./config/passport");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const authRoutes = require("./routes/auth.routes");
const queryRoutes = require("./routes/query.routes");
const aiRoutes = require("./routes/ai.routes");
const schemaRoutes = require("./routes/schema.routes");
const paymentRoutes = require("./routes/payment.routes");
const adminRoutes = require("./routes/admin.routes");
const feedbackRoutes = require("./routes/feedback.routes");

require("./utils/subscription.cron");

const app = express();
const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const configuredOrigins = [
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL
]
  .flatMap((value) => (value ? value.split(",") : []))
  .map((value) => value.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])];

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/schema", schemaRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/query", queryRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
