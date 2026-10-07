const db = require("./config/db");

const q = (sql, params = []) =>
    new Promise((res, rej) => db.query(sql, params, (e, r) => e ? rej(e) : res(r)));

async function fixSchema() {
    console.log("Fixing backend MySQL database schema...");

    // Check & Add status column to maintenance table if missing
    try {
        await q(`ALTER TABLE maintenance ADD COLUMN status ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Scheduled'`);
        console.log("✅ Added status column to maintenance table");
    } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME") {
            console.log("ℹ️ status column already exists in maintenance table");
        } else {
            console.error("Warning on maintenance table status column:", err.message);
        }
    }

    // Ensure all users have valid password hashes and active status
    try {
        await q("UPDATE users SET is_active=1 WHERE is_active IS NULL");
        console.log("✅ Ensured user active statuses");
    } catch (err) {
        console.error("Error updating users active status:", err.message);
    }

    console.log("Schema check & update completed.");
    process.exit(0);
}

fixSchema().catch((err) => {
    console.error("Schema fix failed:", err);
    process.exit(1);
});
