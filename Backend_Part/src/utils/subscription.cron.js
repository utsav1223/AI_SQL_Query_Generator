const cron = require("node-cron");

const { downgradeExpiredProUsers } = require("../services/subscription.service");
const logger = require("./logger");

const subscriptionCron =
  process.env.NODE_ENV === "test"
    ? null
    : cron.schedule("0 0 * * *", async () => {
        logger.info("Checking expired subscriptions");

        try {
          const downgradedUsersCount = await downgradeExpiredProUsers();
          logger.info("Expired subscription check completed", { downgradedUsersCount });
        } catch (error) {
          logger.error("Subscription check failed", error);
        }
      });

module.exports = subscriptionCron;
