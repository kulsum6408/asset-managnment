const db = require("../config/db");

const AssetModel = {

    getAll: (filters = {}) => {
        let sql = `
            SELECT a.*, c.category_name
            FROM assets a
            LEFT JOIN categories c ON a.category_id = c.category_id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            sql += " AND a.status = ?";
            params.push(filters.status);
        }
        if (filters.category_id) {
            sql += " AND a.category_id = ?";
            params.push(filters.category_id);
        }
        if (filters.location) {
            sql += " AND a.location = ?";
            params.push(filters.location);
        }
        if (filters.asset_condition) {
            sql += " AND a.asset_condition = ?";
            params.push(filters.asset_condition);
        }
        if (filters.asset_name) {
            sql += " AND a.asset_name LIKE ?";
            params.push(`%${filters.asset_name}%`);
        }
        if (filters.serial_number) {
            sql += " AND a.serial_number LIKE ?";
            params.push(`%${filters.serial_number}%`);
        }
        if (filters.search) {
            const term = `%${filters.search}%`;
            sql += " AND (a.asset_name LIKE ? OR a.serial_number LIKE ? OR a.location LIKE ? OR c.category_name LIKE ?)";
            params.push(term, term, term, term);
        }
        sql += " ORDER BY a.created_at DESC";

        return new Promise((res, rej) =>
            db.query(sql, params, (e, r) => e ? rej(e) : res(r))
        );
    },

    getById: (id) =>
        new Promise((res, rej) =>
            db.query(
                `SELECT a.*, c.category_name
                 FROM assets a
                 LEFT JOIN categories c ON a.category_id = c.category_id
                 WHERE a.asset_id = ?`,
                [id], (e, r) => e ? rej(e) : res(r[0] || null)
            )
        ),

    create: (data) =>
        new Promise((res, rej) =>
            db.query(
                `INSERT INTO assets
                 (asset_name, category_id, serial_number, purchase_date, purchase_cost, salvage_value, warranty_start_date, warranty_end_date, status, asset_condition, location, created_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())`,
                [
                    data.asset_name,
                    data.category_id   || null,
                    data.serial_number || null,
                    data.purchase_date || null,
                    data.purchase_cost || null,
                    data.salvage_value !== undefined && data.salvage_value !== null ? data.salvage_value : 0.00,
                    data.warranty_start_date || null,
                    data.warranty_end_date   || null,
                    data.status         || "Available",
                    data.asset_condition || "Good",
                    data.location       || null
                ],
                (e, r) => e ? rej(e) : res(r)
            )
        ),

    createWithBinCard: (data, userId) =>
        new Promise((resolve, reject) => {
            db.beginTransaction((err) => {
                if (err) return reject(err);

                const insertAssetSql = `
                    INSERT INTO assets
                    (asset_name, category_id, serial_number, purchase_date, purchase_cost, salvage_value, warranty_start_date, warranty_end_date, status, asset_condition, location, created_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())
                `;
                const assetParams = [
                    data.asset_name,
                    data.category_id   || null,
                    data.serial_number || null,
                    data.purchase_date || null,
                    data.purchase_cost || null,
                    data.salvage_value !== undefined && data.salvage_value !== null ? data.salvage_value : 0.00,
                    data.warranty_start_date || null,
                    data.warranty_end_date   || null,
                    data.status         || "Available",
                    data.asset_condition || "Good",
                    data.location       || null
                ];

                db.query(insertAssetSql, assetParams, (err, assetResult) => {
                    if (err) {
                        return db.rollback(() => reject(err));
                    }

                    const assetId = assetResult.insertId;

                    const insertRegSql = `
                        INSERT INTO registrations 
                        (asset_id, registered_by, registration_date, purchase_date, purchase_cost, supplier, invoice_number, warranty_expiry, asset_condition, location, notes)
                        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    const regParams = [
                        assetId,
                        userId || null,
                        data.purchase_date || null,
                        data.purchase_cost || null,
                        data.supplier || null,
                        data.invoice_number || null,
                        data.warranty_expiry || null,
                        data.asset_condition || "Good",
                        data.location || null,
                        data.notes || null
                    ];

                    db.query(insertRegSql, regParams, (err, regResult) => {
                        if (err) {
                            return db.rollback(() => reject(err));
                        }

                        const registrationId = regResult.insertId;

                        const insertBinCardSql = `
                            INSERT INTO bin_card_transactions
                            (asset_id, transaction_type, quantity, reference_type, reference_id, receipt_number, employee_id, performed_by, notes, transaction_date)
                            VALUES (?, 'RECEIPT', ?, 'ASSET_REGISTRATION', ?, ?, NULL, ?, ?, NOW())
                        `;
                        const binCardParams = [
                            assetId,
                            data.quantity || 1,
                            registrationId || assetId,
                            data.receipt_number || data.invoice_number || null,
                            userId || null,
                            data.notes || `Asset "${data.asset_name}" registered into store (RECEIPT)`
                        ];

                        db.query(insertBinCardSql, binCardParams, (err, binCardResult) => {
                            if (err) {
                                return db.rollback(() => reject(err));
                            }

                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => reject(err));
                                }
                                resolve({
                                    insertId: assetId,
                                    asset_id: assetId,
                                    registration_id: registrationId,
                                    transaction_id: binCardResult.insertId
                                });
                            });
                        });
                    });
                });
            });
        }),

    update: (id, data) =>
        new Promise((res, rej) =>
            db.query(
                `UPDATE assets
                 SET asset_name=?, category_id=?, serial_number=?, purchase_date=?,
                     purchase_cost=?, salvage_value=?, warranty_start_date=?, warranty_end_date=?,
                     status=?, asset_condition=?, location=?
                 WHERE asset_id=?`,
                [
                    data.asset_name,
                    data.category_id    || null,
                    data.serial_number  || null,
                    data.purchase_date  || null,
                    data.purchase_cost  || null,
                    data.salvage_value !== undefined && data.salvage_value !== null ? data.salvage_value : 0.00,
                    data.warranty_start_date || null,
                    data.warranty_end_date   || null,
                    data.status          || "Available",
                    data.asset_condition || "Good",
                    data.location        || null,
                    id
                ],
                (e, r) => e ? rej(e) : res(r)
            )
        ),

    updateStatus: (id, status) =>
        new Promise((res, rej) =>
            db.query(
                "UPDATE assets SET status=? WHERE asset_id=?",
                [status, id], (e, r) => e ? rej(e) : res(r)
            )
        ),

    delete: (id) =>
        new Promise((res, rej) =>
            db.query(
                "DELETE FROM assets WHERE asset_id=?",
                [id], (e, r) => e ? rej(e) : res(r)
            )
        ),

    getCategories: () =>
        new Promise((res, rej) =>
            db.query(
                "SELECT * FROM categories ORDER BY category_name",
                (e, r) => e ? rej(e) : res(r)
            )
        ),

    checkCategoryExists: (categoryId) =>
        new Promise((res, rej) =>
            db.query(
                "SELECT category_id FROM categories WHERE category_id = ?",
                [categoryId],
                (e, r) => e ? rej(e) : res(r.length > 0)
            )
        ),

    checkSerialNumberExists: (serialNumber, excludeAssetId = null) => {
        let sql = "SELECT asset_id FROM assets WHERE serial_number = ?";
        const params = [serialNumber];
        
        if (excludeAssetId) {
            sql += " AND asset_id != ?";
            params.push(excludeAssetId);
        }
        
        return new Promise((res, rej) =>
            db.query(sql, params, (e, r) => e ? rej(e) : res(r.length > 0))
        );
    },

    checkAssetReferences: (assetId) =>
        new Promise((res, rej) =>
            db.query(
                `SELECT 
                    (SELECT COUNT(*) FROM requests WHERE asset_id = ?) as request_count,
                    (SELECT COUNT(*) FROM assignments WHERE asset_id = ?) as assignment_count,
                    (SELECT COUNT(*) FROM maintenance WHERE asset_id = ?) as maintenance_count`,
                [assetId, assetId, assetId],
                (e, r) => e ? rej(e) : res(r[0])
            )
        ),

    getWarranties: (type) => {
        let sql = `
            SELECT a.asset_id, a.asset_name, a.serial_number, c.category_name,
                   a.warranty_start_date, a.warranty_end_date, a.status, a.location,
                   DATEDIFF(a.warranty_end_date, CURRENT_DATE()) AS days_remaining
            FROM assets a
            LEFT JOIN categories c ON a.category_id = c.category_id
            WHERE a.warranty_end_date IS NOT NULL
        `;
        if (type === "active") {
            sql += " AND a.warranty_end_date >= CURRENT_DATE()";
        } else if (type === "expired") {
            sql += " AND a.warranty_end_date < CURRENT_DATE()";
        } else if (type === "expiring-soon") {
            sql += " AND a.warranty_end_date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)";
        }
        sql += " ORDER BY a.warranty_end_date ASC";

        return new Promise((res, rej) =>
            db.query(sql, (e, r) => e ? rej(e) : res(r))
        );
    }
};

module.exports = AssetModel;
