// Role-based access control middleware factory
// Usage: authorize("admin", "manager")

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required." });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Allowed roles: ${roles.join(", ")}`
            });
        }
        next();
    };
};

// Shorthand role groups
const isAdmin         = authorize("admin");
const isAssetOfficer  = authorize("admin", "asset_officer");
const isManager       = authorize("admin", "manager");
const isFinance       = authorize("admin", "finance_officer");
const isMaintenance   = authorize("admin", "maintenance_officer");
const isStaff         = authorize("admin", "manager", "asset_officer", "finance_officer", "maintenance_officer");

module.exports = { authorize, isAdmin, isAssetOfficer, isManager, isFinance, isMaintenance, isStaff };
