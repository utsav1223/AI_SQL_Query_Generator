const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { handleAI } = require("../controllers/ai.controller");

router.post("/", auth, handleAI);

module.exports = router;
