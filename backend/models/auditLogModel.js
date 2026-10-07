const db = require("../config/db");

const AuditLogModel = {
    getAll: (filters = {}) =>
        new Promise((resolve, reject) => {
            let sql = `
                SELECT al.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.user_id
                WHERE 1=1
            `;
            const params = [];

            if (filters.user_id) {
                sql += " AND al.user_id = ?";
                params.push(filters.user_id);
            }
            if (filters.action) {
                sql += " AND al.action = ?";
                params.push(filters.action);
            }
            if (filters.entity_type) {
                sql += " AND al.entity_type = ?";
                params.push(filters.entity_type);
            }

            sql += " ORDER BY al.created_at DESC";

            const limit = parseInt(filters.limit) || 100;
            sql += " LIMIT ?";
            params.push(limit);

            db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
        }),

    getById: (id) =>
        new Promise((resolve, reject) => {
            db.query(
                `SELECT al.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
                 FROM audit_logs al
                 LEFT JOIN users u ON al.user_id = u.user_id
                 WHERE al.log_id = ?`,
                [id],
                (err, results) => err ? reject(err) : resolve(results[0] || null)
            );
        }),

    create: (data) =>
        new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [
                    data.user_id || null,
                    data.action,
                    data.entity_type || null,
                    data.entity_id || null,
                    typeof data.details === 'object' ? JSON.stringify(data.details) : (data.details || null),
                    data.ip_address || null
                ],
                (err, result) => err ? reject(err) : resolve(result)
            );
        })
};

module.exports = AuditLogModel;
