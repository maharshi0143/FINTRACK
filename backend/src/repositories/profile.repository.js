const pool = require('../config/db');

// Get user profile
async function getProfile(userId){
    const query = "SELECT id, name, email, currency, timezone, created_at FROM users WHERE id = $1";

    const result = await pool.query(query, [userId]);

    return result.rows[0];
}

// Update user profile
async function updateProfile(
    userId,
    name,
    currency,
    timezone
) {

    const query = `
        UPDATE users
        SET
            name = $2,
            currency = $3,
            timezone = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING
            id,
            name,
            email,
            currency,
            timezone,
            created_at,
            updated_at
    `;

    const result =
        await pool.query(
            query,
            [
                userId,
                name,
                currency,
                timezone
            ]
        );
    return result.rows[0];
}

// Update password
async function updatePassword(userId, passwordHash) {
    const query = "UPDATE users SET password_hash = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1";

    const result = await pool.query(query, [userId, passwordHash]);
    return result.rowCount > 0;
}

// Delete all user related data
async function deleteUserData(userId) {
    const queries = [
        'DELETE FROM refresh_tokens WHERE user_id = $1',
        'DELETE FROM budgets WHERE user_id = $1',
        'DELETE FROM transactions WHERE user_id = $1',
    ];
    for (const query of queries) {
        await pool.query(query, [userId]);
    }
}

// Delete profile
async function deleteProfile(
    userId
) {

    const query = `
        DELETE FROM users
        WHERE id = $1
        RETURNING id
    `;

    const result =
        await pool.query(
            query,
            [userId]
        );
    return result.rows[0];
}

module.exports = {
    getProfile,
    updateProfile,
    updatePassword,
    deleteUserData,
    deleteProfile
};
