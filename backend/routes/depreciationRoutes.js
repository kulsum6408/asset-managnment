const express = require("express");
const router  = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { authorize }  = require("../middleware/roleMiddleware");
const {
    getAllDepreciations, getDepreciationById, calculateDepreciation,
    calculateAssetDepreciationInstant, deleteDepreciation
} = require("../controllers/depreciationController");

router.get("/", authenticate, getAllDepreciations);
router.get("/calculate/:asset_id", authenticate, calculateAssetDepreciationInstant);
router.get("/:id", authenticate, getDepreciationById);
// NOTE: Admin is intentionally excluded. Admin only monitors depreciation.
router.post("/", authenticate, authorize("manager", "finance_officer", "asset_officer"), calculateDepreciation);
router.delete("/:id", authenticate, authorize("finance_officer"), deleteDepreciation);

module.exports = router;
