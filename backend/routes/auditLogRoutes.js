const express = require("express");
const router  = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { authorize }  = require("../middleware/roleMiddleware");
const { getAllLogs, getLogById } = require("../controllers/auditLogController");

router.get("/", authenticate, authorize("admin", "manager", "asset_officer"), getAllLogs);
router.get("/:id", authenticate, authorize("admin", "manager", "asset_officer"), getLogById);


module.exports = router;
