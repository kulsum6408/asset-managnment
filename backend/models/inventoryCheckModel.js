const db = require("../config/db");

// ============================================================
// HELPER
// ============================================================

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

// ============================================================
// GET ALL INVENTORY CHECKS
// ============================================================

const getAll = async (filters = {}) => {
    let sql = `
        SELECT
            ic.check_id,
            ic.asset_id,
            a.asset_name,
            a.serial_number,
            c.category_name,

            ic.check_year,
            ic.check_date,

            ic.system_status,
            ic.physical_status,

            ic.system_condition,
            ic.physical_condition,

            ic.system_location,
            ic.physical_location,

            ic.discrepancy,
            ic.checked_by,
            u.name AS checked_by_name,

            ic.notes,
            ic.created_at

        FROM inventory_checks ic

        INNER JOIN assets a
            ON ic.asset_id = a.asset_id

        LEFT JOIN categories c
            ON a.category_id = c.category_id

        LEFT JOIN users u
            ON ic.checked_by = u.user_id

        WHERE 1 = 1
    `;

    const params = [];

    if (filters.year) {
        sql += ` AND ic.check_year = ?`;
        params.push(filters.year);
    }

    if (filters.physical_status) {
        sql += ` AND ic.physical_status = ?`;
        params.push(filters.physical_status);
    }

    if (filters.search) {
        sql += `
            AND (
                a.asset_name LIKE ?
                OR a.serial_number LIKE ?
                OR c.category_name LIKE ?
                OR ic.physical_location LIKE ?
            )
        `;

        const search = `%${filters.search}%`;

        params.push(
            search,
            search,
            search,
            search
        );
    }

    sql += `
        ORDER BY ic.check_year DESC,
                 ic.check_date DESC
    `;

    return await query(sql, params);
};

// ============================================================
// GET INVENTORY CHECKS FOR ONE ASSET
// ============================================================

const getByAssetId = async (assetId) => {

    const sql = `
        SELECT
            ic.check_id,
            ic.asset_id,
            a.asset_name,
            a.serial_number,

            ic.check_year,
            ic.check_date,

            ic.system_status,
            ic.physical_status,

            ic.system_condition,
            ic.physical_condition,

            ic.system_location,
            ic.physical_location,

            ic.discrepancy,

            ic.checked_by,
            u.name AS checked_by_name,

            ic.notes,
            ic.created_at

        FROM inventory_checks ic

        INNER JOIN assets a
            ON ic.asset_id = a.asset_id

        LEFT JOIN users u
            ON ic.checked_by = u.user_id

        WHERE ic.asset_id = ?

        ORDER BY ic.check_year DESC,
                 ic.check_date DESC
    `;

    return await query(sql, [assetId]);
};

// ============================================================
// CHECK IF ASSET ALREADY CHECKED THIS YEAR
// ============================================================

const existsForYear = async (assetId, year) => {

    const sql = `
        SELECT check_id
        FROM inventory_checks
        WHERE asset_id = ?
          AND check_year = ?
        LIMIT 1
    `;

    const rows = await query(sql, [assetId, year]);

    return rows.length > 0;
};

// ============================================================
// CREATE INVENTORY CHECK
// ============================================================

const create = async (data) => {

    const sql = `
        INSERT INTO inventory_checks (
            asset_id,
            check_year,
            system_status,
            physical_status,
            system_condition,
            physical_condition,
            system_location,
            physical_location,
            discrepancy,
            checked_by,
            notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        data.asset_id,
        data.check_year,
        data.system_status || null,
        data.physical_status,
        data.system_condition || null,
        data.physical_condition || null,
        data.system_location || null,
        data.physical_location || null,
        data.discrepancy || null,
        data.checked_by,
        data.notes || null
    ];

    return await query(sql, params);
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
    getAll,
    getByAssetId,
    existsForYear,
    create
};