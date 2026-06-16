const cron = require('node-cron');
const pool = require('../config/db');
const notificationService = require('../services/notification.service');

function startDailyReminder() {
    // Run every day at 8:00 PM
    cron.schedule('0 20 * * *', async () => {
        console.log('[Cron] Running daily expense reminder...');
        try {
            const result = await pool.query(
                `SELECT id FROM users WHERE id NOT IN (
                    SELECT DISTINCT user_id FROM transactions WHERE date = CURRENT_DATE AND type = 'expense'
                )`
            );
            for (const user of result.rows) {
                await notificationService.createNotification(
                    user.id,
                    'Daily Reminder',
                    "Don't forget to log today's expenses! Keeping track helps you stay on budget."
                );
            }
            console.log(`[Cron] Sent reminders to ${result.rows.length} users`);
        } catch (e) {
            console.error('[Cron] Daily reminder failed:', e.message);
        }
    });
}

module.exports = { startDailyReminder };
