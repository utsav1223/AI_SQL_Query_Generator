const User = require("../models/User");

exports.requirePro = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.plan !== "pro") {
      return res.status(403).json({
        message: "This feature is available for Pro users only."
      });
    }

    return next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Plan verification failed" });
  }
};
