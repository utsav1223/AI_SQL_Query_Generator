const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const passport = require("./config/passport");
const authRoutes = require("./routes/auth.routes");
const queryRoutes = require("./routes/query.routes");
const aiRoutes = require("./routes/ai.routes");
const schemaRoutes = require("./routes/schema.routes");
const paymentRoutes = require("./routes/payment.routes");
const adminRoutes = require("./routes/admin.routes");
const feedbackRoutes = require("./routes/feedback.routes");

require("./utils/subscription.cron");

const app = express();
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(helmet());
app.use(
  cors({
    origin: CORS_ORIGIN,
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
app.use("/api/query", queryRoutes); // Backward compatible alias.

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong on the server"
  });
});

module.exports = app;
