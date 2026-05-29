const jwt = require("jsonwebtoken");

const generateUserToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const getPublicUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user._id,
    clerkId: user.clerkId || null,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status || "active",
    accessStatus: user.accessStatus || "approved",
    plan: user.plan || "free",
    clerkOrgId: user.clerkOrgId || null,
    clerkOrgRole: user.clerkOrgRole || null,
    clerkOrgPermissions: Array.isArray(user.clerkOrgPermissions)
      ? user.clerkOrgPermissions
      : [],
    avatarUrl: user.avatarUrl || null,
    dailyUsage: user.dailyUsage || 0,
    billingRenewal: user.billingRenewal || null,
    billingStatus: user.billingStatus || "free"
  };
};

module.exports = {
  generateUserToken,
  getPublicUser
};
