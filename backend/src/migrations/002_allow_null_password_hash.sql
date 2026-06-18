-- Allow NULL password_hash for Google-authenticated users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
