const express = require("express");
const router  = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { register, login, getMe, changePassword } = require("../controllers/authController");

router.post("/register",        register);
router.post("/login",           login);
router.get ("/me",              authenticate, getMe);
router.put ("/change-password", authenticate, changePassword);

module.exports = router;
