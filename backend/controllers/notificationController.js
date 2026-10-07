const NotificationModel = require("../models/notificationModel");

const getMyNotifications = async (req, res) => {
    try {
        const isReadFilter = req.query.is_read !== undefined ? (req.query.is_read === 'true' ? 1 : 0) : null;
        const notifications = await NotificationModel.getByUserId(req.user.user_id, isReadFilter);
        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const sendNotification = async (req, res) => {
    try {
        const { user_id, title, message, type } = req.body;
        if (!user_id || !title || !message)
            return res.status(400).json({ error: "user_id, title, and message are required." });

        const result = await NotificationModel.create({ user_id, title, message, type });
        res.status(201).json({ message: "Notification sent successfully.", notification_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const result = await NotificationModel.markAsRead(req.params.id, req.user.user_id);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Notification not found." });
        res.status(200).json({ message: "Notification marked as read." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await NotificationModel.markAllAsRead(req.user.user_id);
        res.status(200).json({ message: "All notifications marked as read." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const result = await NotificationModel.delete(req.params.id, req.user.user_id);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Notification not found." });
        res.status(200).json({ message: "Notification deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getMyNotifications, sendNotification, markAsRead, markAllAsRead, deleteNotification };
