require('dotenv').config();

const pool = require('./db');

async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW()');

        console.log('Database connection successful:', result.rows[0]);
    } catch (error) {
        console.error('Database connection failed:');
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

testConnection();