require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./db");

const users = [
    {
        name: "Admin",
        email: "admin@gmail.com",
        password: "admin123",
        role: "Administrator"
    },
    {
        name: "System Admin",
        email: "admin@assets.com",
        password: "admin123",
        role: "admin"
    },
    {
        name: "John Manager",
        email: "manager@assets.com",
        password: "manager123",
        role: "manager"
    },
    {
        name: "Alice Officer",
        email: "assetofficer@assets.com",
        password: "officer123",
        role: "asset_officer"
    },
    {
        name: "Bob Finance",
        email: "finance@assets.com",
        password: "finance123",
        role: "finance_officer"
    },
    {
        name: "Carol Maintenance",
        email: "maintenance@assets.com",
        password: "maintenance123",
        role: "maintenance_officer"
    },
    {
        name: "David Employee",
        email: "employee@assets.com",
        password: "employee123",
        role: "employee"
    },
    {
        name: "warda Employee",
        email: "eve@assets.com",
        password: "employee123",
        role: "employee"
    }
];

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

async function run() {
    console.log("\n=== Password Reset Tool ===\n");

    for (const user of users) {
        const hash = await bcrypt.hash(user.password, 10);

        const existing = await query(
            "SELECT user_id FROM users WHERE email = ?",
            [user.email]
        );

        if (existing.length > 0) {
            await query(
                "UPDATE users SET password = ?, role = ?, is_active = 1 WHERE email = ?",
                [hash, user.role, user.email]
            );

            console.log(`✅ Password reset: ${user.email}`);
        } else {
            await query(
                `INSERT INTO users
                (name, email, password, role, is_active, created_at)
                VALUES (?, ?, ?, ?, 1, NOW())`,
                [user.name, user.email, hash, user.role]
            );

            console.log(`➕ Created user: ${user.email}`);
        }
    }

    console.log("\n=== Users in database ===");

    const all = await query(
        "SELECT user_id, name, email, role, is_active FROM users"
    );

    all.forEach(user => {
        console.log(
            `[${user.user_id}] ${user.name} | ${user.email} | ${user.role} | active: ${user.is_active}`
        );
    });

    console.log("\n✅ Password reset completed successfully.");

    db.end();
}

run().catch(error => {
    console.error("❌ Error:", error.message);
    db.end();
});