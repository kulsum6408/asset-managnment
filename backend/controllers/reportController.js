const ReportModel = require("../models/reportModel");
const AssetModel  = require("../models/assetModel");
const { generateCSV, generateExcelXML, generatePDF } = require("../utils/exportUtils");

const fetchReportRows = async (type = "assets") => {
    switch (type.toLowerCase()) {
        case "maintenance":
            return await ReportModel.getMaintenanceSummary();
        case "assignments":
            return await ReportModel.getAssignmentsByDepartment();
        case "users":
            return await ReportModel.getUsersByRole();
        case "audit":
            return await ReportModel.getAuditSummary();
        case "category":
        case "assets-by-category":
            return await ReportModel.getAssetsByCategory();
        case "assets":
        default:
            return await AssetModel.getAll();
    }
};

// GET /api/reports/export or /api/reports/export/:format
const exportReport = async (req, res) => {
    try {
        const format = (req.params.format || req.query.format || "csv").toLowerCase();
        const type = req.query.type || "assets";
        const rows = await fetchReportRows(type);

        if (format === "csv") {
            const csv = generateCSV(rows);
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename="${type}_report.csv"`);
            return res.status(200).send(csv);
        } else if (format === "excel" || format === "xlsx") {
            const xml = generateExcelXML(rows, `${type.toUpperCase()} Report`);
            res.setHeader("Content-Type", "application/vnd.ms-excel");
            res.setHeader("Content-Disposition", `attachment; filename="${type}_report.xls"`);
            return res.status(200).send(xml);
        } else if (format === "pdf") {
            const pdfBuf = generatePDF(rows, `${type.toUpperCase()} Report`);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="${type}_report.pdf"`);
            return res.status(200).send(pdfBuf);
        } else {
            return res.status(400).json({ error: "Unsupported format. Supported formats: csv, excel, pdf." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/reports/dashboard
const getDashboard = async (req, res) => {
    try {
        const data = await ReportModel.getDashboard();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/reports/assets or /api/reports/assets-by-category
const getAssetReport = async (req, res) => {
    try {
        const data = await ReportModel.getAssetsByCategory();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/reports/assets-by-status
const getAssetsByStatus = async (req, res) => {
    try {
        const data = await ReportModel.getAssetsByStatus();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/reports/assets-by-location
const getAssetsByLocation = async (req, res) => {
    try {
        const data = await ReportModel.getAssetsByLocation();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/reports/assets/value or /api/reports/valuation
const getAssetValue = async (req, res) => {
    try {
        const data = await ReportModel.getAssetValue();
        res.status(200).json(data[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/reports/users
const getUserReport = async (req, res) => {
    try {
        const data = await ReportModel.getUsersByRole();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/reports/maintenance
const getMaintenanceReport = async (req, res) => {
    try {
        const data = await ReportModel.getMaintenanceSummary();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/reports/assignments
const getAssignmentReport = async (req, res) => {
    try {
        const data = await ReportModel.getAssignmentsByDepartment();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/reports/requests
const getRequestReport = async (req, res) => {
    try {
        const data = await ReportModel.getRequestSummary();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/reports/audit
const getAuditReport = async (req, res) => {
    try {
        const data = await ReportModel.getAuditSummary();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
// FINANCE: ASSET FINANCIAL VALUE REPORT
// GET /api/reports/finance/asset-value
// Per-asset: purchase cost, accumulated depreciation, current
// book value, maintenance expenditure + a summary.
// ============================================================
const getAssetFinancialValueReport = async (req, res) => {
    try {
        const [rows, summary] = await Promise.all([
            ReportModel.getAssetFinancialValue(),
            ReportModel.getAssetFinancialValueSummary()
        ]);
        res.status(200).json({
            rows,
            summary: summary[0] || {}
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
// FINANCE: DEPRECIATION REPORT
// GET /api/reports/finance/depreciation
// ============================================================
const getDepreciationReport = async (req, res) => {
    try {
        const rows = await ReportModel.getDepreciationReport();
        res.status(200).json({
            rows,
            count: rows.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
// FINANCE: MAINTENANCE EXPENDITURE REPORT
// GET /api/reports/finance/maintenance-expenditure
// ============================================================
const getMaintenanceExpenditureReport = async (req, res) => {
    try {
        const [rows, summary] = await Promise.all([
            ReportModel.getMaintenanceExpenditure(),
            ReportModel.getMaintenanceExpenditureSummary()
        ]);
        res.status(200).json({
            rows,
            summary: summary[0] || {}
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
// FINANCE: DISPOSAL FINANCIAL REPORT
// GET /api/reports/finance/disposal
// ============================================================
const getDisposalFinancialReport = async (req, res) => {
    try {
        const [rows, summary] = await Promise.all([
            ReportModel.getDisposalFinancialReport(),
            ReportModel.getDisposalFinancialSummary()
        ]);
        res.status(200).json({
            rows,
            summary: summary[0] || {}
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
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
};
