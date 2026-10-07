const db = require("../config/db");

const NotificationModel = {
  // =====================================================
  // GET USER NOTIFICATIONS
  // =====================================================

  getByUserId: (userId, isRead = null) =>
    new Promise((resolve, reject) => {
      let sql =
        "SELECT * FROM notifications WHERE user_id = ?";

      const params = [userId];

      if (
        isRead !== null &&
        isRead !== undefined
      ) {
        sql += " AND is_read = ?";
        params.push(isRead);
      }

      sql +=
        " ORDER BY created_at DESC LIMIT 50";

      db.query(
        sql,
        params,
        (err, results) =>
          err ? reject(err) : resolve(results)
      );
    }),

  // =====================================================
  // CREATE NOTIFICATION
  // =====================================================

  create: (data) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        INSERT INTO notifications
        (
          user_id,
          title,
          message,
          type,
          is_read,
          created_at
        )
        VALUES (?, ?, ?, ?, 0, NOW())
        `,
        [
          data.user_id,
          data.title,
          data.message,
          data.type || "info",
        ],
        (err, result) =>
          err ? reject(err) : resolve(result)
      );
    }),

  // =====================================================
  // CHECK IF SAME NOTIFICATION ALREADY EXISTS TODAY
  // =====================================================

  existsToday: (userId, title) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        SELECT notification_id
        FROM notifications
        WHERE user_id = ?
          AND title = ?
          AND DATE(created_at) = CURDATE()
        LIMIT 1
        `,
        [userId, title],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.length > 0);
          }
        }
      );
    }),

  // =====================================================
  // MARK AS READ
  // =====================================================

  markAsRead: (notificationId, userId) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        UPDATE notifications
        SET is_read = 1
        WHERE notification_id = ?
          AND user_id = ?
        `,
        [notificationId, userId],
        (err, result) =>
          err ? reject(err) : resolve(result)
      );
    }),

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  markAllAsRead: (userId) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        UPDATE notifications
        SET is_read = 1
        WHERE user_id = ?
        `,
        [userId],
        (err, result) =>
          err ? reject(err) : resolve(result)
      );
    }),

  // =====================================================
  // DELETE
  // =====================================================

  delete: (notificationId, userId) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        DELETE FROM notifications
        WHERE notification_id = ?
          AND user_id = ?
        `,
        [notificationId, userId],
        (err, result) =>
          err ? reject(err) : resolve(result)
      );
    }),
};

module.exports = NotificationModel;