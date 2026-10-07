const MaintenanceCostApprovalModel = require("../models/maintenanceCostApprovalModel");
const NotificationModel = require("../models/notificationModel");
const db = require("../config/db");

const q = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });

// ============================================================
// Helper: notify a specific role group
// ============================================================
const notifyRole = async (role, title, message, type = "info") => {
    const users = await q(
        "SELECT user_id FROM users WHERE role = ?",
        [role]
    );

    for (const user of users) {
        await NotificationModel.create({
            user_id: user.user_id,
            title,
            message,
            type,
        });
    }
};

// ============================================================
// SUBMIT MAINTENANCE COST FOR APPROVAL
// POST /api/maintenance/cost-approvals/submit
// Maintenance officer submits a cost for manager approval.
// Creates (or resets) a maintenance_cost_approvals row as Pending
// and notifies managers.
// ============================================================
const submitCostForApproval = async (req, res) => {
    try {
        const { maintenanceId } = req.params;
        const maintenanceIdValue =
            maintenanceId !== undefined
                ? Number(maintenanceId)
                : Number(req.body.maintenance_id);

        if (!maintenanceIdValue || isNaN(maintenanceIdValue)) {
            return res.status(400).json({
                success: false,
                error: "Valid maintenance ID is required."
            });
        }

        const maintenance = await q(
            `SELECT m.*, a.asset_name
             FROM maintenance m
             LEFT JOIN assets a ON m.asset_id = a.asset_id
             WHERE m.maintenance_id = ?`,
            [maintenanceIdValue]
        );

        if (!maintenance.length) {
            return res.status(404).json({
                success: false,
                error: "Maintenance record not found."
            });
        }

        const record = maintenance[0];

        if (!record.cost || Number(record.cost) <= 0) {
            return res.status(400).json({
                success: false,
                error: "No maintenance cost has been recorded for this record."
            });
        }

        const existing =
            await MaintenanceCostApprovalModel.getByMaintenanceId(maintenanceIdValue);

        await MaintenanceCostApprovalModel.setDecision({
            maintenance_id: maintenanceIdValue,
            estimated_cost: existing.length
                ? existing[0].estimated_cost
                : Number(record.cost),
            approved_cost: null,
            status: "Pending",
            requested_by: existing.length
                ? existing[0].requested_by
                : req.user.user_id,
            approved_by: null,
            review_remarks: null,
            finance_notified: 0
        });

        // Notify managers that a cost is awaiting approval
        const managers = await q(
            "SELECT user_id FROM users WHERE role = 'manager'"
        );
        for (const manager of managers) {
            await NotificationModel.create({
                user_id: manager.user_id,
                title: "Maintenance Cost Submitted for Approval",
                message:
                    `Maintenance cost of ${Number(record.cost)} for asset ` +
                    `"${record.asset_name}" was submitted and needs your approval.`,
                type: "info"
            });
        }

        res.status(200).json({
            success: true,
            message:
                "Maintenance cost submitted for approval. The manager has been notified."
        });
    } catch (error) {
        console.error("Submit maintenance cost error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// GET ALL MAINTENANCE COST APPROVALS
// GET /api/maintenance/cost-approvals
// ============================================================
const getAllCostApprovals = async (req, res) => {
    try {
        const approvals = await MaintenanceCostApprovalModel.getAll();

        res.status(200).json({
            success: true,
            count: approvals.length,
            data: approvals
        });
    } catch (error) {
        console.error("Get cost approvals error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// GET APPROVED COSTS FOR FINANCE
// GET /api/maintenance/cost-approvals/finance
// ============================================================
const getApprovedForFinance = async (req, res) => {
    try {
        const approvals =
            await MaintenanceCostApprovalModel.getApprovedForFinance();

        res.status(200).json({
            success: true,
            count: approvals.length,
            data: approvals
        });
    } catch (error) {
        console.error("Get approved finance costs error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// APPROVE MAINTENANCE COST
// PUT /api/maintenance/cost-approvals/:id/approve
// Manager approves the cost and forwards it to finance.
// ============================================================
const approveCost = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved_cost, remarks } = req.body;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                error: "Valid maintenance ID is required."
            });
        }

        if (req.user.role !== "manager") {
            return res.status(403).json({
                success: false,
                error: "Only a manager can approve maintenance costs."
            });
        }

        const maintenance = await q(
            `SELECT m.*, a.asset_name
             FROM maintenance m
             LEFT JOIN assets a ON m.asset_id = a.asset_id
             WHERE m.maintenance_id = ?`,
            [id]
        );

        if (!maintenance.length) {
            return res.status(404).json({
                success: false,
                error: "Maintenance record not found."
            });
        }

        const record = maintenance[0];
        const finalCost =
            approved_cost !== undefined
                ? Number(approved_cost)
                : Number(record.cost);

        const existing =
            await MaintenanceCostApprovalModel.getByMaintenanceId(id);

        await MaintenanceCostApprovalModel.setDecision({
            maintenance_id: id,
            estimated_cost: Number(record.cost),
            approved_cost: finalCost,
            status: "Approved",
            requested_by: existing.length ? existing[0].requested_by : record.technician_id,
            approved_by: req.user.user_id,
            review_remarks: remarks || null,
            finance_notified: 1
        });

        // ----------------------------------------------------
        // Notify Finance Officers
        // ----------------------------------------------------
        const financeOfficers = await q(
            "SELECT user_id FROM users WHERE role = 'finance_officer'"
        );

        for (const officer of financeOfficers) {
            await NotificationModel.create({
                user_id: officer.user_id,
                title: "Approved Maintenance Cost",
                message:
                    `Maintenance cost for asset "${record.asset_name}" ` +
                    `has been approved at ${finalCost}. It is available ` +
                    `for finance review.`,
                type: "info",
            });
        }

        // ----------------------------------------------------
        // Notify Maintenance Officer
        // ----------------------------------------------------
        if (record.technician_id) {
            await NotificationModel.create({
                user_id: record.technician_id,
                title: "Maintenance Cost Approved",
                message:
                    `The maintenance cost for asset "${record.asset_name}" ` +
                    `has been approved by the manager.`,
                type: "success",
            });
        }

        const { logAudit } = require("../middleware/auditLogger");
        await logAudit(
            req,
            "APPROVE_MAINTENANCE_COST",
            "maintenance",
            id,
            { approved_cost: finalCost, remarks: remarks || null }
        );

        res.status(200).json({
            success: true,
            message:
                "Maintenance cost approved and forwarded to finance.",
            approved_cost: finalCost
        });
    } catch (error) {
        console.error("Approve maintenance cost error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// REJECT MAINTENANCE COST
// PUT /api/maintenance/cost-approvals/:id/reject
// ============================================================
const rejectCost = async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                error: "Valid maintenance ID is required."
            });
        }

        if (req.user.role !== "manager") {
            return res.status(403).json({
                success: false,
                error: "Only a manager can reject maintenance costs."
            });
        }

        const maintenance = await q(
            `SELECT m.*, a.asset_name
             FROM maintenance m
             LEFT JOIN assets a ON m.asset_id = a.asset_id
             WHERE m.maintenance_id = ?`,
            [id]
        );

        if (!maintenance.length) {
            return res.status(404).json({
                success: false,
                error: "Maintenance record not found."
            });
        }

        const record = maintenance[0];
        const existing =
            await MaintenanceCostApprovalModel.getByMaintenanceId(id);

        await MaintenanceCostApprovalModel.setDecision({
            maintenance_id: id,
            estimated_cost: Number(record.cost),
            approved_cost: null,
            status: "Rejected",
            requested_by: existing.length ? existing[0].requested_by : record.technician_id,
            approved_by: req.user.user_id,
            review_remarks: remarks || null,
            finance_notified: 0
        });

        if (record.technician_id) {
            await NotificationModel.create({
                user_id: record.technician_id,
                title: "Maintenance Cost Rejected",
                message:
                    `The maintenance cost for asset "${record.asset_name}" ` +
                    `was rejected.` + (remarks ? ` Remarks: ${remarks}` : ""),
                type: "danger",
            });
        }

        const { logAudit } = require("../middleware/auditLogger");
        await logAudit(
            req,
            "REJECT_MAINTENANCE_COST",
            "maintenance",
            id,
            { remarks: remarks || null }
        );

        res.status(200).json({
            success: true,
            message: "Maintenance cost rejected."
        });
    } catch (error) {
        console.error("Reject maintenance cost error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// PROCESS / RECORD MAINTENANCE COST PAYMENT (FINANCE)
// PUT /api/maintenance/cost-approvals/:id/process
// Finance officer records financial processing / payment status.
// ============================================================
const processCostPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status, payment_method, finance_remarks } = req.body;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                error: "Valid maintenance ID is required."
            });
        }

        if (!["Pending", "Processed", "Paid", "Rejected"].includes(payment_status)) {
            return res.status(400).json({
                success: false,
                error:
                    "Invalid payment status. Use Pending, Processed, Paid, or Rejected."
            });
        }

        const existing =
            await MaintenanceCostApprovalModel.getPaymentByMaintenanceId(id);

        if (!existing.length) {
            return res.status(404).json({
                success: false,
                error: "No approved maintenance cost found for this record."
            });
        }

        if (existing[0].status !== "Approved") {
            return res.status(400).json({
                success: false,
                error:
                    "This maintenance cost is not approved. Only approved costs can be processed."
            });
        }

        await MaintenanceCostApprovalModel.processPayment(id, {
            payment_status,
            payment_method: payment_method || null,
            finance_remarks: finance_remarks || null
        });

        const maintenance = await q(
            `SELECT m.*, a.asset_name
             FROM maintenance m
             LEFT JOIN assets a ON m.asset_id = a.asset_id
             WHERE m.maintenance_id = ?`,
            [id]
        );

        const assetName =
            maintenance.length && maintenance[0]
                ? maintenance[0].asset_name
                : "the asset";

        // Notify the maintenance officer who requested the cost
        if (existing[0].requested_by) {
            await NotificationModel.create({
                user_id: existing[0].requested_by,
                title: "Maintenance Cost Payment Updated",
                message:
                    `Maintenance cost for asset "${assetName}" has been ` +
                    `marked as ${payment_status}.`,
                type: payment_status === "Paid" ? "success" : "info"
            });
        }

        // Notify the manager
        const managers = await q(
            "SELECT user_id FROM users WHERE role = 'manager'"
        );
        for (const manager of managers) {
            await NotificationModel.create({
                user_id: manager.user_id,
                title: "Maintenance Cost Payment Updated",
                message:
                    `Maintenance cost for asset "${assetName}" has been ` +
                    `${payment_status} by finance.`,
                type: "info"
            });
        }

        const { logAudit } = require("../middleware/auditLogger");
        await logAudit(
            req,
            "PROCESS_MAINTENANCE_COST",
            "maintenance",
            id,
            { payment_status, payment_method, finance_remarks }
        );

        res.status(200).json({
            success: true,
            message: `Maintenance cost marked as ${payment_status}.`
        });
    } catch (error) {
        console.error("Process maintenance cost error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    submitCostForApproval,
    getAllCostApprovals,
    getApprovedForFinance,
    approveCost,
    rejectCost,
    processCostPayment
};