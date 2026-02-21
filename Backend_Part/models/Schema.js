const mongoose = require("mongoose");

const schemaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    schemaText: {
      type: String,
      required: true,
      maxlength: 20000 // 🔥 prevent abuse (20KB limit)
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Schema", schemaSchema);
