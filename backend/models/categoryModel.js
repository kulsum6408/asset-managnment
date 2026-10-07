const db = require("../config/db");

const CategoryModel = {
    getAll: () =>
        new Promise((resolve, reject) => {
            db.query(
                `SELECT c.*, COUNT(a.asset_id) AS asset_count
                 FROM categories c
                 LEFT JOIN assets a ON c.category_id = a.category_id
                 GROUP BY c.category_id
                 ORDER BY c.category_name ASC`,
                (err, results) => err ? reject(err) : resolve(results)
            );
        }),

    getById: (id) =>
        new Promise((resolve, reject) => {
            db.query(
                `SELECT c.*, COUNT(a.asset_id) AS asset_count
                 FROM categories c
                 LEFT JOIN assets a ON c.category_id = a.category_id
                 WHERE c.category_id = ?
                 GROUP BY c.category_id`,
                [id],
                (err, results) => err ? reject(err) : resolve(results[0] || null)
            );
        }),

    getByName: (name, excludeId = null) =>
        new Promise((resolve, reject) => {
            let sql = "SELECT * FROM categories WHERE category_name = ?";
            const params = [name];
            if (excludeId) {
                sql += " AND category_id != ?";
                params.push(excludeId);
            }
            db.query(sql, params, (err, results) => err ? reject(err) : resolve(results[0] || null));
        }),

    create: (data) =>
        new Promise((resolve, reject) => {
            db.query(
                "INSERT INTO categories (category_name, description, created_at) VALUES (?, ?, NOW())",
                [data.category_name, data.description || null],
                (err, result) => err ? reject(err) : resolve(result)
            );
        }),

    update: (id, data) =>
        new Promise((resolve, reject) => {
            db.query(
                "UPDATE categories SET category_name = ?, description = ? WHERE category_id = ?",
                [data.category_name, data.description || null, id],
                (err, result) => err ? reject(err) : resolve(result)
            );
        }),

    delete: (id) =>
        new Promise((resolve, reject) => {
            db.query(
                "DELETE FROM categories WHERE category_id = ?",
                [id],
                (err, result) => err ? reject(err) : resolve(result)
            );
        }),
};

module.exports = CategoryModel;
