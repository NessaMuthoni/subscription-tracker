'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          // Send error message to parent window
          window.opener?.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: `Google OAuth error: ${error}`
          }, window.location.origin);
          window.close();
          return;
        }

        if (!code) {
          window.opener?.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: 'No authorization code received from Google'
          }, window.location.origin);
          window.close();
          return;
        }

        // Send code to backend for token exchange
        const backendURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
        console.log('Sending code to backend:', backendURL);
        console.log('Authorization code:', code);
        
        const response = await fetch(`${backendURL}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        }).catch(err => {
          console.error('Fetch error:', err);
          throw new Error(`Network error: ${err.message}. Make sure backend is running on port 8080`);
        });

        console.log('Backend response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Backend error response:', errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            throw new Error(`Backend error (${response.status}): ${errorText}`);
          }
          throw new Error(errorData.error || 'Failed to authenticate with Google');
        }

        const responseData = await response.json();
        console.log('Backend response data:', responseData);
        const { user, token } = responseData;

        // Send success message to parent window
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_SUCCESS',
          user: {
            email: user.email,
            name: user.name,
            picture: user.picture
          },
          token
        }, window.location.origin);

        window.close();
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, window.location.origin);
        window.close();
      }
    };

    handleGoogleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing Google Sign-In...</p>
      </div>
    </div>
  );
}