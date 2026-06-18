-- Add UNIQUE constraint on users.email
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_users_email'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);
  END IF;
END $$;

-- Add index on users.email for lookup performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add index on users.google_id for Google OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Add index on users.reset_password_token for forgot-password lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_password_token ON users(reset_password_token);

-- Add index on refresh_tokens.user_id for faster token cleanup
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Add composite index on transactions for budget progress queries (user + type + date)
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date ON transactions(user_id, type, date);

-- Add composite index on categories for analytics JOINs
CREATE INDEX IF NOT EXISTS idx_categories_user_name ON categories(user_id, name);
