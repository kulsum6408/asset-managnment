-- =====================================================
-- MIGRATION: Add missing SRS tables
-- Run this in MySQL after the main schema
-- =====================================================

USE asset_management;

-- ── TRANSFERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transfers (
    transfer_id    INT PRIMARY KEY AUTO_INCREMENT,
    asset_id       INT NOT NULL,
    from_user_id   INT,
    to_user_id     INT,
    from_location  VARCHAR(200),
    to_location    VARCHAR(200),
    transfer_date  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason         TEXT,
    transferred_by INT,
    notes          TEXT,
    FOREIGN KEY (asset_id)       REFERENCES assets(asset_id)  ON DELETE CASCADE,
    FOREIGN KEY (from_user_id)   REFERENCES users(user_id)    ON DELETE SET NULL,
    FOREIGN KEY (to_user_id)     REFERENCES users(user_id)    ON DELETE SET NULL,
    FOREIGN KEY (transferred_by) REFERENCES users(user_id)    ON DELETE SET NULL,
    INDEX idx_asset (asset_id),
    INDEX idx_to_user (to_user_id)
);

-- ── DISPOSALS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disposals (
    disposal_id   INT PRIMARY KEY AUTO_INCREMENT,
    asset_id      INT NOT NULL,
    disposal_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason        TEXT NOT NULL,
    method        ENUM('Sold','Donated','Scrapped','Written Off','Auction') DEFAULT 'Scrapped',
    disposed_by   INT,
    notes         TEXT,
    FOREIGN KEY (asset_id)    REFERENCES assets(asset_id) ON DELETE CASCADE,
    FOREIGN KEY (disposed_by) REFERENCES users(user_id)   ON DELETE SET NULL,
    INDEX idx_asset (asset_id)
);

-- ── DEPRECIATION ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS depreciation (
    depreciation_id  INT PRIMARY KEY AUTO_INCREMENT,
    asset_id         INT NOT NULL,
    method           ENUM('Straight Line','Declining Balance') DEFAULT 'Straight Line',
    useful_life_years INT DEFAULT 5,
    rate_percent     DECIMAL(5,2) DEFAULT 20.00,
    purchase_cost    DECIMAL(12,2),
    current_value    DECIMAL(12,2),
    total_depreciated DECIMAL(12,2),
    calculated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes            TEXT,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE CASCADE,
    INDEX idx_asset (asset_id)
);

-- ── REGISTRATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registrations (
    registration_id   INT PRIMARY KEY AUTO_INCREMENT,
    asset_id          INT NOT NULL,
    registered_by     INT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    purchase_date     DATE,
    purchase_cost     DECIMAL(12,2),
    supplier          VARCHAR(200),
    invoice_number    VARCHAR(100),
    warranty_expiry   DATE,
    asset_condition   ENUM('New','Good','Fair','Poor','Damaged') DEFAULT 'New',
    location          VARCHAR(200),
    notes             TEXT,
    FOREIGN KEY (asset_id)      REFERENCES assets(asset_id) ON DELETE CASCADE,
    FOREIGN KEY (registered_by) REFERENCES users(user_id)   ON DELETE SET NULL,
    INDEX idx_asset (asset_id)
);

-- ── AUDIT LOGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id      INT PRIMARY KEY AUTO_INCREMENT,
    user_id     INT,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   INT,
    details     TEXT,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id)
);

-- ── NOTIFICATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    type            ENUM('info', 'success', 'warning', 'danger') DEFAULT 'info',
    is_read         TINYINT(1) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_is_read (is_read)
);

-- ── INVENTORY VIEW ────────────────────────────────────────
DROP VIEW IF EXISTS inventory;
DROP TABLE IF EXISTS inventory;
CREATE OR REPLACE VIEW inventory AS
SELECT
    a.asset_id,
    a.asset_name,
    c.category_name,
    a.serial_number,
    a.status,
    a.asset_condition,
    a.location,
    a.purchase_cost,
    a.created_at,
    CASE a.status
        WHEN 'Available'        THEN 1
        WHEN 'Assigned'         THEN 0
        WHEN 'Under Maintenance' THEN 0
        WHEN 'Disposed'         THEN 0
        WHEN 'Lost'             THEN 0
        ELSE 0
    END AS is_available
FROM assets a
LEFT JOIN categories c ON a.category_id = c.category_id;


SELECT 'Migration completed successfully' AS result;

