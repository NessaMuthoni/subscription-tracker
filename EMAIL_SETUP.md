# Email Notification Setup - Quick Reference

## Overview
The system supports **two methods** for sending email notifications:

1. **Gmail OAuth2** (secure, recommended for Gmail users)
2. **SMTP** (simple, works with any email provider)

Choose the method that works best for you.

---

## Method 1: Gmail OAuth2 (Recommended for Gmail)

### Pros
- ✅ More secure than App Passwords
- ✅ Doesn't require 2FA or App Passwords
- ✅ Works with any Gmail account
- ✅ Higher sending limits

### Cons
- ❌ Requires Google Cloud Console setup
- ❌ More complex initial configuration

### Setup Time: ~10 minutes

**Follow the detailed guide:** [GMAIL_OAUTH_SETUP.md](./GMAIL_OAUTH_SETUP.md)

**Quick Steps:**
1. Create Google Cloud Project
2. Enable Gmail API
3. Create OAuth2 credentials
4. Run token generator tool
5. Add credentials to `.env`

**Required .env variables:**
```bash
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
GMAIL_EMAIL=your-email@gmail.com
```

---

## Method 2: SMTP (Simple)

### Pros
- ✅ Easy to set up (5 minutes)
- ✅ Works with any email provider
- ✅ No Google Cloud Console needed

### Cons
- ❌ Gmail requires App Passwords (may not be available)
- ❌ Less secure than OAuth2
- ❌ Lower sending limits

### Setup Time: ~5 minutes

### Option A: Outlook (Easiest)

**Best for**: Production use with personal email

1. Use your Outlook/Hotmail account
2. Add to `.env`:
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-outlook-password
```

### Option B: Mailtrap (Testing Only)

**Best for**: Development and testing (emails don't actually send)

1. Sign up at https://mailtrap.io (free)
2. Go to Email Testing → Inboxes → My Inbox
3. Copy SMTP credentials
4. Add to `.env`:
```bash
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
```

### Option C: Gmail (Legacy)

**Note**: Only works if your account has App Passwords enabled (many don't in 2026)

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

---

## After Setup

### Rebuild Backend
```bash
docker-compose build backend
docker-compose up -d backend
```

### Verify Configuration
```bash
# Check which email service initialized
docker-compose logs backend | findstr "email"
docker-compose logs backend | findstr "Gmail"
```

**Expected output:**
- Gmail OAuth2: `✓ Gmail OAuth2 service initialized`
- SMTP: `✓ Email service initialized`

### Test Email Delivery

The notification system automatically checks every 6 hours for:
- Subscriptions due in 3 days → Sends payment reminders
- Budget usage >= 90% → Sends budget alerts

**Manual test:**
1. Create a subscription with next billing date 3 days from now
2. Restart backend to trigger immediate check:
```bash
docker-compose restart backend
```
3. Check logs for email sending:
```bash
docker-compose logs backend | findstr "Email sent"
```

---

## Recommendation

**For Development:** Use **Mailtrap** (quickest setup, safe testing)

**For Production (Gmail):** Use **Gmail OAuth2** (most secure)

**For Production (Other):** Use **Outlook SMTP** (simplest)

---

## Troubleshooting

### No email service initialized
- Check that you have either `GMAIL_*` or `SMTP_*` variables in `.env`
- Rebuild the backend container after adding variables

### Emails not being sent
- Check backend logs: `docker-compose logs backend`
- Verify notification scheduler is running: Look for "Notification scheduler started"
- Ensure you have subscriptions matching the criteria (due in 3 days, budget >= 90%)

### Gmail OAuth2 errors
- See detailed troubleshooting in [GMAIL_OAUTH_SETUP.md](./GMAIL_OAUTH_SETUP.md)
- Common issue: Refresh token expired → Re-run token generator

### SMTP authentication failed
- Double-check username and password
- For Gmail: Ensure you're using App Password, not regular password
- For Outlook: Ensure you're using the correct password
