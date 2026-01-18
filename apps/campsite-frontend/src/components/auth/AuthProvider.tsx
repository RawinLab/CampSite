'use client';

import { useEffect } from 'react';
import { setTokens } from '@/lib/auth/token';

/**
 * AuthProvider component that handles OAuth callback token storage.
 * This component should be placed at the root of the app to catch
 * the auth_callback_data cookie from OAuth callbacks.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check for OAuth callback data in cookies
    const cookies = document.cookie.split(';');
    const authCallbackCookie = cookies.find((c) => c.trim().startsWith('auth_callback_data='));

    if (authCallbackCookie) {
      try {
        const value = authCallbackCookie.split('=')[1];
        const data = JSON.parse(decodeURIComponent(value));

        if (data.access_token && data.refresh_token) {
          // Store the tokens
          setTokens({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_at * 1000, // Convert to milliseconds
          });

          // Clear the cookie
          document.cookie = 'auth_callback_data=; path=/; max-age=0';

          // Refresh the page to update auth state
          window.location.reload();
        }
      } catch (error) {
        console.error('Failed to parse auth callback data:', error);
        // Clear the invalid cookie
        document.cookie = 'auth_callback_data=; path=/; max-age=0';
      }
    }
  }, []);

  return <>{children}</>;
}
