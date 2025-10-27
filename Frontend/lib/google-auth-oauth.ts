// Google OAuth2 service that avoids CORS issues with GSI client
export class GoogleOAuth2Service {
  private clientId: string;
  private redirectUri: string;
  private scope: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    this.redirectUri = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/google/callback`;
    this.scope = 'openid email profile';
  }

  async initialize(): Promise<void> {
    if (!this.clientId || this.clientId === 'your-google-client-id') {
      throw new Error('Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local');
    }
    // No external scripts needed for OAuth2 flow
    return Promise.resolve();
  }

  async signIn(): Promise<{ user: any; token: string } | null> {
    try {
      // Use OAuth2 authorization code flow instead of GSI
      const authUrl = this.buildAuthUrl();
      
      // Open popup window for OAuth
      const popup = window.open(
        authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes,left=' + 
        (window.screen.width / 2 - 250) + ',top=' + (window.screen.height / 2 - 300)
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site and try again.');
      }

      // Listen for the callback
      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            reject(new Error('Google Sign-In was cancelled by user.'));
          }
        }, 1000);

        // Listen for message from popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            popup.close();
            resolve({
              user: event.data.user,
              token: event.data.token
            });
          } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            popup.close();
            reject(new Error(event.data.error || 'Google OAuth failed'));
          }
        };

        window.addEventListener('message', messageListener);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          if (!popup.closed) {
            popup.close();
          }
          reject(new Error('Google Sign-In timed out. Please try again.'));
        }, 300000);
      });

    } catch (error) {
      throw new Error(`Google Sign-In error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope,
      access_type: 'offline',
      prompt: 'select_account',
      state: Math.random().toString(36).substring(7), // Simple CSRF protection
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  decodeCredential(credential: string): any {
    try {
      // Decode the JWT token (basic decoding for demo purposes)
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

export const googleOAuth2Service = new GoogleOAuth2Service();