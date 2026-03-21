const cron = require("node-cron");

const { downgradeExpiredProUsers } = require("../services/subscription.service");

cron.schedule("0 0 * * *", async () => {
  console.log("Checking expired subscriptions...");

  try {
    const downgradedUsersCount = await downgradeExpiredProUsers();
    console.log(`${downgradedUsersCount} users downgraded.`);
  } catch (error) {
    console.error("Subscription check failed", error);
  }
});
