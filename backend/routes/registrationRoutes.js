const express = require("express");
const router  = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { authorize }  = require("../middleware/roleMiddleware");
const {
    getAllRegistrations, getRegistrationById, createRegistration, deleteRegistration
} = require("../controllers/registrationController");

router.get("/", authenticate, getAllRegistrations);
router.get("/:id", authenticate, getRegistrationById);
router.post("/", authenticate, authorize("admin", "manager", "asset_officer"), createRegistration);
router.delete("/:id", authenticate, authorize("admin"), deleteRegistration);

module.exports = router;
