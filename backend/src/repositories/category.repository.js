const pool = require('../config/db');

// Create a category
async function createCategory(userId, name, icon, color, type){
    const query = "INSERT INTO categories (user_id, name, icon, color, type) VALUES ($1, $2, $3, $4, $5) RETURNING *";
    const result = await pool.query(query, [userId, name, icon, color, type]);
    return result.rows[0];
}

// Get all categories
async function getCategories(userId){
    const query = "SELECT * FROM categories WHERE user_id = $1 ORDER BY name ASC";
    const result = await pool.query(query, [userId]);
    return result.rows;
}

// Update a category by ID
async function updateCategory(categoryId, userId, name, icon, color, type){
     const query = `
        UPDATE categories

        SET
            name = $3,
            icon = $4,
            color = $5,
            type = $6,
            updated_at = CURRENT_TIMESTAMP

        WHERE
            id = $1
            AND user_id = $2

        RETURNING *
    `;
    const result = await pool.query(query, [categoryId, userId, name, icon, color, type]);
    return result.rows[0];
}

// Delete a category by ID
async function deleteCategory(categoryId, userId){
    const query = "DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *";
    const result = await pool.query(query, [categoryId, userId]);
    return result.rows[0];
}


module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
};

  