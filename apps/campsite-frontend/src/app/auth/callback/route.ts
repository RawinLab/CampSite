import { NextResponse } from 'next/server';

import { API_BASE_URL as API_URL } from '@/lib/api/config';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle error from OAuth provider
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/auth/auth-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`,
        requestUrl.origin
      )
    );
  }

  if (code) {
    try {
      // Exchange the code for tokens via our backend API
      const response = await fetch(`${API_URL}/api/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Backend callback error:', errorData);
        return NextResponse.redirect(
          new URL(`/auth/auth-error?error=callback_failed&description=${encodeURIComponent(errorData.error || '')}`, requestUrl.origin)
        );
      }

      const data = await response.json();

      // Create response with redirect
      const redirectResponse = NextResponse.redirect(new URL(next, requestUrl.origin));

      if (data.session) {
        const cookieOptions = {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
        };

        // Store access token in httpOnly cookie for server-side auth
        redirectResponse.cookies.set('campsite_access_token', data.session.access_token, {
          ...cookieOptions,
          httpOnly: true,
          maxAge: data.session.expires_in || 3600,
        });

        // Store refresh token in httpOnly cookie
        redirectResponse.cookies.set('campsite_refresh_token', data.session.refresh_token, {
          ...cookieOptions,
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        // Set a temporary cookie that the client can read to also store tokens in localStorage
        // This provides dual storage for both SSR and CSR scenarios
        redirectResponse.cookies.set('auth_callback_data', JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        }), {
          ...cookieOptions,
          httpOnly: false, // Client needs to read this
          maxAge: 60, // 1 minute - just long enough for the client to read it
        });
      }

      return redirectResponse;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(
        new URL('/auth/auth-error?error=callback_failed', requestUrl.origin)
      );
    }
  }

  // No code provided
  return NextResponse.redirect(
    new URL('/auth/auth-error?error=no_code', requestUrl.origin)
  );
}
