const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticate, requireAssetOfficer } = require("../middleware/authMiddleware");

// =====================
// GET ALL RETURNS
// GET /api/returns
// =====================
router.get("/", authenticate, (req, res) => {
    const privileged = ["admin", "manager", "asset_officer"];
    let sql;
    let params = [];

    if (privileged.includes(req.user.role)) {
        sql = `
            SELECT 
                r.*,
                u.name AS employee_name,
                u.email AS employee_email,
                u.department,
                a.asset_name,
                a.serial_number,
                a.location
            FROM returns r
            LEFT JOIN assignments asn ON r.assignment_id = asn.assignment_id
            LEFT JOIN users u ON asn.user_id = u.user_id
            LEFT JOIN assets a ON asn.asset_id = a.asset_id
            ORDER BY r.return_date DESC
        `;
    } else {
        sql = `
            SELECT 
                r.*,
                a.asset_name,
                a.serial_number
            FROM returns r
            LEFT JOIN assignments asn ON r.assignment_id = asn.assignment_id
            LEFT JOIN assets a ON asn.asset_id = a.asset_id
            WHERE asn.user_id = ?
            ORDER BY r.return_date DESC
        `;
        params = [req.user.user_id];
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
});

// =====================
// GET SINGLE RETURN
// GET /api/returns/:id
// =====================
router.get("/:id", authenticate, (req, res) => {
    const returnId = req.params.id;

    const sql = `
        SELECT 
            r.*,
            u.name AS employee_name,
            u.email AS employee_email,
            a.asset_name,
            a.serial_number
        FROM returns r
        LEFT JOIN assignments asn ON r.assignment_id = asn.assignment_id
        LEFT JOIN users u ON asn.user_id = u.user_id
        LEFT JOIN assets a ON asn.asset_id = a.asset_id
        WHERE r.return_id = ?
    `;

    db.query(sql, [returnId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.status(404).json({ error: "Return record not found." });
        }

        res.status(200).json(result[0]);
    });
});

// =====================
// PROCESS A RETURN
// POST /api/returns
// Asset Officer / Admin
// =====================
router.post("/", authenticate, requireAssetOfficer, (req, res) => {
    const { assignment_id, return_date, asset_condition, notes } = req.body;

    if (!assignment_id) {
        return res.status(400).json({ error: "Assignment ID is required." });
    }

    const validConditions = ["New", "Good", "Fair", "Poor", "Damaged"];
    if (asset_condition && !validConditions.includes(asset_condition)) {
        return res.status(400).json({ error: `Invalid condition. Valid: ${validConditions.join(", ")}` });
    }

    // Get assignment details
    db.query(
        "SELECT asset_id, status FROM assignments WHERE assignment_id = ?",
        [assignment_id],
        (err, assignResult) => {
            if (err) return res.status(500).json({ error: err.message });

            if (assignResult.length === 0) {
                return res.status(404).json({ error: "Assignment not found." });
            }

            if (assignResult[0].status === "Returned") {
                return res.status(400).json({ error: "Asset has already been returned." });
            }

            const assetId = assignResult[0].asset_id;

            // Check if return already exists for this assignment
            db.query(
                "SELECT return_id FROM returns WHERE assignment_id = ?",
                [assignment_id],
                (checkErr, checkResult) => {
                    if (checkErr) return res.status(500).json({ error: checkErr.message });

                    if (checkResult.length > 0) {
                        return res.status(409).json({ error: "Return already recorded for this assignment." });
                    }

                    const sql = `
                        INSERT INTO returns (assignment_id, return_date, asset_condition, notes, received_by)
                        VALUES (?, ?, ?, ?, ?)
                    `;

                    db.query(
                        sql,
                        [
                            assignment_id,
                            return_date || new Date(),
                            asset_condition || "Good",
                            notes || null,
                            req.user.user_id
                        ],
                        (insertErr, insertResult) => {
                            if (insertErr) return res.status(500).json({ error: insertErr.message });

                            // Update assignment status to Returned
                            db.query(
                                "UPDATE assignments SET status = 'Returned' WHERE assignment_id = ?",
                                [assignment_id],
                                () => {}
                            );

                            // Update asset status back to Available and update condition
                            db.query(
                                "UPDATE assets SET status = 'Available', asset_condition = ? WHERE asset_id = ?",
                                [asset_condition || "Good", assetId],
                                (updateErr) => {
                                    if (updateErr) return res.status(500).json({ error: updateErr.message });

                                    res.status(201).json({
                                        message: "Asset returned successfully.",
                                        return_id: insertResult.insertId
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

// =====================
// UPDATE RETURN RECORD
// PUT /api/returns/:id
// Asset Officer / Admin
// =====================
router.put("/:id", authenticate, requireAssetOfficer, (req, res) => {
    const returnId = req.params.id;
    const { return_date, asset_condition, notes } = req.body;

    const validConditions = ["New", "Good", "Fair", "Poor", "Damaged"];
    if (asset_condition && !validConditions.includes(asset_condition)) {
        return res.status(400).json({ error: `Invalid condition. Valid: ${validConditions.join(", ")}` });
    }

    const sql = `
        UPDATE returns
        SET return_date = ?, asset_condition = ?, notes = ?
        WHERE return_id = ?
    `;

    db.query(sql, [return_date, asset_condition || "Good", notes || null, returnId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Return record not found." });
        }

        res.status(200).json({ message: "Return record updated successfully." });
    });
});

// =====================
// DELETE RETURN RECORD
// DELETE /api/returns/:id
// Admin only
// =====================
router.delete("/:id", authenticate, requireAssetOfficer, (req, res) => {
    const returnId = req.params.id;

    db.query("DELETE FROM returns WHERE return_id = ?", [returnId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Return record not found." });
        }

        res.status(200).json({ message: "Return record deleted successfully." });
    });
});

module.exports = router;
