-- =====================================================
-- MIGRATION: Add approval workflow to transfers table
-- Run this in MySQL after previous migrations
-- =====================================================

USE asset_management;

-- Add approval workflow columns to transfers
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'asset_management'
      AND TABLE_NAME = 'transfers'
      AND COLUMN_NAME = 'status'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE transfers
     ADD COLUMN status ENUM(''Pending'',''Approved'',''Rejected'',''Completed'') DEFAULT ''Pending'' AFTER notes,
     ADD COLUMN approved_by INT NULL AFTER status,
     ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by,
     ADD COLUMN rejection_reason TEXT NULL AFTER approved_at,
     ADD COLUMN completed_at TIMESTAMP NULL AFTER rejection_reason,
     ADD FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL',
    'SELECT ''transfers approval columns already exist'' AS result'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrate existing transfer records to 'Completed' status (they were already executed)
UPDATE transfers SET status = 'Completed' WHERE status IS NULL OR status = '';

SELECT 'Transfer approval migration completed' AS result;
