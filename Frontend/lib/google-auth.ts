// Google OAuth service for handling Google Sign-In
declare global {
  interface Window {
    google: any;
    googleSignInCallback: (response: any) => void;
  }
}

export class GoogleAuthService {
  private clientId: string;
  private isInitialized: boolean = false;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || !this.clientId || this.clientId === 'your-google-client-id') {
      throw new Error('Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local');
    }

    return new Promise((resolve, reject) => {
      // Check if Google script is already loaded
      if (window.google && window.google.accounts) {
        this.isInitialized = true;
        resolve();
        return;
      }

      // Load the Google Sign-In script with error handling
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        try {
          if (window.google && window.google.accounts) {
            this.isInitialized = true;
            resolve();
          } else {
            reject(new Error('Google Sign-In failed to initialize properly'));
          }
        } catch (error) {
          reject(new Error('Google Sign-In initialization error: ' + error));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Sign-In script. Check your internet connection and Google Client ID configuration.'));
      };
      
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<{ email: string; name: string; picture?: string } | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      try {
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response: any) => {
            if (response.credential) {
              const userData = this.decodeCredential(response.credential);
              if (userData) {
                resolve({
                  email: userData.email,
                  name: userData.name,
                  picture: userData.picture
                });
              } else {
                reject(new Error('Failed to decode user data from Google'));
              }
            } else {
              reject(new Error('No credential received from Google'));
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Use a more reliable method to trigger the sign-in
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            reject(new Error('Google Sign-In popup was blocked. Please check your popup blocker settings and ensure this domain is authorized in Google Cloud Console.'));
          } else if (notification.isSkippedMoment()) {
            reject(new Error('Google Sign-In was skipped. Please try clicking the button again.'));
          } else if (notification.isDismissedMoment()) {
            reject(new Error('Google Sign-In was dismissed by user.'));
          }
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('CORS')) {
            reject(new Error('CORS error: Please ensure localhost:3000 is added to authorized origins in Google Cloud Console.'));
          } else if (error.message.includes('network')) {
            reject(new Error('Network error: Please check your internet connection and Google Cloud Console configuration.'));
          } else {
            reject(new Error('Google Sign-In error: ' + error.message));
          }
        } else {
          reject(new Error('Unknown Google Sign-In error occurred.'));
        }
      }
    });
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

export const googleAuthService = new GoogleAuthService();