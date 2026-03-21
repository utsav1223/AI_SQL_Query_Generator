const SchemaModel = require("../models/Schema");
const AppError = require("../utils/AppError");

const buildSchemaSummary = (schema) => {
  if (!schema) {
    return {
      schemaText: "",
      lastUpdated: null,
      size: 0
    };
  }

  return {
    schemaText: schema.schemaText,
    lastUpdated: schema.updatedAt,
    size: Buffer.byteLength(schema.schemaText, "utf8")
  };
};

const shouldClearSchema = ({ clear, clearQuery }) => {
  return (
    clear === true ||
    clear === "true" ||
    clear === 1 ||
    clear === "1" ||
    clearQuery === "true" ||
    clearQuery === "1"
  );
};

const saveSchemaForUser = async ({ userId, schemaText, clear, clearQuery }) => {
  if (shouldClearSchema({ clear, clearQuery })) {
    const deleteResult = await SchemaModel.deleteOne({ userId });

    return {
      message: "Schema cleared successfully",
      data: {
        lastUpdated: null,
        size: 0,
        deletedCount: deleteResult.deletedCount || 0
      }
    };
  }

  const normalizedSchema = String(schemaText || "").trim();

  if (!normalizedSchema) {
    throw new AppError(400, "Schema cannot be empty");
  }

  if (normalizedSchema.length > 20000) {
    throw new AppError(400, "Schema exceeds maximum size (20KB)");
  }

  const schema = await SchemaModel.findOneAndUpdate(
    { userId },
    { schemaText: normalizedSchema },
    { new: true, upsert: true }
  );

  return {
    message: "Schema saved successfully",
    data: {
      lastUpdated: schema.updatedAt,
      size: Buffer.byteLength(schema.schemaText, "utf8")
    }
  };
};

const getSchemaForUser = async (userId) => {
  const schema = await SchemaModel.findOne({ userId });
  return buildSchemaSummary(schema);
};

const deleteSchemaForUser = async (userId) => {
  const deleteResult = await SchemaModel.deleteOne({ userId });

  return {
    deletedCount: deleteResult.deletedCount || 0
  };
};

module.exports = {
  saveSchemaForUser,
  getSchemaForUser,
  deleteSchemaForUser
};
