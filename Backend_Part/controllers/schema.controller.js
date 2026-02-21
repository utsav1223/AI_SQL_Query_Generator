const SchemaModel = require("../models/Schema");

// 🔹 Save or Update Schema
exports.saveSchema = async (req, res) => {
  try {
    const { schemaText, clear } = req.body;
    const clearQuery = req.query?.clear;
    const shouldClear =
      clear === true ||
      clear === "true" ||
      clear === 1 ||
      clear === "1" ||
      clearQuery === "true" ||
      clearQuery === "1";

    if (shouldClear) {
      const deleteResult = await SchemaModel.deleteOne({
        userId: req.user.userId
      });

      return res.json({
        message: "Schema cleared successfully",
        lastUpdated: null,
        size: 0,
        deletedCount: deleteResult.deletedCount || 0
      });
    }

    const normalizedSchema = (schemaText || "").trim();

    if (!normalizedSchema) {
      return res.status(400).json({
        message: "Schema cannot be empty"
      });
    }

    if (normalizedSchema.length > 20000) {
      return res.status(400).json({
        message: "Schema exceeds maximum size (20KB)"
      });
    }

    const schema = await SchemaModel.findOneAndUpdate(
      { userId: req.user.userId },
      { schemaText: normalizedSchema },
      { new: true, upsert: true }
    );

    res.json({
      message: "Schema saved successfully",
      lastUpdated: schema.updatedAt,
      size: Buffer.byteLength(schema.schemaText, "utf8")
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to save schema"
    });
  }
};

// 🔹 Get Schema
exports.getSchema = async (req, res) => {
  try {
    const schema = await SchemaModel.findOne({
      userId: req.user.userId
    });

    if (!schema) {
      return res.json({
        schemaText: "",
        lastUpdated: null,
        size: 0
      });
    }

    res.json({
      schemaText: schema.schemaText,
      lastUpdated: schema.updatedAt,
      size: Buffer.byteLength(schema.schemaText, "utf8")
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch schema"
    });
  }
};

// 🔹 Delete Schema
exports.deleteSchema = async (req, res) => {
  try {
    const deleteResult = await SchemaModel.deleteOne({
      userId: req.user.userId
    });

    res.json({
      message: "Schema deleted successfully",
      deletedCount: deleteResult.deletedCount || 0
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to delete schema"
    });
  }
};
