# Running the Payment Method Migration

## Prerequisites Check

Before running the migration, you need PostgreSQL running. You have 3 options:

## Option 1: Using Docker (Recommended)

### Step 1: Start Docker Desktop
1. Open **Docker Desktop** application
2. Wait for Docker to fully start (icon in system tray should be stable)

### Step 2: Start PostgreSQL Container
```powershell
cd C:\Users\JOAN\Downloads\subscription-tracker
scripts\postgres-helper.bat start
```

### Step 3: Run the Migration
```powershell
scripts\run-payment-method-migration.bat
```

That's it! The migration will:
- Add `payment_method` column to `subscriptions` table
- Add validation constraint
- Create index for faster queries
- Show you the updated table structure

---

## Option 2: Using Local PostgreSQL Installation

If you have PostgreSQL installed locally (not Docker):

### Step 1: Find your PostgreSQL bin directory
Common locations:
- `C:\Program Files\PostgreSQL\15\bin\`
- `C:\Program Files\PostgreSQL\14\bin\`

### Step 2: Add to PATH temporarily
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\15\bin"
```

### Step 3: Run migration directly
```powershell
cd C:\Users\JOAN\Downloads\subscription-tracker
psql -U postgres -d subscription_tracker -f backend/migrations/002_add_payment_method_to_subscriptions.sql
```

### Step 4: Verify
```powershell
psql -U postgres -d subscription_tracker -c "\d subscriptions"
```

---

## Option 3: Manual Migration via Database GUI

If you use **pgAdmin** or another PostgreSQL GUI:

1. Open pgAdmin
2. Connect to your database
3. Right-click on `subscription_tracker` database
4. Select **Query Tool**
5. Copy and paste this SQL:

```sql
-- Add payment_method column
ALTER TABLE subscriptions 
ADD COLUMN payment_method VARCHAR(50) 
CHECK (payment_method IN ('card', 'mpesa', 'paypal', 'bank_transfer'));

-- Create index
CREATE INDEX idx_subscriptions_payment_method ON subscriptions(payment_method);

-- Add comment
COMMENT ON COLUMN subscriptions.payment_method IS 'Payment method used for this subscription (card, mpesa, paypal, bank_transfer)';
```

6. Click **Execute** (F5)
7. You should see: "Query returned successfully"

---

## Verification

After running the migration, verify it worked:

### Using Docker:
```powershell
docker exec subscription_tracker_db psql -U postgres -d subscription_tracker -c "\d subscriptions"
```

### Using local psql:
```powershell
psql -U postgres -d subscription_tracker -c "\d subscriptions"
```

### What to look for:
You should see `payment_method` in the column list:

```
Column         | Type                     
---------------+--------------------------
id             | uuid                     
user_id        | uuid                     
name           | character varying(255)   
price          | numeric(10,2)           
billing_cycle  | character varying(20)    
billing_date   | date                     
category_id    | uuid                     
status         | character varying(50)    
payment_method | character varying(50)    ← NEW!
description    | text                     
website_url    | character varying(500)   
created_at     | timestamp with time zone 
updated_at     | timestamp with time zone 
```

---

## Troubleshooting

### Error: "Container not found"
**Solution:** Start Docker and the database:
```powershell
scripts\postgres-helper.bat start
```

### Error: "Database does not exist"
**Solution:** Create the database first:
```powershell
scripts\postgres-helper.bat reset
```
Then run the payment method migration.

### Error: "Column already exists"
**Solution:** The migration already ran successfully! You're good to go.

### Error: "psql: command not found"
**Solution:** Either use Docker option OR add PostgreSQL bin to PATH.

---

## Quick Start (Copy-Paste Commands)

**If you have Docker Desktop running:**
```powershell
cd C:\Users\JOAN\Downloads\subscription-tracker
scripts\run-payment-method-migration.bat
```

**If database doesn't exist yet:**
```powershell
scripts\postgres-helper.bat start
timeout /t 15
scripts\run-payment-method-migration.bat
```

---

## After Migration

Once the migration completes:

1. ✅ Restart your backend server (if running)
2. ✅ Test creating a subscription with M-Pesa
3. ✅ Test editing payment method on existing subscriptions
4. ✅ Verify payment method persists after page reload

The payment method will now be properly saved to the database! 🎉
