const db = require("../config/db");

const q = (sql, params = []) =>
    new Promise((res, rej) =>
        db.query(sql, params, (e, r) => e ? rej(e) : res(r))
    );

const ReportModel = {

    getDashboard: async () => {
        const [assets, activeUsers, employeeUsers, requests, assignments, maintenance, byCategory, byLocation, byStatus] = await Promise.all([
            q("SELECT status FROM assets"),
            q("SELECT COUNT(*) AS total FROM users WHERE is_active=1"),
            q("SELECT COUNT(*) AS total FROM users WHERE role='employee' AND is_active=1"),
            q("SELECT status FROM requests"),
            q("SELECT status FROM assignments"),
            q("SELECT status FROM maintenance"),
            q(`
                SELECT c.category_name,
                       COUNT(a.asset_id)             AS total_assets,
                       SUM(a.status='Available')      AS available,
                       SUM(a.status='Assigned')       AS assigned,
                       SUM(a.status='Under Maintenance') AS under_maintenance,
                       SUM(a.status='Disposed')       AS disposed
                FROM assets a
                LEFT JOIN categories c ON a.category_id = c.category_id
                GROUP BY c.category_id, c.category_name
                ORDER BY total_assets DESC
            `),
            q(`
                SELECT COALESCE(NULLIF(TRIM(location), ''), 'Unassigned') AS location,
                       COUNT(asset_id)               AS total_assets,
                       SUM(status='Available')        AS available,
                       SUM(status='Assigned')         AS assigned,
                       SUM(status='Under Maintenance') AS under_maintenance,
                       SUM(status='Disposed')         AS disposed
                FROM assets
                GROUP BY location
                ORDER BY total_assets DESC
            `),
            q(`
                SELECT status, COUNT(*) AS total, SUM(purchase_cost) AS total_value
                FROM assets GROUP BY status ORDER BY total DESC
            `),
        ]);

        return {
            total_assets:        assets.length,
            available_assets:    assets.filter(a => a.status === "Available").length,
            assigned_assets:     assets.filter(a => a.status === "Assigned").length,
            maintenance_assets:  assets.filter(a => a.status === "Under Maintenance").length,
            disposed_assets:     assets.filter(a => a.status === "Disposed").length,
            total_users:         activeUsers[0].total,
            total_active_users:  activeUsers[0].total,
            total_employees:     employeeUsers[0].total,
            pending_requests:    requests.filter(r => r.status === "Pending").length,
            active_assignments:  assignments.filter(a => a.status === "Active").length,
            open_maintenance:    maintenance.filter(m => ["Scheduled", "In Progress"].includes(m.status)).length,
            assets_by_category:  byCategory,
            assets_by_location:  byLocation,
            assets_by_status:    byStatus,
        };
    },

    getAssetsByCategory: () =>
        q(`
            SELECT c.category_name,
                   COUNT(a.asset_id)             AS total_assets,
                   SUM(a.status='Available')      AS available,
                   SUM(a.status='Assigned')       AS assigned,
                   SUM(a.status='Under Maintenance') AS under_maintenance,
                   SUM(a.purchase_cost)           AS total_value
            FROM assets a
            LEFT JOIN categories c ON a.category_id = c.category_id
            GROUP BY c.category_id, c.category_name
            ORDER BY total_assets DESC
        `),

    getAssetsByLocation: () =>
        q(`
            SELECT COALESCE(NULLIF(TRIM(location), ''), 'Unassigned') AS location,
                   COUNT(asset_id)               AS total_assets,
                   SUM(status='Available')        AS available,
                   SUM(status='Assigned')         AS assigned,
                   SUM(status='Under Maintenance') AS under_maintenance,
                   SUM(status='Disposed')         AS disposed,
                   SUM(purchase_cost)             AS total_value
            FROM assets GROUP BY location ORDER BY total_assets DESC
        `),

    getAssetValue: () =>
        q(`
            SELECT SUM(purchase_cost)  AS total_value,
                   COUNT(*)            AS total_assets,
                   AVG(purchase_cost)  AS average_cost,
                   MIN(purchase_cost)  AS min_cost,
                   MAX(purchase_cost)  AS max_cost
            FROM assets WHERE purchase_cost IS NOT NULL
        `),

    // =====================================================
    // FINANCE: ASSET FINANCIAL VALUE (purchase cost,
    // accumulated depreciation, current book value, per asset)
    // =====================================================
    getAssetFinancialValue: () =>
        q(`
            SELECT
                a.asset_id,
                a.asset_name,
                a.serial_number,
                a.category_id,
                c.category_name,
                a.status,
                a.purchase_date,
                a.purchase_cost,
                a.salvage_value,
                a.useful_life_years,
                a.accumulated_depreciation,
                a.current_book_value,
                (
                    SELECT COALESCE(SUM(m.cost), 0)
                    FROM maintenance m
                    WHERE m.asset_id = a.asset_id
                      AND m.cost IS NOT NULL
                ) AS maintenance_expenditure
            FROM assets a
            LEFT JOIN categories c ON a.category_id = c.category_id
            ORDER BY a.asset_name ASC
        `),

    // =====================================================
    // FINANCE: ASSET FINANCIAL VALUE SUMMARY (totals)
    // =====================================================
    getAssetFinancialValueSummary: () =>
        q(`
            SELECT
                COUNT(a.asset_id)                                    AS total_assets,
                COALESCE(SUM(a.purchase_cost), 0)                     AS total_purchase_cost,
                COALESCE(SUM(a.accumulated_depreciation), 0)          AS total_accumulated_depreciation,
                COALESCE(SUM(a.current_book_value), 0)                AS total_current_book_value,
                (
                    SELECT COALESCE(SUM(m.cost), 0)
                    FROM maintenance m
                    WHERE m.cost IS NOT NULL
                )                                                    AS total_maintenance_expenditure
            FROM assets a
        `),

    // =====================================================
    // FINANCE: DEPRECIATION REPORT (history + per-asset)
    // =====================================================
    getDepreciationReport: () =>
        q(`
            SELECT
                d.depreciation_id,
                d.asset_id,
                d.method,
                d.useful_life_years,
                d.rate_percent,
                d.purchase_cost,
                d.salvage_value,
                d.current_value,
                d.total_depreciated,
                d.calculated_at,
                a.asset_name,
                a.serial_number,
                c.category_name
            FROM depreciation d
            LEFT JOIN assets a ON d.asset_id = a.asset_id
            LEFT JOIN categories c ON a.category_id = c.category_id
            ORDER BY d.calculated_at DESC
        `),

    // =====================================================
    // FINANCE: MAINTENANCE EXPENDITURE REPORT
    // Includes approved/paid maintenance cost approvals.
    // =====================================================
    getMaintenanceExpenditure: () =>
        q(`
            SELECT
                m.maintenance_id,
                m.asset_id,
                m.maintenance_date,
                m.description,
                m.status AS maintenance_status,
                m.cost,
                a.asset_name,
                a.serial_number,
                c.category_name,
                CASE
                    WHEN mca.status IS NULL THEN m.cost
                    ELSE COALESCE(mca.approved_cost, m.cost)
                END AS approved_cost,
                mca.status AS cost_approval_status,
                mca.payment_status,
                mca.payment_method,
                mca.paid_at
            FROM maintenance m
            LEFT JOIN assets a ON m.asset_id = a.asset_id
            LEFT JOIN categories c ON a.category_id = c.category_id
            LEFT JOIN maintenance_cost_approvals mca
                ON m.maintenance_id = mca.maintenance_id
            WHERE m.cost IS NOT NULL
            ORDER BY m.maintenance_date DESC
        `),

    // =====================================================
    // FINANCE: MAINTENANCE EXPENDITURE SUMMARY
    // =====================================================
    getMaintenanceExpenditureSummary: () =>
        q(`
            SELECT
                COUNT(*) AS maintenance_count,
                COALESCE(SUM(m.cost), 0) AS total_cost,
                COALESCE(SUM(CASE WHEN m.status = 'Completed' THEN m.cost ELSE 0 END), 0)
                    AS completed_cost,
                COALESCE(SUM(CASE WHEN mca.status = 'Approved' THEN COALESCE(mca.approved_cost, m.cost) ELSE 0 END), 0)
                    AS approved_cost,
                COALESCE(SUM(CASE WHEN mca.payment_status = 'Paid' THEN COALESCE(mca.approved_cost, m.cost) ELSE 0 END), 0)
                    AS paid_cost
            FROM maintenance m
            LEFT JOIN maintenance_cost_approvals mca
                ON m.maintenance_id = mca.maintenance_id
            WHERE m.cost IS NOT NULL
        `),

    // =====================================================
    // FINANCE: DISPOSAL FINANCIAL REPORT
    // =====================================================
    getDisposalFinancialReport: () =>
        q(`
            SELECT
                d.disposal_id,
                d.asset_id,
                d.disposal_date,
                d.reason,
                d.method,
                d.status,
                d.book_value,
                d.accumulated_depreciation,
                d.disposal_value,
                d.financial_status,
                d.payment_status,
                d.financial_remarks,
                a.asset_name,
                a.serial_number,
                a.purchase_cost
            FROM disposals d
            LEFT JOIN assets a ON d.asset_id = a.asset_id
            WHERE d.status = 'Approved'
            ORDER BY d.decision_date DESC, d.disposal_id DESC
        `),

    // =====================================================
    // FINANCE: DISPOSAL FINANCIAL SUMMARY
    // =====================================================
    getDisposalFinancialSummary: () =>
        q(`
            SELECT
                COUNT(*) AS disposal_count,
                COALESCE(SUM(d.book_value), 0) AS total_book_value,
                COALESCE(SUM(d.accumulated_depreciation), 0) AS total_accumulated_depreciation,
                COALESCE(SUM(d.disposal_value), 0) AS total_disposal_value,
                COALESCE(SUM(CASE WHEN d.payment_status = 'Paid' THEN d.disposal_value ELSE 0 END), 0)
                    AS total_proceeds_received
            FROM disposals d
            WHERE d.status = 'Approved'
        `),

    getUsersByRole: () =>
        q(`
            SELECT role, COUNT(*) AS total,
                   SUM(is_active=1) AS active,
                   SUM(is_active=0) AS inactive
            FROM users GROUP BY role ORDER BY total DESC
        `),

    getMaintenanceSummary: () =>
        q(`
            SELECT m.status, COUNT(*) AS total, SUM(m.cost) AS total_cost
            FROM maintenance m GROUP BY m.status
        `),

    getAssignmentsByDepartment: () =>
        q(`
            SELECT u.department,
                   COUNT(a.assignment_id) AS total_assignments,
                   SUM(a.status='Active')   AS active,
                   SUM(a.status='Returned') AS returned
            FROM assignments a
            LEFT JOIN users u ON a.user_id = u.user_id
            GROUP BY u.department ORDER BY total_assignments DESC
        `),

    getRequestSummary: () =>
        q("SELECT status, COUNT(*) AS total FROM requests GROUP BY status"),

    getAssetsByStatus: () =>
        q(`
            SELECT status, COUNT(*) AS total, SUM(purchase_cost) AS total_value
            FROM assets GROUP BY status ORDER BY total DESC
        `),

    getAuditSummary: () =>
        q(`
            SELECT action, entity_type, COUNT(*) AS total
            FROM audit_logs GROUP BY action, entity_type ORDER BY total DESC
        `),
};

module.exports = ReportModel;
