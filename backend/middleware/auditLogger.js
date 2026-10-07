const AuditLogModel = require("../models/auditLogModel");

const logAudit = async (req, action, entityType = null, entityId = null, details = null) => {
    try {
        const userId = req.user ? req.user.user_id : null;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        await AuditLogModel.create({
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            details,
            ip_address: ipAddress
        });
    } catch (err) {
        console.error("Audit Logging Error:", err.message);
    }
};

module.exports = { logAudit };
