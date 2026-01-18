import { cookies } from 'next/headers';
import type { UserRole } from '@campsite/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3091';

export interface ServerAuthUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
}

export interface ServerSession {
  access_token: string;
  user: ServerAuthUser;
}

/**
 * Get the current session from cookies (for server-side use)
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('campsite_access_token')?.value;

  if (!accessToken) {
    return null;
  }

  try {
    // Verify the token and get user data from backend
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Handle both possible response formats
    const user = data.user || data.profile;
    if (!user) {
      return null;
    }

    return {
      access_token: accessToken,
      user: {
        id: user.id || user.auth_user_id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        role: user.role || user.user_role || 'user',
      },
    };
  } catch (error) {
    console.error('Failed to get server session:', error);
    return null;
  }
}

/**
 * Get the access token from cookies (for server-side API calls)
 */
export async function getServerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('campsite_access_token')?.value || null;
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isServerAuthenticated(): Promise<boolean> {
  const session = await getServerSession();
  return session !== null;
}
