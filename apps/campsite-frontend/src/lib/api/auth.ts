/**
 * Authentication API service
 * All auth operations go through the backend API
 */

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isTokenExpired,
} from '@/lib/auth/token';
import type { UserRole, OwnerRequestInput } from '@campsite/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3091';

// Types for API responses
export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  email_confirmed_at: string | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp in seconds
  expires_in: number; // Seconds until expiry
  token_type: string;
  user: AuthUser;
}

export interface LoginResponse {
  session: AuthSession;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user?: AuthUser;
  session?: AuthSession;
}

export interface MeResponse {
  user: AuthUser;
}

export interface RefreshResponse {
  session: AuthSession;
}

// Profile types (from previous implementation)
export interface Profile {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  user_role: 'admin' | 'owner' | 'user';
  role: 'admin' | 'owner' | 'user';
  created_at: string;
  updated_at: string;
}

export interface OwnerRequest {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string;
  contact_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface ProfileResponse {
  profile: Profile;
}

export interface OwnerRequestsResponse {
  requests: OwnerRequest[];
}

export interface OwnerRequestSubmitResponse {
  message: string;
  request: OwnerRequest;
}

/**
 * Helper to make authenticated API requests
 */
async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: `Request failed with status ${response.status}`,
    }));
    throw new Error(errorData.error || errorData.message || 'Request failed');
  }

  return response.json();
}

// =====================
// Authentication APIs
// =====================

/**
 * Login with email and password
 * Uses the Next.js API route to ensure cookies are set for SSR auth
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  // Call Next.js API route to set cookies
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'Login failed',
    }));
    throw new Error(errorData.error || errorData.message || 'Login failed');
  }

  const data: LoginResponse = await response.json();

  // Store tokens in localStorage for client-side use
  if (data.session) {
    setTokens({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at * 1000, // Convert to milliseconds
    });
  }

  return data;
}

/**
 * Register a new user
 * Uses the Next.js API route to ensure cookies are set for SSR auth
 */
export async function register(data: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}): Promise<RegisterResponse> {
  // Call Next.js API route to set cookies
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'Registration failed',
    }));
    throw new Error(errorData.error || errorData.message || 'Registration failed');
  }

  const responseData: RegisterResponse = await response.json();

  // If registration returns a session (email confirmation disabled), store tokens in localStorage
  if (responseData.session) {
    setTokens({
      accessToken: responseData.session.access_token,
      refreshToken: responseData.session.refresh_token,
      expiresAt: responseData.session.expires_at * 1000,
    });
  }

  return responseData;
}

/**
 * Logout the current user
 * Uses the Next.js API route to clear cookies
 */
export async function logout(): Promise<void> {
  try {
    // Call Next.js API route to clear cookies
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Logout should succeed even if the API call fails
    console.warn('Logout API call failed:', error);
  } finally {
    clearTokens();
  }
}

/**
 * Get the current authenticated user
 */
export async function getMe(): Promise<AuthUser | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    // Check if token is expired and refresh if needed
    if (isTokenExpired()) {
      const refreshed = await refreshTokens();
      if (!refreshed) return null;
    }

    const response = await authFetch<MeResponse>('/api/auth/me');
    return response.user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Refresh the access token using the refresh token
 * Uses the Next.js API route to ensure cookies are updated
 */
export async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return false;
  }

  try {
    // Call Next.js API route to update cookies
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data: RefreshResponse = await response.json();

    // Update localStorage tokens
    setTokens({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at * 1000,
    });

    return true;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    clearTokens();
    return false;
  }
}

/**
 * Request a password reset email
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await fetch(`${API_URL}/api/auth/reset-password/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  // Always succeed to prevent email enumeration
}

/**
 * Confirm password reset with new password
 * Note: This requires the user to be authenticated via the reset link
 */
export async function confirmPasswordReset(newPassword: string): Promise<void> {
  await authFetch('/api/auth/reset-password/confirm', {
    method: 'POST',
    body: JSON.stringify({ password: newPassword }),
  });
}

/**
 * Get the URL for Google OAuth login
 */
export function getGoogleLoginUrl(redirectTo?: string): string {
  const params = new URLSearchParams();
  if (redirectTo) {
    params.set('redirect_to', redirectTo);
  }
  return `${API_URL}/api/auth/google${params.toString() ? `?${params}` : ''}`;
}

/**
 * Handle OAuth callback - exchange code for tokens
 */
export async function handleOAuthCallback(
  code: string
): Promise<LoginResponse | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      return null;
    }

    const data: LoginResponse = await response.json();

    if (data.session) {
      setTokens({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at * 1000,
      });
    }

    return data;
  } catch (error) {
    console.error('OAuth callback failed:', error);
    return null;
  }
}

/**
 * Update user password (when already authenticated)
 */
export async function updatePassword(newPassword: string): Promise<void> {
  await authFetch('/api/auth/update-password', {
    method: 'POST',
    body: JSON.stringify({ password: newPassword }),
  });
}

/**
 * Check if user is authenticated (has valid tokens)
 */
export function isAuthenticated(): boolean {
  const accessToken = getAccessToken();
  return !!accessToken && !isTokenExpired();
}

/**
 * Get auth headers for API requests
 * This is used by other API modules that need authentication
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  // Check if token is expired and refresh if needed
  if (isTokenExpired()) {
    await refreshTokens();
  }

  const accessToken = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
}

// =====================
// Profile APIs (existing)
// =====================

/**
 * Get current user profile from backend API
 */
export async function getProfile(token?: string): Promise<Profile> {
  const authToken = token || getAccessToken();
  if (!authToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch profile' }));
    throw new Error(error.error || 'Failed to fetch profile');
  }

  const result: ProfileResponse = await response.json();
  return result.profile;
}

/**
 * Update current user profile
 */
export async function updateProfile(
  token: string | undefined,
  data: { full_name?: string; phone?: string; bio?: string }
): Promise<Profile> {
  const authToken = token || getAccessToken();
  if (!authToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update profile' }));
    throw new Error(error.error || 'Failed to update profile');
  }

  const result: ProfileResponse = await response.json();
  return result.profile;
}

/**
 * Get user's owner requests
 */
export async function getOwnerRequests(token?: string): Promise<OwnerRequest[]> {
  const authToken = token || getAccessToken();
  if (!authToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/auth/owner-request`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch owner requests' }));
    throw new Error(error.error || 'Failed to fetch owner requests');
  }

  const result: OwnerRequestsResponse = await response.json();
  return result.requests;
}

/**
 * Check if user has a pending owner request
 */
export async function hasPendingOwnerRequest(token?: string): Promise<boolean> {
  try {
    const requests = await getOwnerRequests(token);
    return requests.some((r) => r.status === 'pending');
  } catch {
    return false;
  }
}

/**
 * Submit owner request
 */
export async function submitOwnerRequest(
  token: string | undefined,
  data: OwnerRequestInput
): Promise<OwnerRequest> {
  const authToken = token || getAccessToken();
  if (!authToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/auth/owner-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to submit owner request' }));
    throw new Error(error.error || 'Failed to submit owner request');
  }

  const result: OwnerRequestSubmitResponse = await response.json();
  return result.request;
}
