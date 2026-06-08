-- Update user preferences to include notification_days_before
-- This migration adds default notification preferences

UPDATE users 
SET preferences = jsonb_set(
    COALESCE(preferences, '{}'::jsonb),
    '{notifications}',
    jsonb_build_object(
        'email_enabled', true,
        'push_enabled', true,
        'days_before', 3
    )
)
WHERE preferences->'notifications' IS NULL;

COMMENT ON COLUMN users.preferences IS 'User preferences: {notifications: {email_enabled, push_enabled, days_before}, budget: {...}, ai: {...}}';
