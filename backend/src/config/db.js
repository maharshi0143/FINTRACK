const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
    connectionTimeoutMillis: 120000,
    max: 20,
    idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err.message);
});

const RETRYABLE_CODES = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST'];

const originalQuery = pool.query.bind(pool);
pool.query = async function queryWithRetry(text, params, maxRetries = 2) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await originalQuery(text, params);
        } catch (err) {
            lastError = err;
            const isRetryable = RETRYABLE_CODES.includes(err.code)
                || err.message?.includes('TLS')
                || err.message?.includes('socket')
                || err.message?.includes('timeout');
            if (!isRetryable || attempt === maxRetries) break;
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.warn(`DB query retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${err.message}`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    throw lastError;
};

module.exports = pool;