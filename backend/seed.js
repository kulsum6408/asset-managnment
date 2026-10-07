/**
 * SEED SCRIPT - Asset Management System
 * ======================================
 * Populates the database with:
 *  - Default categories
 *  - System users (admin, manager, asset_officer, finance_officer, maintenance_officer, employee)
 *  - Sample assets
 *
 * Usage: node seed.js
 */

require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./db");

const SALT_ROUNDS = 10;

// =====================
// CATEGORIES
// =====================
const categories = [
    { category_name: "Computers",         description: "Desktop computers and workstations" },
    { category_name: "Laptops",           description: "Portable computing devices" },
    { category_name: "Monitors",          description: "Display screens and monitors" },
    { category_name: "Printers",          description: "Printing devices and scanners" },
    { category_name: "Networking",        description: "Routers, switches, and networking equipment" },
    { category_name: "Furniture",         description: "Office furniture and fixtures" },
    { category_name: "Vehicles",          description: "Company vehicles and transport" },
    { category_name: "Mobile Devices",    description: "Smartphones and tablets" },
    { category_name: "Software Licenses", description: "Software and application licenses" },
    { category_name: "Other",             description: "Miscellaneous assets" },
];

// =====================
// USERS (plaintext passwords — will be hashed below)
// =====================
const users = [
    {
        name:       "System Admin",
        email:      "admin@assets.com",
        password:   "admin123",
        role:       "admin",
        department: "IT",
    },
    {
        name:       "John Manager",
        email:      "manager@assets.com",
        password:   "manager123",
        role:       "manager",
        department: "Operations",
    },
    {
        name:       "Alice Officer",
        email:      "assetofficer@assets.com",
        password:   "officer123",
        role:       "asset_officer",
        department: "Asset Management",
    },
    {
        name:       "Bob Finance",
        email:      "finance@assets.com",
        password:   "finance123",
        role:       "finance_officer",
        department: "Finance",
    },
    {
        name:       "Carol Tech",
        email:      "maintenance@assets.com",
        password:   "maintenance123",
        role:       "maintenance_officer",
        department: "Maintenance",
    },
    {
        name:       "David Employee",
        email:      "employee@assets.com",
        password:   "employee123",
        role:       "employee",
        department: "Sales",
    },
    {
        name:       "Eve Employee",
        email:      "eve@assets.com",
        password:   "employee123",
        role:       "employee",
        department: "HR",
    },
];

// =====================
// ASSETS (category_name used to look up category_id after insert)
// =====================
const assets = [
    // Computers
    {
        asset_name:     "Dell OptiPlex 7090",
        category_name:  "Computers",
        serial_number:  "DLL-OPT-001",
        purchase_date:  "2023-01-15",
        purchase_cost:  850.00,
        status:         "Available",
        asset_condition:"Good",
        location:       "IT Room A",
    },
    {
        asset_name:     "HP EliteDesk 800 G6",
        category_name:  "Computers",
        serial_number:  "HP-ELT-002",
        purchase_date:  "2023-03-20",
        purchase_cost:  920.00,
        status:         "Assigned",
        asset_condition:"Good",
        location:       "Finance Department",
    },
    {
        asset_name:     "Lenovo ThinkCentre M90",
        category_name:  "Computers",
        serial_number:  "LNV-MNT-003",
        purchase_date:  "2022-11-10",
        purchase_cost:  780.00,
        status:         "Under Maintenance",
        asset_condition:"Fair",
        location:       "HR Department",
    },
    // Laptops
    {
        asset_name:     "Dell Latitude 5520",
        category_name:  "Laptops",
        serial_number:  "DLL-LAT-004",
        purchase_date:  "2023-06-01",
        purchase_cost:  1200.00,
        status:         "Available",
        asset_condition:"New",
        location:       "IT Store",
    },
    {
        asset_name:     "HP EliteBook 840 G8",
        category_name:  "Laptops",
        serial_number:  "HP-ELB-005",
        purchase_date:  "2023-02-14",
        purchase_cost:  1350.00,
        status:         "Assigned",
        asset_condition:"Good",
        location:       "Sales Department",
    },
    {
        asset_name:     "Lenovo ThinkPad T14",
        category_name:  "Laptops",
        serial_number:  "LNV-TPD-006",
        purchase_date:  "2022-08-25",
        purchase_cost:  1100.00,
        status:         "Available",
        asset_condition:"Good",
        location:       "IT Store",
    },
    {
        asset_name:     "MacBook Pro 14-inch",
        category_name:  "Laptops",
        serial_number:  "APL-MBP-007",
        purchase_date:  "2023-07-10",
        purchase_cost:  2200.00,
        status:         "Assigned",
        asset_condition:"New",
        location:       "Design Department",
    },
    // Monitors
    {
        asset_name:     "Dell UltraSharp U2722D",
        category_name:  "Monitors",
        serial_number:  "DLL-MON-008",
        purchase_date:  "2023-01-20",
        purchase_cost:  450.00,
        status:         "Available",
        asset_condition:"Good",
        location:       "IT Store",
    },
    {
        asset_name:     "LG 27UK850-W 4K Monitor",
        category_name:  "Monitors",
        serial_number:  "LG-MON-009",
        purchase_date:  "2022-12-05",
        purchase_cost:  380.00,
        status:         "Assigned",
        asset_condition:"Good",
        location:       "Operations Department",
    },
    {
        asset_name:     "Samsung 27-inch Curved",
        category_name:  "Monitors",
        serial_number:  "SAM-MON-010",
        purchase_date:  "2022-05-17",
        purchase_cost:  300.00,
        status:         "Available",
        asset_condition:"Fair",
        location:       "IT Store",
    },
    // Printers
    {
        asset_name:     "HP LaserJet Pro MFP M428",
        category_name:  "Printers",
        serial_number:  "HP-PRN-011",
        purchase_date:  "2022-09-01",
        purchase_cost:  520.00,
        status:         "Available",
        asset_condition:"Good",
        location:       "Admin Office",
    },
    {
        asset_name:     "Canon PIXMA G7020",
        category_name:  "Printers",
        serial_number:  "CNO-PRN-012",
        purchase_date:  "2023-04-18",
        purchase_cost:  280.00,
        status:         "Assigned",
        asset_condition:"New",
        location:       "HR Department",
    },
    // Networking
    {
        asset_name:     "Cisco Catalyst 2960 Switch",
        category_name:  "Networking",
        serial_number:  "CSC-SWT-013",
        purchase_date:  "2021-11-30",
        purchase_cost:  1800.00,
        status:         "Assigned",
        asset_condition:"Good",
        location:       "Server Room",
    },
    {
        asset_name:     "Ubiquiti UniFi AP AC Pro",
        category_name:  "Networking",
        serial_number:  "UBQ-WAP-014",
        purchase_date:  "2022-03-22",
        purchase_cost:  160.00,
        status:         "Available",
        asset_condition:"Good",
        location:       "IT Store",
    },
    // Furniture
    {
        asset_name:     "Executive Office Desk",
        category_name:  "Furniture",
        serial_number:  "FRN-DSK-015",
        purchase_date:  "2021-06-15",
        purchase_cost:  650.00,
        status:         "Assigned",
        asset_condition:"Good",
        location:       "Manager Office",
    },
    {
        asset_name:     "Ergonomic Office Chair",
        category_name:  "Furniture",
        serial_number:  "FRN-CHR-016",
        purchase_date:  "2022-07-08",
        purchase_cost:  350.00,
        status:         "Available",
        asset_condition:"Good",
        location:       "IT Store",
    },
    // Vehicles
    {
        asset_name:     "Toyota HiLux Pickup",
        category_name:  "Vehicles",
        serial_number:  "VHC-TYT-017",
        purchase_date:  "2021-01-10",
        purchase_cost:  32000.00,
        status:         "Assigned",
        asset_condition:"Good",
        location:       "Company Garage",
    },
    {
        asset_name:     "Ford Transit Van",
        category_name:  "Vehicles",
        serial_number:  "VHC-FRD-018",
        purchase_date:  "2020-08-20",
        purchase_cost:  28000.00,
        status:         "Under Maintenance",
        asset_condition:"Fair",
        location:       "Company Garage",
    },
    // Mobile Devices
    {
        asset_name:     "iPhone 14 Pro",
        category_name:  "Mobile Devices",
        serial_number:  "APL-IPH-019",
        purchase_date:  "2023-05-05",
        purchase_cost:  999.00,
        status:         "Assigned",
        asset_condition:"New",
        location:       "Sales Department",
    },
    {
        asset_name:     "Samsung Galaxy Tab S8",
        category_name:  "Mobile Devices",
        serial_number:  "SAM-TAB-020",
        purchase_date:  "2023-02-28",
        purchase_cost:  750.00,
        status:         "Available",
        asset_condition:"Good",
        location:       "IT Store",
    },
];

// =====================
// HELPERS
// =====================
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

function log(msg) {
    console.log(msg);
}

// =====================
// SEED FUNCTIONS
// =====================
async function seedCategories() {
    log("\n📂 Seeding categories...");
    let inserted = 0;
    let skipped = 0;

    for (const cat of categories) {
        const existing = await query(
            "SELECT category_id FROM categories WHERE category_name = ?",
            [cat.category_name]
        );

        if (existing.length > 0) {
            log(`   ⚠️  Skipped (exists): ${cat.category_name}`);
            skipped++;
        } else {
            await query(
                "INSERT INTO categories (category_name, description) VALUES (?, ?)",
                [cat.category_name, cat.description]
            );
            log(`   ✅ Inserted: ${cat.category_name}`);
            inserted++;
        }
    }

    log(`   → Categories: ${inserted} inserted, ${skipped} skipped`);
}

async function getTableColumns(table) {
    const rows = await query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [table]
    );
    return rows.map((r) => r.COLUMN_NAME);
}

async function seedUsers() {
    log("\n👤 Seeding users...");
    let inserted = 0;
    let skipped = 0;

    // Detect which optional columns exist so we don't fail on older schemas
    const existingCols = await getTableColumns("users");
    const hasDept      = existingCols.includes("department");
    const hasActive    = existingCols.includes("is_active");
    const hasCreatedAt = existingCols.includes("created_at");

    for (const user of users) {
        const existing = await query(
            "SELECT user_id FROM users WHERE email = ?",
            [user.email]
        );

        if (existing.length > 0) {
            log(`   ⚠️  Skipped (exists): ${user.email}`);
            skipped++;
        } else {
            const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

            // Build column list dynamically
            const cols   = ["name", "email", "password", "role"];
            const vals   = [user.name, user.email, hashedPassword, user.role];

            if (hasDept)      { cols.push("department");  vals.push(user.department); }
            if (hasActive)    { cols.push("is_active");   vals.push(1); }
            if (hasCreatedAt) { cols.push("created_at");  vals.push(new Date()); }

            const placeholders = cols.map(() => "?").join(", ");

            await query(
                `INSERT INTO users (${cols.join(", ")}) VALUES (${placeholders})`,
                vals
            );

            log(`   ✅ Inserted: ${user.name} (${user.role}) — email: ${user.email} | password: ${user.password}`);
            inserted++;
        }
    }

    log(`   → Users: ${inserted} inserted, ${skipped} skipped`);
}

async function seedAssets() {
    log("\n🖥️  Seeding assets...");
    let inserted = 0;
    let skipped = 0;

    // Fetch all categories into a map
    const catRows = await query("SELECT category_id, category_name FROM categories");
    const categoryMap = {};
    catRows.forEach((c) => { categoryMap[c.category_name] = c.category_id; });

    for (const asset of assets) {
        const existing = await query(
            "SELECT asset_id FROM assets WHERE serial_number = ?",
            [asset.serial_number]
        );

        if (existing.length > 0) {
            log(`   ⚠️  Skipped (exists): ${asset.asset_name}`);
            skipped++;
        } else {
            const categoryId = categoryMap[asset.category_name] || null;

            await query(
                `INSERT INTO assets
                    (asset_name, category_id, serial_number, purchase_date, purchase_cost, status, asset_condition, location, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    asset.asset_name,
                    categoryId,
                    asset.serial_number,
                    asset.purchase_date,
                    asset.purchase_cost,
                    asset.status,
                    asset.asset_condition,
                    asset.location,
                ]
            );

            log(`   ✅ Inserted: ${asset.asset_name} [${asset.status}] — ${asset.location}`);
            inserted++;
        }
    }

    log(`   → Assets: ${inserted} inserted, ${skipped} skipped`);
}

// =====================
// MAIN
// =====================
async function main() {
    console.log("═══════════════════════════════════════════════════");
    console.log("   Asset Management System — Database Seeder");
    console.log("═══════════════════════════════════════════════════");

    try {
        await seedCategories();
        await seedUsers();
        await seedAssets();

        console.log("\n═══════════════════════════════════════════════════");
        console.log("✅ Seeding completed successfully!");
        console.log("\n📋 Login credentials:");
        users.forEach((u) => {
            console.log(`   [${u.role.padEnd(20)}]  ${u.email.padEnd(30)} | password: ${u.password}`);
        });
        console.log("═══════════════════════════════════════════════════\n");

    } catch (err) {
        console.error("\n❌ Seeding failed:", err.message);
    } finally {
        db.end();
    }
}

main();
