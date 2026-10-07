/**
 * Run from backend folder: node diagnose.js
 */
require("dotenv").config();
const db   = require("./db");
const bcrypt = require("bcrypt");

async function q(sql, params = []) {
    return new Promise((res, rej) =>
        db.query(sql, params, (e, r) => e ? rej(e) : res(r))
    );
}

async function run() {
    console.log("\n========================================");
    console.log("  ASSET MANAGEMENT — LOGIN DIAGNOSE");
    console.log("========================================");

    // 1. Show columns in users table
    const cols = await q("SHOW COLUMNS FROM users");
    console.log("\n--- users table columns ---");
    cols.forEach(c => console.log(`  ${c.Field.padEnd(15)} ${c.Type.padEnd(25)} null:${c.Null} default:${c.Default}`));

    // 2. Show all users (no password)
    const users = await q("SELECT user_id, name, email, role, is_active FROM users");
    console.log("\n--- all users ---");
    if (users.length === 0) {
        console.log("  ⚠️  NO USERS IN DATABASE — run: node seed.js");
    } else {
        users.forEach(u =>
            console.log(`  [${u.user_id}] ${u.email.padEnd(38)} role:${u.role.padEnd(22)} active:${u.is_active}`)
        );
    }

    // 3. Test bcrypt for each user against known passwords
    const testPasswords = {
        "admin@assets.com":          "admin123",
        "assetofficer@assets.com":   "officer123",
        "manager@assets.com":        "manager123",
        "finance@assets.com":        "finance123",
        "maintenance@assets.com":    "maintenance123",
        "employee@assets.com":       "employee123",
    };

    console.log("\n--- password check ---");
    for (const [email, pwd] of Object.entries(testPasswords)) {
        const rows = await q("SELECT password, is_active FROM users WHERE email = ?", [email]);
        if (!rows.length) {
            console.log(`  ❌ NOT IN DB:   ${email}`);
            continue;
        }
        const hash = rows[0].password;
        const active = rows[0].is_active;
        const match = await bcrypt.compare(pwd, hash);
        console.log(`  ${match ? "✅" : "❌"} ${email.padEnd(38)} pwd:${pwd.padEnd(18)} hash_ok:${match}  active:${active}`);
    }

    // 4. If no users or passwords wrong — fix automatically
    const broken = [];
    for (const [email, pwd] of Object.entries(testPasswords)) {
        const rows = await q("SELECT password FROM users WHERE email = ?", [email]);
        if (!rows.length || !(await bcrypt.compare(pwd, rows[0].password))) {
            broken.push({ email, pwd });
        }
    }

    if (broken.length > 0) {
        console.log("\n--- AUTO-FIXING broken accounts ---");
        const roleMap = {
            "admin@assets.com":          "admin",
            "assetofficer@assets.com":   "asset_officer",
            "manager@assets.com":        "manager",
            "finance@assets.com":        "finance_officer",
            "maintenance@assets.com":    "maintenance_officer",
            "employee@assets.com":       "employee",
        };
        for (const { email, pwd } of broken) {
            const hash = await bcrypt.hash(pwd, 10);
            const exists = await q("SELECT user_id FROM users WHERE email = ?", [email]);
            if (exists.length > 0) {
                await q("UPDATE users SET password = ?, is_active = 1 WHERE email = ?", [hash, email]);
                console.log(`  🔧 Fixed password: ${email}`);
            } else {
                const name = email.split("@")[0].replace(/([a-z])([A-Z])/g,"$1 $2");
                await q(
                    "INSERT INTO users (name, email, password, role, is_active, created_at) VALUES (?,?,?,?,1,NOW())",
                    [name, email, hash, roleMap[email] || "employee"]
                );
                console.log(`  ➕ Created user:   ${email}`);
            }
        }
        console.log("\n  ✅ All accounts fixed! Try logging in now.");
    } else {
        console.log("\n  ✅ All passwords are correct. Login should work.");
        console.log("  ⚠️  Check if backend server is running on port 5000.");
    }

    console.log("\n--- Login credentials ---");
    Object.entries(testPasswords).forEach(([e,p]) => console.log(`  ${e.padEnd(38)} / ${p}`));
    console.log("========================================\n");

    db.end();
}

run().catch(e => { console.error("\n❌ Error:", e.message); db.end(); });
