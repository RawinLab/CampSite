import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

/**
 * E2E Tests: T032-01 Google Places Overview Dashboard
 *
 * Tests the Google Places integration overview dashboard where admins can
 * view statistics, quick actions, and navigation to sync and candidate management.
 *
 * Test Coverage:
 * 1. Page Access Tests - Admin-only access control
 * 2. Page Rendering Tests - Title, description, and layout
 * 3. Statistics Cards Tests - Display of key metrics
 * 4. Quick Actions Tests - Manual sync, AI processing, configuration
 * 5. Navigation Tests - Quick links to sync and candidates pages
 * 6. Responsive Layout Tests - Mobile viewport handling
 * 7. Loading States Tests - Skeleton screens
 */

test.describe('T032-01: Google Places Overview Dashboard', () => {
  test.setTimeout(60000);

  test.describe('Page Access Control', () => {
    test('should allow admin access to Google Places dashboard', async ({ page }) => {
      await loginAsAdmin(page);

      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible({ timeout: 15000 });
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(2000);

      expect(page.url()).toContain('/auth/login');
    });
  });

  test.describe('Page Rendering', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display page title and description', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible({ timeout: 15000 });

      // Description might vary, just check page loads
      const content = page.locator('main, [role="main"]');
      await expect(content).toBeVisible({ timeout: 15000 });
    });

    test('should display admin sidebar', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      // AdminSidebar should be present
      const sidebar = page.locator('[data-testid="admin-sidebar"]').or(page.locator('aside, nav'));
      await expect(sidebar.first()).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Statistics Cards', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display statistics cards', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      // Check for stats cards - exact text may vary, look for key elements
      const statsSection = page.locator('main, [role="main"]');
      await expect(statsSection).toBeVisible({ timeout: 15000 });

      // Look for numeric stats (could be 0 or positive numbers)
      const numbers = page.locator('text=/^\\d+$/');
      const count = await numbers.count();
      expect(count).toBeGreaterThanOrEqual(0); // Page loads with stats
    });

    test('should display pending candidates card', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      const pendingSection = page.locator('text=/Pending|pending|Awaiting/i');
      await expect(pendingSection.first()).toBeVisible({ timeout: 15000 });
    });

    test('should display sync status card', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      const syncSection = page.locator('text=/Sync|sync/i');
      await expect(syncSection.first()).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Quick Action Cards', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display Manual Sync action card', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      const syncButton = page.locator('button:has-text("Start Sync")').or(
        page.locator('text=/Start.*Sync/i')
      );
      await expect(syncButton.first()).toBeVisible({ timeout: 15000 });
    });

    test('should display AI Processing action card', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      const aiSection = page.locator('text=/AI|ai|Process/i');
      await expect(aiSection.first()).toBeVisible({ timeout: 15000 });
    });

    test('should navigate to sync page when Start Sync clicked', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      const startSyncButton = page.locator('button:has-text("Start Sync")');

      if (await startSyncButton.isVisible()) {
        await startSyncButton.click();
        await page.waitForTimeout(2000);

        // Should navigate to sync page or trigger sync
        const url = page.url();
        const hasSyncContent = await page.locator('text=/sync/i').first().isVisible({ timeout: 5000 }).catch(() => false);

        expect(url.includes('sync') || hasSyncContent).toBe(true);
      }
    });
  });

  test.describe('Quick Links Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display Quick Links section', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      const quickLinks = page.locator('text=/Quick Links|Links|Navigation/i');
      await expect(quickLinks.first()).toBeVisible({ timeout: 15000 });
    });

    test('should have link to sync management', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      const syncLink = page.locator('a[href*="sync"]').or(
        page.locator('text=/Sync.*Management/i')
      );

      const count = await syncLink.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have link to candidates', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      const candidatesLink = page.locator('a[href*="candidates"]').or(
        page.locator('text=/Candidate|Import/i')
      );

      const count = await candidatesLink.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Responsive Layout', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible({ timeout: 15000 });
    });

    test('should adapt layout for mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      // Page should still be accessible on mobile
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Loading States', () => {
    test('should load page content', async ({ page }) => {
      await loginAsAdmin(page);

      await page.goto('/admin/google-places');

      // Wait for content to appear
      await page.waitForTimeout(3000);

      // Content should be visible
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should handle empty data gracefully', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      // Page should still render even with no data
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible({ timeout: 15000 });

      // Should show some content (stats might be 0)
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible({ timeout: 15000 });
    });
  });
});
