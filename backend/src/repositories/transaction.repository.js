const pool = require('../config/db');

// Creates a new transaction
async function createTransaction(
    userId,
    title,
    amount,
    type,
    category,
    date, 
    notes
){
    const query = 'INSERT INTO transactions (user_id, title, amount, type, category, date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';

    const result = await pool.query(query, [userId, title, amount, type, category, date, notes]);
    return result.rows[0];
}


// Get transactions by user ID
async function getTransactions(
  userId,
  limit,
  offset,
  search,
  type,
  category,
  startDate,
  endDate,
  sortBy,
  sortOrder
) {

  let query = `
    SELECT *
    FROM transactions
    WHERE user_id = $1
  `;

  const values = [userId];
  let parameterIndex = 2;

  if (search) {
    query += `
      AND title ILIKE $${parameterIndex}
    `;
    parameterIndex++;
    values.push(`%${search}%`);
  }

  if (type) {
    query += `
      AND type = $${parameterIndex}
    `;
    values.push(type);
    parameterIndex++;
  }

  if (category) {

    query += `
        AND category = $${parameterIndex}
    `;

    values.push(category);

    parameterIndex++;

    }

    if (startDate && endDate) {

    query += `
        AND date BETWEEN $${parameterIndex}
        AND $${parameterIndex + 1}
    `;

    values.push(startDate);

    values.push(endDate);

    parameterIndex += 2;

    }

  const sortFieldMap = {
    date: 'date',
    amount: 'amount',
    created_at: 'created_at',
  };

  const safeSortBy = sortFieldMap[sortBy] || 'date';
  const safeSortOrder = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

query += `
    ORDER BY ${safeSortBy} ${safeSortOrder}
    LIMIT $${parameterIndex}
    OFFSET $${parameterIndex + 1}
`;

  values.push(limit, offset);

  const result = await pool.query(
    query,
    values
  );

  return result.rows;
}

// Get transaction count
async function getTransactionCount(userId, search, type, category, startDate, endDate){
    let query = "SELECT COUNT(*) As total FROM transactions WHERE user_id = $1";
    const values = [userId];
    let parameterIndex = 2;

    if (search) {
        query += ` AND title ILIKE $${parameterIndex}`;
        values.push(`%${search}%`);
        parameterIndex++;
    }

    if (type) {
        query += ` AND type = $${parameterIndex}`;
        values.push(type);
        parameterIndex++;
    }

    if (category) {
        query += ` AND category = $${parameterIndex}`;
        values.push(category);
        parameterIndex++;
    }

    if (startDate) {
        query += ` AND date >= $${parameterIndex}`;
        values.push(startDate);
        parameterIndex++;
    }

    if (endDate) {
        query += ` AND date <= $${parameterIndex}`;
        values.push(endDate);
        parameterIndex++;
    }

    const result = await pool.query(query, values);
    return result.rows[0].total;
}

// Get transaction by ID
async function getTransactionById(transactionId, userId){
    const query = "SELECT * FROM transactions WHERE id = $1 AND user_id = $2";

    const result = await pool.query(query, [transactionId, userId]);
    return result.rows[0];
}

// Update transaction
async function updateTransaction(transactionId, userId, title, amount, type, category, date, notes){
    const query = "UPDATE transactions SET title = $3, amount = $4, type = $5, category = $6, date = $7, notes = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *";

    const result = await pool.query(query, [transactionId, userId, title, amount, type, category, date, notes]);
    return result.rows[0];
}

// Delete transaction
async function deleteTransaction(transactionId, userId){
    const query = "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *";
    const result = await pool.query(query, [transactionId, userId]);    
    return result.rows[0];
}

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionCount,
    getTransactionById,
    updateTransaction,
    deleteTransaction
};

 