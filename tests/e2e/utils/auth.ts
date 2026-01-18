/**
 * E2E Test Authentication Utilities
 *
 * Shared utilities for real authentication in E2E tests.
 * Uses actual Supabase auth instead of mocking.
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
 * Login via UI form
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 15000 } = options;

  await page.goto('/auth/login');
  await page.waitForSelector('#email', { timeout });

  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  // Wait for navigation or error
  await page.waitForTimeout(3000);

  // Check for error
  const errorMsg = page.locator('.bg-red-50, [role="alert"]');
  if (await errorMsg.isVisible().catch(() => false)) {
    const text = await errorMsg.textContent();
    throw new Error(`Login failed: ${text}`);
  }

  // Wait for auth state to propagate
  await page.waitForTimeout(1000);
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
 */
export async function logout(page: Page): Promise<void> {
  // Try to find and click logout button
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("ออกจากระบบ")');

  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click();
    await page.waitForTimeout(1000);
  } else {
    // Navigate to login page to reset auth state
    await page.goto('/auth/login');
  }

  // Clear local storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
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
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    // Try different storage keys used by Supabase
    const keys = [
      'supabase.auth.token',
      'sb-access-token',
      'auth-token',
    ];

    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) return value;
    }

    // Try to find in Supabase session storage
    for (const key of Object.keys(localStorage)) {
      if (key.includes('supabase') && key.includes('auth')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.access_token) return data.access_token;
        } catch {
          // ignore parse errors
        }
      }
    }

    return null;
  });
}

/**
 * Setup auth state in browser context for faster login
 * Use this to avoid UI login in each test
 */
export async function setupAuthState(
  context: BrowserContext,
  role: UserRole
): Promise<void> {
  const user = TEST_USERS[role];
  const supabase = createSupabaseAdmin();

  // Sign in via API to get session
  const { data, error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error || !data.session) {
    throw new Error(`Failed to get session for ${role}: ${error?.message}`);
  }

  // Inject auth state into browser
  await context.addInitScript((session) => {
    const storageKey = `sb-${new URL(location.href).hostname}-auth-token`;
    localStorage.setItem(storageKey, JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: session.user,
    }));
  }, data.session);
}
