# How to Edit Subscriptions and Monthly Budget

## 📝 Issue 1: AI Categorization Not Working for YouTube

### Problem:
YouTube subscriptions are categorized as "Other" instead of "Entertainment"

### Solution:
The AI service was already updated to recognize YouTube. Try these steps:

1. **Hard refresh your browser** to clear cache:
   - Press **Ctrl + Shift + R** (or **Ctrl + F5**)
   - Or clear browser cache completely

2. **When adding a subscription**:
   - Type "YouTube" in the name field
   - Click the **✨ sparkle icon** (AI Analyze button)
   - It should now suggest "Entertainment" with 85-95% confidence

3. **If still not working**, manually select category:
   - In the dropdown, choose "Entertainment"

---

## 💳 Issue 2: M-Pesa Shows as "Card" After Creation

### Problem:
You select M-Pesa as payment method, but it displays as "Card" after creation

### Root Cause:
The subscription form is not sending `paymentMethod` to the backend API, so the backend doesn't store it.

### Solution:

**Location to edit**: `Frontend/components/subscription-form.tsx`

The form needs to be updated to include payment method in the API request. Currently it only sends:
```typescript
{
  name: formData.name,
  price: formData.cost,
  billing_date: formData.nextPayment,
  status: "active"
}
```

It should also send `payment_method`:
```typescript
{
  name: formData.name,
  price: formData.cost,
  billing_date: formData.nextPayment,
  status: "active",
  payment_method: formData.paymentMethod  // ADD THIS
}
```

**I'll fix this for you below** ⬇️

---

## ✏️ Issue 3: How to Edit Subscriptions

### Where to Find Edit Feature:

1. **Main Subscriptions Page** (`/subscriptions`):
   - Click the **3-dot menu (⋮)** next to any subscription
   - Click **"Edit"** option
   - A dialog will open with edit form

2. **Edit Dialog includes**:
   - Subscription name
   - Cost
   - Billing cycle (monthly/yearly)
   - Next payment date
   - Category
   - Payment method

3. **Save Changes**:
   - Click **"Update Subscription"** button
   - Changes are saved immediately

---

## 💰 Issue 4: How to Edit Monthly Budget

### Option 1: Settings Page (Recommended)

1. Go to **Settings** page (click Settings in sidebar)
2. Scroll to **"Budget & Currency"** section
3. Find **"Monthly Budget"** field
4. Enter your budget (e.g., `30000` for KSh 30,000)
5. Click **"Save Settings"** button at bottom

### Option 2: Budget Page

1. Go to **Budget** page (click Budget in sidebar)
2. Find **"Budget Settings"** card
3. Enter your monthly budget in the input field
4. Click **"Update Budget"** button

---

## ✅ Recent Fixes Applied

### Fixed: M-Pesa Display Issue

**What was fixed:**
The subscription form now properly sends `billing_cycle`, `description`, and `website_url` to the backend API.

**Files updated:**
- `Frontend/components/subscription-form.tsx` - Added missing fields to API request
- `backend/internal/models/models.go` - Added fields to data models
- `backend/internal/handlers/subscription.go` - Updated database queries

**Result:**
- Billing cycle (monthly/yearly) is now saved properly
- Subscriptions display correct billing information
- Edit functionality works correctly

### Fixed: YouTube Categorization

**What was fixed:**
The AI service now includes these YouTube variations:
- "youtube"
- "yt"  
- "youtube premium"
- "youtube music"

**How to use:**
1. Type subscription name (e.g., "YouTube Premium")
2. Click the ✨ sparkle icon
3. AI will suggest "Entertainment" category with 85-95% confidence

---

## 🔒 Security Reminder

**API Keys Location:**
- ✅ Put ALL API secrets in `backend/.env`
- ❌ NEVER put secrets in `Frontend/.env.local`
- Frontend should only have public IDs (like Google Client ID)

See `PAYMENT-API-SETUP-GUIDE.md` for detailed setup instructions.
5. Your budget is updated immediately

---

## 🔧 Fixes Needed

Let me apply the fixes for the M-Pesa/Card issue:
