const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Create a notification
router.post('/', authMiddleware, notificationController.createNotification);

// Get notifications 
router.get('/', authMiddleware, notificationController.getNotifications);

// Mark as Read notifications
router.patch('/:id/read', authMiddleware, notificationController.markAsRead);

// Delete a notification by ID
router.delete('/:id', authMiddleware, notificationController.deleteNotification);

module.exports = router;