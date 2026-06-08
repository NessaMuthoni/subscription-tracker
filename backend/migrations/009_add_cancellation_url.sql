-- Add cancellation_url to subscriptions table
ALTER TABLE subscriptions ADD COLUMN cancellation_url VARCHAR(500);

-- Add comment for clarity
COMMENT ON COLUMN subscriptions.cancellation_url IS 'URL where users can cancel their subscription on the provider website';
