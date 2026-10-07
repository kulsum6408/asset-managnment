const AssignmentModel = require("../models/assignmentModel");
const AssetModel = require("../models/assetModel");
const UserModel = require("../models/userModel");
const NotificationModel = require("../models/notificationModel");
const BinCardModel = require("../models/binCardModel");
const db = require("../config/db");
const { logAudit } = require("../middleware/auditLogger");

const q = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });

// =====================================================
// POST /api/assignments/:id/confirm-receipt
// Employee acknowledges receiving the assigned asset.
// Idempotent - safe against duplicate clicks.
// =====================================================
const confirmReceipt = async (req, res) => {
    try {
        const assignment = await AssignmentModel.getById(
            req.params.id
        );

        if (!assignment) {
            return res.status(404).json({
                error: "Assignment not found."
            });
        }

        // -------------------------------------------------
        // SECURITY: only the assigned employee can confirm
        // their own assignment.
        // -------------------------------------------------
        if (assignment.user_id !== req.user.user_id) {
            return res.status(403).json({
                error: "You are not allowed to confirm receipt for this assignment."
            });
        }

        // -------------------------------------------------
        // Only active/assigned assignments can be confirmed
        // -------------------------------------------------
        if (
            String(assignment.status).toLowerCase() !== "active" &&
            String(assignment.status).toLowerCase() !== "assigned"
        ) {
            return res.status(400).json({
                error: `Cannot confirm receipt for an assignment with status "${assignment.status}".`
            });
        }

        // -------------------------------------------------
        // IDEMPOTENT: already confirmed?
        // Setting received_at when it is already set is a no-op.
        // -------------------------------------------------
        if (assignment.received_at) {
            const updated = await AssignmentModel.getById(
                req.params.id
            );

            return res.status(200).json({
                message: "Receipt already confirmed.",
                already_confirmed: true,
                assignment: updated
            });
        }

        // -------------------------------------------------
        // CONFIRM RECEIPT
        // Does NOT touch asset status, bin card, or any
        // other inventory state - it is purely an
        // acknowledgement event.
        // -------------------------------------------------
        const result = await AssignmentModel.confirmReceipt(
            req.params.id
        );

        if (result.affectedRows === 0) {
            return res.status(200).json({
                message: "Receipt already confirmed.",
                already_confirmed: true
            });
        }

        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------
        await logAudit(
            req,
            "CONFIRM_RECEIPT",
            "assignment",
            req.params.id,
            {
                user_id: req.user.user_id,
                asset_id: assignment.asset_id
            }
        );

        // -------------------------------------------------
        // SUCCESS RESPONSE
        // -------------------------------------------------
        const updatedAssignment = await AssignmentModel.getById(
            req.params.id
        );

        res.status(200).json({
            message: "Asset receipt confirmed successfully.",
            already_confirmed: false,
            assignment: updatedAssignment
        });
    } catch (err) {
        console.error("Confirm receipt error:", err);

        res.status(500).json({
            error: err.message
        });
    }
};

// =====================================================
// GET /api/assignments
// =====================================================
const getAllAssignments = async (req, res) => {
    try {
        const data = await AssignmentModel.getAll(
            req.user.user_id,
            req.user.role
        );

        res.status(200).json(data);
    } catch (err) {
        console.error("Get assignments error:", err);

        res.status(500).json({
            error: err.message
        });
    }
};

// =====================================================
// GET /api/assignments/:id
// =====================================================
const getAssignmentById = async (req, res) => {
    try {
        const assignment = await AssignmentModel.getById(
            req.params.id
        );

        if (!assignment) {
            return res.status(404).json({
                error: "Assignment not found."
            });
        }

        const privileged = [
            "admin",
            "manager",
            "asset_officer"
        ];

        if (
            !privileged.includes(req.user.role) &&
            assignment.user_id !== req.user.user_id
        ) {
            return res.status(403).json({
                error: "Access denied."
            });
        }

        res.status(200).json(assignment);
    } catch (err) {
        console.error("Get assignment by ID error:", err);

        res.status(500).json({
            error: err.message
        });
    }
};

// =====================================================
// POST /api/assignments
// CREATE ASSIGNMENT + BIN CARD ISSUE
// =====================================================
const createAssignment = async (req, res) => {
    try {
        const {
            user_id,
            asset_id,
            request_id,
            assignment_date,
            expected_return_date,
            notes
        } = req.body;

        // -------------------------------------------------
        // VALIDATE REQUIRED FIELDS
        // -------------------------------------------------
        if (!user_id || !asset_id) {
            return res.status(400).json({
                error: "User ID and Asset ID are required."
            });
        }

        // -------------------------------------------------
        // VALIDATE REQUEST (MUST BE APPROVED)
        // Backend-side protection: only Approved requests
        // can be turned into assignments.
        // -------------------------------------------------
        if (request_id) {
            const requestRows = await q(
                `SELECT r.*, u.name AS employee_name, a.asset_name AS requested_asset_name
                 FROM requests r
                 LEFT JOIN users u ON r.user_id = u.user_id
                 LEFT JOIN assets a ON r.asset_id = a.asset_id
                 WHERE r.request_id = ?`,
                [request_id]
            );

            if (!requestRows.length) {
                return res.status(404).json({ error: "Request not found." });
            }

            const request = requestRows[0];

            if (String(request.status).toLowerCase() !== "approved") {
                return res.status(400).json({
                    error: `Only approved requests can be assigned. Current status: ${request.status}.`
                });
            }

            if (request.user_id !== parseInt(user_id)) {
                return res.status(400).json({
                    error: "The user does not match the approved request's employee."
                });
            }

            if (request.asset_id && parseInt(request.asset_id) !== parseInt(asset_id)) {
                // The Asset Officer may assign a different available
                // asset to this approved request. Keep the request
                // consistent with the asset that is actually assigned.
                await q(
                    `UPDATE requests SET asset_id = ?, updated_at = NOW() WHERE request_id = ?`,
                    [asset_id, request_id]
                );
            }
        }

        // -------------------------------------------------
        // VALIDATE ASSET
        // -------------------------------------------------
        const asset = await AssetModel.getById(asset_id);

        if (!asset) {
            return res.status(404).json({
                error: "Asset not found."
            });
        }

        if (asset.status !== "Available") {
            return res.status(400).json({
                error:
                    `Asset "${asset.asset_name}" is not available.`
            });
        }

        // -------------------------------------------------
        // VALIDATE USER
        // -------------------------------------------------
        const user = await UserModel.getById(user_id);

        if (!user) {
            return res.status(404).json({
                error: "User not found or inactive."
            });
        }

        // -------------------------------------------------
        // CREATE ASSIGNMENT
        // assignment_date saved in DATETIME format
        // -------------------------------------------------
        let assignmentDT = assignment_date || new Date();
        if (!(assignmentDT instanceof Date)) {
            assignmentDT = new Date(assignmentDT);
        }
        const formattedAssignmentDate = assignmentDT
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");

        const result = await AssignmentModel.create({
            user_id: user_id,
            asset_id: asset_id,
            request_id: request_id || null,
            assignment_date: formattedAssignmentDate,
            assigned_by: req.user.user_id,
            notes: notes,
            expected_return_date: expected_return_date || null
        });

        // -------------------------------------------------
        // CREATE BIN CARD ISSUE
        // OUT -1 : Asset leaves the store
        // -------------------------------------------------
        const binCardResult =
            await BinCardModel.createTransaction({
                asset_id: asset_id,
                transaction_type: "OUT",
                quantity: -1,
                reference_type: "ASSIGNMENT",
                reference_id: result.insertId,
                receipt_number: null,
                employee_id: user_id,
                performed_by: req.user.user_id,
                notes:
                    `Asset "${asset.asset_name}" ` +
                    `issued to employee.`
            });

        // -------------------------------------------------
        // UPDATE ASSET STATUS
        // -------------------------------------------------
        await AssetModel.updateStatus(
            asset_id,
            "Assigned"
        );

        // -------------------------------------------------
        // MARK REQUEST AS ASSIGNED
        // Request no longer appears in Approved/Assignable list
        // -------------------------------------------------
        if (request_id) {
            await q(
                `UPDATE requests SET status = 'Assigned', updated_at = NOW() WHERE request_id = ?`,
                [request_id]
            );
        }

        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------
        await logAudit(
            req,
            "CREATE_ASSIGNMENT",
            "assignment",
            result.insertId,
            {
                user_id: user_id,
                asset_id: asset_id,
                asset_name: asset.asset_name
            }
        );

        // -------------------------------------------------
        // NOTIFICATION
        // -------------------------------------------------
        await NotificationModel.create({
            user_id: user_id,
            title: "Asset Assigned",
            message:
                `Asset "${asset.asset_name}" ` +
                `(${asset.serial_number || "No S/N"}) ` +
                `has been assigned to you.`,
            type: "info"
        });

        // -------------------------------------------------
        // SUCCESS RESPONSE
        // -------------------------------------------------
        res.status(201).json({
            message: "Asset assigned successfully.",
            assignment_id: result.insertId,
            transaction_id: binCardResult.insertId
        });

    } catch (err) {
        console.error("Create assignment error:", err);

        res.status(500).json({
            error: err.message
        });
    }
};

// =====================================================
// PUT /api/assignments/:id
// =====================================================
const updateAssignment = async (req, res) => {
    try {
        const result = await AssignmentModel.update(
            req.params.id,
            req.body
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Assignment not found."
            });
        }

        await logAudit(
            req,
            "UPDATE_ASSIGNMENT",
            "assignment",
            req.params.id
        );

        res.status(200).json({
            message:
                "Assignment updated successfully."
        });

    } catch (err) {
        console.error(
            "Update assignment error:",
            err
        );

        res.status(500).json({
            error: err.message
        });
    }
};

// =====================================================
// DELETE /api/assignments/:id
// Frees asset back to Available
// =====================================================
const deleteAssignment = async (req, res) => {
    try {
        const row =
            await AssignmentModel.getAssetId(
                req.params.id
            );

        if (!row) {
            return res.status(404).json({
                error: "Assignment not found."
            });
        }

        // Delete assignment
        await AssignmentModel.delete(
            req.params.id
        );

        // Return asset to store
        await AssetModel.updateStatus(
            row.asset_id,
            "Available"
        );

        // Audit log
        await logAudit(
            req,
            "DELETE_ASSIGNMENT",
            "assignment",
            req.params.id,
            {
                asset_id: row.asset_id
            }
        );

        res.status(200).json({
            message:
                "Assignment deleted and asset marked as Available."
        });

    } catch (err) {
        console.error(
            "Delete assignment error:",
            err
        );

        res.status(500).json({
            error: err.message
        });
    }
};

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
    getAllAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    confirmReceipt
};