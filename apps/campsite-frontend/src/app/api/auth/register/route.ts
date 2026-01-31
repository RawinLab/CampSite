import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL as API_URL } from '@/lib/api/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Call the backend API to register
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Registration failed' },
        { status: response.status }
      );
    }

    // Create response with session data
    const res = NextResponse.json(data);

    // If registration returns a session (email confirmation disabled)
    if (data.session) {
      const cookieOptions = {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      };

      // Set httpOnly cookies for server-side auth
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
