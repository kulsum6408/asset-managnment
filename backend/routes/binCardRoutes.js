const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");

const {
    getAllBinCards,
    getBinCardByAsset,
    createBinCardTransaction
} = require("../controllers/binCardController");

// ============================================================
// GET ALL BIN CARD TRANSACTIONS
// GET /api/bin-card
// ============================================================

router.get(
    "/",
    authenticate,
    getAllBinCards
);

// ============================================================
// GET BIN CARD TRANSACTIONS FOR ONE ASSET
// GET /api/bin-card/asset/:assetId
// ============================================================

router.get(
    "/asset/:assetId",
    authenticate,
    getBinCardByAsset
);

// ============================================================
// CREATE BIN CARD TRANSACTION
// POST /api/bin-card
// ============================================================

router.post(
    "/",
    authenticate,
    createBinCardTransaction
);

module.exports = router;