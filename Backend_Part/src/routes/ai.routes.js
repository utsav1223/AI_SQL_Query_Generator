const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const { aiLimiter } = require("../middlewares/rateLimit.middleware");
const { handleAI } = require("../controllers/ai.controller");

router.post("/", auth, aiLimiter, handleAI);

module.exports = router;
