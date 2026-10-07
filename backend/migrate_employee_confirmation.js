/**
 * Migration — Adds employee_confirmed_at to maintenance table.
 * Records when the employee confirms/acknowledges receiving a repaired
 * asset back after maintenance completion. NULL = not yet confirmed.
 * Run: node migrate_employee_confirmation.js
 */
require("dotenv").config();
const db = require("./config/db");

const q = (sql, params = []) => new Promise((res, rej) =>
    db.query(sql, params, (e, r) => e ? rej(e) : res(r))
);

async function migrateEmployeeConfirmation() {
    console.log("=== Running Employee Maintenance Confirmation Migration ===");

    try {
        await q("ALTER TABLE maintenance ADD COLUMN employee_confirmed_at TIMESTAMP NULL DEFAULT NULL AFTER repair_keyword");
        console.log("  ✅ Added employee_confirmed_at to maintenance");
    } catch (err) {
        if (String(err.message).includes("Duplicate column name")) {
            console.log("  ℹ️ employee_confirmed_at column already exists");
        } else {
            console.error("  ❌ employee_confirmed_at column check:", err.message);
        }
    }

    console.log("=== Employee Maintenance Confirmation Migration Complete ===\n");
    db.end();
}

migrateEmployeeConfirmation().catch((err) => {
    console.error("Migration error:", err.message);
    db.end();
});
