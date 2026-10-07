-- =====================================================
-- MIGRATION: Full maintenance-officer workflow
-- Adds inspection / problem / repair-requirements /
-- materials / disposal-recommendation data support and
-- expands the maintenance status enum.
-- Run via a mysql2 Node script (MySQL 8).
-- =====================================================

USE asset_management;

-- ── New columns on maintenance ────────────────────────
SET @c1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='maintenance' AND COLUMN_NAME='inspection_result');
SET @s1 = IF(@c1=0,'ALTER TABLE maintenance ADD COLUMN inspection_result VARCHAR(50) DEFAULT NULL','SELECT 1');
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

SET @c2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='maintenance' AND COLUMN_NAME='problem_record');
SET @s2 = IF(@c2=0,'ALTER TABLE maintenance ADD COLUMN problem_record TEXT DEFAULT NULL','SELECT 1');
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;

SET @c3 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='maintenance' AND COLUMN_NAME='repair_requirements');
SET @s3 = IF(@c3=0,'ALTER TABLE maintenance ADD COLUMN repair_requirements TEXT DEFAULT NULL','SELECT 1');
PREPARE st3 FROM @s3; EXECUTE st3; DEALLOCATE PREPARE st3;

SET @c4 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='maintenance' AND COLUMN_NAME='recommended_disposal');
SET @s4 = IF(@c4=0,'ALTER TABLE maintenance ADD COLUMN recommended_disposal TINYINT(1) DEFAULT 0','SELECT 1');
PREPARE st4 FROM @s4; EXECUTE st4; DEALLOCATE PREPARE st4;

SET @c5 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='maintenance' AND COLUMN_NAME='disposal_recommendation');
SET @s5 = IF(@c5=0,'ALTER TABLE maintenance ADD COLUMN disposal_recommendation TEXT DEFAULT NULL','SELECT 1');
PREPARE st5 FROM @s5; EXECUTE st5; DEALLOCATE PREPARE st5;

SET @c6 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='maintenance' AND COLUMN_NAME='materials_summary');
SET @s6 = IF(@c6=0,'ALTER TABLE maintenance ADD COLUMN materials_summary TEXT DEFAULT NULL','SELECT 1');
PREPARE st6 FROM @s6; EXECUTE st6; DEALLOCATE PREPARE st6;

SET @c7 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='maintenance' AND COLUMN_NAME='repair_keyword');
SET @s7 = IF(@c7=0,'ALTER TABLE maintenance ADD COLUMN repair_keyword VARCHAR(50) DEFAULT NULL','SELECT 1');
PREPARE st7 FROM @s7; EXECUTE st7; DEALLOCATE PREPARE st7;

-- ── Expand status enum (add Under Inspection, Pending Repair, Beyond Repair) ──
SET @hasNew = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='maintenance' AND COLUMN_NAME='status' AND COLUMN_TYPE LIKE '%Under Inspection%');
SET @s8 = IF(@hasNew=0,"ALTER TABLE maintenance MODIFY COLUMN status ENUM('Scheduled','Under Inspection','Pending Repair','In Progress','Completed','Beyond Repair','Cancelled') NOT NULL DEFAULT 'Scheduled'",'SELECT 1');
PREPARE st8 FROM @s8; EXECUTE st8; DEALLOCATE PREPARE st8;

-- ── maintenance_materials table ──────────────────────
SET @t1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='asset_management' AND TABLE_NAME='maintenance_materials');
SET @s9 = IF(@t1=0,'CREATE TABLE maintenance_materials (material_id INT PRIMARY KEY AUTO_INCREMENT, maintenance_id INT NOT NULL, material_name VARCHAR(150) NOT NULL, quantity DECIMAL(10,2) DEFAULT 0, unit VARCHAR(30) DEFAULT NULL, unit_cost DECIMAL(12,2) DEFAULT 0, total_cost DECIMAL(12,2) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (maintenance_id) REFERENCES maintenance(maintenance_id) ON DELETE CASCADE, INDEX idx_mat_maint (maintenance_id))','SELECT 1');
PREPARE st9 FROM @s9; EXECUTE st9; DEALLOCATE PREPARE st9;

SELECT 'Full maintenance migration complete' AS result;