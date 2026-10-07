const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
    getAllDisposals,
    getPendingDisposals,
    getDisposalById,
    getDisposalsByAsset,
    createDisposal,
    submitDisposal,
    approveDisposal,
    rejectDisposal,
    deleteDisposal,
    getDisposalsForFinance,
    processDisposalFinancials,
    completePhysicalDisposal
} = require("../controllers/disposalController");

// ============================================================
// GET ALL DISPOSALS
// GET /api/disposals
// ============================================================

router.get(
    "/",
    authenticate,
    getAllDisposals
);

// ============================================================
// GET APPROVED DISPOSALS FOR FINANCE REVIEW
// GET /api/disposals/finance
// NOTE: must be registered before "/:id" so "finance" is not
// treated as a disposal id.
// ============================================================

router.get(
    "/finance",
    authenticate,
    authorize("admin", "finance_officer"),
    getDisposalsForFinance
);

// ============================================================
// RECORD / PROCESS DISPOSAL FINANCIALS
// PUT /api/disposals/:id/financials
// Finance officer records disposal financials.
// ============================================================

router.put(
    "/:id/financials",
    authenticate,
    authorize("admin", "finance_officer"),
    processDisposalFinancials
);

// ============================================================
// GET PENDING DISPOSALS
// GET /api/disposals/pending
// ============================================================

router.get(
    "/pending",
    authenticate,
    authorize("admin", "manager", "asset_officer"),
    getPendingDisposals
);

// ============================================================
// GET DISPOSALS FOR ONE ASSET
// GET /api/disposals/asset/:assetId
// ============================================================

router.get(
    "/asset/:assetId",
    authenticate,
    getDisposalsByAsset
);

// ============================================================
// GET DISPOSAL BY ID
// GET /api/disposals/:id
// ============================================================

router.get(
    "/:id",
    authenticate,
    getDisposalById
);

// ============================================================
// CREATE DISPOSAL REQUEST
// POST /api/disposals
// ONLY an Asset Officer can create a Disposal Request. The asset
// is NOT disposed. It waits for manager approval.
// NOTE: Admin is intentionally excluded. Admin only monitors disposals.
// ============================================================

router.post(
    "/",
    authenticate,
    authorize("asset_officer"),
    createDisposal
);

// ============================================================
// SUBMIT A MAINTENANCE-RECOMMENDED DISPOSAL
// POST /api/disposals/:id/submit
// Asset Officer submits a disposal that was recommended by the
// Maintenance Officer (status 'Recommended'). The asset is already
// carried over; the Officer only adds/confirms the reason. This
// routes the request to the manager for approval.
// ============================================================

router.post(
    "/:id/submit",
    authenticate,
    authorize("asset_officer"),
    submitDisposal
);

// ============================================================
// APPROVE DISPOSAL
// PUT /api/disposals/:id/approve
// ONLY a manager can approve. Disposal can only be
// completed with manager approval.
// ============================================================

router.put(
    "/:id/approve",
    authenticate,
    authorize("manager"),
    approveDisposal
);

// ============================================================
// REJECT DISPOSAL
// PUT /api/disposals/:id/reject
// ONLY a manager can reject.
// ============================================================

router.put(
    "/:id/reject",
    authenticate,
    authorize("manager"),
    rejectDisposal
);

// ============================================================
// COMPLETE PHYSICAL DISPOSAL
// PUT /api/disposals/:id/complete
// Asset Officer (or admin) records the physical disposal method,
// marks the asset as Disposed, creates the Bin Card OUT, and
// completes the disposal. Only for Approved disposals.
// ============================================================

router.put(
    "/:id/complete",
    authenticate,
    authorize("admin", "asset_officer"),
    completePhysicalDisposal
);

// ============================================================
// DELETE DISPOSAL
// DELETE /api/disposals/:id
// Only Asset Officer can delete
// NOTE: Admin is intentionally excluded.
// ============================================================

router.delete(
    "/:id",
    authenticate,
    authorize("asset_officer"),
    deleteDisposal
);

module.exports = router;