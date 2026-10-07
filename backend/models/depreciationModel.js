const db = require("../config/db");

const DepreciationModel = {
    getAll: (filters = {}) =>
        new Promise((resolve, reject) => {
            let sql = `
                SELECT d.*, 
                       a.asset_name, a.serial_number, a.purchase_date,
                       c.category_name
                FROM depreciation d
                LEFT JOIN assets a ON d.asset_id = a.asset_id
                LEFT JOIN categories c ON a.category_id = c.category_id
                WHERE 1=1
            `;
            const params = [];
            if (filters.asset_id) {
                sql += " AND d.asset_id = ?";
                params.push(filters.asset_id);
            }
            if (filters.method) {
                sql += " AND d.method = ?";
                params.push(filters.method);
            }
            sql += " ORDER BY d.calculated_at DESC";

            db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
        }),

    getById: (id) =>
        new Promise((resolve, reject) => {
            db.query(
                `SELECT d.*, 
                        a.asset_name, a.serial_number, a.purchase_date,
                        c.category_name
                 FROM depreciation d
                 LEFT JOIN assets a ON d.asset_id = a.asset_id
                 LEFT JOIN categories c ON a.category_id = c.category_id
                 WHERE d.depreciation_id = ?`,
                [id],
                (err, results) => err ? reject(err) : resolve(results[0] || null)
            );
        }),

    getByAssetId: (assetId) =>
        new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM depreciation WHERE asset_id = ? ORDER BY calculated_at DESC",
                [assetId],
                (err, results) => err ? reject(err) : resolve(results)
            );
        }),

    create: (data) =>
        new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO depreciation 
                 (asset_id, method, useful_life_years, rate_percent, purchase_cost, current_value, total_depreciated, calculated_at, salvage_value)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [
                    data.asset_id,
                    data.method || 'Straight Line',
                    data.useful_life_years || 5,
                    data.rate_percent || 20.00,
                    data.purchase_cost,
                    data.current_value,
                    data.total_depreciated,
                    data.salvage_value != null ? data.salvage_value : 0
                ],
                (err, result) => err ? reject(err) : resolve(result)
            );
        }),

    delete: (id) =>
        new Promise((resolve, reject) => {
            db.query("DELETE FROM depreciation WHERE depreciation_id = ?", [id], (err, result) => err ? reject(err) : resolve(result));
        })
};

module.exports = DepreciationModel;
