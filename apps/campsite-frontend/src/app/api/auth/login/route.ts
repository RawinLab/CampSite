import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3091';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Call the backend API to login
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Login failed' },
        { status: response.status }
      );
    }

    // Create response with session data
    const res = NextResponse.json(data);

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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
