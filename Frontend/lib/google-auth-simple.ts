// Simplified Google Auth solution that avoids CORS issues
export class SimpleGoogleAuth {
  private clientId: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  }

  async initialize(): Promise<void> {
    if (!this.clientId || this.clientId === 'your-google-client-id') {
      throw new Error('Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local');
    }
    return Promise.resolve();
  }

  async signIn(): Promise<{ email: string; name: string; picture?: string } | null> {
    // For now, let's provide helpful instructions instead of the broken GSI client
    throw new Error(`Google Sign-In requires additional setup. Please follow these steps:

1. Open Google Cloud Console (https://console.cloud.google.com/)
2. Go to APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID: ${this.clientId}
4. Add these URLs to "Authorized JavaScript origins":
   - http://localhost:3000
   - http://127.0.0.1:3000
   - https://localhost:3000 (if using HTTPS)
5. Add these URLs to "Authorized redirect URIs":
   - http://localhost:3000/auth/google/callback
   - http://127.0.0.1:3000/auth/google/callback

After saving these changes, wait a few minutes for Google to update, then try again.

For now, please use email/password authentication.`);
  }

  decodeCredential(credential: string): any {
    try {
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode Google credential:', error);
      return null;
    }
  }
}

export const simpleGoogleAuth = new SimpleGoogleAuth();