const User = require("../models/User");

module.exports = async (req, res, next) => {
  const user = await User.findById(req.user.userId);

  if (!user || user.plan !== "pro") {
    return res.status(403).json({
      message: "Pro plan required"
    });
  }

  next();
};
