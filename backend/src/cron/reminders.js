const cron = require('node-cron');
const pool = require('../config/db');
const notificationService = require('../services/notification.service');

function startDailyReminder() {
    // Run every day at 8:00 PM
    cron.schedule('0 20 * * *', async () => {
        try {
            const result = await pool.query(
                `SELECT u.id FROM users u WHERE NOT EXISTS (
                    SELECT 1 FROM transactions WHERE user_id = u.id AND date = CURRENT_DATE AND type = 'expense'
                )`
            );
            for (const user of result.rows) {
                await notificationService.createNotification(
                    user.id,
                    'Daily Reminder',
                    "Don't forget to log today's expenses! Keeping track helps you stay on budget."
                );
            }
        } catch (e) {
            console.error('[Cron] Daily reminder failed:', e.message);
        }
    });
}

module.exports = { startDailyReminder };
