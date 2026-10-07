/**
 * MIGRATION SCRIPT - Asset Management System
 * ============================================
 * Safely adds missing columns to existing tables.
 * Safe to run multiple times — uses IF NOT EXISTS checks.
 *
 * Usage: node migrate.js
 */

require("dotenv").config();
const db = require("./db");

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

async function columnExists(table, column) {
    const rows = await query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    return rows.length > 0;
}

async function addColumnIfMissing(table, column, definition) {
    const exists = await columnExists(table, column);
    if (exists) {
        console.log(`   ⚠️  Column already exists: ${table}.${column}`);
    } else {
        await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`   ✅ Added column: ${table}.${column}`);
    }
}

async function main() {
    console.log("═══════════════════════════════════════════════════");
    console.log("   Asset Management System — Migration");
    console.log("═══════════════════════════════════════════════════");

    try {
        console.log("\n📋 Migrating users table...");
        await addColumnIfMissing("users", "department",  "VARCHAR(100) DEFAULT NULL");
        await addColumnIfMissing("users", "is_active",   "TINYINT(1) NOT NULL DEFAULT 1");
        await addColumnIfMissing("users", "created_at",  "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

        console.log("\n📋 Migrating assets table...");
        await addColumnIfMissing("assets", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

        console.log("\n📋 Migrating requests table...");
        await addColumnIfMissing("requests", "reason",     "TEXT DEFAULT NULL");
        await addColumnIfMissing("requests", "remarks",    "TEXT DEFAULT NULL");
        await addColumnIfMissing("requests", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

        console.log("\n📋 Migrating assignments table...");
        await addColumnIfMissing("assignments", "assigned_by", "INT DEFAULT NULL");
        await addColumnIfMissing("assignments", "status",      "ENUM('Active','Returned','Overdue') DEFAULT 'Active'");
        await addColumnIfMissing("assignments", "notes",       "TEXT DEFAULT NULL");

        console.log("\n📋 Migrating maintenance table...");
        await addColumnIfMissing("maintenance", "cost",          "DECIMAL(10,2) DEFAULT NULL");
        await addColumnIfMissing("maintenance", "technician_id", "INT DEFAULT NULL");
        await addColumnIfMissing("maintenance", "created_at",    "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

        console.log("\n📋 Migrating returns table...");
        await addColumnIfMissing("returns", "notes",       "TEXT DEFAULT NULL");
        await addColumnIfMissing("returns", "received_by", "INT DEFAULT NULL");

        console.log("\n═══════════════════════════════════════════════════");
        console.log("✅ Migration completed successfully!");
        console.log("   Now run: npm run seed");
        console.log("═══════════════════════════════════════════════════\n");

    } catch (err) {
        console.error("\n❌ Migration failed:", err.message);
    } finally {
        db.end();
    }
}

main();
