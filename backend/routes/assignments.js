const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticate, requireAssetOfficer } = require("../middleware/authMiddleware");

// =====================
// GET ALL ASSIGNMENTS
// GET /api/assignments
// Admin / Asset Officer sees all; Employee sees own
// =====================
router.get("/", authenticate, (req, res) => {
    let sql;
    let params = [];

    const privileged = ["admin", "manager", "asset_officer"];

    if (privileged.includes(req.user.role)) {
        sql = `
            SELECT 
                a.*,
                u.name AS employee_name,
                u.email AS employee_email,
                u.department,
                ast.asset_name,
                ast.serial_number,
                ast.asset_condition,
                assigned_by_user.name AS assigned_by_name
            FROM assignments a
            LEFT JOIN users u ON a.user_id = u.user_id
            LEFT JOIN assets ast ON a.asset_id = ast.asset_id
            LEFT JOIN users assigned_by_user ON a.assigned_by = assigned_by_user.user_id
            ORDER BY a.assignment_date DESC
        `;
    } else {
        sql = `
            SELECT 
                a.*,
                ast.asset_name,
                ast.serial_number,
                ast.asset_condition,
                ast.location
            FROM assignments a
            LEFT JOIN assets ast ON a.asset_id = ast.asset_id
            WHERE a.user_id = ?
            ORDER BY a.assignment_date DESC
        `;
        params = [req.user.user_id];
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
});

// =====================
// GET SINGLE ASSIGNMENT
// GET /api/assignments/:id
// =====================
router.get("/:id", authenticate, (req, res) => {
    const assignmentId = req.params.id;

    const sql = `
        SELECT 
            a.*,
            u.name AS employee_name,
            u.email AS employee_email,
            u.department,
            ast.asset_name,
            ast.serial_number,
            ast.asset_condition,
            ast.location
        FROM assignments a
        LEFT JOIN users u ON a.user_id = u.user_id
        LEFT JOIN assets ast ON a.asset_id = ast.asset_id
        WHERE a.assignment_id = ?
    `;

    db.query(sql, [assignmentId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.status(404).json({ error: "Assignment not found." });
        }

        const assignment = result[0];

        // Employees can only see their own assignments
        const privileged = ["admin", "manager", "asset_officer"];
        if (!privileged.includes(req.user.role) && assignment.user_id !== req.user.user_id) {
            return res.status(403).json({ error: "Access denied." });
        }

        res.status(200).json(assignment);
    });
});

// =====================
// CREATE ASSIGNMENT
// POST /api/assignments
// Asset Officer / Admin
// =====================
router.post("/", authenticate, requireAssetOfficer, (req, res) => {
    const { user_id, asset_id, assignment_date, notes } = req.body;

    if (!user_id || !asset_id) {
        return res.status(400).json({ error: "User ID and Asset ID are required." });
    }

    // Check asset is available
    db.query("SELECT status, asset_name FROM assets WHERE asset_id = ?", [asset_id], (err, assetResult) => {
        if (err) return res.status(500).json({ error: err.message });

        if (assetResult.length === 0) {
            return res.status(404).json({ error: "Asset not found." });
        }

        if (assetResult[0].status !== "Available") {
            return res.status(400).json({ error: `Asset "${assetResult[0].asset_name}" is not available for assignment.` });
        }

        // Check user exists
        db.query("SELECT user_id FROM users WHERE user_id = ? AND is_active = 1", [user_id], (userErr, userResult) => {
            if (userErr) return res.status(500).json({ error: userErr.message });

            if (userResult.length === 0) {
                return res.status(404).json({ error: "User not found or inactive." });
            }

            const sql = `
                INSERT INTO assignments (user_id, asset_id, assignment_date, assigned_by, notes, status)
                VALUES (?, ?, ?, ?, ?, 'Active')
            `;

            db.query(
                sql,
                [user_id, asset_id, assignment_date || new Date(), req.user.user_id, notes || null],
                (insertErr, insertResult) => {
                    if (insertErr) return res.status(500).json({ error: insertErr.message });

                    // Update asset status to Assigned
                    db.query("UPDATE assets SET status = 'Assigned' WHERE asset_id = ?", [asset_id], (updateErr) => {
                        if (updateErr) return res.status(500).json({ error: updateErr.message });

                        res.status(201).json({
                            message: "Asset assigned successfully.",
                            assignment_id: insertResult.insertId
                        });
                    });
                }
            );
        });
    });
});

// =====================
// UPDATE ASSIGNMENT
// PUT /api/assignments/:id
// Asset Officer / Admin
// =====================
router.put("/:id", authenticate, requireAssetOfficer, (req, res) => {
    const assignmentId = req.params.id;
    const { assignment_date, notes, status } = req.body;

    const validStatuses = ["Active", "Returned", "Overdue"];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Valid: ${validStatuses.join(", ")}` });
    }

    const sql = `
        UPDATE assignments
        SET assignment_date = ?, notes = ?, status = ?
        WHERE assignment_id = ?
    `;

    db.query(sql, [assignment_date, notes || null, status || "Active", assignmentId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Assignment not found." });
        }

        res.status(200).json({ message: "Assignment updated successfully." });
    });
});

// =====================
// DELETE ASSIGNMENT
// DELETE /api/assignments/:id
// Admin only — also resets asset status to Available
// =====================
router.delete("/:id", authenticate, requireAssetOfficer, (req, res) => {
    const assignmentId = req.params.id;

    // Get asset_id first so we can free the asset
    db.query("SELECT asset_id FROM assignments WHERE assignment_id = ?", [assignmentId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.status(404).json({ error: "Assignment not found." });
        }

        const assetId = result[0].asset_id;

        db.query("DELETE FROM assignments WHERE assignment_id = ?", [assignmentId], (deleteErr) => {
            if (deleteErr) return res.status(500).json({ error: deleteErr.message });

            // Reset asset status to Available
            db.query("UPDATE assets SET status = 'Available' WHERE asset_id = ?", [assetId], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                res.status(200).json({ message: "Assignment deleted and asset marked as available." });
            });
        });
    });
});

module.exports = router;
