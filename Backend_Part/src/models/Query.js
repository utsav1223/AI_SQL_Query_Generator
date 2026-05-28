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
    dialect: {
      type: String,
      default: "standard"
    },
    pinned: {
      type: Boolean,
      default: false
    },
    favorite: {
      type: Boolean,
      default: false
    },
    tags: {
      type: [String],
      default: []
    },
    copyCount: {
      type: Number,
      default: 0
    },
    exportCount: {
      type: Number,
      default: 0
    },
    copiedAt: {
      type: Date,
      default: null
    },
    exportedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

querySchema.index({ userId: 1, pinned: -1, createdAt: -1 });
querySchema.index({ userId: 1, favorite: -1, createdAt: -1 });
querySchema.index({ userId: 1, mode: 1, createdAt: -1 });
querySchema.index({ userId: 1, createdAt: -1 });
querySchema.index({ userId: 1, tags: 1 });

module.exports = mongoose.model("Query", querySchema);
