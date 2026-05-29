const SchemaModel = require("../models/Schema");
const AppError = require("../utils/AppError");
const {
  getWorkspaceWriteFields,
  normalizeActor,
  withWorkspaceScope
} = require("../utils/workspaceScope");

const isDuplicateKeyError = (error) => error?.code === 11000;

const getExactWorkspaceScope = (actor) => {
  const writeFields = getWorkspaceWriteFields(actor);

  if (actor.orgId) {
    return {
      clerkOrgId: actor.orgId
    };
  }

  return {
    userId: writeFields.userId,
    clerkOrgId: null
  };
};

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

const saveSchemaForUser = async ({ actor: actorInput, userId, schemaText, clear, clearQuery }) => {
  const actor = normalizeActor(actorInput || userId);

  if (shouldClearSchema({ clear, clearQuery })) {
    const deleteResult = await SchemaModel.deleteOne(withWorkspaceScope(actor));

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

  const writeFields = getWorkspaceWriteFields(actor);
  const exactScope = getExactWorkspaceScope(actor);
  let schema;

  try {
    schema = await SchemaModel.findOneAndUpdate(
      withWorkspaceScope(actor),
      {
        $set: {
          schemaText: normalizedSchema,
          ...writeFields
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    schema = await SchemaModel.findOneAndUpdate(
      exactScope,
      {
        $set: {
          schemaText: normalizedSchema,
          ...writeFields
        }
      },
      {
        new: true,
        upsert: false
      }
    );

    if (!schema) {
      throw error;
    }
  }

  return {
    message: "Schema saved successfully",
    data: {
      lastUpdated: schema.updatedAt,
      size: Buffer.byteLength(schema.schemaText, "utf8")
    }
  };
};

const getSchemaForUser = async (actorOrUserId) => {
  const actor = normalizeActor(actorOrUserId);
  const schema = await SchemaModel.findOne(withWorkspaceScope(actor));
  return buildSchemaSummary(schema);
};

const deleteSchemaForUser = async (actorOrUserId) => {
  const actor = normalizeActor(actorOrUserId);
  const deleteResult = await SchemaModel.deleteOne(withWorkspaceScope(actor));

  return {
    deletedCount: deleteResult.deletedCount || 0
  };
};

module.exports = {
  saveSchemaForUser,
  getSchemaForUser,
  deleteSchemaForUser
};
