require("dotenv").config();
const db = require("../config/db");
const bcrypt = require("bcrypt");

db.query("SELECT * FROM users WHERE email = 'admin@gmail.com'", async (err, rows) => {
    if (err || !rows.length) {
        console.log("User admin@gmail.com not found");
        db.end();
        return;
    }
    const user = rows[0];
    console.log("User details:", { user_id: user.user_id, email: user.email, role: user.role, is_active: user.is_active });

    const testPasswords = ["admin123", "admin", "123456", "password", "Admin123", "admin1234"];
    let matched = false;
    for (const p of testPasswords) {
        const match = await bcrypt.compare(p, user.password);
        if (match) {
            console.log(`MATCH_FOUND for password: "${p}"`);
            matched = true;
            break;
        }
    }
    if (!matched) {
        console.log("NO_MATCH_FOUND for common passwords for admin@gmail.com");
    }
    db.end();
});
