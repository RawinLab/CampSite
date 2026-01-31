import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL as API_URL } from '@/lib/api/config';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('campsite_access_token')?.value;

    // Call the backend API to logout (if we have a token)
    if (accessToken) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        // Ignore errors - we'll clear cookies anyway
        console.warn('Backend logout call failed:', error);
      }
    }

    // Create response
    const res = NextResponse.json({ success: true });

    // Clear cookies
    res.cookies.set('campsite_access_token', '', {
      path: '/',
      maxAge: 0,
    });
    res.cookies.set('campsite_refresh_token', '', {
      path: '/',
      maxAge: 0,
    });

    return res;
  } catch (error) {
    console.error('Logout error:', error);
    // Even on error, clear cookies
    const res = NextResponse.json({ success: true });
    res.cookies.set('campsite_access_token', '', { path: '/', maxAge: 0 });
    res.cookies.set('campsite_refresh_token', '', { path: '/', maxAge: 0 });
    return res;
  }
}
