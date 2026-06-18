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
            COALESCE(c1.name, c2.name, t.category) AS category,
            SUM(t.amount) AS total
        FROM transactions t
        LEFT JOIN categories c1 ON c1.name = t.category AND c1.user_id = $1
        LEFT JOIN categories c2 ON c2.id::text = t.category AND c2.user_id = $1
        WHERE
            t.user_id = $1
            AND t.type = 'expense'
        GROUP BY COALESCE(c1.name, c2.name, t.category)
        ORDER BY total DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
}

// Get the top-expenses
async function getTopExpenses(userId){
    const query = `
        SELECT
            t.title,
            t.amount,
            COALESCE(c1.name, c2.name, t.category) AS category,
            t.date
        FROM transactions t
        LEFT JOIN categories c1 ON c1.name = t.category AND c1.user_id = $1
        LEFT JOIN categories c2 ON c2.id::text = t.category AND c2.user_id = $1
        WHERE
            t.user_id = $1
            AND t.type = 'expense'
        ORDER BY t.amount DESC
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
