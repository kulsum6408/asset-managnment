require("dotenv").config();

const bcrypt = require("bcrypt");
const db = require("./config/db");

const email = "assetofficer@assets.com";
const newPassword = "Asset@12345";

const hashPassword = async () => {
  try {
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    db.query(
      `
      UPDATE users
      SET password = ?
      WHERE email = ?
        AND role = 'asset_officer'
      `,
      [hashedPassword, email],
      (error, result) => {
        if (error) {
          console.error(
            "❌ Password update failed:",
            error
          );
          process.exit(1);
        }

        if (result.affectedRows === 0) {
          console.log(
            "❌ Asset Officer account not found."
          );
        } else {
          console.log(
            "✅ Asset Officer password updated successfully."
          );
          console.log(
            "Email:",
            email
          );
          console.log(
            "New Password:",
            newPassword
          );
        }

        db.end();
      }
    );
  } catch (error) {
    console.error(
      "❌ Error:",
      error
    );
    process.exit(1);
  }
};

hashPassword();