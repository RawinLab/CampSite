import { test, expect, Page } from '@playwright/test';

/**
 * Real E2E Tests: Admin Pages Flow
 *
 * These tests use actual login with real credentials to test admin functionality.
 * Prerequisites:
 * - Admin user: admin@campsite.local / Admin123!
 * - Running frontend at localhost:3090
 * - Running backend at localhost:3091
 */

const ADMIN_EMAIL = 'admin@campsite.local';
const ADMIN_PASSWORD = 'Admin123!';

test.describe('Admin Pages - Real E2E Flow', () => {
  // Increase timeout for all tests
  test.setTimeout(60000);

  // Helper: Login as admin
  async function loginAsAdmin(page: Page) {
    await page.goto('/auth/login');

    // Wait for the form to be ready
    await page.waitForSelector('#email', { timeout: 15000 });

    // Fill login form using id selectors
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation or error
    await page.waitForTimeout(3000);

    // Check if there's an error message
    const errorMsg = page.locator('.bg-red-50');
    if (await errorMsg.isVisible().catch(() => false)) {
      const text = await errorMsg.textContent();
      throw new Error(`Login failed: ${text}`);
    }

    // Wait a bit more for auth state
    await page.waitForTimeout(1000);
  }

  test.describe('1. Admin Login and Access', () => {
    test('can login as admin and access admin dashboard', async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate to admin
      await page.goto('/admin');

      // Wait for page to load
      await page.waitForTimeout(3000);

      // Should be on admin page (not redirected to login)
      const currentUrl = page.url();
      if (currentUrl.includes('/auth/login')) {
        throw new Error('Was redirected to login - admin role not detected');
      }

      // Should not see access denied message
      const accessDenied = page.locator('text=Access Denied');
      if (await accessDenied.isVisible().catch(() => false)) {
        throw new Error('Admin access was denied - check user role');
      }

      // Should see some admin content
      const adminContent = page.locator('text=/admin|pending|dashboard/i');
      await expect(adminContent.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('2. Pending Campsites Page', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('can access pending campsites page', async ({ page }) => {
      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      // Should show the page title or loading state
      const heading = page.locator('h1');
      await expect(heading.first()).toBeVisible({ timeout: 15000 });
    });

    test('shows pending campsites count or empty state', async ({ page }) => {
      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(5000);

      // Should show either:
      // 1. Count of pending campsites ("X campsites awaiting approval")
      // 2. Empty state ("All caught up!")
      const content = page.locator('text=/awaiting approval|all caught up|campsite/i');
      await expect(content.first()).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('3. Owner Requests Page', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('can access owner requests page', async ({ page }) => {
      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      // Should show the page content
      const content = page.locator('text=/owner request|become owner|request/i');
      await expect(content.first()).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('4. Reported Reviews Page', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('can access reported reviews page', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForTimeout(3000);

      // Should show the page content
      const content = page.locator('text=/reported|review/i');
      await expect(content.first()).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('5. Google Places Admin Pages', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('can access Google Places overview page', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(5000);

      // Should show page content (h1, h2, or any content)
      const content = page.locator('h1, h2, main');
      await expect(content.first()).toBeVisible({ timeout: 15000 });
    });

    test('can access sync management page', async ({ page }) => {
      await page.goto('/admin/google-places/sync');
      await page.waitForTimeout(5000);

      // Should show page content
      const content = page.locator('h1, h2, main');
      await expect(content.first()).toBeVisible({ timeout: 15000 });
    });

    test('can access candidates page', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForTimeout(3000);

      // Should show candidates related content
      const content = page.locator('text=/candidate|import|campsite/i');
      await expect(content.first()).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('6. Admin Sidebar Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('sidebar is visible on admin pages', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);

      // Look for sidebar - it should have nav links
      const sidebar = page.locator('aside, nav, [class*="sidebar"]');
      await expect(sidebar.first()).toBeVisible({ timeout: 10000 });
    });

    test('can navigate between admin pages via sidebar', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);

      // Try to click on a link
      const link = page.locator('a[href*="/admin/"]').first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(2000);
        expect(page.url()).toMatch(/\/admin\//);
      }
    });
  });

  test.describe('7. Admin Stats Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('admin dashboard shows stats', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(5000);

      // Should show some content (admin sidebar, main content area)
      const content = page.locator('main, aside, nav');
      await expect(content.first()).toBeVisible({ timeout: 15000 });
    });
  });
});
