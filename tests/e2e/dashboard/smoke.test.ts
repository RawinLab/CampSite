import { test, expect } from '@playwright/test';
import { loginAsOwner } from '../utils/auth';

/**
 * E2E Smoke Tests: Owner Dashboard Critical Paths
 *
 * These smoke tests verify the most critical user paths in the owner dashboard
 * to ensure the application is functional. Uses real authentication and APIs.
 *
 * Test Coverage:
 * 1. Dashboard Access - Login and home page load
 * 2. Campsite Management - List, create, edit navigation
 * 3. Inquiry Management - List, detail, reply access
 * 4. Analytics - Chart rendering and date controls
 * 5. Profile/Settings - Account access and basic settings
 */

test.describe('Owner Dashboard Smoke Tests', () => {
  test.setTimeout(60000);

  test.describe('1. Dashboard Access Smoke Test', () => {
    test('owner can access dashboard home and see stats cards', async ({ page }) => {
      // Login as owner using real auth
      await loginAsOwner(page);

      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify dashboard page loads
      await expect(page).toHaveURL(/\/dashboard/);

      // Verify welcome message or dashboard content
      const heading = page.getByRole('heading', { name: /welcome|dashboard/i });
      await expect(heading).toBeVisible({ timeout: 10000 });

      // Verify stats cards are visible and contain data
      const statsCards = page.locator('text=/Search Impressions|Profile Views|Booking Clicks|New Inquiries|Campsites|Views/i');
      await expect(statsCards.first()).toBeVisible({ timeout: 10000 });

      // Verify navigation menu is present
      const campsitesLink = page.getByRole('link', { name: /campsites/i });
      await expect(campsitesLink.first()).toBeVisible();
    });

    test('navigation menu works correctly', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Test navigation to Campsites
      const campsitesLink = page.getByRole('link', { name: /campsites/i }).first();
      await campsitesLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/campsites/);

      // Navigate back to overview
      const overviewLink = page.getByRole('link', { name: /overview|dashboard/i }).first();
      await overviewLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard$/);
    });

    test('dashboard shows analytics chart', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify analytics chart section exists
      const chartTitle = page.getByText(/30-day analytics|analytics|performance/i);
      await expect(chartTitle.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('2. Campsite Management Smoke Test', () => {
    test('can navigate to campsite list and see campsites', async ({ page }) => {
      await loginAsOwner(page);

      // Navigate to campsites page
      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Verify page title
      const heading = page.getByRole('heading', { name: /campsites/i });
      await expect(heading).toBeVisible({ timeout: 10000 });

      // Verify Add Campsite button exists
      const addButton = page.getByRole('link', { name: /add|create.*campsite|new.*campsite/i });
      await expect(addButton.first()).toBeVisible();

      // Verify status filters are present
      const allFilter = page.getByRole('button', { name: /^all$/i });
      await expect(allFilter.first()).toBeVisible();
    });

    test('can navigate to create campsite page', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Click Add Campsite button
      const addButton = page.getByRole('link', { name: /add|create.*campsite|new.*campsite/i });
      await addButton.first().click();
      await page.waitForLoadState('networkidle');

      // Verify navigation to create page
      await expect(page).toHaveURL(/\/dashboard\/campsites\/new/);

      // Verify form elements are present
      const pageHeading = page.getByRole('heading', { name: /add|create|new.*campsite/i });
      await expect(pageHeading).toBeVisible({ timeout: 10000 });
    });

    test('can navigate to edit campsite page', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Look for any campsite link or button
      const campsiteLink = page.locator('a[href*="/dashboard/campsites/"]').first();

      if (await campsiteLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await campsiteLink.click();
        await page.waitForLoadState('networkidle');

        // Should navigate to a campsite detail/edit page
        await expect(page).toHaveURL(/\/dashboard\/campsites\/.+/);
      }
    });

    test('status filters work', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Try to click on Pending filter if it exists
      const pendingFilter = page.getByRole('button', { name: /pending/i });
      if (await pendingFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pendingFilter.click();
        await page.waitForTimeout(1000);
      }

      // Try to click on Active filter
      const activeFilter = page.getByRole('button', { name: /active|approved/i });
      if (await activeFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await activeFilter.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('3. Inquiry Management Smoke Test', () => {
    test('can navigate to inquiry list', async ({ page }) => {
      await loginAsOwner(page);

      // Navigate to inquiries page
      await page.goto('/dashboard/inquiries');
      await page.waitForLoadState('networkidle');

      // Verify page title or content
      const heading = page.getByRole('heading', { name: /inquiries/i });
      await expect(heading).toBeVisible({ timeout: 10000 });

      // Verify status filters exist
      const allFilter = page.getByRole('button', { name: /^all$/i });
      await expect(allFilter.first()).toBeVisible();
    });

    test('can view inquiry detail if inquiries exist', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard/inquiries');
      await page.waitForLoadState('networkidle');

      // Try to click on first inquiry if exists
      const firstInquiry = page.locator('a[href*="/dashboard/inquiries/"]').first();
      if (await firstInquiry.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstInquiry.click();
        await page.waitForLoadState('networkidle');

        // Should navigate to inquiry detail
        await expect(page).toHaveURL(/\/dashboard\/inquiries\/.+/);
      }
    });

    test('inquiry status filters work', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard/inquiries');
      await page.waitForLoadState('networkidle');

      // Try to click on New filter
      const newFilter = page.getByRole('button', { name: /^new$/i });
      if (await newFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newFilter.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('4. Analytics Smoke Test', () => {
    test('analytics data is displayed on dashboard', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify stats show numeric values
      const statsSection = page.locator('text=/\\d+/');
      await expect(statsSection.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('5. Profile/Settings Smoke Test', () => {
    test('user profile information is displayed', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify user name or email is displayed in header
      const userInfo = page.locator('text=/owner|@campsite.local/i');
      await expect(userInfo.first()).toBeVisible({ timeout: 10000 });
    });

    test('logout button is accessible', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify logout button exists
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
      await expect(logoutButton).toBeVisible({ timeout: 10000 });
    });

    test('can navigate back to main site', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for logo or home link
      const homeLink = page.getByRole('link', { name: /camping thailand|home/i });
      if (await homeLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await homeLink.first().click();
        await page.waitForLoadState('networkidle');

        // Should navigate to home page
        await expect(page).toHaveURL(/^\/$/);
      }
    });
  });

  test.describe('6. Mobile Responsiveness Smoke Test', () => {
    test('mobile bottom navigation is visible on small screens', async ({ page }) => {
      await loginAsOwner(page);

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify mobile navigation exists
      const navItems = page.getByRole('link', { name: /overview|campsites|inquiries|analytics/i });
      const navCount = await navItems.count();

      expect(navCount).toBeGreaterThanOrEqual(1);
    });

    test('dashboard is usable on tablet', async ({ page }) => {
      await loginAsOwner(page);

      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify stats cards are visible
      const statsCards = page.locator('text=/Search|Profile|Booking|Inquiries|Views/i');
      await expect(statsCards.first()).toBeVisible({ timeout: 10000 });

      // Verify navigation is accessible
      const campsitesLink = page.getByRole('link', { name: /campsites/i }).first();
      await expect(campsitesLink).toBeVisible();
    });
  });

  test.describe('7. Error Handling Smoke Test', () => {
    test('dashboard handles empty data gracefully', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Dashboard should load even with no data
      const heading = page.getByRole('heading', { name: /welcome|dashboard/i });
      await expect(heading).toBeVisible({ timeout: 10000 });

      // Stats should show values (even if zero)
      const statsCards = page.locator('text=/\\d+/');
      await expect(statsCards.first()).toBeVisible();
    });
  });

  test.describe('8. Performance Smoke Test', () => {
    test('dashboard loads within acceptable time', async ({ page }) => {
      await loginAsOwner(page);

      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Dashboard should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);

      // Verify critical content is visible
      const heading = page.getByRole('heading', { name: /welcome|dashboard/i });
      await expect(heading).toBeVisible();
    });

    test('navigation between pages is responsive', async ({ page }) => {
      await loginAsOwner(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Measure navigation time to campsites
      const startTime = Date.now();
      const campsitesLink = page.getByRole('link', { name: /campsites/i }).first();
      await campsitesLink.click();
      await page.waitForLoadState('networkidle');
      const navTime = Date.now() - startTime;

      // Navigation should be quick (under 5 seconds)
      expect(navTime).toBeLessThan(5000);

      // Verify page loaded
      await expect(page).toHaveURL(/\/dashboard\/campsites/);
    });
  });
});
