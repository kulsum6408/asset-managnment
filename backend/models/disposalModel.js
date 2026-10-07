const db = require("../config/db");

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

const DisposalModel = {

    // =====================================================
    // GET ALL DISPOSALS
    // =====================================================
    getAll: () =>
        q(
            `
                SELECT
                    d.disposal_id,
                    d.asset_id,
                    d.disposal_date,
                    d.reason,
                    d.status,
                    d.requested_by,
                    d.approved_by,
                    d.review_remarks,
                    d.decision_date,
                    d.book_value,
                    d.accumulated_depreciation,
                    d.disposal_value,
                    d.financial_status,
                    d.payment_status,
                    d.financial_remarks,
                    d.source_maintenance_id,

                    a.asset_name,
                    a.serial_number,
                    a.status AS asset_status,
                    a.location,
                    a.asset_condition,

                    m.description AS maintenance_source_description,
                    m.problem_record AS maintenance_problem,

                    ru.name AS requested_by_name,
                    au.name AS approved_by_name

                FROM disposals d

                LEFT JOIN assets a
                    ON d.asset_id = a.asset_id

                LEFT JOIN maintenance m
                    ON d.source_maintenance_id = m.maintenance_id

                LEFT JOIN users ru
                    ON d.requested_by = ru.user_id

                LEFT JOIN users au
                    ON d.approved_by = au.user_id

                ORDER BY
                    CASE WHEN d.status = 'Pending' THEN 0 ELSE 1 END,
                    d.disposal_date DESC,
                    d.disposal_id DESC
            `
        ),

    // =====================================================
    // GET DISPOSALS WITH 'Pending' STATUS
    // =====================================================
    getPending: () =>
        q(
            `
                SELECT
                    d.disposal_id,
                    d.asset_id,
                    d.disposal_date,
                    d.reason,
                    d.status,
                    d.requested_by,
                    d.approved_by,
                    d.review_remarks,
                    d.decision_date,
                    d.book_value,
                    d.accumulated_depreciation,
                    d.disposal_value,
                    d.financial_status,
                    d.payment_status,
                    d.financial_remarks,
                    d.source_maintenance_id,

                    a.asset_name,
                    a.serial_number,
                    a.status AS asset_status,
                    a.location,
                    a.asset_condition,

                    m.description AS maintenance_source_description,
                    m.problem_record AS maintenance_problem,

                    ru.name AS requested_by_name,
                    au.name AS approved_by_name

                FROM disposals d

                LEFT JOIN assets a
                    ON d.asset_id = a.asset_id

                LEFT JOIN maintenance m
                    ON d.source_maintenance_id = m.maintenance_id

                LEFT JOIN users ru
                    ON d.requested_by = ru.user_id

                LEFT JOIN users au
                    ON d.approved_by = au.user_id

                WHERE d.status = 'Pending'

                ORDER BY d.disposal_date DESC,
                         d.disposal_id DESC
            `
        ),

    // =====================================================
    // GET DISPOSAL BY ID
    // =====================================================
    getById: (disposalId) =>
        q(
            `
                SELECT
                    d.disposal_id,
                    d.asset_id,
                    d.disposal_date,
                    d.reason,
                    d.status,
                    d.requested_by,
                    d.approved_by,
                    d.review_remarks,
                    d.decision_date,
                    d.book_value,
                    d.accumulated_depreciation,
                    d.disposal_value,
                    d.financial_status,
                    d.payment_status,
                    d.financial_remarks,
                    d.source_maintenance_id,

                    a.asset_name,
                    a.serial_number,
                    a.status AS asset_status,
                    a.location,
                    a.asset_condition,

                    m.description AS maintenance_source_description,
                    m.problem_record AS maintenance_problem
                FROM disposals d
                LEFT JOIN assets a
                    ON d.asset_id = a.asset_id
                LEFT JOIN maintenance m
                    ON d.source_maintenance_id = m.maintenance_id
                WHERE d.disposal_id = ?
                LIMIT 1
            `,
            [disposalId]
        ),

    // =====================================================
    // GET DISPOSALS FOR ONE ASSET
    // =====================================================
    getByAssetId: (assetId) =>
        q(
            `
                SELECT
                    d.disposal_id,
                    d.asset_id,
                    d.disposal_date,
                    d.reason,
                    d.status,
                    d.requested_by,
                    d.approved_by,
                    d.review_remarks,
                    d.decision_date,
                    d.book_value,
                    d.accumulated_depreciation,
                    d.disposal_value,
                    d.financial_status,
                    d.payment_status,
                    d.financial_remarks,
                    d.source_maintenance_id,

                    a.asset_name,
                    a.serial_number,
                    a.status AS asset_status,
                    a.location,
                    m.description AS maintenance_source_description,
                    m.problem_record AS maintenance_problem
                FROM disposals d
                LEFT JOIN assets a
                    ON d.asset_id = a.asset_id
                LEFT JOIN maintenance m
                    ON d.source_maintenance_id = m.maintenance_id
                WHERE d.asset_id = ?
                ORDER BY d.disposal_date DESC,
                         d.disposal_id DESC
            `,
            [assetId]
        ),

    // =====================================================
    // CREATE DISPOSAL (as a Pending recommendation)
    // =====================================================
    create: (data) =>
        q(
            `
                INSERT INTO disposals
                (
                    asset_id,
                    disposal_date,
                    reason,
                    status,
                    requested_by,
                    source_maintenance_id
                )
                VALUES (?, ?, ?, 'Pending', ?, ?)
            `,
            [
                data.asset_id,
                data.disposal_date,
                data.reason,
                data.requested_by,
                data.source_maintenance_id || null
            ]
        ),

    // =====================================================
    // CREATE DISPOSAL RECOMMENDATION (Maintenance Officer)
    // Creates a 'Recommended' disposal that carries the asset
    // information onto the Asset Officer's Disposal screen. It is
    // NOT yet visible to managers for approval; the Asset Officer
    // must submit it (see submit) to route it to the manager.
    // =====================================================
    createRecommendation: (data) =>
        q(
            `
                INSERT INTO disposals
                (
                    asset_id,
                    disposal_date,
                    reason,
                    status,
                    requested_by,
                    source_maintenance_id
                )
                VALUES (?, NOW(), ?, 'Recommended', NULL, ?)
            `,
            [
                data.asset_id,
                data.reason,
                data.source_maintenance_id || null
            ]
        ),

    // =====================================================
    // SUBMIT A RECOMMENDED DISPOSAL (Asset Officer)
    // Transitions a Maintenance-recommended disposal ('Recommended')
    // to 'Pending' so it reaches the manager for approval. Records
    // which Asset Officer submitted it and (optionally) an updated
    // disposal reason.
    // =====================================================
    submit: (disposalId, requestedBy, reason) =>
        q(
            `
                UPDATE disposals
                SET
                    status = 'Pending',
                    requested_by = ?,
                    reason = ?
                WHERE disposal_id = ?
                  AND status = 'Recommended'
            `,
            [requestedBy, reason || null, disposalId]
        ),

    // =====================================================
    // APPROVE DISPOSAL (manager decision)
    // =====================================================
    approve: (disposalId, approvedBy, remarks) =>
        q(
            `
                UPDATE disposals
                SET
                    status = 'Approved',
                    approved_by = ?,
                    review_remarks = ?,
                    decision_date = NOW()
                WHERE disposal_id = ?
                  AND status = 'Pending'
            `,
            [approvedBy, remarks || null, disposalId]
        ),

    // =====================================================
    // REJECT DISPOSAL (manager decision)
    // =====================================================
    reject: (disposalId, approvedBy, remarks) =>
        q(
            `
                UPDATE disposals
                SET
                    status = 'Rejected',
                    approved_by = ?,
                    review_remarks = ?,
                    decision_date = NOW()
                WHERE disposal_id = ?
                  AND status = 'Pending'
            `,
            [approvedBy, remarks || null, disposalId]
        ),

    // =====================================================
    // GET CURRENT STATUS
    // =====================================================
    getStatus: (disposalId) =>
        q(
            `
                SELECT
                    d.status,
                    d.requested_by,
                    d.asset_id,
                    a.asset_name,
                    a.purchase_cost,
                    a.salvage_value,
                    a.useful_life_years,
                    a.purchase_date,
                    a.current_book_value,
                    a.accumulated_depreciation
                FROM disposals d
                LEFT JOIN assets a
                    ON d.asset_id = a.asset_id
                WHERE d.disposal_id = ?
                LIMIT 1
            `,
            [disposalId]
        ),

    // =====================================================
    // DELETE DISPOSAL
    // =====================================================
    delete: (disposalId) =>
        q(
            `
                DELETE FROM disposals
                WHERE disposal_id = ?
            `,
            [disposalId]
        ),

    // =====================================================
    // CAPTURE DISPOSAL FINANCIALS ON APPROVAL
    // Manager approve -> finance fields seeded from asset
    // book value so finance can complete the record.
    // =====================================================
    captureFinancials: (disposalId, bookValue, accumulatedDepreciation) =>
        q(
            `
                UPDATE disposals
                SET
                    book_value = ?,
                    accumulated_depreciation = ?,
                    financial_status = 'Pending',
                    payment_status = 'Pending'
                WHERE disposal_id = ?
            `,
            [
                bookValue != null ? bookValue : null,
                accumulatedDepreciation != null ? accumulatedDepreciation : null,
                disposalId
            ]
        ),

    // =====================================================
    // GET APPROVED DISPOSALS FOR FINANCE REVIEW
    // =====================================================
    getFinancialsForFinance: () =>
        q(
            `
                SELECT
                    d.disposal_id,
                    d.asset_id,
                    d.disposal_date,
                    d.reason,
                    d.status,
                    d.method,
                    d.disposed_by,
                    d.notes,
                    d.approved_by,
                    d.decision_date,
                    d.book_value,
                    d.accumulated_depreciation,
                    d.disposal_value,
                    d.financial_status,
                    d.payment_status,
                    d.financial_remarks,
                    d.source_maintenance_id,

                    a.asset_name,
                    a.serial_number,
                    a.purchase_cost,
                    a.salvage_value,
                    a.current_book_value,
                    a.accumulated_depreciation AS asset_accumulated_depreciation,

                    m.description AS maintenance_source_description,

                    au.name AS approved_by_name

                FROM disposals d
                LEFT JOIN assets a
                    ON d.asset_id = a.asset_id
                LEFT JOIN maintenance m
                    ON d.source_maintenance_id = m.maintenance_id
                LEFT JOIN users au
                    ON d.approved_by = au.user_id

                WHERE d.status IN ('Approved', 'Completed')

                ORDER BY d.decision_date DESC, d.disposal_id DESC
            `
        ),

    // =====================================================
    // PROCESS / RECORD DISPOSAL FINANCIALS (FINANCE)
    // =====================================================
    processFinancials: (disposalId, data) =>
        q(
            `
                UPDATE disposals
                SET
                    book_value = ?,
                    accumulated_depreciation = ?,
                    disposal_value = ?,
                    financial_status = ?,
                    payment_status = COALESCE(?, payment_status),
                    financial_remarks = ?
                WHERE disposal_id = ?
                  AND status IN ('Approved', 'Completed')
            `,
            [
                data.book_value != null ? data.book_value : null,
                data.accumulated_depreciation != null ? data.accumulated_depreciation : null,
                data.disposal_value != null ? data.disposal_value : null,
                data.financial_status || "Recorded",
                data.payment_status || null,
                data.financial_remarks || null,
                disposalId
            ]
        )
};

module.exports = DisposalModel;
