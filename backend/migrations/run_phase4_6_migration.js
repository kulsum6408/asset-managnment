require("dotenv").config();
const db = require("../config/db");

const sql1 = `
ALTER TABLE assets 
    ADD COLUMN IF NOT EXISTS warranty_start_date DATE AFTER location,
    ADD COLUMN IF NOT EXISTS warranty_end_date   DATE AFTER warranty_start_date,
    ADD COLUMN IF NOT EXISTS salvage_value       DECIMAL(12,2) DEFAULT 0.00 AFTER purchase_cost;
`;

const sql2 = `
ALTER TABLE maintenance
    ADD COLUMN IF NOT EXISTS maintenance_type ENUM('Preventive','Corrective','Inspection','Upgrade') DEFAULT 'Preventive' AFTER status,
    ADD COLUMN IF NOT EXISTS next_maintenance_date DATE AFTER maintenance_date;
`;

async function run() {
    console.log("Running manual schema migration for Phase 4-6...");
    await new Promise((res, rej) => db.query(sql1, (e) => e ? rej(e) : res()));
    console.log("✅ Added warranty & salvage_value columns to assets table");
    await new Promise((res, rej) => db.query(sql2, (e) => e ? rej(e) : res()));
    console.log("✅ Added maintenance_type & next_maintenance_date columns to maintenance table");
    db.end();
}

run().catch(err => {
    console.error("Migration Error:", err.message);
    db.end();
});
