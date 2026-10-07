const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticate, requireMaintenance } = require("../middleware/authMiddleware");

// =====================
// GET ALL MAINTENANCE RECORDS
// GET /api/maintenance
// =====================
router.get("/", authenticate, (req, res) => {
    const { status, asset_id } = req.query;

    let sql = `
        SELECT 
            m.*,
            a.asset_name,
            a.serial_number,
            a.location,
            u.name AS technician_name
        FROM maintenance m
        LEFT JOIN assets a ON m.asset_id = a.asset_id
        LEFT JOIN users u ON m.technician_id = u.user_id
        WHERE 1=1
    `;
    const params = [];

    if (status) {
        sql += " AND m.status = ?";
        params.push(status);
    }

    if (asset_id) {
        sql += " AND m.asset_id = ?";
        params.push(asset_id);
    }

    sql += " ORDER BY m.maintenance_date DESC";

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
});

// =====================
// GET SINGLE MAINTENANCE RECORD
// GET /api/maintenance/:id
// =====================
router.get("/:id", authenticate, (req, res) => {
    const maintenanceId = req.params.id;

    const sql = `
        SELECT 
            m.*,
            a.asset_name,
            a.serial_number,
            a.location,
            u.name AS technician_name
        FROM maintenance m
        LEFT JOIN assets a ON m.asset_id = a.asset_id
        LEFT JOIN users u ON m.technician_id = u.user_id
        WHERE m.maintenance_id = ?
    `;

    db.query(sql, [maintenanceId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.status(404).json({ error: "Maintenance record not found." });
        }

        res.status(200).json(result[0]);
    });
});

// =====================
// CREATE MAINTENANCE RECORD
// POST /api/maintenance
// Maintenance Officer / Admin
// =====================
router.post("/", authenticate, requireMaintenance, (req, res) => {
    const {
        asset_id,
        maintenance_date,
        description,
        status,
        cost,
        technician_id
    } = req.body;

    if (!asset_id || !description) {
        return res.status(400).json({ error: "Asset ID and description are required." });
    }

    const validStatuses = ["Scheduled", "In Progress", "Completed", "Cancelled"];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Valid: ${validStatuses.join(", ")}` });
    }

    // Check asset exists
    db.query("SELECT asset_id, asset_name FROM assets WHERE asset_id = ?", [asset_id], (err, assetResult) => {
        if (err) return res.status(500).json({ error: err.message });

        if (assetResult.length === 0) {
            return res.status(404).json({ error: "Asset not found." });
        }

        const sql = `
            INSERT INTO maintenance (asset_id, maintenance_date, description, status, cost, technician_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;

        db.query(
            sql,
            [
                asset_id,
                maintenance_date || new Date(),
                description,
                status || "Scheduled",
                cost || null,
                technician_id || req.user.user_id
            ],
            (insertErr, insertResult) => {
                if (insertErr) return res.status(500).json({ error: insertErr.message });

                // If status is In Progress, update asset status
                if (status === "In Progress") {
                    db.query("UPDATE assets SET status = 'Under Maintenance' WHERE asset_id = ?", [asset_id], () => {});
                }

                res.status(201).json({
                    message: "Maintenance record created successfully.",
                    maintenance_id: insertResult.insertId
                });
            }
        );
    });
});

// =====================
// UPDATE MAINTENANCE RECORD
// PUT /api/maintenance/:id
// Maintenance Officer / Admin
// =====================
router.put("/:id", authenticate, requireMaintenance, (req, res) => {
    const maintenanceId = req.params.id;
    const { maintenance_date, description, status, cost, technician_id } = req.body;

    const validStatuses = ["Scheduled", "In Progress", "Completed", "Cancelled"];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Valid: ${validStatuses.join(", ")}` });
    }

    // Get current record to know asset_id
    db.query("SELECT asset_id FROM maintenance WHERE maintenance_id = ?", [maintenanceId], (err, current) => {
        if (err) return res.status(500).json({ error: err.message });

        if (current.length === 0) {
            return res.status(404).json({ error: "Maintenance record not found." });
        }

        const assetId = current[0].asset_id;

        const sql = `
            UPDATE maintenance
            SET maintenance_date = ?, description = ?, status = ?, cost = ?, technician_id = ?
            WHERE maintenance_id = ?
        `;

        db.query(
            sql,
            [maintenance_date, description, status || "Scheduled", cost || null, technician_id || null, maintenanceId],
            (updateErr, result) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                // Sync asset status based on maintenance status
                if (status === "In Progress") {
                    db.query("UPDATE assets SET status = 'Under Maintenance' WHERE asset_id = ?", [assetId], () => {});
                } else if (status === "Completed" || status === "Cancelled") {
                    db.query("UPDATE assets SET status = 'Available' WHERE asset_id = ?", [assetId], () => {});
                }

                res.status(200).json({ message: "Maintenance record updated successfully." });
            }
        );
    });
});

// =====================
// DELETE MAINTENANCE RECORD
// DELETE /api/maintenance/:id
// Admin only
// =====================
router.delete("/:id", authenticate, requireMaintenance, (req, res) => {
    const maintenanceId = req.params.id;

    db.query("DELETE FROM maintenance WHERE maintenance_id = ?", [maintenanceId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Maintenance record not found." });
        }

        res.status(200).json({ message: "Maintenance record deleted successfully." });
    });
});

module.exports = router;
