-- Add preferences column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Create index for better JSON query performance
CREATE INDEX IF NOT EXISTS idx_users_preferences ON users USING gin(preferences);

-- Add comment
COMMENT ON COLUMN users.preferences IS 'User preferences stored as JSON (budget, notifications, AI settings, calendar sync, etc.)';
