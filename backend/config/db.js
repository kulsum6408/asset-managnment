require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection({
    host:     process.env.DB_HOST     || "localhost",
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "233889@ky",
    database: process.env.DB_NAME     || "asset_management"
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1);
    }
    console.log("✅ MySQL Database Connected Successfully");
});

module.exports = db;
