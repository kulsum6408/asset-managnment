const db = require("../config/db");

const q = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });

const TransferModel = {
    getAll: (filters = {}) => {
        let sql = `
            SELECT t.*,
                   a.asset_name, a.serial_number, a.asset_condition, a.location AS current_asset_location,
                   fu.name AS from_user_name, fu.email AS from_user_email,
                   tu.name AS to_user_name, tu.email AS to_user_email,
                   by_u.name AS transferred_by_name,
                   ap_u.name AS approved_by_name
            FROM transfers t
            LEFT JOIN assets a ON t.asset_id = a.asset_id
            LEFT JOIN users fu ON t.from_user_id = fu.user_id
            LEFT JOIN users tu ON t.to_user_id = tu.user_id
            LEFT JOIN users by_u ON t.transferred_by = by_u.user_id
            LEFT JOIN users ap_u ON t.approved_by = ap_u.user_id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            sql += " AND t.status = ?";
            params.push(filters.status);
        }
        if (filters.asset_id) {
            sql += " AND t.asset_id = ?";
            params.push(filters.asset_id);
        }
        if (filters.employee_id) {
            sql += " AND (t.from_user_id = ? OR t.to_user_id = ? OR t.transferred_by = ?)";
            params.push(filters.employee_id, filters.employee_id, filters.employee_id);
        } else {
            if (filters.to_user_id) {
                sql += " AND t.to_user_id = ?";
                params.push(filters.to_user_id);
            }
            if (filters.from_user_id) {
                sql += " AND t.from_user_id = ?";
                params.push(filters.from_user_id);
            }
        }

        sql += " ORDER BY t.transfer_date DESC";
        return q(sql, params);
    },

    getById: (id) =>
        q(
            `SELECT t.*,
                    a.asset_name, a.serial_number, a.asset_condition, a.location AS current_asset_location,
                    fu.name AS from_user_name, fu.email AS from_user_email,
                    tu.name AS to_user_name, tu.email AS to_user_email,
                    by_u.name AS transferred_by_name,
                    ap_u.name AS approved_by_name
             FROM transfers t
             LEFT JOIN assets a ON t.asset_id = a.asset_id
             LEFT JOIN users fu ON t.from_user_id = fu.user_id
             LEFT JOIN users tu ON t.to_user_id = tu.user_id
             LEFT JOIN users by_u ON t.transferred_by = by_u.user_id
             LEFT JOIN users ap_u ON t.approved_by = ap_u.user_id
             WHERE t.transfer_id = ?`,
            [id]
        ).then(rows => rows[0] || null),

    create: (data) =>
        q(
            `INSERT INTO transfers
             (asset_id, from_user_id, to_user_id, from_location, to_location, transfer_date, reason, transferred_by, notes, status)
             VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, 'Pending')`,
            [
                data.asset_id,
                data.from_user_id || null,
                data.to_user_id || null,
                data.from_location || null,
                data.to_location || null,
                data.reason || null,
                data.transferred_by || null,
                data.notes || null
            ]
        ),

    approve: (transferId, approvedBy, remarks) =>
        q(
            `UPDATE transfers
             SET status = 'Approved', approved_by = ?, approved_at = NOW()
             WHERE transfer_id = ? AND status = 'Pending'`,
            [approvedBy, transferId]
        ),

    reject: (transferId, approvedBy, reason) =>
        q(
            `UPDATE transfers
             SET status = 'Rejected', approved_by = ?, approved_at = NOW(), rejection_reason = ?
             WHERE transfer_id = ? AND status = 'Pending'`,
            [approvedBy, reason || null, transferId]
        ),

    complete: (transferId) =>
        q(
            `UPDATE transfers
             SET status = 'Completed', completed_at = NOW()
             WHERE transfer_id = ? AND status = 'Approved'`,
            [transferId]
        ),

    cancel: (transferId) =>
        q(
            `UPDATE transfers
             SET status = 'Cancelled', completed_at = NOW()
             WHERE transfer_id = ? AND status = 'Pending'`,
            [transferId]
        ),

    delete: (id) =>
        q("DELETE FROM transfers WHERE transfer_id = ?", [id])
};

module.exports = TransferModel;
