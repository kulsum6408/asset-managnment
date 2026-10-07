const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticate, requireAssetOfficer } = require("../middleware/authMiddleware");

// =====================
// GET ALL REQUESTS
// GET /api/requests
// Admin / Asset Officer sees all; Employee sees own
// =====================
router.get("/", authenticate, (req, res) => {
    let sql;
    let params = [];

    const privileged = ["admin", "manager", "asset_officer"];

    if (privileged.includes(req.user.role)) {
        sql = `
            SELECT 
                r.*,
                u.name AS requester_name,
                u.email AS requester_email,
                u.department,
                a.asset_name,
                a.serial_number,
                a.status AS asset_status
            FROM requests r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN assets a ON r.asset_id = a.asset_id
            ORDER BY r.request_date DESC
        `;
    } else {
        sql = `
            SELECT 
                r.*,
                a.asset_name,
                a.serial_number,
                a.status AS asset_status
            FROM requests r
            LEFT JOIN assets a ON r.asset_id = a.asset_id
            WHERE r.user_id = ?
            ORDER BY r.request_date DESC
        `;
        params = [req.user.user_id];
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
});

// =====================
// GET REQUEST BY ID
// GET /api/requests/:id
// =====================
router.get("/:id", authenticate, (req, res) => {
    const requestId = req.params.id;

    const sql = `
        SELECT 
            r.*,
            u.name AS requester_name,
            u.email AS requester_email,
            a.asset_name,
            a.serial_number
        FROM requests r
        LEFT JOIN users u ON r.user_id = u.user_id
        LEFT JOIN assets a ON r.asset_id = a.asset_id
        WHERE r.request_id = ?
    `;

    db.query(sql, [requestId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.status(404).json({ error: "Request not found." });
        }

        // Employees can only see their own requests
        const request = result[0];
        const privileged = ["admin", "manager", "asset_officer"];
        if (!privileged.includes(req.user.role) && request.user_id !== req.user.user_id) {
            return res.status(403).json({ error: "Access denied." });
        }

        res.status(200).json(request);
    });
});

// =====================
// CREATE REQUEST
// POST /api/requests
// Any authenticated user
// =====================
router.post("/", authenticate, (req, res) => {
    const { asset_id, reason } = req.body;

    if (!asset_id) {
        return res.status(400).json({ error: "Asset ID is required." });
    }

    // Check if asset is available
    db.query("SELECT status FROM assets WHERE asset_id = ?", [asset_id], (err, assetResult) => {
        if (err) return res.status(500).json({ error: err.message });

        if (assetResult.length === 0) {
            return res.status(404).json({ error: "Asset not found." });
        }

        if (assetResult[0].status !== "Available") {
            return res.status(400).json({ error: "Asset is not available for request." });
        }

        // Check if user already has a pending request for this asset
        db.query(
            "SELECT request_id FROM requests WHERE user_id = ? AND asset_id = ? AND status = 'Pending'",
            [req.user.user_id, asset_id],
            (checkErr, checkResult) => {
                if (checkErr) return res.status(500).json({ error: checkErr.message });

                if (checkResult.length > 0) {
                    return res.status(409).json({ error: "You already have a pending request for this asset." });
                }

                const sql = `
                    INSERT INTO requests (user_id, asset_id, request_date, status, reason)
                    VALUES (?, ?, NOW(), 'Pending', ?)
                `;

                db.query(sql, [req.user.user_id, asset_id, reason || null], (insertErr, insertResult) => {
                    if (insertErr) return res.status(500).json({ error: insertErr.message });

                    res.status(201).json({
                        message: "Request submitted successfully.",
                        request_id: insertResult.insertId
                    });
                });
            }
        );
    });
});

// =====================
// UPDATE REQUEST STATUS
// PUT /api/requests/:id
// Asset Officer / Admin
// =====================
router.put("/:id", authenticate, requireAssetOfficer, (req, res) => {
    const requestId = req.params.id;
    const { status, remarks } = req.body;

    const validStatuses = ["Pending", "Approved", "Rejected", "Cancelled"];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Valid status required: ${validStatuses.join(", ")}` });
    }

    const sql = `
        UPDATE requests
        SET status = ?, remarks = ?, updated_at = NOW()
        WHERE request_id = ?
    `;

    db.query(sql, [status, remarks || null, requestId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Request not found." });
        }

        res.status(200).json({ message: `Request ${status.toLowerCase()} successfully.` });
    });
});

// =====================
// DELETE REQUEST
// DELETE /api/requests/:id
// Admin or request owner (only if Pending)
// =====================
router.delete("/:id", authenticate, (req, res) => {
    const requestId = req.params.id;

    db.query("SELECT * FROM requests WHERE request_id = ?", [requestId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.status(404).json({ error: "Request not found." });
        }

        const request = result[0];

        // Only admin can delete any; owners can only delete their own pending requests
        if (req.user.role !== "admin") {
            if (request.user_id !== req.user.user_id) {
                return res.status(403).json({ error: "Access denied." });
            }
            if (request.status !== "Pending") {
                return res.status(400).json({ error: "Only pending requests can be cancelled." });
            }
        }

        db.query("DELETE FROM requests WHERE request_id = ?", [requestId], (deleteErr) => {
            if (deleteErr) return res.status(500).json({ error: deleteErr.message });
            res.status(200).json({ message: "Request deleted successfully." });
        });
    });
});

module.exports = router;
