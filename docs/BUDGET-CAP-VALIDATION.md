# Budget Cap Validation System

## Overview
The subscription tracker now includes a budget cap validation system that prevents users from making payments that would exceed their monthly budget limit.

## How It Works

### Backend Validation (Go)
Both payment handlers check the user's budget before processing:

1. **Paystack Payments** (`payment_paystack.go`)
2. **M-Pesa Payments** (`payment_stkpush.go`)

#### Validation Logic:
```go
// 1. Fetch user's current budget
SELECT id, user_id, amount, period, created_at 
FROM budgets 
WHERE user_id = $1 
ORDER BY created_at DESC LIMIT 1

// 2. Calculate total active subscription spending
SELECT COALESCE(SUM(price), 0) 
FROM subscriptions 
WHERE user_id = $1 AND status = 'active'

// 3. Check if new payment would exceed budget
if totalSpent + paymentAmount > budget.Amount {
    return 402 Payment Required error
}
```

#### Error Response (HTTP 402):
```json
{
  "success": false,
  "error": "Budget exceeded",
  "message": "This payment would exceed your monthly budget of KSh 5000.00. Current spending: KSh 4800.00",
  "budget": 5000.00,
  "current_spent": 4800.00,
  "payment_amount": 500.00,
  "would_exceed": true
}
```

### Frontend Handling (TypeScript/React)

#### Payment Service (`payment-service.ts`)
Both payment methods now handle budget errors:

1. **Paystack**: `initializePaystackPayment()`
2. **M-Pesa**: `initiateMpesaPayment()`

```typescript
if (response.status === 402 && errorData.would_exceed) {
  return {
    success: false,
    message: errorData.message,
    budget_exceeded: true,
    budget: errorData.budget,
    current_spent: errorData.current_spent,
    payment_amount: errorData.payment_amount,
  }
}
```

#### UI Response (`subscriptions/page.tsx`)
When budget is exceeded, the user sees:

1. **Payment dialog closes automatically**
2. **High-priority notification shows**:
   - Title: "Budget Exceeded"
   - Message: "This payment would exceed your monthly budget of KSh 5000.00..."

## Testing the Budget Cap

### Prerequisites
1. User must have a budget set in the `/budget` page
2. User must have active subscriptions

### Test Scenario 1: Paystack Payment
```
Budget: KSh 5000
Active Subscriptions Total: KSh 4800
New Payment Attempt: KSh 500
Result: ❌ BLOCKED - Would total KSh 5300 (exceeds KSh 5000)
```

### Test Scenario 2: M-Pesa Payment
```
Budget: KSh 3000
Active Subscriptions Total: KSh 2500
New Payment Attempt: KSh 600
Result: ❌ BLOCKED - Would total KSh 3100 (exceeds KSh 3000)
```

### Test Scenario 3: Within Budget
```
Budget: KSh 5000
Active Subscriptions Total: KSh 3000
New Payment Attempt: KSh 500
Result: ✅ ALLOWED - Would total KSh 3500 (within KSh 5000)
```

## User Experience Flow

### Step-by-Step:
1. User clicks "Pay with M-Pesa" or "Pay Now" (Paystack)
2. **Backend checks budget** before initiating payment
3. If **budget exceeded**:
   - Payment is **NOT initiated**
   - No charge attempt made
   - User sees clear error message with budget details
   - Dialog closes automatically
4. If **within budget**:
   - Payment proceeds normally
   - Paystack: Opens payment window
   - M-Pesa: Sends STK push to phone

## Error Messages

### Budget Exceeded Message Format:
```
"This payment would exceed your monthly budget of KSh [BUDGET]. 
Current spending: KSh [SPENT]"
```

### Example:
```
"This payment would exceed your monthly budget of KSh 5000.00. 
Current spending: KSh 4800.00"
```

## Implementation Files

### Backend:
- `/backend/internal/handlers/payment_paystack.go` (lines 54-90)
- `/backend/internal/handlers/payment_stkpush.go` (lines 36-78)

### Frontend:
- `/Frontend/lib/payment-service.ts` (lines 207-248, 273-291)
- `/Frontend/app/subscriptions/page.tsx` (lines 297-314, 360-377)

## Budget Management

Users can:
1. **Set budget**: `/budget` page
2. **View spending**: Dashboard shows "Budget Used" percentage
3. **Adjust budget**: Update budget amount in settings

## Notes

- Budget check occurs **before** any payment gateway API call
- No unnecessary charges or failed transactions
- Users are protected from overspending
- Budget is checked against **active subscriptions only**
- Paused/cancelled subscriptions don't count toward budget
