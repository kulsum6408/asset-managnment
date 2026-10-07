const db = require("../config/db");

// =====================================================
// STORE-IN (+) / STORE-OUT (-) CLASSIFICATION
//
// The bin card running balance is the source of truth
// for physical store quantity. Store-in types ADD to the
// balance; store-out types SUBTRACT.
//
// IMPORTANT: keep this array in sync with the SQL literal
// list used in getStoreLevels() below.
// =====================================================
const STORE_IN_TYPES = [
    "RECEIPT", "RECEIPTS", "IN", "RETURN", "RETURNS",
    "MAINTENANCE_RETURN", "MAINTENANCE_IN", "TRANSFER_IN", "INC"
];

const BinCardModel = {

    isStoreIn: (type) => {
        const t = String(type || "").toUpperCase();
        return STORE_IN_TYPES.includes(t);
    },

    // =====================================================
    // GET PER-ASSET STORE LEVELS
    // Returns total received, running store balance and
    // issued quantity for every asset that has a bin card.
    // Available-in-Store per asset = its running balance.
    //
    // NOTE: quantity-aware. A RECEIPT of qty 5 then two
    // OUTs of qty 1 yields store_balance 3, so an asset
    // that received 5 units and has 2 issued still has
    // exactly 3 units physically left in the store.
    // =====================================================
    getStoreLevels: () =>
        new Promise((resolve, reject) => {
            db.query(
                `
                SELECT
                    b.asset_id,
                    SUM(
                        CASE
                            WHEN UPPER(b.transaction_type) IN ('RECEIPT','RECEIPTS','IN','RETURN','RETURNS','MAINTENANCE_RETURN','MAINTENANCE_IN','TRANSFER_IN','INC')
                                THEN b.quantity
                            ELSE -ABS(b.quantity)
                        END
                    ) AS store_balance,
                    SUM(
                        CASE
                            WHEN UPPER(b.transaction_type) IN ('RECEIPT','RECEIPTS','IN','RETURN','RETURNS','MAINTENANCE_RETURN','MAINTENANCE_IN','TRANSFER_IN','INC')
                                THEN b.quantity
                            ELSE 0
                        END
                    ) AS received_qty,
                    SUM(
                        CASE
                            WHEN UPPER(b.transaction_type) IN ('OUT','OUTS','ISSUE','ISSUES','DISPOSAL','DISPOSED','MAINTENANCE_OUT','MAINTENANCE_ISSUE','TRANSFER_OUT')
                                THEN ABS(b.quantity)
                            ELSE 0
                        END
                    ) AS issued_qty
                FROM bin_card_transactions b
                GROUP BY b.asset_id
                `,
                (error, rows) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(rows);
                    }
                }
            );
        }),

    // =====================================================
    // CREATE BIN CARD TRANSACTION
    // =====================================================
    createTransaction: (data) =>
        new Promise((resolve, reject) => {
            db.query(
                `
                INSERT INTO bin_card_transactions
                (
                    asset_id,
                    transaction_type,
                    quantity,
                    reference_type,
                    reference_id,
                    receipt_number,
                    employee_id,
                    performed_by,
                    notes
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    data.asset_id,
                    data.transaction_type,
                    data.quantity || 1,
                    data.reference_type || null,
                    data.reference_id || null,
                    data.receipt_number || null,
                    data.employee_id || null,
                    data.performed_by,
                    data.notes || null
                ],
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
        }),

    // =====================================================
    // GET TRANSACTIONS FOR ONE ASSET (with running balance)
    // =====================================================
    getByAssetId: (assetId) =>
        new Promise((resolve, reject) => {
            db.query(
                `
                SELECT
                    b.*,
                    a.asset_name,
                    a.serial_number,
                    u.name AS employee_name,
                    p.name AS performed_by_name
                FROM bin_card_transactions b
                LEFT JOIN assets a
                    ON b.asset_id = a.asset_id
                LEFT JOIN users u
                    ON b.employee_id = u.user_id
                LEFT JOIN users p
                    ON b.performed_by = p.user_id
                WHERE b.asset_id = ?
                ORDER BY b.transaction_date DESC
                `,
                [assetId],
                (error, rows) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(rows);
                    }
                }
            );
        }),

    // =====================================================
    // GET ALL BIN CARD TRANSACTIONS
    // =====================================================
    getAll: () =>
        new Promise((resolve, reject) => {
            db.query(
                `
                SELECT
                    b.*,
                    a.asset_name,
                    a.serial_number,
                    u.name AS employee_name,
                    p.name AS performed_by_name
                FROM bin_card_transactions b
                LEFT JOIN assets a
                    ON b.asset_id = a.asset_id
                LEFT JOIN users u
                    ON b.employee_id = u.user_id
                LEFT JOIN users p
                    ON b.performed_by = p.user_id
                ORDER BY b.transaction_date DESC
                `,
                (error, rows) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(rows);
                    }
                }
            );
        })
};

module.exports = BinCardModel;
