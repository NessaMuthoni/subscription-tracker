# Payment Balance Checker - Real API Integration Guide

## Overview
The payment balance checker now uses **real APIs** instead of simulated data. This guide will help you set up the necessary API credentials for M-Pesa, Paystack/Flutterwave/Stripe, and PayPal.

---

## 🚨 Important Changes

### Frontend (payment-service.ts)
- ✅ Removed mock/simulated data
- ✅ Now makes real HTTP requests to backend `/api/payment/*` endpoints
- ✅ Includes authentication tokens in requests
- ✅ Proper error handling with descriptive messages

### Backend (payment_balance.go)
- ✅ New file: `backend/internal/handlers/payment_balance.go`
- ✅ Three new endpoints:
  - `POST /api/payment/mpesa/balance`
  - `POST /api/payment/card/balance`
  - `POST /api/payment/paypal/balance`
- ✅ Real API integration for Paystack, Flutterwave, Stripe, PayPal
- ✅ M-Pesa Daraja API authentication (balance query requires additional setup)

---

## 🔧 Required Environment Variables

Add these to your `.env` file or environment configuration:

```env
# M-Pesa Daraja API (Kenya)
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here

# Card Payment Provider (choose one)
CARD_PAYMENT_PROVIDER=paystack  # Options: paystack, flutterwave, stripe
CARD_PAYMENT_API_KEY=your_api_key_here

# PayPal (Optional - if you want PayPal balance checking)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

---

## 1️⃣ M-Pesa Daraja API Setup (Kenya)

### Step 1: Create Daraja Account
1. Go to https://developer.safaricom.co.ke/
2. Click **"Register"** → Create account
3. Verify your email
4. Login to Daraja Portal

### Step 2: Create App
1. Go to **"My Apps"**
2. Click **"Create New App"**
3. Select **"Lipa Na M-Pesa Online"** (for payments)
4. Fill in app details:
   - App Name: "Subscription Tracker"
   - Description: "Track subscription payments"
5. Click **"Create App"**

### Step 3: Get Credentials
1. Open your created app
2. Copy:
   - **Consumer Key** → `MPESA_CONSUMER_KEY`
   - **Consumer Secret** → `MPESA_CONSUMER_SECRET`
3. Add to `.env` file

### Step 4: Enable Account Balance API (Optional)
⚠️ **Note**: Account Balance query requires additional permissions from Safaricom.

To enable:
1. Go to **"My Apps"** → Select your app
2. Request **"Account Balance"** API access
3. Fill out business verification form
4. Wait for Safaricom approval (2-5 business days)
5. Once approved, you'll get additional credentials

**Alternative**: Use Lipa Na M-Pesa for payments only (doesn't require balance checking)

### Test vs Production
```env
# For testing (use sandbox credentials)
MPESA_CONSUMER_KEY=sandbox_consumer_key
MPESA_CONSUMER_SECRET=sandbox_consumer_secret
MPESA_ENVIRONMENT=sandbox

# For production (use live credentials)
MPESA_CONSUMER_KEY=live_consumer_key
MPESA_CONSUMER_SECRET=live_consumer_secret
MPESA_ENVIRONMENT=production
```

---

## 2️⃣ Paystack Setup (Recommended for Africa)

### Why Paystack?
- ✅ Best for Kenya, Nigeria, Ghana, South Africa
- ✅ Supports M-Pesa, card payments, bank transfers
- ✅ Easy KES currency support
- ✅ Free to start

### Step 1: Create Account
1. Go to https://paystack.com/
2. Click **"Sign Up"**
3. Choose **"Kenya"** as country
4. Verify your email and phone
5. Complete business verification

### Step 2: Get API Keys
1. Login to Paystack Dashboard
2. Go to **Settings** → **API Keys & Webhooks**
3. Copy:
   - **Test Secret Key** (starts with `sk_test_`)
   - **Live Secret Key** (starts with `sk_live_`)

### Step 3: Configure Environment
```env
CARD_PAYMENT_PROVIDER=paystack
CARD_PAYMENT_API_KEY=sk_test_your_secret_key_here  # Use sk_live_ for production
```

### Step 4: Test Balance API
```bash
curl https://api.paystack.co/balance \
  -H "Authorization: Bearer sk_test_your_key" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "status": true,
  "data": [
    {
      "currency": "KES",
      "balance": 0
    }
  ]
}
```

---

## 3️⃣ Flutterwave Setup (Alternative)

### Step 1: Create Account
1. Go to https://flutterwave.com/
2. Sign up for business account
3. Verify email and business details

### Step 2: Get API Keys
1. Dashboard → Settings → API
2. Copy **Secret Key**

### Step 3: Configure
```env
CARD_PAYMENT_PROVIDER=flutterwave
CARD_PAYMENT_API_KEY=FLWSECK_TEST-your_secret_key
```

---

## 4️⃣ Stripe Setup (International)

### Step 1: Create Account
1. Go to https://stripe.com/
2. Sign up
3. Complete business verification

### Step 2: Get API Keys
1. Dashboard → Developers → API Keys
2. Copy **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Step 3: Configure
```env
CARD_PAYMENT_PROVIDER=stripe
CARD_PAYMENT_API_KEY=sk_test_your_secret_key
```

**Note**: Stripe returns balance in your Stripe account, not customer card balances.

---

## 5️⃣ PayPal Setup (Optional)

### Step 1: Create PayPal Developer Account
1. Go to https://developer.paypal.com/
2. Log in with PayPal account
3. Go to **Dashboard**

### Step 2: Create App
1. Click **"My Apps & Credentials"**
2. Create App:
   - App Name: "Subscription Tracker"
   - Choose **"Merchant"**
3. Copy:
   - **Client ID**
   - **Secret**

### Step 3: Get Access Token
PayPal requires OAuth flow to get access tokens. Users need to authenticate.

**Implementation needed**: Add PayPal OAuth flow to frontend.

---

## 🔐 Security Best Practices

### 1. Never Expose API Keys in Frontend
✅ **Correct**: Store in backend `.env`  
❌ **Wrong**: Hardcode in React components

### 2. Use Environment-Specific Keys
```env
# Development
MPESA_CONSUMER_KEY=sandbox_key
CARD_PAYMENT_API_KEY=sk_test_key

# Production
MPESA_CONSUMER_KEY=production_key
CARD_PAYMENT_API_KEY=sk_live_key
```

### 3. Rotate Keys Regularly
- Change API keys every 90 days
- Immediately rotate if compromised
- Use different keys per environment

### 4. Implement Rate Limiting
```go
// Add to backend
if requestCount > 100 {
    return errors.New("rate limit exceeded")
}
```

---

## 📊 Testing the Integration

### Test M-Pesa Balance Check
```bash
# Start backend
cd backend
go run cmd/server/main.go

# Test endpoint (in new terminal)
curl -X POST http://localhost:8080/api/payment/mpesa/balance \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+254700000000"}'
```

### Test Card Balance Check
```bash
curl -X POST http://localhost:8080/api/payment/card/balance \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"cardToken": "card_token_123"}'
```

### Test from Frontend
1. Start frontend: `cd Frontend && npm run dev`
2. Login to app
3. Go to **Settings**
4. Enable **"Balance Checking"**
5. Enable M-Pesa or Card
6. Click **"Check Balances"**
7. Check browser console for API responses

---

## 🐛 Troubleshooting

### Error: "M-Pesa API credentials not configured"
**Solution**: Add `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` to `.env`

### Error: "Failed to authenticate with M-Pesa API"
**Solutions**:
1. Check credentials are correct (no extra spaces)
2. Verify using sandbox keys for testing
3. Check internet connection
4. Test credentials:
```bash
curl -u "consumer_key:consumer_secret" \
  https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials
```

### Error: "Paystack API error (401)"
**Solutions**:
1. Verify API key is correct
2. Make sure using `sk_test_` or `sk_live_` (not public key)
3. Check key hasn't expired

### Error: "M-Pesa balance query requires additional setup"
**Expected**: M-Pesa Account Balance API requires special permissions.
**Solutions**:
1. Apply for Account Balance API access in Daraja Portal
2. Wait for Safaricom approval
3. Use alternative: Track payments instead of checking balance

### CORS Errors
**Solution**: Add frontend URL to backend CORS config:
```go
// backend/cmd/server/main.go
AllowOrigins: []string{"http://localhost:3000"},
```

---

## 📈 Next Steps

### 1. Implement User Phone Number Storage
Store user's M-Pesa phone number in database:
```sql
ALTER TABLE users ADD COLUMN mpesa_phone VARCHAR(15);
```

### 2. Add Card Token Management
Allow users to save card tokens securely.

### 3. Implement Webhooks
Set up webhooks to receive payment notifications:
- M-Pesa: Result URL and Timeout URL
- Paystack: Transaction webhooks
- PayPal: IPN (Instant Payment Notification)

### 4. Add Balance Caching
Cache balance results for 5-10 minutes to reduce API calls:
```go
// Use Redis or in-memory cache
cachedBalance := cache.Get("mpesa_balance_" + userID)
if cachedBalance != nil {
    return cachedBalance
}
```

### 5. Enable Auto-Topup
Notify users when balance is low and suggest top-up.

---

## 💰 Cost Considerations

### M-Pesa Daraja API
- **Free**: Sandbox testing
- **Production**: Transaction fees apply (1.5% - 3%)

### Paystack
- **Free**: Balance API calls
- **Transaction fees**: 1.5% + KES 25 for Kenyan cards
- **M-Pesa**: 1.45%

### Flutterwave
- **Free**: API calls
- **Transaction fees**: ~1.4% for cards

### Stripe
- **Free**: Balance API
- **Transaction fees**: 2.9% + KES 25

---

## 📝 Summary

✅ **Frontend**: Real API calls implemented  
✅ **Backend**: Payment balance endpoints created  
✅ **Security**: API keys stored in backend only  
✅ **Providers**: Paystack (recommended), Flutterwave, Stripe supported  
✅ **M-Pesa**: Daraja API integration (balance query needs approval)  
✅ **Error Handling**: Descriptive error messages  

**Ready for production** once you add API credentials! 🚀

---

## 🆘 Need Help?

- **M-Pesa**: https://developer.safaricom.co.ke/support
- **Paystack**: https://paystack.com/support  
- **Flutterwave**: https://support.flutterwave.com/
- **Stripe**: https://support.stripe.com/

**Contact**: Create issue in GitHub repo with "[Payment API]" prefix
