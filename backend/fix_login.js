require("dotenv").config();
const db = require("./db");
const bcrypt = require("bcrypt");

async function q(sql, params = []) {
    return new Promise((res, rej) =>
        db.query(sql, params, (e, r) => e ? rej(e) : res(r))
    );
}

async function run() {
    console.log("\n========================================");
    console.log("  CHECKING & FIXING LOGIN");
    console.log("========================================\n");

    // Show all users
    const users = await q("SELECT user_id, name, email, role, is_active FROM users");
    console.log("Users in database:");
    if (users.length === 0) {
        console.log("  ⚠️  NO USERS FOUND — inserting now...");
    } else {
        users.forEach(u =>
            console.log(`  [${u.user_id}] ${u.email}  role:${u.role}  active:${u.is_active}`)
        );
    }

    // Force upsert all users with correct hashed passwords
    const accounts = [
        { name: "System Admin",       email: "admin@assets.com",        password: "123456",       role: "admin" },
        { name: "John Manager",       email: "manager@assets.com",      password: "123456",     role: "manager" },
        { name: "Alice Officer",      email: "assetofficer@assets.com", password: "123456",     role: "asset_officer" },
        { name: "Bob Finance",        email: "finance@assets.com",      password: "123456",     role: "finance_officer" },
        { name: "Carol Maintenance",  email: "maintenance@assets.com",  password: "123456", role: "maintenance_officer" },
        { name: "David Employee",     email: "employee@assets.com",     password: "123456",    role: "employee" },
    ];

    console.log("\nFixing accounts...");
    for (const acc of accounts) {
        const hash = await bcrypt.hash(acc.password, 10);
        const existing = await q("SELECT user_id FROM users WHERE email = ?", [acc.email]);

        if (existing.length > 0) {
            await q(
                "UPDATE users SET name=?, password=?, role=?, is_active=1 WHERE email=?",
                [acc.name, hash, acc.role, acc.email]
            );
            console.log(`  ✅ Updated: ${acc.email}`);
        } else {
            await q(
                "INSERT INTO users (name, email, password, role, is_active, created_at) VALUES (?,?,?,?,1,NOW())",
                [acc.name, acc.email, hash, acc.role]
            );
            console.log(`  ➕ Created: ${acc.email}`);
        }
    }

    // Verify
    console.log("\nVerifying passwords...");
    for (const acc of accounts) {
        const row = await q("SELECT password, is_active FROM users WHERE email=?", [acc.email]);
        const ok  = row.length > 0 && await bcrypt.compare(acc.password, row[0].password);
        console.log(`  ${ok ? "✅" : "❌"} ${acc.email.padEnd(38)} / ${acc.password}`);
    }

    console.log("\n========================================");
    console.log("  LOGIN CREDENTIALS");
    console.log("========================================");
    accounts.forEach(a =>
        console.log(`  ${a.email.padEnd(38)} / ${a.password}`)
    );
    console.log("========================================\n");

    db.end();
}

run().catch(e => { console.error("❌ Error:", e.message); db.end(); });
