-- =============================================================
-- user.repository
-- =============================================================

-- findUserByEmail
SELECT * FROM users WHERE email = $1;

-- createUser
INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *;

-- findUserById
SELECT id, name, email, currency, timezone, created_at, password_hash FROM users WHERE id = $1;

-- findUserByGoogleId
SELECT * FROM users WHERE google_id = $1;

-- createGoogleUser
INSERT INTO users (name, email, google_id, provider, is_verified) VALUES ($1, $2, $3, 'google', TRUE) RETURNING *;

-- updateResetPasswordToken
UPDATE users SET reset_password_token = $2, reset_password_expires = $3 WHERE id = $1;

-- findUserByResetToken
SELECT * FROM users WHERE reset_password_token = $1;

-- clearResetPasswordToken
UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1;

-- linkGoogleAccount
UPDATE users SET google_id = $2, provider = 'google', is_verified = TRUE WHERE id = $1 RETURNING *;

-- updatePassword
UPDATE users SET password_hash = $2 WHERE id = $1;

-- =============================================================
-- transaction.repository
-- =============================================================

-- createTransaction
INSERT INTO transactions (user_id, title, amount, type, category, date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- getTransactions (filtered, paginated, sorted — ORDER BY built dynamically with whitelist)
SELECT * FROM transactions WHERE user_id = $1
  AND (title ILIKE $2 OR $2 IS NULL)
  AND (type = $3 OR $3 IS NULL)
  AND (category = $4 OR $4 IS NULL)
  AND (date BETWEEN $5 AND $6 OR ($5 IS NULL AND $6 IS NULL))
ORDER BY {safeSortBy} {safeSortOrder}
LIMIT $7 OFFSET $8;

-- getTransactionCount
SELECT COUNT(*) AS total FROM transactions WHERE user_id = $1
  AND (title ILIKE $2 OR $2 IS NULL)
  AND (type = $3 OR $3 IS NULL)
  AND (category = $4 OR $4 IS NULL)
  AND (date >= $5 OR $5 IS NULL)
  AND (date <= $6 OR $6 IS NULL);

-- getTransactionById
SELECT * FROM transactions WHERE id = $1 AND user_id = $2;

-- updateTransaction
UPDATE transactions SET title = $3, amount = $4, type = $5, category = $6, date = $7, notes = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *;

-- deleteTransaction
DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *;

-- =============================================================
-- budget.repository
-- =============================================================

-- createBudget
INSERT INTO budgets (user_id, category, monthly_limit) VALUES ($1, $2, $3) RETURNING *;

-- getBudgets
SELECT * FROM budgets WHERE user_id = $1 ORDER BY category;

-- updateBudget
UPDATE budgets SET category = $3, monthly_limit = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *;

-- deleteBudget
DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *;

-- getBudgetProgress
SELECT
    b.id,
    b.category,
    b.monthly_limit,
    COALESCE(SUM(t.amount), 0) AS spent
FROM budgets b
LEFT JOIN transactions t
    ON b.user_id = t.user_id
    AND (
        b.category = t.category
        OR t.category = (SELECT c.id::text FROM categories c WHERE c.name = b.category AND c.user_id = b.user_id LIMIT 1)
    )
    AND t.type = 'expense'
    AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)
WHERE b.user_id = $1
GROUP BY b.id, b.category, b.monthly_limit
ORDER BY b.category;

-- =============================================================
-- analytics.repository
-- =============================================================

-- getSummary
SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS total_expense
FROM transactions
WHERE user_id = $1;

-- getMonthlyAnalytics
SELECT
    DATE_TRUNC('month', date) AS month,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expense
FROM transactions
WHERE user_id = $1
GROUP BY month
ORDER BY month;

-- getCategoryAnalytics
SELECT
    category,
    COALESCE(SUM(amount), 0) AS total
FROM transactions
WHERE user_id = $1 AND type = 'expense'
GROUP BY category
ORDER BY total DESC;

-- getTopExpenses
SELECT
    title,
    amount,
    category,
    date
FROM transactions
WHERE user_id = $1 AND type = 'expense'
ORDER BY amount DESC
LIMIT 10;

-- =============================================================
-- notification.repository
-- =============================================================

-- createNotification
INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4) RETURNING *;

-- getNotifications
SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC;

-- markAsRead
UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *;

-- deleteNotification
DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *;

-- =============================================================
-- category.repository
-- =============================================================

-- createCategory
INSERT INTO categories (user_id, name, type, icon, color) VALUES ($1, $2, $3, $4, $5) RETURNING *;

-- getCategories
SELECT * FROM categories WHERE user_id = $1 ORDER BY name;

-- updateCategory
UPDATE categories SET name = $3, type = $4, icon = $5, color = $6 WHERE id = $1 AND user_id = $2 RETURNING *;

-- deleteCategory
DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *;

-- =============================================================
-- profile.repository
-- =============================================================

-- getProfile
SELECT id, name, email, currency, timezone, created_at FROM users WHERE id = $1;

-- updateProfile
UPDATE users SET name = $2, currency = $3, timezone = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $1
RETURNING id, name, email, currency, timezone, created_at, updated_at;

-- updatePassword
UPDATE users SET password_hash = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1;

-- deleteProfile (all child tables use ON DELETE CASCADE)
DELETE FROM users WHERE id = $1 RETURNING id;
