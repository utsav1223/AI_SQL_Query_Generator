const mongoose = require("mongoose");

const Feedback = require("../models/Feedback");
const AppError = require("../utils/AppError");

const createFeedbackForUser = async (userId, { rating, topic, message }) => {
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError(400, "Rating must be between 1 and 5");
  }

  if (!topic || !String(topic).trim()) {
    throw new AppError(400, "Topic is required");
  }

  if (!message || String(message).trim().length < 10) {
    throw new AppError(400, "Message must be at least 10 characters");
  }

  return Feedback.create({
    userId,
    rating,
    topic: String(topic).trim(),
    message: String(message).trim()
  });
};

const getUserFeedbackHistory = async (userId) => {
  const ownerId = new mongoose.Types.ObjectId(userId);
  return Feedback.find({ userId: ownerId }).sort({ createdAt: -1 }).limit(20);
};

module.exports = {
  createFeedbackForUser,
  getUserFeedbackHistory
};
