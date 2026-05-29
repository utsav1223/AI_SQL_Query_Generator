const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const {
  requireApprovedAccess,
  requireWorkspacePermission
} = require("../middlewares/access.middleware");
const { aiLimiter } = require("../middlewares/rateLimit.middleware");
const validate = require("../middlewares/validate.middleware");
const { aiRequestRules } = require("../validators/api.validator");
const { handleAI } = require("../controllers/ai.controller");
const { requireTeamForOrganizationWorkspace } = require("../middlewares/plan.middleware");

router.post(
  "/",
  auth,
  requireApprovedAccess,
  requireTeamForOrganizationWorkspace,
  requireWorkspacePermission("org:query:generate", ["org:admin", "org:analyst", "org:member"]),
  aiLimiter,
  aiRequestRules,
  validate,
  handleAI
);

module.exports = router;
