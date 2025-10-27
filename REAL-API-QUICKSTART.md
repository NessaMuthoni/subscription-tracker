# Quick Start - Real Payment API Integration

## ✅ What Changed

Your payment balance checker now uses **REAL APIs** instead of simulated data!

- ❌ **Before**: Mock data showing fake balances
- ✅ **Now**: Real API calls to M-Pesa, Paystack, Flutterwave, Stripe, PayPal

---

## 🚀 Quick Setup (5 minutes)

### For Testing (Free, No API Keys Needed)
The app will run, but balance checks will return errors until you add API credentials. That's expected!

### For Production (With Real Balances)

1. **Choose Your Card Provider** (Pick one based on location):
   - **Kenya/Africa**: Use **Paystack** (recommended) - See section below
   - **Nigeria**: Flutterwave or Paystack
   - **International**: Stripe

2. **Set Up M-Pesa** (if in Kenya):
   - Go to https://developer.safaricom.co.ke/
   - Create account → Create app
   - Copy Consumer Key & Secret

3. **Add API Keys**:
```bash
# Copy example file
cp .env.example .env

# Edit .env and add:
MPESA_CONSUMER_KEY=your_key_here
MPESA_CONSUMER_SECRET=your_secret_here
CARD_PAYMENT_PROVIDER=paystack
CARD_PAYMENT_API_KEY=sk_test_your_paystack_key
```

4. **Restart Backend**:
```bash
cd backend
go run cmd/server/main.go
```

---

## 📋 Recommended: Paystack Setup (5 min)

**Why Paystack?**
- Free to start
- Best for Kenya (supports M-Pesa + Cards)
- Balance API is free
- Easy setup

**Steps**:
1. Go to https://paystack.com/
2. Sign up (choose Kenya)
3. Verify email
4. Dashboard → Settings → API Keys
5. Copy **Test Secret Key** (starts with `sk_test_`)
6. Add to `.env`:
```env
CARD_PAYMENT_PROVIDER=paystack
CARD_PAYMENT_API_KEY=sk_test_your_secret_key
```

**Test it**:
```bash
curl https://api.paystack.co/balance \
  -H "Authorization: Bearer sk_test_your_key"
```

---

## 🧪 Test Without Real APIs

You can test the app without API keys, but balance checks will show errors:

```
Error: "M-Pesa API credentials not configured"
Error: "Card payment provider not configured"
```

**This is normal!** Add API keys to fix.

---

## 📂 Files Changed

### Frontend
- ✅ `Frontend/lib/payment-service.ts` - Real API calls
- ✅ `Frontend/components/payment-balance-checker.tsx` - Demo notice removed

### Backend
- ✅ `backend/internal/handlers/payment_balance.go` - New file with API integrations
- ✅ `backend/cmd/server/main.go` - Added routes

### Documentation
- ✅ `PAYMENT-API-SETUP-GUIDE.md` - Complete setup guide
- ✅ `.env.example` - Environment variables template

---

## 🔍 Test the Integration

### 1. Start Backend
```bash
cd backend
go run cmd/server/main.go
```

### 2. Start Frontend
```bash
cd Frontend
npm run dev
```

### 3. Test in Browser
1. Login to app
2. Go to **Settings**
3. Scroll to **Payment Balance Checker**
4. Enable "Enable Balance Checking"
5. Enable M-Pesa or Card payment method
6. Click **"Check Balances"**

**Expected Results**:
- ✅ **With API keys**: Real balance shown
- ❌ **Without API keys**: Error message (normal)

---

## 💡 Next Steps

1. **Get Paystack account** (5 min) - https://paystack.com/
2. **Add API keys to `.env`** (1 min)
3. **Restart backend** (1 sec)
4. **Test balance check** (10 sec)

**Full setup guide**: See `PAYMENT-API-SETUP-GUIDE.md`

---

## 📞 Support

**Need help?**
- M-Pesa: https://developer.safaricom.co.ke/support
- Paystack: https://paystack.com/support
- Check `PAYMENT-API-SETUP-GUIDE.md` for detailed troubleshooting

---

## Summary

✅ Payment balance checker now uses **real APIs**  
✅ No more simulated/mock data  
✅ **Paystack recommended** for Kenya  
✅ **M-Pesa Daraja** for mobile money  
✅ Secure - API keys stored in backend only  
✅ Ready for production with real balances!

**Total setup time**: ~5-10 minutes (mostly waiting for email verifications)
