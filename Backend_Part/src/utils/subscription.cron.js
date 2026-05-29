const cron = require("node-cron");

const { downgradeExpiredSubscriptions } = require("../services/subscription.service");
const logger = require("./logger");

const shouldRunSubscriptionCron = () =>
  process.env.NODE_ENV !== "test" &&
  String(process.env.RUN_SUBSCRIPTION_CRON || "").toLowerCase() === "true";

const subscriptionCron =
  shouldRunSubscriptionCron()
    ? cron.schedule("0 0 * * *", async () => {
        logger.info("Checking expired subscriptions");

        try {
          const downgradedCounts = await downgradeExpiredSubscriptions();
          logger.info("Expired subscription check completed", downgradedCounts);
        } catch (error) {
          logger.error("Subscription check failed", error);
        }
      })
    : null;

module.exports = subscriptionCron;
