const pool = require('../config/db');

async function createRefreshToken(userId, token, expiresAt) {
    const query = `
        INSERT INTO refresh_tokens (
            user_id,
            token,
            expires_at
        )
        VALUES ($1, $2, $3)
        RETURNING *
    `;

    const result = await pool.query(query, [
        userId,
        token,
        expiresAt
    ]);

    return result.rows[0];
}

async function findRefreshToken(token) {
    const query = `
        SELECT *
        FROM refresh_tokens
        WHERE token = $1
    `;

    const result = await pool.query(query, [token]);

    return result.rows[0];
}

async function deleteRefreshToken(token) {

    const query = `
        DELETE FROM refresh_tokens
        WHERE token = $1
        RETURNING *
    `;

    const result = await pool.query(query, [token]);

    console.log("Deleted rows:", result.rowCount);
    console.log("Deleted token:", result.rows[0]);

    return result.rows[0];
}

module.exports = {
    createRefreshToken,
    findRefreshToken,
    deleteRefreshToken
};