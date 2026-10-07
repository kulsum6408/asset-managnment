const express      = require("express");
const router       = express.Router();
const db           = require("../config/db");
const authenticate = require("../middleware/authMiddleware");

// Tiny db helper
const q = (sql, params = []) =>
    new Promise((res, rej) => db.query(sql, params, (e, r) => e ? rej(e) : res(r)));

// =========================================================
// STORE-IN (+) vs STORE-OUT (-) CLASSIFICATION
//
// The bin card running balance is the *source of truth* for
// how many physical units are actually in the store. Store-in
// transaction types ADD quantity; store-out types SUBTRACT it:
//
//     Received 5  -  Issued 2  =  3 units available in store.
//
// Keep in sync with binCardModel.isStoreIn() so the summary
// running balance never diverges from the Bin Card page.
// =========================================================
const isStoreIn = (t) =>
    ["RECEIPT","RECEIPTS","IN","RETURN","RETURNS",
     "MAINTENANCE_RETURN","MAINTENANCE_IN","TRANSFER_IN","INC"]
    .includes(String(t || "").toUpperCase());

const STORE_OUT_SQL = "OUT,OUTS,ISSUE,ISSUES,ISSUED,ISSUANCE,ISSUANCES,DISPOSAL,DISPOSALS,DISPOSED,MAINTENANCE_OUT,MAINTENANCE_ISSUE,TRANSFER_OUT,WRITE_OFF,WRITEOFF,LOST,DEC,DECREASE,REMOVED,EXIT,OUTGOING";

const isStoreOut = (t) => {
    const v = String(t || "").toUpperCase();
    const set = new Set(STORE_OUT_SQL.split(","));
    return set.has(v);
};

/********************************************************
 * GET /api/inventory/summary
 * Overall store inventory metrics + summary counts.
 * Must be registered BEFORE GET /api/inventory.
 ********************************************************/
router.get("/summary", authenticate, async (req, res) => {
    try {
        // =====================================================
        // PER-ASSET STORE QUANTITY (running balance)
        // The bin card running balance is the source of truth
        // for how many physical units are actually in the store:
        //   Received 5  -  Issued 2  =  3 available.
        // =====================================================
        const storeQtyRows = await q(`
            SELECT
                a.asset_id,
                a.status,
                COALESCE(has_bin.has, 'N') AS has_bin,
                COALESCE(has_bin.balance, 0) AS balance
            FROM assets a
            LEFT JOIN (
                SELECT
                    asset_id,
                    'Y' AS has,
                    SUM(
                        CASE
                            WHEN ${isStoreIn("__T")} THEN quantity
                            ELSE -ABS(quantity)
                        END
                    ) AS balance
                FROM bin_card_transactions
                GROUP BY asset_id
            ) has_bin ON a.asset_id = has_bin.asset_id
        `);

// Store-in transaction types (bin card running-balance
// classification) — kept in sync with binCardModel.
const STORE_IN_TYPES = [
    "RECEIPT","RECEIPTS","IN","RETURN","RETURNS",
    "MAINTENANCE_RETURN","MAINTENANCE_IN","TRANSFER_IN","INC"
];
const isStoreIn = (t) =>
    STORE_IN_TYPES.includes(String(t || "").toUpperCase());

const STORE_IN_TYPES = [
    "RECEIPT","RECEIPTS","IN","RETURN","RETURNS",
    "MAINTENANCE_RETURN","MAINTENANCE_IN","TRANSFER_IN","INC"
];

const isStoreIn = (t) =>
    STORE_IN_TYPES.includes(String(t || "").toUpperCase());

router.get("/summary", authenticate, async (req, res) => {
    try {
        // =====================================================
        // PER-ASSET STORE QUANTITY
        // The bin card running balance is the source of truth
        // for how many physical units are actually in the store:
        //     Received 5  -  Issued 2  =  3 available.
        // Assets with status 'Available' but no bin card rows
        // yet are treated as 1 unit in the store (legacy).
        // =====================================================
        const storeRows = await q(`
            SELECT
                a.asset_id,
                a.status,
                COALESCE(bl.balance, 0) AS balance,
                COALESCE(bl.has_row, 0) AS has_row
            FROM assets a
            LEFT JOIN (
                SELECT
                    asset_id,
                    SUM(
                        CASE
                            WHEN ${isStoreIn("__T")} THEN quantity
                            ELSE -ABS(quantity)
                        END
                    ) AS balance,
                    MAX(1) AS has_row
                FROM bin_card_transactions
                GROUP BY asset_id
            ) bl ON a.asset_id = bl.asset_id
        `);
