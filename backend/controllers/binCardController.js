const BinCardModel = require("../models/binCardModel");

// ============================================================
// CHECK BIN CARD ACCESS
// ADMIN + ASSET OFFICER
// ============================================================

const requireBinCardAccess = (req, res) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: "Authentication required."
        });
        return false;
    }

    const role = String(req.user.role || "").toLowerCase();

    const allowedRoles = [
        "admin",
        "administrator",
        "asset_officer"
    ];

    if (!allowedRoles.includes(role)) {
        res.status(403).json({
            success: false,
            error:
                "Access denied. Bin Card is available to Administrators and Asset Officers."
        });
        return false;
    }

    return true;
};

// ============================================================
// CHECK WRITE ACCESS
// ONLY ASSET OFFICER CAN CREATE TRANSACTIONS
// ============================================================

const requireAssetOfficer = (req, res) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: "Authentication required."
        });
        return false;
    }

    const role = String(req.user.role || "").toLowerCase();

    if (role !== "asset_officer") {
        res.status(403).json({
            success: false,
            error:
                "Access denied. Only Asset Officers can create Bin Card transactions."
        });
        return false;
    }

    return true;
};

// ============================================================
// GET ALL BIN CARD TRANSACTIONS
// GET /api/bin-card
// ADMIN + ASSET OFFICER
// ============================================================

const getAllBinCards = async (req, res) => {
    try {
        if (!requireBinCardAccess(req, res)) return;

        const transactions = await BinCardModel.getAll();

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        console.error("Get all Bin Card error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// GET BIN CARD TRANSACTIONS FOR ONE ASSET
// GET /api/bin-card/asset/:assetId
// ADMIN + ASSET OFFICER
// ============================================================

const getBinCardByAsset = async (req, res) => {
    try {
        if (!requireBinCardAccess(req, res)) return;

        const { assetId } = req.params;

        if (!assetId || isNaN(Number(assetId))) {
            return res.status(400).json({
                success: false,
                error: "Valid asset ID is required."
            });
        }

        const transactions = await BinCardModel.getByAssetId(assetId);

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        console.error("Get Bin Card by asset error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// CREATE BIN CARD TRANSACTION
// POST /api/bin-card
// ONLY ASSET OFFICER
// ============================================================

const createBinCardTransaction = async (req, res) => {
    try {
        if (!requireAssetOfficer(req, res)) return;

        const {
            asset_id,
            transaction_type,
            quantity,
            reference_type,
            reference_id,
            receipt_number,
            employee_id,
            notes
        } = req.body;

        // ----------------------------------------------------
        // REQUIRED FIELDS
        // ----------------------------------------------------

        if (!asset_id) {
            return res.status(400).json({
                success: false,
                error: "Asset ID is required."
            });
        }

        if (!transaction_type || transaction_type.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "Transaction type is required."
            });
        }

        // ----------------------------------------------------
        // VALIDATE QUANTITY
        // ----------------------------------------------------

        const transactionQuantity =
            quantity === undefined ||
            quantity === null ||
            quantity === ""
                ? 1
                : Number(quantity);

        if (
            isNaN(transactionQuantity) ||
            transactionQuantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                error: "Quantity must be a positive number."
            });
        }

        // ----------------------------------------------------
        // CREATE TRANSACTION
        // performed_by = logged-in Asset Officer
        // ----------------------------------------------------

        const result = await BinCardModel.createTransaction({
            asset_id,
            transaction_type: transaction_type.trim(),
            quantity: transactionQuantity,
            reference_type: reference_type || null,
            reference_id: reference_id || null,
            receipt_number: receipt_number || null,
            employee_id: employee_id || null,
            performed_by: req.user.user_id,
            notes: notes || null
        });

        res.status(201).json({
            success: true,
            message: "Bin Card transaction created successfully.",
            transaction_id: result.insertId
        });

    } catch (error) {
        console.error("Create Bin Card transaction error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    getAllBinCards,
    getBinCardByAsset,
    createBinCardTransaction
};