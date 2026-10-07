const ReturnModel     = require("../models/returnModel");
const AssignmentModel = require("../models/assignmentModel");
const AssetModel      = require("../models/assetModel");
const NotificationModel = require("../models/notificationModel");
const db              = require("../config/db");
const { isValidAssetCondition } = require("../utils/validator");

const q = (sql, params = []) =>
    new Promise((resolve, reject) =>
        db.query(sql, params, (err, results) =>
            err ? reject(err) : resolve(results)
        )
    );

// GET /api/returns
const getAllReturns = async (req, res) => {
    try {
        const data = await ReturnModel.getAll(req.user.user_id, req.user.role);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/returns/:id
const getReturnById = async (req, res) => {
    try {
        const ret = await ReturnModel.getById(req.params.id);
        if (!ret) return res.status(404).json({ error: "Return record not found." });
        res.status(200).json(ret);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/returns
const createReturn = async (req, res) => {
    try {
        const { assignment_id, return_date, asset_condition, notes } = req.body;

        if (!assignment_id)
            return res.status(400).json({ error: "Assignment ID is required." });

        if (asset_condition && !isValidAssetCondition(asset_condition))
            return res.status(400).json({ error: "Invalid condition." });

        // Validate assignment
        const assignment = await AssignmentModel.getById(assignment_id);
        if (!assignment) return res.status(404).json({ error: "Assignment not found." });
        if (assignment.status === "Returned")
            return res.status(400).json({ error: "Asset already returned." });

        // Employees can only return their own assigned assets
        const privileged = ["admin", "manager", "asset_officer"];
        if (!privileged.includes(req.user.role) && assignment.user_id !== req.user.user_id)
            return res.status(403).json({ error: "You can only return your own assigned assets." });

        // Check duplicate return
        const existing = await ReturnModel.getByAssignment(assignment_id);
        if (existing) return res.status(409).json({ error: "Return already recorded for this assignment." });

        const result = await ReturnModel.create({
            assignment_id,
            return_date: return_date || new Date(),
            asset_condition: asset_condition || "Good",
            notes,
            received_by: req.user.user_id
        });
        await AssignmentModel.updateStatus(assignment_id, "Returned");

        // Free asset back to Available and update condition
        await AssetModel.updateStatus(assignment.asset_id, "Available");
        await q(
            "UPDATE assets SET asset_condition = ? WHERE asset_id = ?",
            [asset_condition || "Good", assignment.asset_id]
        );

        // -------------------------------------------------
        // Notify asset officers of the return
        // -------------------------------------------------
        try {
            const returningByName =
                req.user.name || `User #${req.user.user_id}`;

            const asset = await q(
                "SELECT asset_name FROM assets WHERE asset_id=?",
                [assignment.asset_id]
            );

            const assetName = asset.length
                ? asset[0].asset_name
                : "the asset";

            const officers = await q(
                "SELECT user_id FROM users WHERE role='asset_officer'"
            );

            for (const officer of officers) {
                await NotificationModel.create({
                    user_id: officer.user_id,
                    title: "Asset Returned",
                    message:
                        `${returningByName} returned asset "${assetName}" ` +
                        `(Serial: ${assignment.serial_number || "N/A"}). ` +
                        `The asset is now Available in store.`,
                    type: "info"
                });
            }
        } catch (notifyErr) {
            console.error("Return notification error:", notifyErr.message);
        }

        res.status(201).json({ message: "Asset returned successfully.", return_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/returns/:id
const updateReturn = async (req, res) => {
    try {
        const result = await ReturnModel.update(req.params.id, req.body);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Return record not found." });
        res.status(200).json({ message: "Return record updated successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/returns/:id
const deleteReturn = async (req, res) => {
    try {
        const result = await ReturnModel.delete(req.params.id);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Return record not found." });
        res.status(200).json({ message: "Return record deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllReturns, getReturnById, createReturn, updateReturn, deleteReturn };
