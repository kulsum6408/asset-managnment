require("dotenv").config();
const db = require("../config/db");

const columns = [
    "ADD COLUMN received_by INT NULL AFTER reviewed_by",
    "ADD COLUMN received_at TIMESTAMP NULL AFTER received_by",
    "ADD COLUMN inspection_condition VARCHAR(30) DEFAULT 'Good' AFTER received_at",
    "ADD COLUMN inspection_remarks TEXT NULL AFTER inspection_condition"
];

const run = (index) => {
    if (index >= columns.length) {
        console.log("✅ Phase 5 Return Completion Migration Successful.");
        db.end();
        return;
    }

    const column = columns[index];

    db.query(
        `ALTER TABLE return_requests ${column}`,
        (err) => {
            if (err) {
                if (
                    String(err.message).includes("Duplicate column name")
                ) {
                    console.log("Skipped (already exists):", column);
                } else {
                    console.error("❌ Migration Error:", err.message);
                    db.end();
                    process.exit(1);
                }
            } else {
                console.log("Added:", column);
            }

            run(index + 1);
        }
    );
};

db.query(
    "SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'return_requests'",
    (err, rows) => {
        if (err) {
            console.error("❌ Could not inspect table:", err.message);
            db.end();
            process.exit(1);
        }
        run(0);
    }
);