require("dotenv").config();

const { validateEnv } = require("./config/env");
const logger = require("./utils/logger");

const startServer = async () => {
  validateEnv();

  const app = require("./app");
  const connectDatabase = require("./config/db");
  const port = Number(process.env.PORT || 5000);

  await connectDatabase();

  app.listen(port, () => {
    logger.info("Server started", { port });
  });
};

startServer().catch((error) => {
  logger.error("Failed to start server", error);
  process.exit(1);
});
