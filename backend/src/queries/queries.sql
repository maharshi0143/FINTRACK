-- =============================================================
-- FINTRACK — ALL SQL QUERIES
-- Organized by repository for easy auditing & optimization
-- =============================================================

-- =============================================================
-- users.repository
-- =============================================================

-- findUserByEmail
SELECT * FROM users WHERE email = $1;

-- createUser
INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *;

-- findUserById
SELECT id, name, email, currency, timezone, created_at, password_hash
FROM users WHERE id = $1;

-- findUserByGoogleId
SELECT * FROM users WHERE google_id = $1;

-- createGoogleUser
INSERT INTO users (name, email, google_id, provider, is_verified)
VALUES ($1, $2, $3, 'google', TRUE)
RETURNING *;

-- updateResetPasswordToken
UPDATE users
SET reset_password_token = $2, reset_password_expires = $3
WHERE id = $1;

-- findUserByResetToken
SELECT * FROM users WHERE reset_password_token = $1;

-- clearResetPasswordToken
UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1;

-- linkGoogleAccount
UPDATE users
SET google_id = $2, provider = 'google', is_verified = TRUE
WHERE id = $1
RETURNING *;

-- updatePassword (user.repository)
UPDATE users SET password_hash = $2 WHERE id = $1;


-- =============================================================
-- transaction.repository
-- =============================================================

-- createTransaction
INSERT INTO transactions (user_id, title, amount, type, category, date, notes)
VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- getTransactions (base)
SELECT * FROM transactions WHERE user_id = $1;

-- getTransactions (optional filters appended dynamically)
-- AND title ILIKE $2
-- AND type = $3
-- AND category = $4
-- AND date BETWEEN $5 AND $6
-- ORDER BY $sortBy $sortOrder LIMIT $limit OFFSET $offset

-- getTransactionCount
SELECT COUNT(*) AS total FROM transactions WHERE user_id = $1;

-- getTransactionById
SELECT * FROM transactions WHERE id = $1 AND user_id = $2;

-- updateTransaction
UPDATE transactions
SET title = $3, amount = $4, type = $5, category = $6, date = $7, notes = $8
WHERE id = $1 AND user_id = $2
RETURNING *;

-- deleteTransaction
DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *;


-- =============================================================
-- refreshToken.repository
-- =============================================================

-- createRefreshToken
INSERT INTO refresh_tokens (user_id, token, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- findRefreshToken
SELECT * FROM refresh_tokens WHERE token = $1;

-- deleteRefreshToken
DELETE FROM refresh_tokens WHERE token = $1 RETURNING *;


-- =============================================================
-- profile.repository
-- =============================================================

-- getProfile
SELECT id, name, email, currency, timezone, created_at
FROM users WHERE id = $1;

-- updateProfile
UPDATE users
SET name = $2, currency = $3, timezone = $4, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id, name, email, currency, timezone, created_at, updated_at;

-- updatePassword (profile.repository)
UPDATE users SET password_hash = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1;

-- deleteUserData (3 queries)
DELETE FROM refresh_tokens WHERE user_id = $1;
DELETE FROM budgets WHERE user_id = $1;
DELETE FROM transactions WHERE user_id = $1;

-- deleteProfile
DELETE FROM users WHERE id = $1 RETURNING id;


-- =============================================================
-- notification.repository
-- =============================================================

-- createNotification
INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3) RETURNING *;

-- getNotifications
SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC;

-- markAsRead
UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *;

-- deleteNotification
DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *;


-- =============================================================
-- category.repository
-- =============================================================

-- createCategory
INSERT INTO categories (user_id, name, icon, color, type) VALUES ($1, $2, $3, $4, $5) RETURNING *;

-- getCategories
SELECT * FROM categories WHERE user_id = $1 ORDER BY name ASC;

-- updateCategory
UPDATE categories
SET name = $3, icon = $4, color = $5, type = $6, updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND user_id = $2
RETURNING *;

-- deleteCategory
DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *;


-- =============================================================
-- budget.repository
-- =============================================================

-- createBudget
INSERT INTO budgets (user_id, category, monthly_limit) VALUES ($1, $2, $3) RETURNING *;

-- getBudgets
SELECT * FROM budgets WHERE user_id = $1 ORDER BY category;

-- updateBudget
UPDATE budgets SET category = $3, monthly_limit = $4 WHERE id = $1 AND user_id = $2 RETURNING *;

-- deleteBudget
DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *;

-- getBudgetProgress
SELECT
    b.category,
    b.monthly_limit,
    COALESCE(SUM(t.amount), 0) AS spent
FROM budgets b
LEFT JOIN transactions t
    ON b.user_id = t.user_id
    AND b.category = t.category
    AND t.type = 'expense'
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
FROM transactions WHERE user_id = $1;

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
SELECT category, SUM(amount) AS total
FROM transactions
WHERE user_id = $1 AND type = 'expense'
GROUP BY category
ORDER BY total DESC;

-- getTopExpenses
SELECT title, amount
FROM transactions
WHERE user_id = $1 AND type = 'expense'
ORDER BY amount DESC
LIMIT 5;


-- =============================================================
-- aiChat.repository
-- =============================================================

-- createChat
INSERT INTO ai_chats (user_id, role, content) VALUES ($1, $2, $3) RETURNING *;

-- getChats
SELECT * FROM ai_chats WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2;


-- =============================================================
-- cron / reminders
-- =============================================================

-- dailyReminder (get users with no expenses today)
SELECT id FROM users WHERE id NOT IN (
    SELECT DISTINCT user_id FROM transactions WHERE date = CURRENT_DATE AND type = 'expense'
);
