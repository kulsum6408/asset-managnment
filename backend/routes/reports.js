const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticate, requireManager } = require("../middleware/authMiddleware");

const getDashboardHandler = (req, res) => {
    const queries = {
        assets: "SELECT COUNT(*) AS total FROM assets",
        available: "SELECT COUNT(*) AS total FROM assets WHERE status = 'Available'",
        assigned: "SELECT COUNT(*) AS total FROM assets WHERE status = 'Assigned'",
        maintenance: "SELECT COUNT(*) AS total FROM assets WHERE status = 'Under Maintenance'",
        users: "SELECT COUNT(*) AS total FROM users WHERE is_active = 1",
        pending_requests: "SELECT COUNT(*) AS total FROM requests WHERE status = 'Pending'",
        active_assignments: "SELECT COUNT(*) AS total FROM assignments WHERE status = 'Active'",
        open_maintenance: "SELECT COUNT(*) AS total FROM maintenance WHERE status IN ('Scheduled', 'In Progress')"
    };

    const results = {};
    const keys = Object.keys(queries);
    let completed = 0;
    let hasError = false;

    keys.forEach((key) => {
        db.query(queries[key], (err, result) => {
            if (hasError) return;
            if (err) {
                hasError = true;
                return res.status(500).json({ error: err.message });
            }
            results[key] = result[0].total;
            completed++;
            if (completed === keys.length) {
                res.status(200).json(results);
            }
        });
    });
};

router.get("/", authenticate, requireManager, getDashboardHandler);
router.get("/dashboard", authenticate, requireManager, getDashboardHandler);

// =====================
// ASSET REPORT
// GET /api/reports/assets
// =====================
router.get("/assets", authenticate, requireManager, (req, res) => {
    const sql = `
        SELECT 
            c.category_name,
            COUNT(a.asset_id) AS total_assets,
            SUM(a.status = 'Available') AS available,
            SUM(a.status = 'Assigned') AS assigned,
            SUM(a.status = 'Under Maintenance') AS under_maintenance,
            SUM(a.status = 'Disposed') AS disposed,
            SUM(a.status = 'Lost') AS lost,
            SUM(a.purchase_cost) AS total_value
        FROM assets a
        LEFT JOIN categories c ON a.category_id = c.category_id
        GROUP BY c.category_id, c.category_name
        ORDER BY total_assets DESC
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
});

// =====================
// ASSET VALUE REPORT
// GET /api/reports/assets/value
// Finance / Admin
// =====================
router.get("/assets/value", authenticate, (req, res) => {
    const allowed = ["admin", "finance_officer", "manager"];
    if (!allowed.includes(req.user.role)) {
        return res.status(403).json({ error: "Access denied." });
    }

    const sql = `
        SELECT 
            SUM(purchase_cost) AS total_purchase_value,
            COUNT(*) AS total_assets,
            AVG(purchase_cost) AS average_cost,
            MIN(purchase_cost) AS min_cost,
            MAX(purchase_cost) AS max_cost
        FROM assets
        WHERE purchase_cost IS NOT NULL
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result[0]);
    });
});

// =====================
// USER REPORT
// GET /api/reports/users
// Admin
// =====================
router.get("/users", authenticate, requireManager, (req, res) => {
    const sql = `
        SELECT 
            role,
            COUNT(*) AS total,
            SUM(is_active = 1) AS active,
            SUM(is_active = 0) AS inactive
        FROM users
        GROUP BY role
        ORDER BY total DESC
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
});

// =====================
// MAINTENANCE REPORT
// GET /api/reports/maintenance
// =====================
router.get("/maintenance", authenticate, requireManager, (req, res) => {
    const sql = `
        SELECT 
            m.status,
            COUNT(*) AS total,
            SUM(m.cost) AS total_cost
        FROM maintenance m
        GROUP BY m.status
    `;

    const detailSql = `
        SELECT 
            m.*,
            a.asset_name,
            a.serial_number
        FROM maintenance m
        LEFT JOIN assets a ON m.asset_id = a.asset_id
        ORDER BY m.maintenance_date DESC
        LIMIT 50
    `;

    db.query(sql, (err, summary) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(detailSql, (detailErr, details) => {
            if (detailErr) return res.status(500).json({ error: detailErr.message });

            res.status(200).json({ summary, details });
        });
    });
});

// =====================
// ASSIGNMENT REPORT
// GET /api/reports/assignments
// =====================
router.get("/assignments", authenticate, requireManager, (req, res) => {
    const sql = `
        SELECT 
            u.department,
            COUNT(a.assignment_id) AS total_assignments,
            SUM(a.status = 'Active') AS active,
            SUM(a.status = 'Returned') AS returned
        FROM assignments a
        LEFT JOIN users u ON a.user_id = u.user_id
        GROUP BY u.department
        ORDER BY total_assignments DESC
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
});

// =====================
// REQUEST REPORT
// GET /api/reports/requests
// =====================
router.get("/requests", authenticate, requireManager, (req, res) => {
    const sql = `
        SELECT 
            status,
            COUNT(*) AS total
        FROM requests
        GROUP BY status
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
});

module.exports = router;
