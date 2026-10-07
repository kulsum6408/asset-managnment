const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
    getAllTransfers, getTransferById, getMyTransferableAssets, createTransfer,
    approveTransfer, completeTransfer, rejectTransfer, cancelTransfer, deleteTransfer
} = require("../controllers/transferController");

// GET /api/transfers - View transfers
// Employees see only their own; managers/admin/asset_officer see all
router.get("/", authenticate, getAllTransfers);

// GET /api/transfers/my-assets - the logged-in employee's currently
// transferable assets (active assignment only). MUST come before /:id.
router.get("/my-assets", authenticate, authorize("employee"), getMyTransferableAssets);

// GET /api/transfers/:id - View single transfer
router.get("/:id", authenticate, getTransferById);

// POST /api/transfers - Create transfer request
// Employee, Admin, Manager, or Asset Officer can create
router.post("/", authenticate, authorize("admin", "manager", "asset_officer", "employee"), createTransfer);

// PUT /api/transfers/:id/approve - Manager reviews and approves (Pending -> Approved)
router.put("/:id/approve", authenticate, authorize("admin", "manager", "asset_officer"), approveTransfer);

// PUT /api/transfers/:id/complete - Asset Officer confirms physical handover (Approved -> Completed)
router.put("/:id/complete", authenticate, authorize("admin", "asset_officer"), completeTransfer);

// PUT /api/transfers/:id/reject - Manager reviews and rejects (or Asset Officer / Admin)
router.put("/:id/reject", authenticate, authorize("admin", "manager", "asset_officer"), rejectTransfer);

// PUT /api/transfers/:id/cancel - Creator cancels their own pending transfer
router.put("/:id/cancel", authenticate, cancelTransfer);

// DELETE /api/transfers/:id - Delete non-completed transfer (Asset Officer / Admin only)
router.delete("/:id", authenticate, authorize("asset_officer", "admin"), deleteTransfer);

module.exports = router;
