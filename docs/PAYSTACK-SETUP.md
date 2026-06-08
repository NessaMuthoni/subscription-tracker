# Paystack Payment Integration Setup Guide

## Overview
Paystack is now integrated into the Subscription Tracker to allow users to pay for their subscriptions using debit/credit cards.

## Features Implemented

### Backend (Go)
- **Payment Initialization**: `POST /api/payment/paystack/initialize`
  - Creates a payment session and returns authorization URL
  - Converts amount to kobo (smallest currency unit)
  - Generates unique reference for each transaction

- **Payment Verification**: `GET /api/payment/paystack/verify/:reference`
  - Verifies if payment was successful
  - Returns payment status, amount, and currency

- **Webhook Handler**: `POST /api/payment/paystack/webhook`
  - Receives payment notifications from Paystack
  - For automated payment status updates (requires signature verification)

### Frontend (Next.js)
- **PaymentService Methods**:
  - `initializePaystackPayment(email, amount, subscriptionName)` - Starts payment
  - `verifyPaystackPayment(reference)` - Confirms payment completion

- **PaystackPaymentButton Component**:
  - Reusable button for subscription payments
  - Opens Paystack checkout in popup window
  - Automatically verifies payment on completion
  - Shows success/error states

## Getting Started

### 1. Create a Paystack Account
1. Go to [Paystack Dashboard](https://dashboard.paystack.com/signup)
2. Sign up with your business email
3. Complete KYC (Know Your Customer) verification
4. Activate your account

### 2. Get API Keys

#### For Testing (Sandbox):
1. Login to [Paystack Dashboard](https://dashboard.paystack.com/login)
2. Go to **Settings** → **API Keys & Webhooks**
3. Copy your **Test Secret Key** (starts with `sk_test_`)
4. Copy your **Test Public Key** (starts with `pk_test_`)

#### For Production (Live):
1. Complete Paystack business verification
2. Go to **Settings** → **API Keys & Webhooks**
3. Toggle to **Live Mode**
4. Copy your **Live Secret Key** (starts with `sk_live_`)
5. Copy your **Live Public Key** (starts with `pk_live_`)

### 3. Update Environment Variables

Edit your `.env` file and replace the test keys:

```env
# Paystack Payment Configuration
PAYSTACK_SECRET_KEY=sk_test_your_actual_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_actual_public_key_here
PAYSTACK_CALLBACK_URL=http://localhost:3000/payment/callback
```

**For Production:**
```env
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key_here
PAYSTACK_CALLBACK_URL=https://yourdomain.com/payment/callback
```

### 4. Restart Services
```bash
docker-compose restart backend
```

## Testing Payments

### Test Card Details (Sandbox Only)

#### Success:
- **Card Number**: 4084 0840 8408 4081
- **CVV**: 408
- **Expiry**: Any future date (e.g., 12/26)
- **PIN**: 0000

#### Insufficient Funds:
- **Card Number**: 5060 6666 6666 6666 4
- **CVV**: 123
- **Expiry**: Any future date

#### Declined:
- **Card Number**: 4084 0840 8408 4081
- **CVV**: 111
- **Expiry**: Any future date

See [Paystack Test Cards Documentation](https://paystack.com/docs/payments/test-payments/)

## How Users Make Payments

1. **View Subscriptions**: Navigate to Subscriptions page
2. **Click "Pay with Card"**: Button appears on each subscription
3. **Review Payment Details**: Dialog shows subscription name, amount, email
4. **Click "Pay Now"**: Opens Paystack checkout in popup
5. **Enter Card Details**: Fill in card number, expiry, CVV, PIN
6. **Complete Payment**: Popup closes automatically on success
7. **Verification**: System verifies payment and shows confirmation

## Integration in Components

### Add Payment Button to Subscription Card

```tsx
import { PaystackPaymentButton } from "@/components/paystack-payment-button"

<PaystackPaymentButton
  subscriptionId={subscription.id}
  subscriptionName={subscription.name}
  amount={subscription.cost}
  onPaymentSuccess={() => {
    // Refresh subscriptions or update UI
    console.log("Payment successful!")
  }}
/>
```

## Security Notes

⚠️ **IMPORTANT**:
- Never commit real API keys to Git
- Use environment variables for all credentials
- Test Secret Key should ONLY be used in development
- Live Secret Key should ONLY be used in production
- Enable webhook signature verification before production

## Webhook Setup (Optional)

To receive automatic payment notifications:

1. Go to **Settings** → **API Keys & Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/payment/paystack/webhook`
3. Copy the **Webhook Secret**
4. Add to `.env`: `PAYSTACK_WEBHOOK_SECRET=your_webhook_secret`
5. Update `payment_paystack.go` to verify webhook signatures

## Currency Support

Paystack supports multiple currencies:
- NGN (Nigerian Naira)
- GHS (Ghanaian Cedi)
- ZAR (South African Rand)
- USD (US Dollar)
- KES (Kenyan Shilling) - via Mpesa or card

Amount is automatically converted to the smallest unit (e.g., KES 100 → 10000 cents).

## Troubleshooting

### "Paystack API credentials not configured"
- Check `.env` file has `PAYSTACK_SECRET_KEY` set
- Restart backend: `docker-compose restart backend`

### Payment Popup Blocked
- Allow popups for localhost in browser settings
- Click the popup icon in address bar

### Payment Not Verifying
- Check browser console for errors
- Verify reference is being stored correctly
- Ensure popup wasn't closed before payment completion

### Webhook Not Receiving Events
- Ensure URL is publicly accessible (use ngrok for local testing)
- Check webhook signature verification
- View webhook delivery logs in Paystack Dashboard

## API Endpoints

### Initialize Payment
```
POST /api/payment/paystack/initialize
Authorization: Bearer <jwt_token>

{
  "email": "user@example.com",
  "amount": 1000.00,
  "subscriptionName": "Netflix Premium"
}

Response:
{
  "success": true,
  "authorization_url": "https://checkout.paystack.com/...",
  "reference": "SUB_1234567890"
}
```

### Verify Payment
```
GET /api/payment/paystack/verify/:reference
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "reference": "SUB_1234567890",
  "amount": 1000.00,
  "currency": "KES",
  "status": "success",
  "email": "user@example.com"
}
```

## Next Steps

1. ✅ Get real Paystack API keys
2. ✅ Update `.env` with real credentials
3. ✅ Test with Paystack test cards
4. ⏸️ Add payment button to subscription components
5. ⏸️ Store payment history in database
6. ⏸️ Set up webhook for automatic status updates
7. ⏸️ Complete business verification for live mode

## Support

- [Paystack Documentation](https://paystack.com/docs)
- [Paystack Support](https://support.paystack.com)
- [Test Cards List](https://paystack.com/docs/payments/test-payments/)

---

**Status**: ✅ Paystack integration complete and ready for testing!
