import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL as API_URL } from '@/lib/api/config';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie or request body
    let refreshToken = request.cookies.get('campsite_refresh_token')?.value;

    // If not in cookies, check body (for client-side refresh)
    if (!refreshToken) {
      try {
        const body = await request.json();
        refreshToken = body.refresh_token;
      } catch {
        // No body provided
      }
    }

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Call the backend API to refresh
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Clear cookies on refresh failure
      const res = NextResponse.json(
        { error: data.error || 'Token refresh failed' },
        { status: response.status }
      );
      res.cookies.set('campsite_access_token', '', { path: '/', maxAge: 0 });
      res.cookies.set('campsite_refresh_token', '', { path: '/', maxAge: 0 });
      return res;
    }

    // Create response with new session data
    const res = NextResponse.json(data);

    if (data.session) {
      const cookieOptions = {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      };

      // Update httpOnly cookies with new tokens
      res.cookies.set('campsite_access_token', data.session.access_token, {
        ...cookieOptions,
        httpOnly: true,
        maxAge: data.session.expires_in || 3600,
      });

      res.cookies.set('campsite_refresh_token', data.session.refresh_token, {
        ...cookieOptions,
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return res;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'An error occurred during token refresh' },
      { status: 500 }
    );
  }
}
