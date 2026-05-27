const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_DIRECT;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in the environment variables.");
  }

  await mongoose.connect(mongoUri);
  logger.info("MongoDB connected successfully");
};

module.exports = connectDB;
