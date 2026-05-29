const mongoose = require("mongoose");

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const normalizeActor = (actorOrUserId) => {
  if (actorOrUserId && typeof actorOrUserId === "object") {
    return {
      ...actorOrUserId,
      userId: String(actorOrUserId.userId || actorOrUserId._id || "")
    };
  }

  return {
    userId: String(actorOrUserId || ""),
    orgId: null
  };
};

const getWorkspaceScope = (actorOrUserId) => {
  const actor = normalizeActor(actorOrUserId);

  if (actor.orgId) {
    return {
      clerkOrgId: actor.orgId
    };
  }

  return {
    userId: toObjectId(actor.userId),
    $or: [
      { clerkOrgId: null },
      { clerkOrgId: { $exists: false } }
    ]
  };
};

const withWorkspaceScope = (actorOrUserId, extraFilter = {}) => {
  const scope = getWorkspaceScope(actorOrUserId);
  const filters = [scope];

  if (extraFilter && Object.keys(extraFilter).length > 0) {
    filters.push(extraFilter);
  }

  return filters.length === 1 ? scope : { $and: filters };
};

const getWorkspaceWriteFields = (actorOrUserId) => {
  const actor = normalizeActor(actorOrUserId);

  return {
    userId: toObjectId(actor.userId),
    clerkOrgId: actor.orgId || null
  };
};

module.exports = {
  normalizeActor,
  getWorkspaceScope,
  withWorkspaceScope,
  getWorkspaceWriteFields
};
