const router = require("express").Router();

const { getOpenApiDocument } = require("../controllers/docs.controller");

router.get("/openapi.json", getOpenApiDocument);

module.exports = router;
