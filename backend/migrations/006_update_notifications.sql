-- Add missing columns to notifications table

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT 'Notification',
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'info',
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'low';

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
