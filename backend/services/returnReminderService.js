const db = require("../config/db");
const NotificationModel = require("../models/notificationModel");

// ============================================================
// RETURN REMINDER SERVICE
// ============================================================

const ReturnReminderService = {

  // ==========================================================
  // CHECK RETURN DATES
  // ==========================================================

  checkReturnDates: async () => {
    try {

      const assignments = await new Promise((resolve, reject) => {

        db.query(
          `
          SELECT
            a.assignment_id,
            a.user_id,
            a.asset_id,
            a.assignment_date,
            a.expected_return_date,
            a.status,
            ast.asset_name,
            ast.serial_number
          FROM assignments a
          LEFT JOIN assets ast
            ON a.asset_id = ast.asset_id
          WHERE
            a.status = 'Active'
            AND a.expected_return_date IS NOT NULL
          `,
          (error, rows) => {

            if (error) {
              reject(error);
            } else {
              resolve(rows);
            }

          }
        );

      });

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      for (const assignment of assignments) {

        const returnDate = new Date(
          assignment.expected_return_date
        );

        returnDate.setHours(0, 0, 0, 0);

        const difference = Math.floor(
          (today - returnDate) /
          (1000 * 60 * 60 * 24)
        );

        // ======================================================
        // OFFICIAL RETURN DATE
        // ======================================================

        if (difference === 0) {

          await ReturnReminderService.sendOnce(
            assignment,
            "Asset Return Reminder",
            `Today is the return date for "${assignment.asset_name}". Please return the asset today.`,
            "warning"
          );

        }

        // ======================================================
        // ONE BONUS / GRACE DAY
        // ======================================================

        if (difference === 1) {

          await ReturnReminderService.sendOnce(
            assignment,
            "Final Grace Day",
            `Your asset "${assignment.asset_name}" was due yesterday. You have 1 bonus day to return it. Please return it today to avoid a penalty.`,
            "warning"
          );

        }

        // ======================================================
        // PENALTY
        // ======================================================

        if (difference >= 2) {

          await ReturnReminderService.sendOnce(
            assignment,
            "Asset Return Overdue",
            `Penalty: "${assignment.asset_name}" has not been returned after the 1-day grace period. Please return the asset immediately.`,
            "error"
          );

        }

      }

      console.log(
        `✅ Return reminder check completed. ${assignments.length} active assignment(s) checked.`
      );

    } catch (error) {

      console.error(
        "❌ Return reminder service error:",
        error
      );

    }
  },

  // ==========================================================
  // SEND NOTIFICATION ONLY ONCE
  // ==========================================================

  sendOnce: async (
    assignment,
    title,
    message,
    type
  ) => {

    try {

      const existing = await new Promise(
        (resolve, reject) => {

          db.query(
            `
            SELECT notification_id
            FROM notifications
            WHERE
              user_id = ?
              AND title = ?
              AND message = ?
            LIMIT 1
            `,
            [
              assignment.user_id,
              title,
              message
            ],
            (error, rows) => {

              if (error) {
                reject(error);
              } else {
                resolve(rows.length > 0);
              }

            }
          );

        }
      );

      // Don't send duplicate notification
      if (existing) {
        return;
      }

      await NotificationModel.create({

        user_id: assignment.user_id,

        title: title,

        message: message,

        type: type

      });

      console.log(
        `🔔 ${title} sent to user ${assignment.user_id}`
      );

    } catch (error) {

      console.error(
        "❌ Failed to create return notification:",
        error
      );

    }

  }

};

// ============================================================
// EXPORT
// ============================================================

module.exports = ReturnReminderService;