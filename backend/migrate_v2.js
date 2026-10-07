/**
 * Migration V2 Script — Adds columns for salvage_value, warranty dates, maintenance_type, and next_maintenance_date
 * Run: node migrate_v2.js
 */
require("dotenv").config();
const db = require("./config/db");

const q = (sql, params = []) => new Promise((res, rej) =>
    db.query(sql, params, (e, r) => e ? rej(e) : res(r))
);

async function migrateV2() {
    console.log("=== Running Migration V2 ===");
    
    // 1. Assets table alterations
    try {
        await q("ALTER TABLE assets ADD COLUMN salvage_value DECIMAL(12,2) DEFAULT 0.00");
        console.log("  ✅ Added salvage_value to assets");
    } catch (err) {
        if (!err.message.includes("Duplicate column name")) console.log("  ℹ️ salvage_value column check:", err.message);
    }

    try {
        await q("ALTER TABLE assets ADD COLUMN warranty_start_date DATE");
        console.log("  ✅ Added warranty_start_date to assets");
    } catch (err) {
        if (!err.message.includes("Duplicate column name")) console.log("  ℹ️ warranty_start_date column check:", err.message);
    }

    try {
        await q("ALTER TABLE assets ADD COLUMN warranty_end_date DATE");
        console.log("  ✅ Added warranty_end_date to assets");
    } catch (err) {
        if (!err.message.includes("Duplicate column name")) console.log("  ℹ️ warranty_end_date column check:", err.message);
    }

    // 2. Maintenance table alterations
    try {
        await q("ALTER TABLE maintenance ADD COLUMN maintenance_type ENUM('Preventive', 'Corrective', 'Inspection', 'Upgrade') DEFAULT 'Preventive'");
        console.log("  ✅ Added maintenance_type to maintenance");
    } catch (err) {
        if (!err.message.includes("Duplicate column name")) console.log("  ℹ️ maintenance_type column check:", err.message);
    }

    try {
        await q("ALTER TABLE maintenance ADD COLUMN next_maintenance_date DATE");
        console.log("  ✅ Added next_maintenance_date to maintenance");
    } catch (err) {
        if (!err.message.includes("Duplicate column name")) console.log("  ℹ️ next_maintenance_date column check:", err.message);
    }

    console.log("=== Migration V2 Complete ===\n");
    db.end();
}

migrateV2().catch((err) => {
    console.error("Migration V2 error:", err.message);
    db.end();
});
