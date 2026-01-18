/**
 * Token management for authentication
 * Handles storing, retrieving, and refreshing JWT tokens
 */

const ACCESS_TOKEN_KEY = 'campsite_access_token';
const REFRESH_TOKEN_KEY = 'campsite_refresh_token';
const TOKEN_EXPIRY_KEY = 'campsite_token_expiry';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

/**
 * Check if we're running in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Store tokens in localStorage
 */
export function setTokens(data: TokenData): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, data.expiresAt.toString());
  } catch (error) {
    console.error('Failed to store tokens:', error);
  }
}

/**
 * Get the current access token
 */
export function getAccessToken(): string | null {
  if (!isBrowser()) return null;

  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
}

/**
 * Get the current refresh token
 */
export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;

  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
}

/**
 * Get all token data
 */
export function getTokens(): TokenData | null {
  if (!isBrowser()) return null;

  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (!accessToken || !refreshToken || !expiresAt) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      expiresAt: parseInt(expiresAt, 10),
    };
  } catch (error) {
    console.error('Failed to get tokens:', error);
    return null;
  }
}

/**
 * Clear all stored tokens
 */
export function clearTokens(): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
}

/**
 * Check if the access token is expired or will expire soon
 * @param bufferMs - Buffer time in milliseconds before actual expiry (default: 60 seconds)
 */
export function isTokenExpired(bufferMs: number = 60000): boolean {
  if (!isBrowser()) return true;

  try {
    const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiresAt) return true;

    const expiryTime = parseInt(expiresAt, 10);
    return Date.now() >= expiryTime - bufferMs;
  } catch (error) {
    console.error('Failed to check token expiry:', error);
    return true;
  }
}

/**
 * Check if user has valid tokens stored
 */
export function hasValidTokens(): boolean {
  const tokens = getTokens();
  if (!tokens) return false;
  return !isTokenExpired();
}

/**
 * Parse JWT token to extract payload (without verification)
 * This is for client-side use only - server should always verify the token
 */
export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

/**
 * Get user ID from the access token (if available)
 */
export function getUserIdFromToken(): string | null {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  const payload = parseJwtPayload(accessToken);
  if (!payload) return null;

  // Supabase JWT uses 'sub' for user ID
  return (payload.sub as string) || null;
}
