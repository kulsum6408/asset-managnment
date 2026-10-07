require("dotenv").config();
const db = require("./db");
const bcrypt = require("bcrypt");

// Show all users
db.query("SELECT user_id, name, email, role, is_active, LEFT(password,20) as pw_preview FROM users", async (err, users) => {
    if (err) { console.error("DB Error:", err.message); db.end(); return; }

    console.log("\n=== USERS IN DATABASE ===");
    console.table(users);

    // Test bcrypt match for known passwords
    const testCases = [
        { email: "admin@assets.com",          password: "admin123" },
        { email: "assetofficer@assets.com",   password: "officer123" },
        { email: "employee@assets.com",       password: "employee123" },
    ];

    console.log("\n=== PASSWORD CHECK ===");
    for (const test of testCases) {
        const match = users.find(u => u.email === test.email);
        if (!match) {
            console.log(`❌ User not found: ${test.email}`);
            continue;
        }
        // Get full hash
        db.query("SELECT password FROM users WHERE email = ?", [test.email], async (e, r) => {
            if (e || !r.length) return;
            const ok = await bcrypt.compare(test.password, r[0].password);
            console.log(`${ok ? "✅" : "❌"} ${test.email} / ${test.password} → ${ok ? "MATCH" : "NO MATCH"}`);
        });
    }

    setTimeout(() => db.end(), 2000);
});
