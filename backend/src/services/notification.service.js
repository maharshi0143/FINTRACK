const notificationRepository = require("../repositories/notification.repository");
const { getIO } = require("../socket/socket");

// Create a notification
async function createNotification(
    userId,
    title,
    message
) {

    const notification =
        await notificationRepository
            .createNotification(
                userId,
                title,
                message
            );

    getIO()
    .to(userId)
    .emit(
        'notification',
        notification
    );

    return notification;

}

// Get notifications
async function getNotifications(userId){
    return await notificationRepository.getNotifications(userId);
}

// Mark as Read notifications
async function markAsRead(notificationId, userId){
    return await notificationRepository.markAsRead(notificationId, userId);
}

// Delete a notification by ID
async function deleteNotification(notificationId, userId){
    return await notificationRepository.deleteNotification(notificationId, userId);
}

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    deleteNotification
};