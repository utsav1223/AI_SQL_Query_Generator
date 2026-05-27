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
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status || "active",
    plan: user.plan || "free",
    avatarUrl: user.avatarUrl || null,
    dailyUsage: user.dailyUsage || 0,
    billingRenewal: user.billingRenewal || null
  };
};

module.exports = {
  generateUserToken,
  getPublicUser
};
