const express = require("express");
const router  = express.Router();
const db = require("../config/db");
const authenticate = require("../middleware/authMiddleware");

// Helper function for db queries
const q = (sql, params = []) =>
    new Promise((res, rej) => db.query(sql, params, (e, r) => e ? rej(e) : res(r)));

/**
 * GET /api/inventory/summary
 * Returns overall store inventory metrics and summary counts.
 * Must be registered BEFORE GET /api/inventory.
 */
router.get("/summary", authenticate, async (req, res) => {
    try {
        const counts = await q(`
            SELECT
                COUNT(*) AS total_assets,
                SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available_assets,
                SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) AS assigned_assets,
                SUM(CASE WHEN status IN ('Under Maintenance', 'Maintenance') THEN 1 ELSE 0 END) AS maintenance_assets,
                SUM(CASE WHEN status = 'Disposed' THEN 1 ELSE 0 END) AS disposed_assets,
                SUM(CASE WHEN status = 'Lost' THEN 1 ELSE 0 END) AS lost_assets
            FROM assets
        `);

        const categories = await q(`
            SELECT
                c.category_id,
                c.category_name,
                COUNT(a.asset_id) AS total_count,
                COUNT(DISTINCT CASE
                    WHEN x.asset_id IS NOT NULL OR UPPER(a.status) = 'ASSIGNED' THEN a.asset_id
                END) AS assigned_count,
                COUNT(DISTINCT CASE
                    WHEN a.asset_id IS NOT NULL
                     AND NOT (x.asset_id IS NOT NULL OR UPPER(a.status) = 'ASSIGNED')
                     AND UPPER(COALESCE(a.status, '')) NOT IN
                         ('UNDER MAINTENANCE', 'MAINTENANCE', 'DISPOSED', 'PENDING DISPOSAL', 'LOST', 'EXPIRED')
                    THEN a.asset_id
                END) AS available_count
            FROM categories c
            LEFT JOIN assets a ON c.category_id = a.category_id
            LEFT JOIN (
                SELECT DISTINCT asset_id FROM assignments WHERE status IN ('Active', 'Assigned')
            ) x ON x.asset_id = a.asset_id
            GROUP BY c.category_id, c.category_name
            ORDER BY c.category_name ASC
        `);

        const summary = counts[0] || {};
        res.status(200).json({
            total_assets: Number(summary.total_assets || 0),
            available_assets: Number(summary.available_assets || 0),
            assigned_assets: Number(summary.assigned_assets || 0),
            maintenance_assets: Number(summary.maintenance_assets || 0),
            disposed_assets: Number(summary.disposed_assets || 0),
            lost_assets: Number(summary.lost_assets || 0),
            categories_summary: categories.map(c => ({
                category_id: c.category_id,
                category_name: c.category_name,
                total_count: Number(c.total_count || 0),
                available_count: Number(c.available_count || 0),
                assigned_count: Number(c.assigned_count || 0)
            }))
        });
    } catch (err) {
        console.error("Error fetching inventory summary:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/inventory
 * Retrieves inventory records from the `inventory` SQL VIEW.
 * Requires JWT authentication.
 */
router.get("/", authenticate, async (req, res) => {
    try {
        const { status, category_name, search, location } = req.query;

        let sql = "SELECT * FROM inventory WHERE status <> 'Disposed'";
        const params = [];

        if (status) {
            sql += " AND status = ?";
            params.push(status);
        }

        if (category_name) {
            sql += " AND category_name = ?";
            params.push(category_name);
        }

        if (location) {
            sql += " AND location = ?";
            params.push(location);
        }

        if (search) {
            sql += " AND (asset_name LIKE ? OR serial_number LIKE ? OR location LIKE ? OR category_name LIKE ?)";
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        sql += " ORDER BY created_at DESC";

        const records = await q(sql, params);
        res.status(200).json(records);
    } catch (err) {
        console.error("Error fetching inventory view:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
