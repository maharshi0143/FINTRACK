const pool = require('../config/db');

// Get analytics summary
async function getSummary(userId){
    const query = "SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS total_income, COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS total_expense FROM transactions WHERE user_id = $1";
    const result = await pool.query(query, [userId]);
    return result.rows[0];
}


// Get monthly analytics summary
async function getMonthlyAnalytics(userId){
    const query = `
        SELECT

            DATE_TRUNC(
                'month',
                date
            ) AS month,
            COALESCE(
                SUM(
                    CASE
                        WHEN type = 'income'
                        THEN amount
                    END
                ),
                0
            ) AS income,
            COALESCE(
                SUM(
                    CASE
                        WHEN type = 'expense'
                        THEN amount
                    END
                ),
                0
            ) AS expense
        FROM transactions
        WHERE user_id = $1
        GROUP BY month
        ORDER BY month
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
}

// Get category analytics summary
async function getCategoryAnalytics(userId) {
    const query = `
        SELECT
            category,
            SUM(amount) AS total
        FROM transactions

        WHERE
            user_id = $1
            AND type = 'expense'
        GROUP BY category
        ORDER BY total DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
}

// Get the top-expenses
async function getTopExpenses(userId){
    const query = `
        SELECT
            title,
            amount
        FROM transactions
        WHERE
            user_id = $1
            AND type = 'expense'
        ORDER BY amount DESC
        LIMIT 5
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
}

module.exports = {
    getSummary,
    getMonthlyAnalytics,
    getCategoryAnalytics,
    getTopExpenses
};
