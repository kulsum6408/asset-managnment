const express = require("express");

const router = express.Router();

const authenticate =
    require("../middleware/authMiddleware");

const {
    getAllInventoryChecks,
    getInventoryChecksByAsset,
    createInventoryCheck
} = require("../controllers/inventoryCheckController");

// ============================================================
// GET ALL INVENTORY CHECKS
// ADMIN + ASSET OFFICER
// ============================================================

router.get(
    "/",
    authenticate,
    getAllInventoryChecks
);

// ============================================================
// GET INVENTORY CHECK HISTORY FOR ASSET
// ADMIN + ASSET OFFICER
// ============================================================

router.get(
    "/asset/:assetId",
    authenticate,
    getInventoryChecksByAsset
);

// ============================================================
// CREATE YEARLY INVENTORY CHECK
// ONLY ASSET OFFICER
// ============================================================

router.post(
    "/",
    authenticate,
    createInventoryCheck
);

module.exports = router;
