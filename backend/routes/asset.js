const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticate, requireAssetOfficer } = require("../middleware/authMiddleware");

// =====================
// GET ALL ASSETS
// GET /api/assets
// Authenticated users
// =====================
router.get("/", authenticate, (req, res) => {
    const { status, category_id, search } = req.query;

    let sql = `
        SELECT 
            a.asset_id,
            a.asset_name,
            a.serial_number,
            a.purchase_date,
            a.purchase_cost,
            a.status,
            a.asset_condition,
            a.location,
            a.created_at,
            c.category_name
        FROM assets a
        LEFT JOIN categories c ON a.category_id = c.category_id
        WHERE 1=1
    `;
    const params = [];

    if (status) {
        sql += " AND a.status = ?";
        params.push(status);
    }

    if (category_id) {
        sql += " AND a.category_id = ?";
        params.push(category_id);
    }

    if (search) {
        sql += " AND (a.asset_name LIKE ? OR a.serial_number LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY a.created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// =====================
// GET ASSET BY ID
// GET /api/assets/:id
// Authenticated users
// =====================
router.get("/:id", authenticate, (req, res) => {
    const assetId = req.params.id;

    const sql = `
        SELECT 
            a.*,
            c.category_name
        FROM assets a
        LEFT JOIN categories c ON a.category_id = c.category_id
        WHERE a.asset_id = ?
    `;

    db.query(sql, [assetId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.status(404).json({ error: "Asset not found." });
        }

        res.status(200).json(results[0]);
    });
});

// =====================
// CREATE ASSET
// POST /api/assets
// Asset Officer / Admin
// =====================
router.post("/", authenticate, requireAssetOfficer, (req, res) => {
    const {
        asset_name,
        category_id,
        serial_number,
        purchase_date,
        purchase_cost,
        status,
        asset_condition,
        location
    } = req.body;

    if (!asset_name) {
        return res.status(400).json({ error: "Asset name is required." });
    }

    const validStatuses = ["Available", "Assigned", "Under Maintenance", "Disposed", "Lost"];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Valid: ${validStatuses.join(", ")}` });
    }

    const validConditions = ["New", "Good", "Fair", "Poor", "Damaged"];
    if (asset_condition && !validConditions.includes(asset_condition)) {
        return res.status(400).json({ error: `Invalid condition. Valid: ${validConditions.join(", ")}` });
    }

    const sql = `
        INSERT INTO assets
        (asset_name, category_id, serial_number, purchase_date, purchase_cost, status, asset_condition, location, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(
        sql,
        [
            asset_name,
            category_id || null,
            serial_number || null,
            purchase_date || null,
            purchase_cost || null,
            status || "Available",
            asset_condition || "Good",
            location || null
        ],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            res.status(201).json({
                message: "Asset created successfully.",
                asset_id: result.insertId
            });
        }
    );
});

// =====================
// UPDATE ASSET
// PUT /api/assets/:id
// Asset Officer / Admin
// =====================
router.put("/:id", authenticate, requireAssetOfficer, (req, res) => {
    const assetId = req.params.id;

    const {
        asset_name,
        category_id,
        serial_number,
        purchase_date,
        purchase_cost,
        status,
        asset_condition,
        location
    } = req.body;

    if (!asset_name) {
        return res.status(400).json({ error: "Asset name is required." });
    }

    const sql = `
        UPDATE assets
        SET
            asset_name = ?,
            category_id = ?,
            serial_number = ?,
            purchase_date = ?,
            purchase_cost = ?,
            status = ?,
            asset_condition = ?,
            location = ?
        WHERE asset_id = ?
    `;

    db.query(
        sql,
        [
            asset_name,
            category_id || null,
            serial_number || null,
            purchase_date || null,
            purchase_cost || null,
            status || "Available",
            asset_condition || "Good",
            location || null,
            assetId
        ],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Asset not found." });
            }

            res.status(200).json({ message: "Asset updated successfully." });
        }
    );
});

// =====================
// UPDATE ASSET STATUS ONLY
// PATCH /api/assets/:id/status
// Asset Officer / Admin
// =====================
router.patch("/:id/status", authenticate, requireAssetOfficer, (req, res) => {
    const assetId = req.params.id;
    const { status } = req.body;

    const validStatuses = ["Available", "Assigned", "Under Maintenance", "Disposed", "Lost"];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Valid status required: ${validStatuses.join(", ")}` });
    }

    db.query("UPDATE assets SET status = ? WHERE asset_id = ?", [status, assetId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Asset not found." });
        }

        res.status(200).json({ message: "Asset status updated successfully." });
    });
});

// =====================
// DELETE ASSET
// DELETE /api/assets/:id
// Admin only
// =====================
router.delete("/:id", authenticate, requireAssetOfficer, (req, res) => {
    const assetId = req.params.id;

    db.query("DELETE FROM assets WHERE asset_id = ?", [assetId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Asset not found." });
        }

        res.status(200).json({ message: "Asset deleted successfully." });
    });
});

module.exports = router;
