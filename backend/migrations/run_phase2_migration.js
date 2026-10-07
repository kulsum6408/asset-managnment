require("dotenv").config();
const db = require("../config/db");

const sql = `
CREATE TABLE IF NOT EXISTS asset_history (
    history_id     INT PRIMARY KEY AUTO_INCREMENT,
    asset_id       INT NOT NULL,
    user_id        INT,
    action         VARCHAR(100) NOT NULL,
    previous_value TEXT,
    new_value      TEXT,
    description    TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(user_id)  ON DELETE SET NULL,
    INDEX idx_asset (asset_id),
    INDEX idx_created (created_at)
);
`;

db.query(sql, (err, result) => {
    if (err) {
        console.error("❌ Phase 2 Migration Failed:", err.message);
        db.end();
        process.exit(1);
    }
    console.log("✅ Phase 2 Manual Migration Successful: asset_history table created/verified.");
    db.end();
});
