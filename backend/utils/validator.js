const VALID_ROLES = [
    "admin", "manager", "asset_officer",
    "finance_officer", "maintenance_officer", "employee"
];

const VALID_ASSET_STATUSES = [
    "Available", "Assigned", "Under Maintenance", "Disposed", "Lost"
];

const VALID_ASSET_CONDITIONS = ["New", "Good", "Fair", "Poor", "Damaged"];

const VALID_MAINTENANCE_STATUSES = [
    "Scheduled", "In Progress", "Completed", "Cancelled"
];

const VALID_REQUEST_STATUSES = [
    "Pending", "Approved", "Rejected", "Cancelled"
];

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidRole = (role) => VALID_ROLES.includes(role);

const isValidAssetStatus = (status) => VALID_ASSET_STATUSES.includes(status);

const isValidAssetCondition = (condition) => VALID_ASSET_CONDITIONS.includes(condition);

const isValidMaintenanceStatus = (status) => VALID_MAINTENANCE_STATUSES.includes(status);

const isValidRequestStatus = (status) => VALID_REQUEST_STATUSES.includes(status);

module.exports = {
    VALID_ROLES,
    VALID_ASSET_STATUSES,
    VALID_ASSET_CONDITIONS,
    VALID_MAINTENANCE_STATUSES,
    VALID_REQUEST_STATUSES,
    isValidEmail,
    isValidRole,
    isValidAssetStatus,
    isValidAssetCondition,
    isValidMaintenanceStatus,
    isValidRequestStatus
};
