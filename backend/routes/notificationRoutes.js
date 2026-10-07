const express = require("express");
const router  = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { authorize }  = require("../middleware/roleMiddleware");
const {
    getMyNotifications, sendNotification, markAsRead, markAllAsRead, deleteNotification
} = require("../controllers/notificationController");

router.get("/", authenticate, getMyNotifications);
router.put("/read-all", authenticate, markAllAsRead);
router.put("/:id/read", authenticate, markAsRead);
router.delete("/:id", authenticate, deleteNotification);
router.post("/", authenticate, authorize("admin", "manager", "asset_officer"), sendNotification);

module.exports = router;
