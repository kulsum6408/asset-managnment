const jwt = require("jsonwebtoken");

const generateToken = (user) => {
    return jwt.sign(
        {
            user_id: user.user_id,
            name:    user.name,
            email:   user.email,
            role:    user.role
        },
        process.env.JWT_SECRET || "asset_management_super_secret_key_2024",
        { expiresIn: "8h" }
    );
};

module.exports = generateToken;
