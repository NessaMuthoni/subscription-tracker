# M-Pesa Backend Integration Guide

## Quick Start

### Step 1: Run the Migration

From the `backend` directory:

```powershell
.\run-migration.ps1
```

Or manually:
```powershell
$env:PGPASSWORD = "password123"
psql -h localhost -p 5432 -U postgres -d subscription_tracker -f migrations\003_add_mpesa_paystack_payment_methods.sql
```

### Step 2: Start Backend

```powershell
go run cmd/server/main.go
```

### Step 3: Test the API

**Create M-Pesa Payment Method:**
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    type = "mpesa"
    phone_number = "+254712345678"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/payment-methods" -Method POST -Headers $headers -Body $body
```

**Check M-Pesa Balance:**
```powershell
$body = @{
    phoneNumber = "+254712345678"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/payment/mpesa/balance" -Method POST -Headers $headers -Body $body
```

## API Endpoints

### Payment Methods

- **Create:** `POST /api/payment-methods`
- **List:** `GET /api/payment-methods`
- **Delete:** `DELETE /api/payment-methods/:id`

### Balance Checks

- **M-Pesa:** `POST /api/payment/mpesa/balance`
- **Card:** `POST /api/payment/card/balance`
- **PayPal:** `POST /api/payment/paypal/balance`

## Environment Variables

Your `.env` already has M-Pesa credentials:

```env
MPESA_CONSUMER_KEY=z1OOuUILFdYZPp1fPgyWCFQ2E5D91miNVK0Uxi0tJhAA5qeV
MPESA_CONSUMER_SECRET=A7VROWa3eth7jG8gbLNAqHDZ6Mm9Tp2vnHa1ktaAUGXf3b2SwGMsJLfmqeDlwOGa
MPESA_ENVIRONMENT=sandbox
```

**Optional (for PayPal/Paystack):**
```env
PAYPAL_CLIENT_ID=your_id
PAYPAL_CLIENT_SECRET=your_secret
PAYSTACK_SECRET_KEY=sk_test_your_key
CARD_PAYMENT_PROVIDER=paystack
```

## Payment Method Types

Supported types:
- `mpesa` - Requires `phone_number`
- `paypal` - Requires `account_email`
- `paystack` - Requires `account_email`, optional `api_key`
- `credit_card` / `debit_card` - Requires `last4`, `brand`
- `bank_transfer`

## Request Examples

**M-Pesa:**
```json
{
  "type": "mpesa",
  "phone_number": "+254712345678"
}
```

**PayPal:**
```json
{
  "type": "paypal",
  "account_email": "user@example.com"
}
```

**Paystack:**
```json
{
  "type": "paystack",
  "account_email": "user@example.com",
  "api_key": "sk_test_..."
}
```

**Card:**
```json
{
  "type": "credit_card",
  "last4": "4242",
  "brand": "Visa"
}
```

## Database Schema

After migration, `payment_methods` table has:

```sql
- id (UUID)
- user_id (UUID)
- type (VARCHAR) - mpesa, paypal, paystack, credit_card, debit_card, bank_transfer
- last4 (VARCHAR) - For cards
- brand (VARCHAR) - For cards
- phone_number (VARCHAR) - For M-Pesa
- account_email (VARCHAR) - For PayPal/Paystack
- api_key_encrypted (TEXT) - For Paystack
- last_balance_check (TIMESTAMP)
- balance_cents (BIGINT)
- currency (VARCHAR)
- is_default (BOOLEAN)
- created_at (TIMESTAMP)
```

## Troubleshooting

**"psql: command not found"**
- Add PostgreSQL to PATH or use full path:
  ```powershell
  "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -d subscription_tracker -f migrations\003_add_mpesa_paystack_payment_methods.sql
  ```

**"password authentication failed"**
- Check password in `.env` (currently: `password123`)
- Update `run-migration.ps1` if different

**"column already exists"**
- Migration already applied - safe to ignore

**M-Pesa balance returns error**
- Expected until Safaricom Account Balance API is fully configured
- Requires special permissions from Safaricom
- Visit: https://developer.safaricom.co.ke/Documentation

## Production Setup

For production M-Pesa, you need:
1. Production Consumer Key & Secret
2. Organization Shortcode
3. Initiator Name & Security Credential
4. Result URL and Timeout URL (webhooks)
5. Account Balance API approval from Safaricom

Update `.env`:
```env
MPESA_ENVIRONMENT=production
```

## Frontend Integration

The frontend already has full UI components:
- `PaymentMethodSetup` - Add payment methods
- `PaymentBalanceChecker` - Check balances
- Settings page with tabs for M-Pesa, PayPal, Paystack

Just ensure backend is running and migration is complete!

## Testing

**Sandbox Test Numbers:**
- M-Pesa: Use Safaricom test numbers from developer portal
- PayPal: Use sandbox accounts
- Paystack: Use test cards (4084084084084081)

**Test Flow:**
1. ✅ Run migration
2. ✅ Start backend
3. ✅ Login to get JWT token
4. ✅ Create payment method via API
5. ✅ View in Settings > Payments
6. ✅ Check balance (may show error for M-Pesa until production setup)

## Files Reference

- `migrations/003_add_mpesa_paystack_payment_methods.sql` - Database migration
- `internal/models/models.go` - PaymentMethod struct
- `internal/handlers/payment.go` - CRUD operations
- `internal/handlers/payment_balance.go` - Balance checking
- `run-migration.ps1` - Migration helper script
- `.env` - Environment configuration

For complete documentation, see root directory:
- `MPESA-PAYMENT-SETUP.md` - Full API documentation
- `BACKEND-PAYMENT-SUMMARY.md` - Implementation overview
