const mongoose = require("mongoose");
const Feedback = require("../models/Feedback");

exports.createFeedback = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rating, topic, message } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ message: "Topic is required" });
    }

    if (!message || String(message).trim().length < 10) {
      return res.status(400).json({ message: "Message must be at least 10 characters" });
    }

    const feedback = await Feedback.create({
      userId,
      rating,
      topic: String(topic).trim(),
      message: String(message).trim()
    });

    return res.status(201).json({
      message: "Feedback submitted successfully",
      feedback
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to submit feedback" });
  }
};

exports.getMyFeedback = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const feedback = await Feedback.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json(feedback);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch feedback history" });
  }
};
