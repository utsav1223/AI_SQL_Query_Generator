const Feedback = require("../models/Feedback");
const AppError = require("../utils/AppError");
const {
  getWorkspaceWriteFields,
  normalizeActor,
  withWorkspaceScope
} = require("../utils/workspaceScope");

const createFeedbackForUser = async (actorOrUserId, { rating, topic, message }) => {
  const actor = normalizeActor(actorOrUserId);

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
    ...getWorkspaceWriteFields(actor),
    rating,
    topic: String(topic).trim(),
    message: String(message).trim()
  });
};

const getUserFeedbackHistory = async (actorOrUserId) => {
  const actor = normalizeActor(actorOrUserId);
  return Feedback.find(withWorkspaceScope(actor)).sort({ createdAt: -1 }).limit(20);
};

module.exports = {
  createFeedbackForUser,
  getUserFeedbackHistory
};
