const pool = require('../config/db');

// Create a notification
async function createNotification(userId, title, message) {
    const query = "INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3) RETURNING *";
    const result = await pool.query(query, [userId, title, message]);
    return result.rows[0];
}

// Get notifications
async function getNotifications(userId) {
    const query = "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC";
    const result = await pool.query(query, [userId]);
    return result.rows;
}

// Mark as Read notifications
async function markAsRead(notificationId, userId) {
    const query = `
        UPDATE notifications
        SET
            is_read = TRUE
        WHERE
            id = $1
            AND user_id = $2
        RETURNING *
    `;
    const result = await pool.query(query, [notificationId, userId]);
    return result.rows[0];
}

// Delete a notification by ID
async function deleteNotification(notificationId, userId) {
    const query = "DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *";
    const result = await pool.query(query, [notificationId, userId]);
    return result.rows[0];
}

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    deleteNotification
};
