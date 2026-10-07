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

const MaintenanceCostApprovalModel = {

    // =====================================================
    // GET ALL MAINTENANCE COST APPROVALS
    // Shows every maintenance record that has a cost,
    // joined with the approval status.
    // =====================================================
    getAll: () =>
        q(
            `
                SELECT
                    m.maintenance_id,
                    m.asset_id,
                    m.maintenance_date,
                    m.description,
                    m.status AS maintenance_status,
                    m.cost,
                    m.technician_id,

                    a.asset_name,
                    a.serial_number,
                    a.status AS asset_status,

                    tech.name AS technician_name,

                    mca.cost_approval_id,
                    mca.estimated_cost,
                    mca.approved_cost,
                    mca.status AS cost_status,
                    mca.requested_by,
                    mca.approved_by,
                    mca.review_remarks,
                    mca.finance_notified,
                    mca.payment_status,
                    mca.payment_method,
                    mca.paid_at,
                    mca.finance_remarks AS cost_finance_remarks,
                    mca.created_at AS approval_created_at,
                    mca.decision_date AS approval_decision_date,

                    ru.name AS requested_by_name,
                    au.name AS approved_by_name

                FROM maintenance m

                LEFT JOIN assets a
                    ON m.asset_id = a.asset_id

                LEFT JOIN users tech
                    ON m.technician_id = tech.user_id

                LEFT JOIN maintenance_cost_approvals mca
                    ON m.maintenance_id = mca.maintenance_id

                LEFT JOIN users ru
                    ON mca.requested_by = ru.user_id

                LEFT JOIN users au
                    ON mca.approved_by = au.user_id

                WHERE m.cost IS NOT NULL

                ORDER BY
                    CASE WHEN COALESCE(mca.status, 'Pending') = 'Pending' THEN 0 ELSE 1 END,
                    m.maintenance_date DESC
            `
        ),

    // =====================================================
    // GET APPROVED COST APPROVALS (for Finance)
    // =====================================================
    getApprovedForFinance: () =>
        q(
            `
                SELECT
                    mca.cost_approval_id,
                    mca.maintenance_id,
                    mca.estimated_cost,
                    mca.approved_cost,
                    mca.status,
                    mca.review_remarks,
                    mca.approved_by,
                    mca.decision_date,
                    mca.payment_status,
                    mca.payment_method,
                    mca.paid_at,
                    mca.finance_remarks,

                    m.description,
                    m.cost AS maintenance_cost,

                    a.asset_name,
                    a.serial_number,

                    au.name AS approved_by_name

                FROM maintenance_cost_approvals mca

                INNER JOIN maintenance m
                    ON mca.maintenance_id = m.maintenance_id

                LEFT JOIN assets a
                    ON m.asset_id = a.asset_id

                LEFT JOIN users au
                    ON mca.approved_by = au.user_id

                WHERE mca.status = 'Approved'
                  AND mca.finance_notified = 1

                ORDER BY mca.decision_date DESC
            `
        ),

    // =====================================================
    // GET SINGLE APPROVAL BY MAINTENANCE ID
    // =====================================================
    getByMaintenanceId: (maintenanceId) =>
        q(
            `
                SELECT *
                FROM maintenance_cost_approvals
                WHERE maintenance_id = ?
                LIMIT 1
            `,
            [maintenanceId]
        ),

    // =====================================================
    // INSERT / UPSERT AN APPROVAL DECISION
    // If a row already exists it is updated, otherwise
    // a new row is created.
    // =====================================================
    setDecision: (data) =>
        new Promise((resolve, reject) => {
            const checkSql = `
                SELECT cost_approval_id
                FROM maintenance_cost_approvals
                WHERE maintenance_id = ?
                LIMIT 1
            `;

            db.query(checkSql, [data.maintenance_id], (checkError, checkResult) => {
                if (checkError) {
                    return reject(checkError);
                }

                if (checkResult.length) {
                    const updateSql = `
                        UPDATE maintenance_cost_approvals
                        SET
                            estimated_cost = ?,
                            approved_cost = ?,
                            status = ?,
                            requested_by = ?,
                            approved_by = ?,
                            review_remarks = ?,
                            finance_notified = ?,
                            decision_date = NOW()
                        WHERE maintenance_id = ?
                    `;

                    db.query(
                        updateSql,
                        [
                            data.estimated_cost || null,
                            data.approved_cost || null,
                            data.status,
                            data.requested_by || null,
                            data.approved_by || null,
                            data.review_remarks || null,
                            data.finance_notified ? 1 : 0,
                            data.maintenance_id
                        ],
                        (error, result) => error ? reject(error) : resolve(result)
                    );
                } else {
                    const insertSql = `
                        INSERT INTO maintenance_cost_approvals
                        (
                            maintenance_id,
                            estimated_cost,
                            approved_cost,
                            status,
                            requested_by,
                            approved_by,
                            review_remarks,
                            finance_notified,
                            decision_date
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    `;

                    db.query(
                        insertSql,
                        [
                            data.maintenance_id,
                            data.estimated_cost || null,
                            data.approved_cost || null,
                            data.status,
                            data.requested_by || null,
                            data.approved_by || null,
                            data.review_remarks || null,
                            data.finance_notified ? 1 : 0
                        ],
                        (error, result) => error ? reject(error) : resolve(result)
                    );
                }
            });
        }),

    // =====================================================
    // RECORD FINANCE PAYMENT PROCESSING
    // Finance officer marks an approved cost as processed/paid,
    // optionally updating the payment method and remarks.
    // =====================================================
    processPayment: (maintenanceId, data) =>
        q(
            `
                UPDATE maintenance_cost_approvals
                SET
                    payment_status = ?,
                    payment_method = ?,
                    finance_remarks = ?,
                    paid_at = NOW()
                WHERE maintenance_id = ?
                  AND status = 'Approved'
            `,
            [
                data.payment_status || "Pending",
                data.payment_method || null,
                data.finance_remarks || null,
                maintenanceId
            ]
        ),

    // =====================================================
    // GET A SINGLE APPROVAL RECORD BY MAINTENANCE ID
    // (returns payment + decision columns for finance view)
    // =====================================================
    getPaymentByMaintenanceId: (maintenanceId) =>
        q(
            `
                SELECT
                    cost_approval_id,
                    maintenance_id,
                    estimated_cost,
                    approved_cost,
                    status,
                    requested_by,
                    payment_status,
                    payment_method,
                    paid_at,
                    finance_remarks,
                    decision_date
                FROM maintenance_cost_approvals
                WHERE maintenance_id = ?
                LIMIT 1
            `,
            [maintenanceId]
        )
};

module.exports = MaintenanceCostApprovalModel;