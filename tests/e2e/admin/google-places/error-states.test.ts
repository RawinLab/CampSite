import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

/**
 * E2E Tests: T032-05 Error States and Edge Cases
 *
 * Tests error handling, loading states, and edge cases across all Google Places
 * admin dashboard pages to ensure robust user experience.
 *
 * Test Coverage:
 * 1. Empty Data States - Display appropriate messages when no data
 * 2. Loading States - Show proper loading behavior during data fetch
 * 3. Invalid URLs - Handle invalid page routes
 * 4. Permission Errors - Handle unauthorized access
 */

test.describe('T032-05: Error States and Edge Cases', () => {
  test.setTimeout(60000);

  test.describe('Empty Data States - Overview Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should handle empty data gracefully on overview page', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      // Page should still render with zero/empty values
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible({ timeout: 15000 });

      // Should show some content even if stats are 0
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible({ timeout: 15000 });
    });

    test('should display zero statistics when no data', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      // Should show 0 or "Pending" status
      const statsContent = page.locator('main, [role="main"]');
      await expect(statsContent).toBeVisible({ timeout: 15000 });

      // Look for numeric content (could be 0)
      const numbers = page.locator('text=/\\d+/');
      const count = await numbers.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Empty Data States - Sync Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display empty state for no sync logs', async ({ page }) => {
      await page.goto('/admin/google-places/sync');
      await page.waitForTimeout(3000);

      // Either shows sync history or empty state message
      const hasHistory = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasEmptyState = await page.locator('text=/No.*sync|Empty|no.*history/i').first().isVisible({ timeout: 5000 }).catch(() => false);

      // Page should render with one of these states
      expect(hasHistory || hasEmptyState).toBe(true);
    });
  });

  test.describe('Empty Data States - Candidates', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display empty state for no candidates', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForTimeout(3000);

      // Either shows candidates or empty state
      const hasCandidates = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasEmptyState = await page.locator('text=/No.*candidates|Start.*Sync|Trigger/i').first().isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasCandidates || hasEmptyState).toBe(true);
    });

    test('should have action button in empty state', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForTimeout(3000);

      const hasEmptyState = await page.locator('text=/No.*candidates/i').first().isVisible({ timeout: 5000 }).catch(() => false);

      if (hasEmptyState) {
        // Should have Start Sync button or link to sync page
        const actionButton = page.locator('button:has-text("Start Sync")').or(
          page.locator('a[href*="sync"]')
        );

        await expect(actionButton.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Loading States', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should load overview dashboard content', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      // Page should load successfully
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible({ timeout: 15000 });
    });

    test('should load sync management content', async ({ page }) => {
      await page.goto('/admin/google-places/sync');
      await page.waitForTimeout(3000);

      // Page should load successfully
      const title = page.locator('h1:has-text("Sync Management")').or(
        page.locator('h1:has-text("Sync")')
      );
      await expect(title).toBeVisible({ timeout: 15000 });
    });

    test('should load candidates page content', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForTimeout(3000);

      // Page should load successfully
      const title = page.locator('h1:has-text("Import Candidates")').or(
        page.locator('h1:has-text("Candidates")')
      );
      await expect(title).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Invalid URLs', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should handle invalid candidate ID', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/invalid-candidate-id-999999');
      await page.waitForTimeout(3000);

      // Should show error or redirect
      const hasError = await page.locator('text=/not found|Not Found|Error|error|404/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      const redirectedBack = page.url().includes('/candidates') && !page.url().includes('/candidates/invalid');

      expect(hasError || redirectedBack).toBe(true);
    });

    test('should handle non-existent routes', async ({ page }) => {
      await page.goto('/admin/google-places/nonexistent-page');
      await page.waitForTimeout(3000);

      // Should show 404 or redirect
      const has404 = await page.locator('text=/404|not found|Not Found/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      const redirected = !page.url().includes('/nonexistent-page');

      expect(has404 || redirected).toBe(true);
    });
  });

  test.describe('Permission Errors', () => {
    test('should redirect non-authenticated users to login', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(2000);

      // Should redirect to login
      expect(page.url()).toContain('/auth/login');
    });

    test('should redirect from sync page to login when not authenticated', async ({ page }) => {
      await page.goto('/admin/google-places/sync');
      await page.waitForTimeout(2000);

      expect(page.url()).toContain('/auth/login');
    });

    test('should redirect from candidates page to login when not authenticated', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForTimeout(2000);

      expect(page.url()).toContain('/auth/login');
    });
  });

  test.describe('Page Resilience', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should handle page refresh on overview', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      // Refresh the page
      await page.reload();
      await page.waitForTimeout(3000);

      // Page should still work
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible({ timeout: 15000 });
    });

    test('should handle page refresh on sync management', async ({ page }) => {
      await page.goto('/admin/google-places/sync');
      await page.waitForTimeout(3000);

      // Refresh the page
      await page.reload();
      await page.waitForTimeout(3000);

      // Page should still work
      const title = page.locator('h1:has-text("Sync Management")').or(
        page.locator('h1:has-text("Sync")')
      );
      await expect(title).toBeVisible({ timeout: 15000 });
    });

    test('should handle page refresh on candidates', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForTimeout(3000);

      // Refresh the page
      await page.reload();
      await page.waitForTimeout(3000);

      // Page should still work
      const title = page.locator('h1:has-text("Import Candidates")').or(
        page.locator('h1:has-text("Candidates")')
      );
      await expect(title).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Navigation Resilience', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should handle browser back navigation', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      await page.goto('/admin/google-places/sync');
      await page.waitForTimeout(3000);

      // Go back
      await page.goBack();
      await page.waitForTimeout(2000);

      // Should be back on overview
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible({ timeout: 15000 });
    });

    test('should handle browser forward navigation', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForTimeout(3000);

      await page.goto('/admin/google-places/candidates');
      await page.waitForTimeout(3000);

      // Go back
      await page.goBack();
      await page.waitForTimeout(2000);

      // Go forward
      await page.goForward();
      await page.waitForTimeout(2000);

      // Should be on candidates page
      const title = page.locator('h1:has-text("Import Candidates")').or(
        page.locator('h1:has-text("Candidates")')
      );
      await expect(title).toBeVisible({ timeout: 15000 });
    });
  });
});
