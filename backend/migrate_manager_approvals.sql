-- =====================================================
-- MIGRATION: Manager approval workflows
-- Run this in MySQL after the main schema
-- =====================================================

USE asset_management;

-- ── DISPOSALS: add approval workflow columns ──────────
-- status     : Pending / Approved / Rejected
-- requested_by : who submitted the disposal recommendation
-- approved_by  : who approved it (must be a manager)
-- review_remarks: manager's decision notes

SET @has_status   = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='disposals' AND COLUMN_NAME='status');
SET @has_req      = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='disposals' AND COLUMN_NAME='requested_by');
SET @has_appr     = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='disposals' AND COLUMN_NAME='approved_by');
SET @has_remk     = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='disposals' AND COLUMN_NAME='review_remarks');
SET @has_ddate    = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='disposals' AND COLUMN_NAME='decision_date');

SET @stmt1 = IF(@has_status=0, 'ALTER TABLE disposals ADD COLUMN status VARCHAR(20) DEFAULT ''Pending''', 'SELECT ''status exists''');
PREPARE stmt1 FROM @stmt1; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;

SET @stmt2 = IF(@has_req=0, 'ALTER TABLE disposals ADD COLUMN requested_by INT', 'SELECT ''requested_by exists''');
PREPARE stmt2 FROM @stmt2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

SET @stmt3 = IF(@has_appr=0, 'ALTER TABLE disposals ADD COLUMN approved_by INT', 'SELECT ''approved_by exists''');
PREPARE stmt3 FROM @stmt3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

SET @stmt4 = IF(@has_remk=0, 'ALTER TABLE disposals ADD COLUMN review_remarks TEXT', 'SELECT ''review_remarks exists''');
PREPARE stmt4 FROM @stmt4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;

SET @stmt5 = IF(@has_ddate=0, 'ALTER TABLE disposals ADD COLUMN decision_date DATETIME DEFAULT NULL', 'SELECT ''decision_date exists''');
PREPARE stmt5 FROM @stmt5; EXECUTE stmt5; DEALLOCATE PREPARE stmt5;

-- ── MAINTENANCE COST APPROVALS ────────────────────────
-- Stores manager approvals of maintenance costs that are
-- forwarded to the finance officer.
CREATE TABLE IF NOT EXISTS maintenance_cost_approvals (
    cost_approval_id   INT PRIMARY KEY AUTO_INCREMENT,
    maintenance_id     INT NOT NULL,
    estimated_cost     DECIMAL(12,2),
    approved_cost      DECIMAL(12,2),
    status             VARCHAR(20) DEFAULT 'Pending', -- Pending / Approved / Rejected
    requested_by       INT,
    approved_by        INT,
    review_remarks     TEXT,
    finance_notified   TINYINT(1) DEFAULT 0,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decision_date      DATETIME DEFAULT NULL,
    FOREIGN KEY (maintenance_id) REFERENCES maintenance(maintenance_id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by)   REFERENCES users(user_id)  ON DELETE SET NULL,
    FOREIGN KEY (approved_by)    REFERENCES users(user_id)  ON DELETE SET NULL,
    UNIQUE KEY uq_maintenance (maintenance_id),
    INDEX idx_status (status)
);

SELECT 'Manager approval migration completed successfully' AS result;