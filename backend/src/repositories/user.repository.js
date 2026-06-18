const pool = require('../config/db');

// Select user by email
async function findUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
}

// Create new user
async function createUser(name, email, passwordHash) {
    const query = 'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *';
    const result = await pool.query(query, [name, email, passwordHash]);
    return result.rows[0];
}

// Find user by ID
async function findUserById(userId) {

  const query = `
    SELECT
      id,
      name,
      email,
      currency,
      timezone,
      created_at,
      password_hash
    FROM users
    WHERE id = $1
  `;

  const result = await pool.query(query, [userId]);

  return result.rows[0];
}

// Find user by GoogleId
async function findUserByGoogleId(googleId) {
    const query = "SELECT * FROM users WHERE google_id = $1";
    const result = await pool.query(query, [googleId]);
    return result.rows[0];
}

// Create user with Google ID
async function createGoogleUser(
    name,
    email,
    googleId
) {

    const query = `
        INSERT INTO users (
            name,
            email,
            google_id,
            provider,
            is_verified
        )

        VALUES (
            $1,
            $2,
            $3,
            'google',
            TRUE
        )

        RETURNING *
    `;

    const result = await pool.query(
        query,
        [
            name,
            email,
            googleId
        ]
    );
    return result.rows[0];
}


// UpdateResetPasswordToken
async function updateResetPasswordToken(userId, token, expiresAt) {
  const query = `
        UPDATE users

        SET
            reset_password_token = $2,
            reset_password_expires = $3

        WHERE id = $1
    `;

    const result = await pool.query(
        query,
        [
            userId,
            token,
            expiresAt
        ]
    );
    return result.rowCount > 0;
}

// Find user by reset token
async function findUserByResetToken(token) {
    const query = 'SELECT * FROM users WHERE reset_password_token = $1';
    const result = await pool.query(query, [token]);
    return result.rows[0];
}

// Clear reset password token
async function clearResetPasswordToken(userId) {
    const query = 'UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1';
    await pool.query(query, [userId]);
}

// Link Google account to existing user
async function linkGoogleAccount(userId, googleId) {
    const query = `
        UPDATE users
        SET google_id = $2, provider = 'google', is_verified = TRUE
        WHERE id = $1
        RETURNING *
    `;
    const result = await pool.query(query, [userId, googleId]);
    return result.rows[0];
}

// Update password
async function updatePassword(
    userId,
    passwordHash
) {

    const query = `
        UPDATE users

        SET
            password_hash = $2

        WHERE id = $1
    `;

    await pool.query(
        query,
        [
            userId,
            passwordHash
        ]
    );

}

module.exports = {
    findUserByEmail,
    createUser,
    findUserById,
    findUserByGoogleId,
    createGoogleUser,
    findUserByResetToken,
    clearResetPasswordToken,
    linkGoogleAccount,
    updateResetPasswordToken,
    updatePassword
};

