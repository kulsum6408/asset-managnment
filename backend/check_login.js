require("dotenv").config();
const db = require("./db");
const bcrypt = require("bcrypt");

async function run() {
    // 1. Show all users
    const users = await new Promise((res, rej) =>
        db.query("SELECT user_id, name, email, role, is_active FROM users", (e, r) => e ? rej(e) : res(r))
    );

    console.log("\n=== ALL USERS IN DATABASE ===");
    users.forEach(u => console.log(`  [${u.user_id}] ${u.email.padEnd(35)} role: ${u.role.padEnd(20)} active: ${u.is_active}`));

    // 2. Test passwords
    const testCases = [
        { email: "admin@assets.com",        password: "admin123" },
        { email: "assetofficer@assets.com", password: "officer123" },
        { email: "employee@assets.com",     password: "employee123" },
        { email: "manager@assets.com",      password: "manager123" },
    ];

    console.log("\n=== PASSWORD VERIFICATION ===");
    for (const t of testCases) {
        const rows = await new Promise((res, rej) =>
            db.query("SELECT password FROM users WHERE email = ?", [t.email], (e, r) => e ? rej(e) : res(r))
        );
        if (!rows.length) {
            console.log(`  ❌ NOT FOUND: ${t.email}`);
            continue;
        }
        const ok = await bcrypt.compare(t.password, rows[0].password);
        console.log(`  ${ok?"✅":"❌"} ${t.email} / ${t.password} → ${ok?"CORRECT":"WRONG HASH"}`);
    }

    db.end();
}

run().catch(e => { console.error("Error:", e.message); db.end(); });
