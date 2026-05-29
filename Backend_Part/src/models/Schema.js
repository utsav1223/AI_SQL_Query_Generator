const mongoose = require("mongoose");

const schemaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    clerkOrgId: {
      type: String,
      default: null
    },

    schemaText: {
      type: String,
      required: true,
      maxlength: 20000 // 20KB limit to prevent oversized schema submissions
    }
  },
  { timestamps: true }
);

schemaSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clerkOrgId: null
    }
  }
);
schemaSchema.index(
  { clerkOrgId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clerkOrgId: { $type: "string" }
    }
  }
);
schemaSchema.index({ clerkOrgId: 1, updatedAt: -1 });

module.exports = mongoose.model("Schema", schemaSchema);
