const { clerkClient } = require("@clerk/express");

const User = require("../models/User");
const Query = require("../models/Query");
const Schema = require("../models/Schema");
const Feedback = require("../models/Feedback");
const AppError = require("../utils/AppError");

const getPrimaryEmail = (clerkUser) => {
  const primaryEmailId = clerkUser.primaryEmailAddressId || clerkUser.primary_email_address_id;
  const emailAddresses = clerkUser.emailAddresses || clerkUser.email_addresses || [];
  const primaryEmail =
    emailAddresses.find((email) => email.id === primaryEmailId) || emailAddresses[0];

  return primaryEmail?.emailAddress || primaryEmail?.email_address || null;
};

const getDisplayName = (clerkUser) => {
  const firstName = clerkUser.firstName || clerkUser.first_name || "";
  const lastName = clerkUser.lastName || clerkUser.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || clerkUser.username || getPrimaryEmail(clerkUser)?.split("@")[0] || "Workspace Member";
};

const getAvatarUrl = (clerkUser) => {
  return clerkUser.imageUrl || clerkUser.image_url || clerkUser.profileImageUrl || clerkUser.profile_image_url || null;
};

const getMetadataAccessStatus = (clerkUser) => {
  const status =
    clerkUser.publicMetadata?.accessStatus ||
    clerkUser.public_metadata?.accessStatus ||
    clerkUser.privateMetadata?.accessStatus ||
    clerkUser.private_metadata?.accessStatus;

  return ["approved", "pending", "rejected"].includes(status) ? status : null;
};

const getDefaultAccessStatus = () => {
  return String(process.env.CLERK_WAITLIST_MODE || "").toLowerCase() === "true"
    ? "pending"
    : "approved";
};

const mapClerkUser = (clerkUser) => {
  return {
    clerkId: clerkUser.id,
    name: getDisplayName(clerkUser),
    email: getPrimaryEmail(clerkUser),
    avatarUrl: getAvatarUrl(clerkUser),
    accessStatus: getMetadataAccessStatus(clerkUser)
  };
};

const upsertUserFromClerkUser = async (clerkUser) => {
  const mappedUser = mapClerkUser(clerkUser);

  if (!mappedUser.clerkId || !mappedUser.email) {
    throw new AppError(400, "Clerk user payload is missing a user ID or email address");
  }

  let user = await User.findOne({ clerkId: mappedUser.clerkId });

  if (!user) {
    user = await User.findOne({ email: mappedUser.email.toLowerCase() });
  }

  if (!user) {
    user = await User.create({
      ...mappedUser,
      email: mappedUser.email.toLowerCase(),
      plan: "free",
      dailyUsage: 0,
      role: "user",
      status: "active",
      accessStatus: mappedUser.accessStatus || getDefaultAccessStatus()
    });
    return user;
  }

  user.clerkId = mappedUser.clerkId;
  user.name = mappedUser.name;
  user.email = mappedUser.email.toLowerCase();
  user.avatarUrl = mappedUser.avatarUrl;
  if (mappedUser.accessStatus) {
    user.accessStatus = mappedUser.accessStatus;
  } else if (!user.accessStatus) {
    user.accessStatus = "approved";
  }
  await user.save();

  return user;
};

const getOrCreateUserFromClerkId = async (clerkId) => {
  if (!clerkId) {
    throw new AppError(401, "Clerk user ID is required");
  }

  const existingUser = await User.findOne({ clerkId });
  if (existingUser) {
    return existingUser;
  }

  const clerkUser = await clerkClient.users.getUser(clerkId);
  return upsertUserFromClerkUser(clerkUser);
};

const deleteUserFromClerkId = async (clerkId) => {
  const user = await User.findOne({ clerkId });

  if (!user) {
    return null;
  }

  await Promise.all([
    Query.deleteMany({ userId: user._id }),
    Schema.deleteMany({ userId: user._id }),
    Feedback.deleteMany({ userId: user._id }),
    User.findByIdAndDelete(user._id)
  ]);
  return user;
};

module.exports = {
  getOrCreateUserFromClerkId,
  mapClerkUser,
  upsertUserFromClerkUser,
  deleteUserFromClerkId
};
