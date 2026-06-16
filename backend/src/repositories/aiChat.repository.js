const pool = require('../config/db');

async function createChat(userId, role, content) {
    const query = 'INSERT INTO ai_chats (user_id, role, content) VALUES ($1, $2, $3) RETURNING *';
    const result = await pool.query(query, [userId, role, content]);
    return result.rows[0];
}

async function getChats(userId, limit = 20) {
    const query = 'SELECT * FROM ai_chats WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2';
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
}

module.exports = {
    createChat,
    getChats
};
