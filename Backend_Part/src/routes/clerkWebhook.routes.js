const router = require("express").Router();

const { handleClerkWebhook } = require("../controllers/clerkWebhook.controller");

router.post("/", handleClerkWebhook);

module.exports = router;
