const db = require("../config/db");

const AssetHistoryModel = {
    getByAssetId: (assetId) =>
        new Promise((resolve, reject) => {
            const sql = `
                SELECT ah.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
                FROM asset_history ah
                LEFT JOIN users u ON ah.user_id = u.user_id
                WHERE ah.asset_id = ?
                ORDER BY ah.created_at DESC
            `;
            db.query(sql, [assetId], (err, results) => err ? reject(err) : resolve(results));
        }),

    create: (data) =>
        new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO asset_history (asset_id, user_id, action, previous_value, new_value, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;
            db.query(
                sql,
                [
                    data.asset_id,
                    data.user_id || null,
                    data.action,
                    typeof data.previous_value === 'object' ? JSON.stringify(data.previous_value) : (data.previous_value || null),
                    typeof data.new_value === 'object' ? JSON.stringify(data.new_value) : (data.new_value || null),
                    data.description || null
                ],
                (err, result) => err ? reject(err) : resolve(result)
            );
        })
};

module.exports = AssetHistoryModel;
