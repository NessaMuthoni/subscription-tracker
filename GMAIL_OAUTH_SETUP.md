# Gmail OAuth2 Setup Guide

## Step 1: Create Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. Click **"Select a project"** at the top → **"NEW PROJECT"**
3. Name it: **"Subscription Tracker"**
4. Click **"CREATE"**
5. Wait for it to be created, then select it

## Step 2: Enable Gmail API

1. In the Google Cloud Console, go to: https://console.cloud.google.com/apis/library
2. Search for: **"Gmail API"**
3. Click on it
4. Click **"ENABLE"**

## Step 3: Create OAuth2 Credentials

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **"CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted to configure consent screen:
   - Click **"CONFIGURE CONSENT SCREEN"**
   - Select **"External"** → **"CREATE"**
   - Fill in:
     - App name: **Subscription Tracker**
     - User support email: **your-email@gmail.com**
     - Developer contact: **your-email@gmail.com**
   - Click **"SAVE AND CONTINUE"**
   - Skip "Scopes" → **"SAVE AND CONTINUE"**
   - Add your email as test user → **"SAVE AND CONTINUE"**
   - Click **"BACK TO DASHBOARD"**

4. Back at Credentials page:
   - Click **"CREATE CREDENTIALS"** → **"OAuth client ID"**
   - Application type: **"Web application"**
   - Name: **Subscription Tracker Backend**
   - Authorized redirect URIs: **http://localhost:8080/oauth2callback**
   - Click **"CREATE"**

5. **IMPORTANT:** Copy and save:
   - Client ID
   - Client Secret

## Step 4: Get Refresh Token

Run the token generator tool to obtain your OAuth2 refresh token:

1. Open a terminal in the backend directory
2. Navigate to the token generator:
```bash
cd tools/gmail-token-generator
```

3. Run the tool:
```bash
go run main.go
```

4. Follow the prompts:
   - Enter your Client ID
   - Enter your Client Secret
   - Visit the authorization URL
   - Grant permissions
   - Copy the authorization code
   - Paste it back in the terminal

5. The tool will save your tokens and show you the .env variables

## Step 5: Add Credentials to Backend

Add the credentials to your backend `.env` file (in `backend/.env`):

```bash
# Gmail OAuth2 Configuration
GMAIL_CLIENT_ID=your-oauth2-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-oauth2-client-secret
GMAIL_REFRESH_TOKEN=your-oauth2-refresh-token-from-tool
GMAIL_EMAIL=your-email@gmail.com
```

**Important**: 
- Comment out or remove any `SMTP_*` variables if you're using Gmail OAuth2
- The system will prioritize Gmail OAuth2 over SMTP if both are configured

## Step 6: Rebuild and Test

1. Rebuild the backend container:
```bash
# From the project root
docker-compose build backend
docker-compose up -d backend
```

2. Check the backend logs to confirm Gmail OAuth2 initialization:
```bash
docker-compose logs backend | findstr "Gmail"
```

You should see: `✓ Gmail OAuth2 service initialized`

3. Test email sending by creating a subscription that's due in 3 days

---

## Troubleshooting

### "Failed to initialize Gmail OAuth2"
- Double-check all 4 credentials are correct
- Ensure Gmail API is enabled in Google Cloud Console
- Verify the refresh token hasn't expired

### "OAuth2 token refresh failed"
- Re-run the token generator tool to get a new refresh token
- Make sure you authorized all required scopes

### No emails being sent
- Check backend logs: `docker-compose logs backend`
- Verify Gmail API quota hasn't been exceeded (check Google Cloud Console)
- Ensure your Gmail account doesn't have suspicious activity blocks

### Invalid grant error
- The refresh token may have been revoked
- Check if you changed your Google account password (this revokes tokens)
- Re-run the token generator to obtain a new token

---

## Alternative: Simple SMTP (Easier Setup)

If OAuth2 is too complex, you can use standard SMTP instead:

**Outlook** (recommended for simplicity):
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-outlook-password
```

**Mailtrap** (for testing only):
1. Sign up at https://mailtrap.io
2. Get your sandbox credentials:
```bash
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
```

Mailtrap captures all emails in a test inbox - perfect for development!
