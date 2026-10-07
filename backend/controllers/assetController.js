const AssetModel = require("../models/assetModel");
const AssetHistoryModel = require("../models/assetHistoryModel");
const { isValidAssetStatus, isValidAssetCondition } = require("../utils/validator");
const { logAudit } = require("../middleware/auditLogger");
const { generateQRCodeDataURI } = require("../utils/qrUtils");

const isValidDate = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

const isValidNumber = (value) => {
    if (value === null || value === undefined || value === '') return false;
    const num = Number(value);
    return !isNaN(num) && num >= 0;
};

// GET /api/assets
const getAllAssets = async (req, res) => {
    try {
        const assets = await AssetModel.getAll(req.query);
        res.status(200).json(assets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/assets/categories
const getCategories = async (req, res) => {
    try {
        const categories = await AssetModel.getCategories();
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/assets/:id
const getAssetById = async (req, res) => {
    try {
        const asset = await AssetModel.getById(req.params.id);
        if (!asset) return res.status(404).json({ error: "Asset not found." });
        res.status(200).json(asset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/assets/:id/history
const getAssetHistory = async (req, res) => {
    try {
        const asset = await AssetModel.getById(req.params.id);
        if (!asset) return res.status(404).json({ error: "Asset not found." });
        const history = await AssetHistoryModel.getByAssetId(req.params.id);
        res.status(200).json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/assets/:id/qr
const getAssetQR = async (req, res) => {
    try {
        const asset = await AssetModel.getById(req.params.id);
        if (!asset) return res.status(404).json({ error: "Asset not found." });

        const payload = {
            asset_id: asset.asset_id,
            asset_name: asset.asset_name,
            serial_number: asset.serial_number,
            category_name: asset.category_name,
            status: asset.status,
            location: asset.location
        };

        const qr_code = await generateQRCodeDataURI(payload);
        res.status(200).json({ asset_id: asset.asset_id, payload, qr_code });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/assets
const createAsset = async (req, res) => {
    try {
        const { asset_name, category_id, serial_number, purchase_date, purchase_cost, salvage_value, warranty_start_date, warranty_end_date, status, asset_condition, location } = req.body;

        if (!asset_name || asset_name.trim() === '')
            return res.status(400).json({ error: "Asset name is required." });

        if (category_id !== null && category_id !== undefined) {
            const categoryExists = await AssetModel.checkCategoryExists(category_id);
            if (!categoryExists)
                return res.status(400).json({ error: "Category does not exist." });
        }

        if (serial_number && serial_number.trim() !== '') {
            const serialExists = await AssetModel.checkSerialNumberExists(serial_number);
            if (serialExists)
                return res.status(400).json({ error: "Serial number already exists." });
        }

        if (purchase_cost !== null && purchase_cost !== undefined && purchase_cost !== '') {
            if (!isValidNumber(purchase_cost))
                return res.status(400).json({ error: "Purchase cost must be a valid non-negative number." });
        }

        if (salvage_value !== null && salvage_value !== undefined && salvage_value !== '') {
            if (!isValidNumber(salvage_value))
                return res.status(400).json({ error: "Salvage value must be a valid non-negative number." });
        }

        if (purchase_date && !isValidDate(purchase_date))
            return res.status(400).json({ error: "Purchase date must be a valid date." });

        if (status && !isValidAssetStatus(status))
            return res.status(400).json({ error: "Invalid status. Valid statuses are: Available, Assigned, Under Maintenance, Disposed, Lost." });

        if (asset_condition && !isValidAssetCondition(asset_condition))
            return res.status(400).json({ error: "Invalid condition. Valid conditions are: New, Good, Fair, Poor, Damaged." });

        const userId = req.user ? req.user.user_id : null;
        const result = await AssetModel.createWithBinCard(req.body, userId);
        await logAudit(req, "CREATE_ASSET", "asset", result.insertId, { asset_name, serial_number, status });

        // Record history
        await AssetHistoryModel.create({
            asset_id: result.insertId,
            user_id: userId,
            action: "ASSET_REGISTERED",
            previous_value: null,
            new_value: { status: status || "Available", asset_condition: asset_condition || "Good", location: location || null },
            description: `Asset "${asset_name}" registered and Bin Card RECEIPT created.`
        });

        res.status(201).json({ message: "Asset created successfully.", asset_id: result.insertId, transaction_id: result.transaction_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/assets/:id
const updateAsset = async (req, res) => {
    try {
        const { asset_name, category_id, serial_number, purchase_date, purchase_cost, salvage_value, warranty_start_date, warranty_end_date, status, asset_condition, location } = req.body;

        if (!asset_name || asset_name.trim() === '')
            return res.status(400).json({ error: "Asset name is required." });

        if (category_id !== null && category_id !== undefined) {
            const categoryExists = await AssetModel.checkCategoryExists(category_id);
            if (!categoryExists)
                return res.status(400).json({ error: "Category does not exist." });
        }

        if (serial_number && serial_number.trim() !== '') {
            const serialExists = await AssetModel.checkSerialNumberExists(serial_number, req.params.id);
            if (serialExists)
                return res.status(400).json({ error: "Serial number already exists." });
        }

        if (purchase_cost !== null && purchase_cost !== undefined && purchase_cost !== '') {
            if (!isValidNumber(purchase_cost))
                return res.status(400).json({ error: "Purchase cost must be a valid non-negative number." });
        }

        if (salvage_value !== null && salvage_value !== undefined && salvage_value !== '') {
            if (!isValidNumber(salvage_value))
                return res.status(400).json({ error: "Salvage value must be a valid non-negative number." });
        }

        if (purchase_date && !isValidDate(purchase_date))
            return res.status(400).json({ error: "Purchase date must be a valid date." });

        if (status && !isValidAssetStatus(status))
            return res.status(400).json({ error: "Invalid status. Valid statuses are: Available, Assigned, Under Maintenance, Disposed, Lost." });

        if (asset_condition && !isValidAssetCondition(asset_condition))
            return res.status(400).json({ error: "Invalid condition. Valid conditions are: New, Good, Fair, Poor, Damaged." });

        const existing = await AssetModel.getById(req.params.id);
        const result = await AssetModel.update(req.params.id, req.body);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Asset not found." });

        await logAudit(req, "UPDATE_ASSET", "asset", req.params.id, { asset_name, status, location });

        // Record history
        await AssetHistoryModel.create({
            asset_id: req.params.id,
            user_id: req.user ? req.user.user_id : null,
            action: "ASSET_UPDATED",
            previous_value: existing ? { asset_name: existing.asset_name, status: existing.status, location: existing.location } : null,
            new_value: { asset_name, status, location },
            description: `Asset details updated.`
        });

        res.status(200).json({ message: "Asset updated successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/assets/:id/status
const updateAssetStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !isValidAssetStatus(status))
            return res.status(400).json({ error: "Valid status required. Valid statuses are: Available, Assigned, Under Maintenance, Disposed, Lost." });

        const existing = await AssetModel.getById(req.params.id);
        const result = await AssetModel.updateStatus(req.params.id, status);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Asset not found." });

        await logAudit(req, "UPDATE_ASSET_STATUS", "asset", req.params.id, { new_status: status });

        // Record history
        await AssetHistoryModel.create({
            asset_id: req.params.id,
            user_id: req.user ? req.user.user_id : null,
            action: "STATUS_CHANGED",
            previous_value: existing ? existing.status : null,
            new_value: status,
            description: `Asset status changed to ${status}.`
        });

        res.status(200).json({ message: "Asset status updated successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/assets/:id
const deleteAsset = async (req, res) => {
    try {
        const references = await AssetModel.checkAssetReferences(req.params.id);
        
        if (references.request_count > 0 || references.assignment_count > 0 || references.maintenance_count > 0) {
            const errors = [];
            if (references.request_count > 0) errors.push(`${references.request_count} request(s)`);
            if (references.assignment_count > 0) errors.push(`${references.assignment_count} assignment(s)`);
            if (references.maintenance_count > 0) errors.push(`${references.maintenance_count} maintenance record(s)`);
            
            return res.status(400).json({ 
                error: `Cannot delete asset. It is referenced by: ${errors.join(', ')}.` 
            });
        }

        const result = await AssetModel.delete(req.params.id);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Asset not found." });
        
        await logAudit(req, "DELETE_ASSET", "asset", req.params.id);

        res.status(200).json({ message: "Asset deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Warranty Handlers
const getWarrantiesActive = async (req, res) => {
    try {
        const list = await AssetModel.getWarranties("active");
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getWarrantiesExpired = async (req, res) => {
    try {
        const list = await AssetModel.getWarranties("expired");
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getWarrantiesExpiringSoon = async (req, res) => {
    try {
        const list = await AssetModel.getWarranties("expiring-soon");
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllAssets,
    getCategories,
    getAssetById,
    getAssetHistory,
    getAssetQR,
    createAsset,
    updateAsset,
    updateAssetStatus,
    deleteAsset,
    getWarrantiesActive,
    getWarrantiesExpired,
    getWarrantiesExpiringSoon
};
