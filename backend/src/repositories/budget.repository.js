const pool = require('../config/db');

// Create a new budget
async function createBudget(user_id, category, monthly_limit){
    const query = "INSERT INTO budgets (user_id, category, monthly_limit) VALUES ($1, $2, $3) RETURNING *";

    const result = await pool.query(query, [user_id, category, monthly_limit]);
    return result.rows[0];
}

// Get all budgets
async function getBudgets(user_id){
    const query = "SELECT * FROM budgets WHERE user_id = $1 ORDER BY category";
    const result = await pool.query(query, [user_id]);
    return result.rows;
}

// Update a budget by ID
async function updateBudget(id, user_id, category, monthly_limit){
    const query = "UPDATE budgets SET category = $3, monthly_limit = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *";
    const result = await pool.query(query, [id, user_id, category, monthly_limit]);
    return result.rows[0];
}

// Delete a budget by ID
async function deleteBudget(id, user_id){
    const query = "DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *";
    const result = await pool.query(query, [id, user_id]);
    return result.rows[0];
}

// Get budget progress
async function getBudgetProgress(userId) {

    const query = `
        SELECT

            b.id,
            b.category,

            b.monthly_limit,

            COALESCE(
                SUM(t.amount),
                0
            ) AS spent

        FROM budgets b

        LEFT JOIN transactions t

        ON
            b.user_id = t.user_id
            AND (
                b.category = t.category
                OR t.category = (SELECT c.id::text FROM categories c WHERE c.name = b.category AND c.user_id = b.user_id LIMIT 1)
            )
            AND t.type = 'expense'
            AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)

        WHERE b.user_id = $1

        GROUP BY
            b.id,
            b.category,
            b.monthly_limit

        ORDER BY b.category
    `;

    const result =
        await pool.query(
            query,
            [userId]
        );

    return result.rows;
}

module.exports = {
    createBudget,
    getBudgets,
    updateBudget,
    deleteBudget,
    getBudgetProgress
}