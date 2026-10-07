const express = require("express");
const router  = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { isStaff, isAdmin, isFinance } = require("../middleware/roleMiddleware");
const {
    getDashboard,
    getAssetReport,
    getAssetsByStatus,
    getAssetsByLocation,
    getAssetValue,
    getUserReport,
    getMaintenanceReport,
    getAssignmentReport,
    getRequestReport,
    getAuditReport,
    exportReport,
    getAssetFinancialValueReport,
    getDepreciationReport,
    getMaintenanceExpenditureReport,
    getDisposalFinancialReport,
} = require("../controllers/reportController");

// Export endpoints
router.get("/export",              authenticate, isStaff, exportReport);
router.get("/export/:format",      authenticate, isStaff, exportReport);

// Root reports overview & Dashboard summary — available to all staff roles
router.get("/",                    authenticate, isStaff, getDashboard);
router.get("/dashboard",           authenticate, isStaff, getDashboard);

// Asset reports — status, category, valuation, location
router.get("/assets",              authenticate, isStaff, getAssetReport);
router.get("/assets-by-category",  authenticate, isStaff, getAssetReport);
router.get("/assets-by-status",    authenticate, isStaff, getAssetsByStatus);
router.get("/assets-by-location",  authenticate, isStaff, getAssetsByLocation);
router.get("/assets/value",        authenticate, isStaff, getAssetValue);
router.get("/valuation",           authenticate, isStaff, getAssetValue);

// Detailed reports
router.get("/users",               authenticate, isStaff, getUserReport);
router.get("/maintenance",         authenticate, isStaff, getMaintenanceReport);
router.get("/assignments",         authenticate, isStaff, getAssignmentReport);
router.get("/requests",            authenticate, isStaff, getRequestReport);
router.get("/audit",               authenticate, isStaff, getAuditReport);

// ── FINANCE REPORTS (finance officers + managers) ───────────
router.get("/finance/asset-value",            authenticate, isFinance, getAssetFinancialValueReport);
router.get("/finance/depreciation",           authenticate, isFinance, getDepreciationReport);
router.get("/finance/maintenance-expenditure", authenticate, isFinance, getMaintenanceExpenditureReport);
router.get("/finance/disposal",               authenticate, isFinance, getDisposalFinancialReport);

module.exports = router;
