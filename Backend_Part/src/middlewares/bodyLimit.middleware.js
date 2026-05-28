const express = require("express");

const tinyJson = express.json({ limit: "10kb" });
const standardJson = express.json({ limit: "50kb" });
const schemaJson = express.json({ limit: "30kb" });
const aiJson = express.json({ limit: "25kb" });
const razorpayWebhookRaw = express.raw({
  type: "application/json",
  limit: "50kb"
});

module.exports = {
  tinyJson,
  standardJson,
  schemaJson,
  aiJson,
  razorpayWebhookRaw
};
