const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
    submitCostForApproval,
    getAllCostApprovals,
    getApprovedForFinance,
    approveCost,
    rejectCost,
    processCostPayment
} = require("../controllers/maintenanceCostController");

// ============================================================
// SUBMIT MAINTENANCE COST FOR APPROVAL
// POST /api/maintenance/cost-approvals/submit/:maintenanceId
// Maintenance officer (or admin) submits a cost for approval.
// ============================================================
router.post(
    "/submit/:maintenanceId",
    authenticate,
    authorize("admin", "maintenance_officer"),
    submitCostForApproval
);

// ============================================================
// GET ALL MAINTENANCE COST APPROVALS
// GET /api/maintenance/cost-approvals
// Manager reviews pending maintenance costs.
// ============================================================
router.get(
    "/",
    authenticate,
    authorize("admin", "manager"),
    getAllCostApprovals
);

// ============================================================
// GET APPROVED COSTS FOR FINANCE
// GET /api/maintenance/cost-approvals/finance
// Finance officer views approved maintenance costs.
// ============================================================
router.get(
    "/finance",
    authenticate,
    authorize("admin", "finance_officer", "manager"),
    getApprovedForFinance
);

// ============================================================
// APPROVE MAINTENANCE COST
// PUT /api/maintenance/cost-approvals/:id/approve
// Manager only.
// ============================================================
router.put(
    "/:id/approve",
    authenticate,
    authorize("manager"),
    approveCost
);

// ============================================================
// REJECT MAINTENANCE COST
// PUT /api/maintenance/cost-approvals/:id/reject
// Manager only.
// ============================================================
router.put(
    "/:id/reject",
    authenticate,
    authorize("manager"),
    rejectCost
);

// ============================================================
// PROCESS / RECORD MAINTENANCE COST PAYMENT
// PUT /api/maintenance/cost-approvals/:id/process
// Finance officer records financial processing / payment status.
// ============================================================
router.put(
    "/:id/process",
    authenticate,
    authorize("admin", "finance_officer"),
    processCostPayment
);

module.exports = router;