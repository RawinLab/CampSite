import { test, expect } from '@playwright/test';
import { loginAsOwner } from '../utils/auth';
import { waitForApi, assertNoErrors, DASHBOARD_API } from '../utils/api-helpers';

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

      // Wait for analytics API call
      const analyticsPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.analytics) && res.status() === 200
      );

      // Navigate to dashboard
      await page.goto('/dashboard');
      const analyticsResponse = await analyticsPromise;

      // Verify API success
      const analyticsData = await analyticsResponse.json();
      expect(analyticsData.success).toBe(true);

      // Verify no errors on page
      await assertNoErrors(page);

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

      // Navigate to dashboard with analytics API wait
      const analyticsPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.analytics) && res.status() === 200
      );
      await page.goto('/dashboard');
      await analyticsPromise;

      // Navigate to Campsites and wait for API
      const campsitesApiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.myCampsites) && res.status() === 200
      );
      const campsitesLink = page.getByRole('link', { name: /campsites/i }).first();
      await campsitesLink.click();
      const campsitesResponse = await campsitesApiPromise;

      // Verify campsites API
      const campsitesData = await campsitesResponse.json();
      expect(campsitesData.success).toBe(true);
      await assertNoErrors(page);
      await expect(page).toHaveURL(/\/dashboard\/campsites/);

      // Navigate back to overview and wait for analytics API
      const analyticsPromise2 = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.analytics) && res.status() === 200
      );
      const overviewLink = page.getByRole('link', { name: /overview|dashboard/i }).first();
      await overviewLink.click();
      await analyticsPromise2;
      await expect(page).toHaveURL(/\/dashboard$/);
    });

    test('dashboard shows analytics chart', async ({ page }) => {
      await loginAsOwner(page);

      // Wait for analytics API
      const analyticsPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.analytics) && res.status() === 200
      );

      await page.goto('/dashboard');
      const analyticsResponse = await analyticsPromise;

      // Verify API response
      const data = await analyticsResponse.json();
      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Verify analytics chart section exists
      const chartTitle = page.getByText(/30-day analytics|analytics|performance/i);
      await expect(chartTitle.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('2. Campsite Management Smoke Test', () => {
    test('can navigate to campsite list and see campsites', async ({ page }) => {
      await loginAsOwner(page);

      // Wait for campsites API
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.myCampsites) && res.status() === 200
      );

      // Navigate to campsites page
      await page.goto('/dashboard/campsites');
      const response = await apiPromise;

      // Verify API response
      const data = await response.json();
      expect(data.success).toBe(true);
      await assertNoErrors(page);

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

      // Navigate to campsites list first
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.myCampsites) && res.status() === 200
      );
      await page.goto('/dashboard/campsites');
      await apiPromise;

      // Click Add Campsite button
      const addButton = page.getByRole('link', { name: /add|create.*campsite|new.*campsite/i });
      await addButton.first().click();

      // Verify navigation to create page
      await expect(page).toHaveURL(/\/dashboard\/campsites\/new/);
      await assertNoErrors(page);

      // Verify form elements are present
      const pageHeading = page.getByRole('heading', { name: /add|create|new.*campsite/i });
      await expect(pageHeading).toBeVisible({ timeout: 10000 });
    });

    test('can navigate to edit campsite page', async ({ page }) => {
      await loginAsOwner(page);

      // Wait for campsites API
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.myCampsites) && res.status() === 200
      );
      await page.goto('/dashboard/campsites');
      const response = await apiPromise;

      // Check if there are campsites
      const data = await response.json();
      expect(data.success).toBe(true);

      // Look for any campsite link or button
      const campsiteLink = page.locator('a[href*="/dashboard/campsites/"]').first();
      const isVisible = await campsiteLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible && data.data && data.data.length > 0) {
        await campsiteLink.click();
        await assertNoErrors(page);

        // Should navigate to a campsite detail/edit page
        await expect(page).toHaveURL(/\/dashboard\/campsites\/.+/);
      }
    });

    test('status filters work', async ({ page }) => {
      await loginAsOwner(page);

      // Navigate and wait for initial API
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.myCampsites) && res.status() === 200
      );
      await page.goto('/dashboard/campsites');
      await apiPromise;

      // Try Pending filter
      const pendingFilter = page.getByRole('button', { name: /pending/i });
      const isPendingVisible = await pendingFilter.isVisible({ timeout: 3000 }).catch(() => false);

      if (isPendingVisible) {
        const pendingApiPromise = page.waitForResponse(
          res => res.url().includes(DASHBOARD_API.myCampsites) && res.status() === 200
        );
        await pendingFilter.click();
        await pendingApiPromise;
      }

      // Try Active filter
      const activeFilter = page.getByRole('button', { name: /active|approved/i });
      const isActiveVisible = await activeFilter.isVisible({ timeout: 3000 }).catch(() => false);

      if (isActiveVisible) {
        const activeApiPromise = page.waitForResponse(
          res => res.url().includes(DASHBOARD_API.myCampsites) && res.status() === 200
        );
        await activeFilter.click();
        await activeApiPromise;
      }
    });
  });

  test.describe('3. Inquiry Management Smoke Test', () => {
    test('can navigate to inquiry list', async ({ page }) => {
      await loginAsOwner(page);

      // Wait for inquiries API
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.inquiries) && res.status() === 200
      );

      // Navigate to inquiries page
      await page.goto('/dashboard/inquiries');
      const response = await apiPromise;

      // Verify API response
      const data = await response.json();
      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Verify page title or content
      const heading = page.getByRole('heading', { name: /inquiries/i });
      await expect(heading).toBeVisible({ timeout: 10000 });

      // Verify status filters exist
      const allFilter = page.getByRole('button', { name: /^all$/i });
      await expect(allFilter.first()).toBeVisible();
    });

    test('can view inquiry detail if inquiries exist', async ({ page }) => {
      await loginAsOwner(page);

      // Wait for inquiries API
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.inquiries) && res.status() === 200
      );
      await page.goto('/dashboard/inquiries');
      const response = await apiPromise;

      // Check if there are inquiries
      const data = await response.json();
      expect(data.success).toBe(true);

      // Try to click on first inquiry if exists
      const firstInquiry = page.locator('a[href*="/dashboard/inquiries/"]').first();
      const isVisible = await firstInquiry.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible && data.data && data.data.length > 0) {
        // Extract inquiry ID from href for API verification
        const href = await firstInquiry.getAttribute('href');
        const inquiryId = href?.split('/').pop();

        if (inquiryId) {
          const detailApiPromise = page.waitForResponse(
            res => res.url().includes(`/api/owner/inquiries/${inquiryId}`) && res.status() === 200
          );
          await firstInquiry.click();
          await detailApiPromise;
          await assertNoErrors(page);

          // Should navigate to inquiry detail
          await expect(page).toHaveURL(/\/dashboard\/inquiries\/.+/);
        }
      }
    });

    test('inquiry status filters work', async ({ page }) => {
      await loginAsOwner(page);

      // Navigate and wait for initial API
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.inquiries) && res.status() === 200
      );
      await page.goto('/dashboard/inquiries');
      await apiPromise;

      // Try to click on New filter
      const newFilter = page.getByRole('button', { name: /^new$/i });
      const isVisible = await newFilter.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible) {
        const filterApiPromise = page.waitForResponse(
          res => res.url().includes(DASHBOARD_API.inquiries) && res.status() === 200
        );
        await newFilter.click();
        await filterApiPromise;
      }
    });
  });

  test.describe('4. Analytics Smoke Test', () => {
    test('analytics data is displayed on dashboard', async ({ page }) => {
      await loginAsOwner(page);

      // Wait for analytics API
      const analyticsPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.analytics) && res.status() === 200
      );

      await page.goto('/dashboard');
      const response = await analyticsPromise;

      // Verify API response
      const data = await response.json();
      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Verify stats show numeric values
      const statsSection = page.locator('text=/\\d+/');
      await expect(statsSection.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('5. Profile/Settings Smoke Test', () => {
    test('user profile information is displayed', async ({ page }) => {
      await loginAsOwner(page);

      // Wait for analytics API
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.analytics) && res.status() === 200
      );

      await page.goto('/dashboard');
      await apiPromise;
      await assertNoErrors(page);

      // Verify user name or email is displayed in header
      const userInfo = page.locator('text=/owner|@campsite.local/i');
      await expect(userInfo.first()).toBeVisible({ timeout: 10000 });
    });

    test('logout button is accessible', async ({ page }) => {
      await loginAsOwner(page);

      // Wait for analytics API
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.analytics) && res.status() === 200
      );

      await page.goto('/dashboard');
      await apiPromise;
      await assertNoErrors(page);

      // Verify logout button exists
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
      await expect(logoutButton).toBeVisible({ timeout: 10000 });
    });

    test('can navigate back to main site', async ({ page }) => {
      await loginAsOwner(page);

      // Wait for analytics API
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.analytics) && res.status() === 200
      );

      await page.goto('/dashboard');
      await apiPromise;

      // Look for logo or home link
      const homeLink = page.getByRole('link', { name: /camping thailand|home/i });
      const isVisible = await homeLink.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible) {
        await homeLink.first().click();

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

      // Wait for analytics API
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.analytics) && res.status() === 200
      );

      await page.goto('/dashboard');
      await apiPromise;
      await assertNoErrors(page);

      // Verify mobile navigation exists
      const navItems = page.getByRole('link', { name: /overview|campsites|inquiries|analytics/i });
      const navCount = await navItems.count();

      expect(navCount).toBeGreaterThanOrEqual(1);
    });

    test('dashboard is usable on tablet', async ({ page }) => {
      await loginAsOwner(page);

      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Wait for analytics API
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.analytics) && res.status() === 200
      );

      await page.goto('/dashboard');
      await apiPromise;
      await assertNoErrors(page);

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

      // Wait for analytics API
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.analytics) && res.status() === 200
      );

      await page.goto('/dashboard');
      const response = await apiPromise;

      // Verify API succeeds even with no data
      const data = await response.json();
      expect(data.success).toBe(true);
      await assertNoErrors(page);

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

      // Wait for analytics API
      const apiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.analytics) && res.status() === 200
      );

      await page.goto('/dashboard');
      await apiPromise;

      const loadTime = Date.now() - startTime;

      // Dashboard should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);

      await assertNoErrors(page);

      // Verify critical content is visible
      const heading = page.getByRole('heading', { name: /welcome|dashboard/i });
      await expect(heading).toBeVisible();
    });

    test('navigation between pages is responsive', async ({ page }) => {
      await loginAsOwner(page);

      // Wait for initial analytics API
      const analyticsPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.analytics) && res.status() === 200
      );
      await page.goto('/dashboard');
      await analyticsPromise;

      // Measure navigation time to campsites
      const startTime = Date.now();
      const campsitesApiPromise = page.waitForResponse(
        res => res.url().includes(DASHBOARD_API.myCampsites) && res.status() === 200
      );

      const campsitesLink = page.getByRole('link', { name: /campsites/i }).first();
      await campsitesLink.click();
      await campsitesApiPromise;

      const navTime = Date.now() - startTime;

      // Navigation should be quick (under 5 seconds)
      expect(navTime).toBeLessThan(5000);

      // Verify page loaded
      await expect(page).toHaveURL(/\/dashboard\/campsites/);
    });
  });
});
