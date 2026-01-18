/**
 * E2E Test Authentication Utilities
 *
 * Shared utilities for real authentication in E2E tests.
 * Uses the new API-based authentication flow instead of direct Supabase calls.
 */

import { Page, BrowserContext } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test user credentials - must be created via seeding script
export const TEST_USERS = {
  admin: {
    email: 'admin@campsite.local',
    password: 'Admin123!',
    role: 'admin',
  },
  owner: {
    email: 'owner@campsite.local',
    password: 'Owner123!',
    role: 'owner',
  },
  user: {
    email: 'user@campsite.local',
    password: 'User123!',
    role: 'user',
  },
} as const;

export type UserRole = keyof typeof TEST_USERS;

// API base URL
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3091';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3090';

// Token storage keys used by the new auth system
const ACCESS_TOKEN_KEY = 'campsite_access_token';
const REFRESH_TOKEN_KEY = 'campsite_refresh_token';
const TOKEN_EXPIRY_KEY = 'campsite_token_expiry';

/**
 * Create Supabase admin client for test data manipulation
 */
export function createSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Login via API injection (bypassing UI form)
 * Uses the new API-based authentication flow and injects tokens directly
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 15000 } = options;

  // Login via backend API to get tokens
  const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!loginResponse.ok) {
    const error = await loginResponse.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(`Login failed: ${error.error || error.message || 'Unknown error'}`);
  }

  const data = await loginResponse.json();

  if (!data.session) {
    throw new Error('No session returned from login');
  }

  console.log(`Logged in as ${email}, injecting tokens into page`);

  // Get browser context for setting cookies
  const context = page.context();

  // Set cookies for SSR auth (critical - server reads cookies, not localStorage)
  await context.addCookies([
    {
      name: 'campsite_access_token',
      value: data.session.access_token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'campsite_refresh_token',
      value: data.session.refresh_token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // Navigate to frontend to establish page context
  await page.goto(`${FRONTEND_URL}/`);
  await page.waitForLoadState('domcontentloaded', { timeout });

  // Inject tokens into localStorage for client-side auth
  await page.evaluate((tokenData) => {
    localStorage.setItem('campsite_access_token', tokenData.access);
    localStorage.setItem('campsite_refresh_token', tokenData.refresh);
    localStorage.setItem('campsite_token_expiry', tokenData.expiry);
  }, {
    access: data.session.access_token,
    refresh: data.session.refresh_token,
    expiry: (data.session.expires_at * 1000).toString(),
  });

  // Verify tokens were stored in localStorage
  const hasTokens = await page.evaluate(() => {
    return Boolean(
      localStorage.getItem('campsite_access_token') &&
      localStorage.getItem('campsite_refresh_token') &&
      localStorage.getItem('campsite_token_expiry')
    );
  });

  if (!hasTokens) {
    throw new Error('Failed to inject tokens into localStorage');
  }

  console.log('Tokens and cookies injected, reloading page for auth to initialize');

  // Reload the page so SSR can pick up the auth cookies
  await page.reload({ waitUntil: 'networkidle' });

  // Wait a bit more for auth context to fully initialize
  await page.waitForTimeout(1000);

  console.log('Auth ready');
}

/**
 * Login as a specific role
 */
export async function loginAs(
  page: Page,
  role: UserRole,
  options: { timeout?: number } = {}
): Promise<void> {
  const user = TEST_USERS[role];
  await loginViaUI(page, user.email, user.password, options);
}

/**
 * Login as admin
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAs(page, 'admin');
}

/**
 * Login as owner
 */
export async function loginAsOwner(page: Page): Promise<void> {
  await loginAs(page, 'owner');
}

/**
 * Login as regular user
 */
export async function loginAsUser(page: Page): Promise<void> {
  await loginAs(page, 'user');
}

/**
 * Logout user
 * Clears tokens from localStorage and cookies
 */
export async function logout(page: Page): Promise<void> {
  // Try to find and click logout button
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("ออกจากระบบ")');

  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click();
    await page.waitForTimeout(1000);
  } else {
    // Navigate to login page to reset auth state
    await page.goto(`${FRONTEND_URL}/auth/login`);
  }

  // Clear local storage and session storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Clear auth cookies by setting them to expired
  await page.context().clearCookies();
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for auth-related elements
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")');
  const loginButton = page.locator('a:has-text("Login"), a:has-text("เข้าสู่ระบบ")');

  const hasLogout = await logoutButton.isVisible().catch(() => false);
  const hasLogin = await loginButton.isVisible().catch(() => false);

  return hasLogout && !hasLogin;
}

/**
 * Wait for auth state to be ready
 */
export async function waitForAuthReady(page: Page, timeout = 5000): Promise<void> {
  await page.waitForTimeout(Math.min(timeout, 2000));
}

/**
 * Get auth token from browser storage
 * Uses the new token storage keys
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return page.evaluate((key) => {
    return localStorage.getItem(key);
  }, ACCESS_TOKEN_KEY);
}

/**
 * Get all auth tokens from browser storage
 */
export async function getAuthTokens(page: Page): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
}> {
  return page.evaluate((keys) => {
    return {
      accessToken: localStorage.getItem(keys.access),
      refreshToken: localStorage.getItem(keys.refresh),
      expiresAt: localStorage.getItem(keys.expiry),
    };
  }, {
    access: ACCESS_TOKEN_KEY,
    refresh: REFRESH_TOKEN_KEY,
    expiry: TOKEN_EXPIRY_KEY,
  });
}

/**
 * Setup auth state in browser context for faster login
 * Use this to avoid UI login in each test
 * NOTE: Uses the new API-based authentication flow
 */
export async function setupAuthState(
  context: BrowserContext,
  role: UserRole
): Promise<void> {
  const user = TEST_USERS[role];

  // Login via backend API to get tokens
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(`Failed to login as ${role}: ${error.error || error.message}`);
  }

  const data = await response.json();

  if (!data.session) {
    throw new Error(`No session returned for ${role}`);
  }

  // Inject auth tokens into browser localStorage
  await context.addInitScript((tokenData) => {
    localStorage.setItem(tokenData.keys.access, tokenData.session.access_token);
    localStorage.setItem(tokenData.keys.refresh, tokenData.session.refresh_token);
    localStorage.setItem(tokenData.keys.expiry, (tokenData.session.expires_at * 1000).toString());
  }, {
    session: data.session,
    keys: {
      access: ACCESS_TOKEN_KEY,
      refresh: REFRESH_TOKEN_KEY,
      expiry: TOKEN_EXPIRY_KEY,
    },
  });

  // Also set cookies for SSR auth
  await context.addCookies([
    {
      name: 'campsite_access_token',
      value: data.session.access_token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'campsite_refresh_token',
      value: data.session.refresh_token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Login via API directly (faster than UI)
 * Returns the session data
 */
export async function loginViaAPI(
  email: string,
  password: string
): Promise<{ session: any; user: any }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(error.error || error.message || 'Login failed');
  }

  return response.json();
}
