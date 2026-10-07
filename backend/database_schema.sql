-- =====================================================
-- ASSET MANAGEMENT SYSTEM DATABASE SCHEMA
-- =====================================================

CREATE DATABASE IF NOT EXISTS asset_management;
USE asset_management;

-- =====================
-- USERS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'asset_officer', 'finance_officer', 'maintenance_officer', 'employee') DEFAULT 'employee',
    department VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
);

-- =====================
-- CATEGORIES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- ASSETS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS assets (
    asset_id INT PRIMARY KEY AUTO_INCREMENT,
    asset_name VARCHAR(200) NOT NULL,
    category_id INT,
    serial_number VARCHAR(100) UNIQUE,
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2),
    status ENUM('Available', 'Assigned', 'Under Maintenance', 'Disposed', 'Lost') DEFAULT 'Available',
    asset_condition ENUM('New', 'Good', 'Fair', 'Poor', 'Damaged') DEFAULT 'Good',
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_category (category_id),
    INDEX idx_serial (serial_number)
);

-- =====================
-- REQUESTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS requests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    asset_id INT NOT NULL,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending',
    reason TEXT,
    remarks TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_asset (asset_id),
    INDEX idx_status (status)
);

-- =====================
-- ASSIGNMENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    asset_id INT NOT NULL,
    assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT,
    status ENUM('Active', 'Returned', 'Overdue') DEFAULT 'Active',
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_asset (asset_id),
    INDEX idx_status (status)
);

-- =====================
-- MAINTENANCE TABLE
-- =====================
CREATE TABLE IF NOT EXISTS maintenance (
    maintenance_id INT PRIMARY KEY AUTO_INCREMENT,
    asset_id INT NOT NULL,
    maintenance_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    status ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    cost DECIMAL(10, 2),
    technician_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_asset (asset_id),
    INDEX idx_status (status),
    INDEX idx_technician (technician_id)
);

-- =====================
-- RETURNS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS returns (
    return_id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL UNIQUE,
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    asset_condition ENUM('New', 'Good', 'Fair', 'Poor', 'Damaged') DEFAULT 'Good',
    notes TEXT,
    received_by INT,
    FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    FOREIGN KEY (received_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_assignment (assignment_id)
);
-- =====================================================
-- BIN CARD TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bin_card_transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,

    asset_id INT NOT NULL,

    transaction_type VARCHAR(30) NOT NULL,

    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,

    reference_type VARCHAR(50),

    reference_id INT,

    receipt_number VARCHAR(100),

    employee_id INT,

    performed_by INT,

    notes TEXT,

    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (asset_id)
        REFERENCES assets(asset_id)
        ON DELETE CASCADE,

    FOREIGN KEY (employee_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    FOREIGN KEY (performed_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    INDEX idx_bin_asset (asset_id),

    INDEX idx_bin_type (transaction_type),

    INDEX idx_bin_date (transaction_date),

    INDEX idx_bin_receipt (receipt_number)
);
-- =====================================================
-- SEED DATA (DEFAULT CATEGORIES AND ADMIN USER)
-- =====================================================

-- Insert default categories
INSERT INTO categories (category_name, description) VALUES
('Computers', 'Desktop computers and workstations'),
('Laptops', 'Portable computing devices'),
('Monitors', 'Display screens and monitors'),
('Printers', 'Printing devices and scanners'),
('Networking', 'Routers, switches, and networking equipment'),
('Furniture', 'Office furniture and fixtures'),
('Vehicles', 'Company vehicles and transport'),
('Mobile Devices', 'Smartphones and tablets'),
('Software Licenses', 'Software and application licenses'),
('Other', 'Miscellaneous assets')
ON DUPLICATE KEY UPDATE category_name=category_name;

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (name, email, password, role, department, is_active) VALUES
('System Admin', 'admin@assetmanagement.com', '$2b$10$rQZ8bZv5Y5CJ5nJZ5nJZ5ueKqX5V5V5V5V5V5V5V5V5V5V5V5V5V5u', 'admin', 'IT', 1)
ON DUPLICATE KEY UPDATE email=email;

-- Note: Replace the password hash above with actual bcrypt hash of 'admin123'
-- You can generate it by running: node hashpassword.js

-- =====================================================
-- END OF SCHEMA
-- =====================================================
