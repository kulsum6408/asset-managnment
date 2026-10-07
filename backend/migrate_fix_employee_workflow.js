require("dotenv").config();
const db = require("./config/db");

const addColumnIfNotExists = (table, column, definition) => {
    return new Promise((resolve, reject) => {
        const checkSql = `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}'`;
        db.query(checkSql, (err, rows) => {
            if (err) return reject(err);
            if (rows[0].c > 0) {
                console.log(`Skipped (already exists): ${table}.${column}`);
                return resolve();
            }
            const alterSql = `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`;
            db.query(alterSql, (err2) => {
                if (err2) return reject(err2);
                console.log(`✅ Added ${table}.${column}`);
                resolve();
            });
        });
    });
};

async function run() {
    try {
        await addColumnIfNotExists("requests", "expected_return_date", "DATE NULL AFTER remarks");
        await addColumnIfNotExists("assignments", "expected_return_date", "DATE NULL AFTER notes");
        console.log("✅ All migrations completed.");
    } catch (err) {
        console.error("❌ Migration error:", err.message);
    }
    db.end();
}

run();
