/**
 * Utility to hash a password using bcrypt.
 * Usage: node hashpassword.js <password>
 * Example: node hashpassword.js admin123
 */

const bcrypt = require("bcrypt");

const password = process.argv[2];

if (!password) {
    console.log("Usage: node hashpassword.js <password>");
    console.log("Example: node hashpassword.js admin123");
    process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error("Error hashing password:", err.message);
        process.exit(1);
    }
    console.log("\nOriginal Password:", password);
    console.log("Hashed Password:  ", hash);
    console.log("\nCopy the hash above and insert it into your database.");
});
