const mongoose = require("mongoose");

const querySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    prompt: String,
    generatedSQL: String,
    mode: {
      type: String,
      enum: ["generate", "optimize", "validate", "explain", "format"],
      default: "generate"
    },
    pinned: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Query", querySchema);
