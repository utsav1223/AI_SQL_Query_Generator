const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const {
  saveSchema,
  getSchema,
  deleteSchema
} = require("../controllers/schema.controller");

router.get("/", auth, getSchema);
router.post("/", auth, saveSchema);
router.delete("/", auth, deleteSchema);
router.post("/clear", auth, deleteSchema);
router.delete("/clear", auth, deleteSchema);

module.exports = router;
