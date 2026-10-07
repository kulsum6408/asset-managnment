const AuditLogModel = require("../models/auditLogModel");

const getAllLogs = async (req, res) => {
    try {
        const logs = await AuditLogModel.getAll(req.query);
        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getLogById = async (req, res) => {
    try {
        const log = await AuditLogModel.getById(req.params.id);
        if (!log) return res.status(404).json({ error: "Audit log not found." });
        res.status(200).json(log);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllLogs, getLogById };
