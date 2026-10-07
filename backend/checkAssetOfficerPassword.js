require("dotenv").config();

const bcrypt = require("bcrypt");
const db = require("./config/db");

const email = "assetofficer@assets.com";
const passwordToTest = "Asset@12345";

db.query(
  "SELECT password, role FROM users WHERE email = ?",
  [email],
  async (error, rows) => {
    if (error) {
      console.error("Database error:", error);
      process.exit(1);
    }

    if (!rows.length) {
      console.log("User not found.");
      db.end();
      return;
    }

    const user = rows[0];

    console.log("Role:", user.role);
    console.log(
      "Password hash length:",
      user.password.length
    );

    const matches = await bcrypt.compare(
      passwordToTest,
      user.password
    );

    console.log(
      "Password matches:",
      matches
    );

    db.end();
  }
);