-- =====================================================
-- MIGRATION: Finance Officer module
-- Adds financial columns for depreciation, maintenance
-- cost processing, disposal financials, and reports.
-- Idempotent: each column is only added if missing.
-- =====================================================

USE asset_management;

-- ── ASSETS: depreciation / book value ────────────────
SET @c1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='assets' AND COLUMN_NAME='useful_life_years');
SET @s1 = IF(@c1=0, 'ALTER TABLE assets ADD COLUMN useful_life_years INT DEFAULT NULL', 'SELECT ''useful_life_years exists''');
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

SET @c2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='assets' AND COLUMN_NAME='accumulated_depreciation');
SET @s2 = IF(@c2=0, 'ALTER TABLE assets ADD COLUMN accumulated_depreciation DECIMAL(12,2) DEFAULT 0.00', 'SELECT ''accumulated_depreciation exists''');
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;

SET @c3 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='assets' AND COLUMN_NAME='current_book_value');
SET @s3 = IF(@c3=0, 'ALTER TABLE assets ADD COLUMN current_book_value DECIMAL(12,2) DEFAULT NULL', 'SELECT ''current_book_value exists''');
PREPARE st3 FROM @s3; EXECUTE st3; DEALLOCATE PREPARE st3;

SET @c4 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='assets' AND COLUMN_NAME='salvage_value');
SET @s4 = IF(@c4=0, 'ALTER TABLE assets ADD COLUMN salvage_value DECIMAL(12,2) DEFAULT 0.00', 'SELECT ''salvage_value exists''');
PREPARE st4 FROM @s4; EXECUTE st4; DEALLOCATE PREPARE st4;

-- ── DISPOSALS: disposal financials ───────────────────
SET @c5 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='disposals' AND COLUMN_NAME='book_value');
SET @s5 = IF(@c5=0, 'ALTER TABLE disposals ADD COLUMN book_value DECIMAL(12,2) DEFAULT NULL', 'SELECT ''book_value exists''');
PREPARE st5 FROM @s5; EXECUTE st5; DEALLOCATE PREPARE st5;

SET @c6 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='disposals' AND COLUMN_NAME='accumulated_depreciation');
SET @s6 = IF(@c6=0, 'ALTER TABLE disposals ADD COLUMN accumulated_depreciation DECIMAL(12,2) DEFAULT NULL', 'SELECT ''accul dep exists''');
PREPARE st6 FROM @s6; EXECUTE st6; DEALLOCATE PREPARE st6;

SET @c7 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='disposals' AND COLUMN_NAME='disposal_value');
SET @s7 = IF(@c7=0, 'ALTER TABLE disposals ADD COLUMN disposal_value DECIMAL(12,2) DEFAULT NULL', 'SELECT ''disposal_value exists''');
PREPARE st7 FROM @s7; EXECUTE st7; DEALLOCATE PREPARE st7;

SET @c8 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='disposals' AND COLUMN_NAME='financial_status');
SET @s8 = IF(@c8=0, 'ALTER TABLE disposals ADD COLUMN financial_status VARCHAR(20) DEFAULT NULL', 'SELECT ''financial_status exists''');
PREPARE st8 FROM @s8; EXECUTE st8; DEALLOCATE PREPARE st8;

SET @c9 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='disposals' AND COLUMN_NAME='payment_status');
SET @s9 = IF(@c9=0, 'ALTER TABLE disposals ADD COLUMN payment_status VARCHAR(20) DEFAULT NULL', 'SELECT ''payment_status exists''');
PREPARE st9 FROM @s9; EXECUTE st9; DEALLOCATE PREPARE st9;

SET @c10 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='disposals' AND COLUMN_NAME='financial_remarks');
SET @s10 = IF(@c10=0, 'ALTER TABLE disposals ADD COLUMN financial_remarks TEXT DEFAULT NULL', 'SELECT ''financial_remarks exists''');
PREPARE st10 FROM @s10; EXECUTE st10; DEALLOCATE PREPARE st10;

-- ── MAINTENANCE COST APPROVALS: payment tracking ────
SET @c11 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='maintenance_cost_approvals' AND COLUMN_NAME='payment_status');
SET @s11 = IF(@c11=0, 'ALTER TABLE maintenance_cost_approvals ADD COLUMN payment_status VARCHAR(20) DEFAULT ''Pending''', 'SELECT ''payment_status exists''');
PREPARE st11 FROM @s11; EXECUTE st11; DEALLOCATE PREPARE st11;

SET @c12 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='maintenance_cost_approvals' AND COLUMN_NAME='paid_at');
SET @s12 = IF(@c12=0, 'ALTER TABLE maintenance_cost_approvals ADD COLUMN paid_at DATETIME DEFAULT NULL', 'SELECT ''paid_at exists''');
PREPARE st12 FROM @s12; EXECUTE st12; DEALLOCATE PREPARE st12;

SET @c13 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='maintenance_cost_approvals' AND COLUMN_NAME='payment_method');
SET @s13 = IF(@c13=0, 'ALTER TABLE maintenance_cost_approvals ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL', 'SELECT ''payment_method exists''');
PREPARE st13 FROM @s13; EXECUTE st13; DEALLOCATE PREPARE st13;

SET @c14 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='maintenance_cost_approvals' AND COLUMN_NAME='finance_remarks');
SET @s14 = IF(@c14=0, 'ALTER TABLE maintenance_cost_approvals ADD COLUMN finance_remarks TEXT DEFAULT NULL', 'SELECT ''finance_remarks exists''');
PREPARE st14 FROM @s14; EXECUTE st14; DEALLOCATE PREPARE st14;

-- ── DEPRECIATION HISTORY: salvage value ──────────────
SET @c15 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='depreciation' AND COLUMN_NAME='salvage_value');
SET @s15 = IF(@c15=0, 'ALTER TABLE depreciation ADD COLUMN salvage_value DECIMAL(12,2) DEFAULT 0.00', 'SELECT ''salvage_value exists''');
PREPARE st15 FROM @s15; EXECUTE st15; DEALLOCATE PREPARE st15;

SELECT 'Finance migration completed successfully' AS result;