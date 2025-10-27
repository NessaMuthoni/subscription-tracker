-- Migration: Add payment_method column to subscriptions table
-- This allows tracking which payment method is used for each subscription

ALTER TABLE subscriptions 
ADD COLUMN payment_method VARCHAR(50) CHECK (payment_method IN ('card', 'mpesa', 'paypal', 'bank_transfer'));

-- Create index for faster queries by payment method
CREATE INDEX idx_subscriptions_payment_method ON subscriptions(payment_method);

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.payment_method IS 'Payment method used for this subscription (card, mpesa, paypal, bank_transfer)';
