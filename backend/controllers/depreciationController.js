const DepreciationModel = require("../models/depreciationModel");
const AssetModel        = require("../models/assetModel");
const db               = require("../config/db");

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

const getAllDepreciations = async (req, res) => {
    try {
        const list = await DepreciationModel.getAll(req.query);
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getDepreciationById = async (req, res) => {
    try {
        const item = await DepreciationModel.getById(req.params.id);
        if (!item) return res.status(404).json({ error: "Depreciation record not found." });
        res.status(200).json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const calculateDepreciation = async (req, res) => {
    try {
        const { asset_id, method, useful_life_years, rate_percent } = req.body;
        if (!asset_id) return res.status(400).json({ error: "Asset ID is required." });

        const asset = await AssetModel.getById(asset_id);
        if (!asset) return res.status(404).json({ error: "Asset not found." });

        const purchaseCost = Number(asset.purchase_cost) || 0;
        const salvageValue = Number(asset.salvage_value) || 0;
        if (purchaseCost <= 0)
            return res.status(400).json({ error: "Asset purchase cost must be greater than 0 to calculate depreciation." });

        const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date(asset.created_at);
        const now = new Date();
        const ageInYears = Math.max(0, (now - purchaseDate) / (1000 * 60 * 60 * 24 * 365.25));

        const methodType = method === "Declining Balance" ? "Declining Balance" : "Straight Line";
        const years = Number(useful_life_years) || 5;
        const rate  = Number(rate_percent) || (100 / years);

        let currentValue = purchaseCost;
        let totalDepreciated = 0;

        const depreciableBase = Math.max(0, purchaseCost - salvageValue);

        if (methodType === "Straight Line") {
            const annualDepreciation = depreciableBase / years;
            totalDepreciated = Math.min(depreciableBase, annualDepreciation * ageInYears);
            currentValue = Math.max(salvageValue, purchaseCost - totalDepreciated);
        } else {
            const r = rate / 100;
            const computedVal = purchaseCost * Math.pow(1 - r, ageInYears);
            currentValue = Math.max(salvageValue, computedVal);
            totalDepreciated = purchaseCost - currentValue;
        }

        const result = await DepreciationModel.create({
            asset_id,
            method: methodType,
            useful_life_years: years,
            rate_percent: rate.toFixed(2),
            purchase_cost: purchaseCost,
            current_value: Number(currentValue.toFixed(2)),
            total_depreciated: Number(totalDepreciated.toFixed(2)),
            salvage_value: salvageValue
        });

        // Persist the computed depreciation to the asset's financial
        // columns so asset financial value reports stay accurate.
        await q(
            `UPDATE assets
             SET useful_life_years = ?,
                 salvage_value = ?,
                 accumulated_depreciation = ?,
                 current_book_value = ?
             WHERE asset_id = ?`,
            [
                years,
                salvageValue,
                Number(totalDepreciated.toFixed(2)),
                Number(currentValue.toFixed(2)),
                asset_id
            ]
        );

        const { logAudit } = require("../middleware/auditLogger");
        await logAudit(
            req,
            "CALCULATE_DEPRECIATION",
            "assets",
            asset_id,
            {
                method: methodType,
                current_value: Number(currentValue.toFixed(2)),
                total_depreciated: Number(totalDepreciated.toFixed(2))
            }
        );

        res.status(201).json({
            message: "Depreciation calculated and saved successfully.",
            depreciation_id: result.insertId,
            calculation: {
                asset_id,
                method: methodType,
                age_in_years: Number(ageInYears.toFixed(2)),
                purchase_cost: purchaseCost,
                salvage_value: salvageValue,
                current_value: Number(currentValue.toFixed(2)),
                total_depreciated: Number(totalDepreciated.toFixed(2))
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const calculateAssetDepreciationInstant = async (req, res) => {
    try {
        const assetId = req.params.asset_id;
        const asset = await AssetModel.getById(assetId);
        if (!asset) return res.status(404).json({ error: "Asset not found." });

        const purchaseCost = Number(asset.purchase_cost) || 0;
        const salvageValue = Number(asset.salvage_value) || 0;
        const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date(asset.created_at);
        const now = new Date();
        const ageInYears = Math.max(0, (now - purchaseDate) / (1000 * 60 * 60 * 24 * 365.25));

        const years = Number(req.query.years) || 5;
        const depreciableBase = Math.max(0, purchaseCost - salvageValue);
        const annualDepreciation = depreciableBase / years;
        const totalDepreciated = Math.min(depreciableBase, annualDepreciation * ageInYears);
        const currentValue = Math.max(salvageValue, purchaseCost - totalDepreciated);

        res.status(200).json({
            asset_id: Number(assetId),
            asset_name: asset.asset_name,
            purchase_cost: purchaseCost,
            salvage_value: salvageValue,
            useful_life_years: years,
            age_in_years: Number(ageInYears.toFixed(2)),
            annual_depreciation: Number(annualDepreciation.toFixed(2)),
            current_book_value: Number(currentValue.toFixed(2)),
            accumulated_depreciation: Number(totalDepreciated.toFixed(2))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteDepreciation = async (req, res) => {
    try {
        const result = await DepreciationModel.delete(req.params.id);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Record not found." });
        res.status(200).json({ message: "Depreciation record deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllDepreciations,
    getDepreciationById,
    calculateDepreciation,
    calculateAssetDepreciationInstant,
    deleteDepreciation
};
