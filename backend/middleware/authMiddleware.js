const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authentication required. Please provide a valid token." });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "asset_management_super_secret_key_2024"
        );

        req.user = {
            user_id: decoded.user_id,
            name:    decoded.name,
            email:   decoded.email,
            role:    decoded.role
        };

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ error: "Invalid token." });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expired. Please login again." });
        }
        return res.status(401).json({ error: "Authentication failed." });
    }
};

module.exports = authenticate;