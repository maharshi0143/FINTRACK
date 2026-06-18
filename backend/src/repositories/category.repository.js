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


const DEFAULT_CATEGORIES = [
  { name: 'Salary', icon: '💰', color: '#10b981', type: 'income' },
  { name: 'Freelance', icon: '💻', color: '#6366f1', type: 'income' },
  { name: 'Investments', icon: '📈', color: '#06b6d4', type: 'income' },
  { name: 'Other Income', icon: '💵', color: '#84cc16', type: 'income' },
  { name: 'Food & Dining', icon: '🍔', color: '#f43f5e', type: 'expense' },
  { name: 'Transportation', icon: '🚗', color: '#f97316', type: 'expense' },
  { name: 'Shopping', icon: '🛒', color: '#ec4899', type: 'expense' },
  { name: 'Entertainment', icon: '🎬', color: '#8b5cf6', type: 'expense' },
  { name: 'Bills & Utilities', icon: '📄', color: '#eab308', type: 'expense' },
  { name: 'Health', icon: '🏥', color: '#ef4444', type: 'expense' },
  { name: 'Education', icon: '📚', color: '#3b82f6', type: 'expense' },
  { name: 'Other', icon: '📦', color: '#78716c', type: 'expense' },
];

async function createDefaultCategories(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const cat of DEFAULT_CATEGORIES) {
      await client.query(
        "INSERT INTO categories (user_id, name, icon, color, type) VALUES ($1, $2, $3, $4, $5)",
        [userId, cat.name, cat.icon, cat.color, cat.type]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    createDefaultCategories,
};

  