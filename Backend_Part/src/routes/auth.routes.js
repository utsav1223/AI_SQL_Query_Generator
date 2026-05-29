const router = require("express").Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
  logout,
  getMe
} = require("../controllers/auth.controller");

router.post("/logout", logout);

router.get("/me", authMiddleware, getMe);

module.exports = router;
