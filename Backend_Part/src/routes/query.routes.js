const router = require("express").Router();

const auth = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  requirePro,
  requireTeamForOrganizationWorkspace
} = require("../middlewares/plan.middleware");
const {
  requireApprovedAccess,
  requireWorkspacePermission
} = require("../middlewares/access.middleware");
const {
  getUserQueries,
  deleteQuery,
  getAnalytics,
  getAdvancedAnalytics,
  togglePin,
  toggleFavorite,
  updateTags,
  trackAction,
  getOverview
} = require("../controllers/query.controller");
const {
  mongoIdParam,
  queryActionRules,
  queryHistoryRules,
  tagsRules
} = require("../validators/api.validator");

const canDeleteQuery = requireWorkspacePermission("org:query:delete", [
  "org:admin",
  "org:analyst"
]);
const canEditQuery = requireWorkspacePermission("org:query:generate", [
  "org:admin",
  "org:analyst",
  "org:member"
]);

router.get("/advanced-analytics", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, requirePro, getAdvancedAnalytics);
router.get("/analytics", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, getAnalytics);
router.get("/overview", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, getOverview);
router.get("/", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, queryHistoryRules, validate, getUserQueries);
router.delete("/:id", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, canDeleteQuery, mongoIdParam("id"), validate, deleteQuery);
router.patch("/:id/pin", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, requirePro, canEditQuery, mongoIdParam("id"), validate, togglePin);
router.patch("/:id/favorite", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, requirePro, canEditQuery, mongoIdParam("id"), validate, toggleFavorite);
router.patch("/:id/tags", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, requirePro, canEditQuery, tagsRules, validate, updateTags);
router.post("/:id/action", auth, requireApprovedAccess, requireTeamForOrganizationWorkspace, queryActionRules, validate, trackAction);

module.exports = router;
