const db = require("../config/db");

const RegistrationModel = {
    getAll: (filters = {}) =>
        new Promise((resolve, reject) => {
            let sql = `
                SELECT r.*, 
                       a.asset_name, a.serial_number, c.category_name,
                       u.name AS registered_by_name
                FROM registrations r
                LEFT JOIN assets a ON r.asset_id = a.asset_id
                LEFT JOIN categories c ON a.category_id = c.category_id
                LEFT JOIN users u ON r.registered_by = u.user_id
                WHERE 1=1
            `;
            const params = [];
            if (filters.asset_id) {
                sql += " AND r.asset_id = ?";
                params.push(filters.asset_id);
            }
            if (filters.supplier) {
                sql += " AND r.supplier LIKE ?";
                params.push(`%${filters.supplier}%`);
            }
            sql += " ORDER BY r.registration_date DESC";

            db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
        }),

    getById: (id) =>
        new Promise((resolve, reject) => {
            db.query(
                `SELECT r.*, 
                        a.asset_name, a.serial_number, c.category_name,
                        u.name AS registered_by_name
                 FROM registrations r
                 LEFT JOIN assets a ON r.asset_id = a.asset_id
                 LEFT JOIN categories c ON a.category_id = c.category_id
                 LEFT JOIN users u ON r.registered_by = u.user_id
                 WHERE r.registration_id = ?`,
                [id],
                (err, results) => err ? reject(err) : resolve(results[0] || null)
            );
        }),

    create: (data) =>
        new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO registrations 
                 (asset_id, registered_by, registration_date, purchase_date, purchase_cost, supplier, invoice_number, warranty_expiry, asset_condition, location, notes)
                 VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.asset_id,
                    data.registered_by || null,
                    data.purchase_date || null,
                    data.purchase_cost || null,
                    data.supplier || null,
                    data.invoice_number || null,
                    data.warranty_expiry || null,
                    data.asset_condition || 'New',
                    data.location || null,
                    data.notes || null
                ],
                (err, result) => err ? reject(err) : resolve(result)
            );
        }),

    delete: (id) =>
        new Promise((resolve, reject) => {
            db.query("DELETE FROM registrations WHERE registration_id = ?", [id], (err, result) => err ? reject(err) : resolve(result));
        })
};

module.exports = RegistrationModel;
