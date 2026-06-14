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
      created_at
    FROM users
    WHERE id = $1
  `;

  console.log("Finding user by ID:", userId);

  const result = await pool.query(query, [userId]);

  console.log("User found:", result.rows[0]);

  return result.rows[0];
}

module.exports = {
    findUserByEmail,
    createUser,
    findUserById
};
