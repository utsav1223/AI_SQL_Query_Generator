const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  requireApprovedAccess,
  requireWorkspacePermission
} = require("../middlewares/access.middleware");
const {
  saveSchema,
  getSchema,
  deleteSchema
} = require("../controllers/schema.controller");
const { requireTeamForOrganizationWorkspace } = require("../middlewares/plan.middleware");
const { schemaSaveRules } = require("../validators/api.validator");

const canManageSchema = requireWorkspacePermission("org:schema:manage", [
  "org:admin",
  "org:analyst",
  "org:member"
]);

router.get("/", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, getSchema);
router.post("/", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, canManageSchema, schemaSaveRules, validate, saveSchema);
router.delete("/", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, canManageSchema, deleteSchema);
router.post("/clear", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, canManageSchema, deleteSchema);
router.delete("/clear", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, canManageSchema, deleteSchema);

module.exports = router;
