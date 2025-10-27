# Google OAuth Setup Guide

To enable Google Sign-In functionality in the Subscription Tracker application, follow these steps:

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Identity services

## 2. Configure OAuth Consent Screen

1. In the Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required application information:
   - App name: "Subscription Tracker"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users if in testing mode

## 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: "Subscription Tracker Web Client"
5. Authorized origins:
   - `http://localhost:3000` (for development)
   - Your production domain (when deployed)
6. Authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - Your production domain (when deployed)

## 4. Configure Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-from-step-3
```

### Backend (.env)
```bash
GOOGLE_CLIENT_ID=your-google-client-id-from-step-3
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-step-3
```

## 5. Testing

1. Make sure both backend and frontend are running
2. Go to the login page
3. Click "Continue with Google"
4. You should see the Google OAuth consent screen
5. After authorization, you'll be redirected back to the app

## Current Implementation Status

✅ **Frontend Implementation**: Complete
- Google OAuth service created
- Auth provider updated to handle Google login
- Login and signup pages configured
- Error handling for missing configuration

⚠️ **Backend Implementation**: Partial
- Google OAuth endpoint exists but not fully implemented
- Currently using workaround with regular signup/login flow
- Future enhancement: Full backend Google OAuth validation

## Features

- **Automatic Account Creation**: If a user signs in with Google for the first time, an account is automatically created
- **Existing User Login**: If a user already exists, they are logged in automatically
- **Error Handling**: Graceful fallback when Google OAuth is not configured
- **Security**: JWT tokens are properly handled and stored

## Troubleshooting

### "Google Sign-In is not configured" Error
- Make sure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart the frontend development server after adding environment variables

### "Google Sign-In prompt was not displayed" Error
- Check if popup blockers are enabled
- Ensure the domain is added to authorized origins in Google Cloud Console
- Try refreshing the page and attempting again

### Backend 501 Error (Not Implemented)
- This is expected with the current implementation
- The frontend handles Google authentication and creates accounts using the regular API
- Future versions will implement full backend Google OAuth validation