-- Migration: Add M-Pesa and Paystack to payment methods
-- This migration updates the payment_methods table to support M-Pesa and Paystack

-- Step 1: Drop the existing type constraint
ALTER TABLE payment_methods DROP CONSTRAINT IF EXISTS payment_methods_type_check;

-- Step 2: Add new constraint with M-Pesa and Paystack
ALTER TABLE payment_methods 
ADD CONSTRAINT payment_methods_type_check 
CHECK (type IN ('credit_card', 'debit_card', 'mpesa', 'paypal', 'paystack', 'bank_transfer'));

-- Step 3: Add phone_number column for M-Pesa
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Step 4: Add account_email column for PayPal and Paystack
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS account_email VARCHAR(255);

-- Step 5: Add API key column for Paystack (encrypted)
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS api_key_encrypted TEXT;

-- Step 6: Add last_balance_check column
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS last_balance_check TIMESTAMP WITH TIME ZONE;

-- Step 7: Add balance column (in minor units, e.g., cents/kobo)
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS balance_cents BIGINT DEFAULT 0;

-- Step 8: Add currency column
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'KES';

-- Comments for documentation
COMMENT ON COLUMN payment_methods.phone_number IS 'Phone number for M-Pesa accounts (format: +254XXXXXXXXX)';
COMMENT ON COLUMN payment_methods.account_email IS 'Email address for PayPal or Paystack accounts';
COMMENT ON COLUMN payment_methods.api_key_encrypted IS 'Encrypted API key for Paystack integration';
COMMENT ON COLUMN payment_methods.last_balance_check IS 'Timestamp of last successful balance check';
COMMENT ON COLUMN payment_methods.balance_cents IS 'Last known balance in minor units (cents/kobo)';
COMMENT ON COLUMN payment_methods.currency IS 'Currency code (ISO 4217)';

-- Create index for phone numbers
CREATE INDEX IF NOT EXISTS idx_payment_methods_phone ON payment_methods(phone_number) WHERE phone_number IS NOT NULL;

-- Create index for account emails
CREATE INDEX IF NOT EXISTS idx_payment_methods_email ON payment_methods(account_email) WHERE account_email IS NOT NULL;
