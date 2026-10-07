const cron = require("node-cron");

const {
  processReturnReminders,
} = require("./returnReminderService");

// =====================================================
// RUN EVERY DAY AT 8:00 AM
// =====================================================

const startReturnReminderScheduler = () => {
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log(
        "Running daily asset return reminder..."
      );

      await processReturnReminders();
    }
  );

  console.log(
    "Return reminder scheduler started."
  );
};

module.exports = {
  startReturnReminderScheduler,
};