const router = require("express").Router();

const auth = require("../middleware/auth.middleware");
const { requirePro } = require("../middleware/plan.middleware");
const {
  getUserQueries,
  deleteQuery,
  getAnalytics,
  getAdvancedAnalytics,
  togglePin,
  getOverview
} = require("../controllers/query.controller");

router.get("/advanced-analytics", auth, requirePro, getAdvancedAnalytics);
router.get("/analytics", auth, getAnalytics);
router.get("/overview", auth, getOverview);
router.get("/", auth, getUserQueries);
router.delete("/:id", auth, deleteQuery);
router.patch("/:id/pin", auth, requirePro, togglePin);

module.exports = router;
