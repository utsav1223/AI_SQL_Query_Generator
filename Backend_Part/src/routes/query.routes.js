const router = require("express").Router();

const auth = require("../middlewares/auth.middleware");
const { requirePro } = require("../middlewares/plan.middleware");
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

router.get("/advanced-analytics", auth, requirePro, getAdvancedAnalytics);
router.get("/analytics", auth, getAnalytics);
router.get("/overview", auth, getOverview);
router.get("/", auth, getUserQueries);
router.delete("/:id", auth, deleteQuery);
router.patch("/:id/pin", auth, requirePro, togglePin);
router.patch("/:id/favorite", auth, requirePro, toggleFavorite);
router.patch("/:id/tags", auth, requirePro, updateTags);
router.post("/:id/action", auth, trackAction);

module.exports = router;
