const RegistrationModel = require("../models/registrationModel");
const AssetModel        = require("../models/assetModel");
const db                = require("../config/db");

const q = (sql, params = []) =>
    new Promise((res, rej) => db.query(sql, params, (e, r) => e ? rej(e) : res(r)));

const getAllRegistrations = async (req, res) => {
    try {
        const list = await RegistrationModel.getAll(req.query);
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getRegistrationById = async (req, res) => {
    try {
        const item = await RegistrationModel.getById(req.params.id);
        if (!item) return res.status(404).json({ error: "Registration record not found." });
        res.status(200).json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createRegistration = async (req, res) => {
    try {
        const { asset_id, purchase_date, purchase_cost, supplier, invoice_number, warranty_expiry, asset_condition, location, notes } = req.body;
        if (!asset_id) return res.status(400).json({ error: "Asset ID is required." });

        const asset = await AssetModel.getById(asset_id);
        if (!asset) return res.status(404).json({ error: "Asset not found." });

        const result = await RegistrationModel.create({
            asset_id,
            registered_by: req.user.user_id,
            purchase_date: purchase_date || asset.purchase_date || null,
            purchase_cost: purchase_cost || asset.purchase_cost || null,
            supplier,
            invoice_number,
            warranty_expiry,
            asset_condition: asset_condition || asset.asset_condition || 'New',
            location: location || asset.location || null,
            notes
        });

        // Optionally sync asset purchase_cost and condition if supplied
        const updates = [];
        const params = [];
        if (purchase_cost) { updates.push("purchase_cost=?"); params.push(purchase_cost); }
        if (asset_condition) { updates.push("asset_condition=?"); params.push(asset_condition); }
        if (location) { updates.push("location=?"); params.push(location); }
        
        if (updates.length > 0) {
            params.push(asset_id);
            await q(`UPDATE assets SET ${updates.join(", ")} WHERE asset_id=?`, params);
        }

        res.status(201).json({ message: "Asset intake registration completed.", registration_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteRegistration = async (req, res) => {
    try {
        const result = await RegistrationModel.delete(req.params.id);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Registration record not found." });
        res.status(200).json({ message: "Registration record deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllRegistrations, getRegistrationById, createRegistration, deleteRegistration };
