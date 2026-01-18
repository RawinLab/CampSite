import { test, expect } from '@playwright/test';

/**
 * E2E Smoke Tests: Owner Dashboard Critical Paths
 *
 * These smoke tests verify the most critical user paths in the owner dashboard
 * to ensure the application is functional. They are designed to run quickly
 * and catch major issues before full test suites run.
 *
 * Test Coverage:
 * 1. Dashboard Access - Login and home page load
 * 2. Campsite Management - List, create, edit navigation
 * 3. Inquiry Management - List, detail, reply access
 * 4. Analytics - Chart rendering and date controls
 * 5. Profile/Settings - Account access and basic settings
 */

test.describe('Owner Dashboard Smoke Tests', () => {
  // Helper function to mock owner authentication
  async function mockOwnerLogin(page: any) {
    // Mock the session cookie and auth state
    // In a real implementation, this would use actual auth tokens
    // For smoke tests, we'll navigate directly assuming auth middleware is tested separately

    // Set up API route mocking for authenticated requests
    await page.route('**/api/auth/session', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-owner-id',
            email: 'owner@test.com',
            role: 'owner',
          },
        }),
      });
    });

    // Mock profile endpoint
    await page.route('**/api/auth/me', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'test-owner-id',
            email: 'owner@test.com',
            full_name: 'Test Owner',
            user_role: 'owner',
          },
        }),
      });
    });
  }

  // Helper function to mock dashboard stats
  async function mockDashboardStats(page: any) {
    await page.route('**/api/dashboard/stats*', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            search_impressions: 1250,
            search_impressions_change: 15.5,
            profile_views: 348,
            profile_views_change: 8.2,
            booking_clicks: 87,
            booking_clicks_change: -3.1,
            new_inquiries: 12,
            total_campsites: 5,
            active_campsites: 4,
            pending_campsites: 1,
          },
        }),
      });
    });

    await page.route('**/api/dashboard/analytics*', async (route: any) => {
      const chartData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        search_impressions: Math.floor(Math.random() * 100) + 20,
        profile_views: Math.floor(Math.random() * 50) + 10,
        booking_clicks: Math.floor(Math.random() * 20) + 5,
        inquiries: Math.floor(Math.random() * 5) + 1,
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            chartData,
          },
        }),
      });
    });

    await page.route('**/api/dashboard/campsites*', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'campsite-1',
              name: 'Mountain View Camp',
              status: 'approved',
              province: 'Chiang Mai',
              total_reviews: 24,
              average_rating: 4.5,
              views_count: 156,
            },
            {
              id: 'campsite-2',
              name: 'Beach Paradise',
              status: 'approved',
              province: 'Phuket',
              total_reviews: 18,
              average_rating: 4.8,
              views_count: 203,
            },
            {
              id: 'campsite-3',
              name: 'Forest Retreat',
              status: 'pending',
              province: 'Chiang Rai',
              total_reviews: 0,
              average_rating: 0,
              views_count: 0,
            },
          ],
          pagination: {
            total: 3,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        }),
      });
    });

    await page.route('**/api/dashboard/inquiries*', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'inquiry-1',
              campsite_id: 'campsite-1',
              campsite_name: 'Mountain View Camp',
              guest_name: 'John Doe',
              guest_email: 'john@example.com',
              inquiry_type: 'booking',
              message: 'I would like to book for 3 nights next week',
              status: 'new',
              is_read: false,
              created_at: new Date().toISOString(),
            },
            {
              id: 'inquiry-2',
              campsite_id: 'campsite-2',
              campsite_name: 'Beach Paradise',
              guest_name: 'Jane Smith',
              guest_email: 'jane@example.com',
              inquiry_type: 'general',
              message: 'Do you allow pets?',
              status: 'in_progress',
              is_read: true,
              created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          pagination: {
            total: 2,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
          unread_count: 1,
        }),
      });
    });
  }

  test.describe('1. Dashboard Access Smoke Test', () => {
    test('owner can access dashboard home and see stats cards', async ({ page }) => {
      // Mock authentication
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify dashboard page loads
      await expect(page).toHaveURL(/\/dashboard/);

      // Verify welcome message
      const heading = page.getByRole('heading', { name: /welcome/i });
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Verify stats cards are visible and contain data
      const statsCards = page.locator('text=/Search Impressions|Profile Views|Booking Clicks|New Inquiries/i');
      await expect(statsCards.first()).toBeVisible({ timeout: 5000 });

      // Verify at least 4 stat cards are present
      const cardCount = await statsCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(4);

      // Verify navigation menu is present
      const overviewLink = page.getByRole('link', { name: /overview/i });
      const campsitesLink = page.getByRole('link', { name: /campsites/i });
      const inquiriesLink = page.getByRole('link', { name: /inquiries/i });

      await expect(overviewLink).toBeVisible();
      await expect(campsitesLink).toBeVisible();
      await expect(inquiriesLink).toBeVisible();
    });

    test('navigation menu works correctly', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Test navigation to Campsites
      const campsitesLink = page.getByRole('link', { name: /campsites/i }).first();
      await campsitesLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/campsites/);

      // Navigate back to overview
      const overviewLink = page.getByRole('link', { name: /overview/i }).first();
      await overviewLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard$/);
    });

    test('dashboard shows analytics chart', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify analytics chart section exists
      const chartTitle = page.getByText(/30-day analytics|analytics/i);
      await expect(chartTitle).toBeVisible({ timeout: 5000 });

      // Verify chart legend items
      const legend = page.locator('text=/Search Impressions|Profile Views|Booking Clicks/i');
      await expect(legend.first()).toBeVisible();
    });
  });

  test.describe('2. Campsite Management Smoke Test', () => {
    test('can navigate to campsite list and see campsites', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      // Navigate to campsites page
      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Verify page title
      const heading = page.getByRole('heading', { name: /campsites/i });
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Verify Add Campsite button exists
      const addButton = page.getByRole('link', { name: /add campsite/i });
      await expect(addButton).toBeVisible();

      // Verify campsite list loads (should show at least one campsite from mock)
      const campsiteNames = page.locator('text=/Mountain View Camp|Beach Paradise|Forest Retreat/i');
      await expect(campsiteNames.first()).toBeVisible({ timeout: 5000 });

      // Verify status filters are present
      const allFilter = page.getByRole('button', { name: /^all$/i });
      const activeFilter = page.getByRole('button', { name: /active/i });
      const pendingFilter = page.getByRole('button', { name: /pending/i });

      await expect(allFilter).toBeVisible();
      await expect(activeFilter).toBeVisible();
      await expect(pendingFilter).toBeVisible();
    });

    test('can navigate to create campsite page', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Click Add Campsite button
      const addButton = page.getByRole('link', { name: /add campsite/i });
      await addButton.click();
      await page.waitForLoadState('networkidle');

      // Verify navigation to create page
      await expect(page).toHaveURL(/\/dashboard\/campsites\/new/);

      // Verify form elements are present
      const pageHeading = page.getByRole('heading', { name: /add|create|new.*campsite/i });
      await expect(pageHeading).toBeVisible({ timeout: 5000 });
    });

    test('can navigate to edit campsite page', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      // Mock single campsite endpoint
      await page.route('**/api/dashboard/campsites/campsite-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'campsite-1',
              name: 'Mountain View Camp',
              description: 'Beautiful mountain views',
              province: 'Chiang Mai',
              district: 'Mae Rim',
              price_per_night: 500,
              campsite_type: 'mountain',
              status: 'approved',
              amenities: ['wifi', 'parking', 'restroom'],
            },
          }),
        });
      });

      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Look for edit/view link or button for first campsite
      const editLink = page.getByRole('link', { name: /edit|view/i }).first();

      // If no explicit edit link, click on campsite name
      const campsiteName = page.locator('text=Mountain View Camp');
      if (await editLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editLink.click();
      } else if (await campsiteName.isVisible({ timeout: 2000 })) {
        await campsiteName.click();
      }

      await page.waitForLoadState('networkidle');

      // Verify navigation to edit/detail page
      await expect(page).toHaveURL(/\/dashboard\/campsites\/campsite-1/);
    });

    test('status filters work', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Click on Pending filter
      const pendingFilter = page.getByRole('button', { name: /pending/i });
      await pendingFilter.click();
      await page.waitForTimeout(500);

      // Verify URL updates with status parameter
      await expect(page).toHaveURL(/status=pending/);

      // Click on Active filter
      const activeFilter = page.getByRole('button', { name: /active/i });
      await activeFilter.click();
      await page.waitForTimeout(500);

      // Verify URL updates
      await expect(page).toHaveURL(/status=approved/);
    });
  });

  test.describe('3. Inquiry Management Smoke Test', () => {
    test('can navigate to inquiry list and see inquiries', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      // Navigate to inquiries page
      await page.goto('/dashboard/inquiries');
      await page.waitForLoadState('networkidle');

      // Verify page title
      const heading = page.getByRole('heading', { name: /inquiries/i });
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Verify unread count badge is visible (mocked 1 unread)
      const unreadBadge = page.locator('text=/^1$/').first();
      await expect(unreadBadge).toBeVisible({ timeout: 3000 });

      // Verify inquiry list loads
      const inquiryGuest = page.locator('text=/John Doe|Jane Smith/i');
      await expect(inquiryGuest.first()).toBeVisible({ timeout: 5000 });

      // Verify status filters
      const allFilter = page.getByRole('button', { name: /^all$/i });
      const newFilter = page.getByRole('button', { name: /new/i });
      const inProgressFilter = page.getByRole('button', { name: /in progress/i });

      await expect(allFilter).toBeVisible();
      await expect(newFilter).toBeVisible();
      await expect(inProgressFilter).toBeVisible();
    });

    test('can view inquiry detail', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      // Mock inquiry detail endpoint
      await page.route('**/api/dashboard/inquiries/inquiry-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'inquiry-1',
              campsite_id: 'campsite-1',
              campsite_name: 'Mountain View Camp',
              guest_name: 'John Doe',
              guest_email: 'john@example.com',
              guest_phone: '0812345678',
              inquiry_type: 'booking',
              message: 'I would like to book for 3 nights next week',
              check_in_date: '2026-02-01',
              check_out_date: '2026-02-04',
              status: 'new',
              is_read: false,
              created_at: new Date().toISOString(),
              replies: [],
            },
          }),
        });
      });

      await page.goto('/dashboard/inquiries');
      await page.waitForLoadState('networkidle');

      // Click on first inquiry
      const firstInquiry = page.locator('text=John Doe').first();
      await firstInquiry.click();
      await page.waitForLoadState('networkidle');

      // Verify navigation to detail page
      await expect(page).toHaveURL(/\/dashboard\/inquiries\/inquiry-1/);

      // Verify inquiry details are displayed
      const guestName = page.locator('text=John Doe');
      const message = page.locator('text=/I would like to book for 3 nights/i');

      await expect(guestName).toBeVisible({ timeout: 5000 });
      await expect(message).toBeVisible();
    });

    test('reply form is accessible', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      // Mock inquiry detail
      await page.route('**/api/dashboard/inquiries/inquiry-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'inquiry-1',
              campsite_id: 'campsite-1',
              campsite_name: 'Mountain View Camp',
              guest_name: 'John Doe',
              guest_email: 'john@example.com',
              inquiry_type: 'booking',
              message: 'I would like to book for 3 nights next week',
              status: 'new',
              is_read: false,
              created_at: new Date().toISOString(),
              replies: [],
            },
          }),
        });
      });

      await page.goto('/dashboard/inquiries/inquiry-1');
      await page.waitForLoadState('networkidle');

      // Look for reply button or form
      const replyButton = page.getByRole('button', { name: /reply|send reply/i });
      const replyTextarea = page.getByPlaceholder(/reply|message|response/i);

      // Either reply button or textarea should be visible
      const hasReplyButton = await replyButton.isVisible({ timeout: 3000 }).catch(() => false);
      const hasReplyTextarea = await replyTextarea.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasReplyButton || hasReplyTextarea).toBeTruthy();
    });

    test('inquiry status filters work', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      await page.goto('/dashboard/inquiries');
      await page.waitForLoadState('networkidle');

      // Click on New filter
      const newFilter = page.getByRole('button', { name: /^new$/i });
      await newFilter.click();
      await page.waitForTimeout(500);

      // Verify URL updates
      await expect(page).toHaveURL(/status=new/);

      // Click on In Progress filter
      const inProgressFilter = page.getByRole('button', { name: /in progress/i });
      await inProgressFilter.click();
      await page.waitForTimeout(500);

      // Verify URL updates
      await expect(page).toHaveURL(/status=in_progress/);
    });
  });

  test.describe('4. Analytics Smoke Test', () => {
    test('analytics page loads with chart', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      // Navigate to analytics page
      await page.goto('/dashboard/analytics');
      await page.waitForLoadState('networkidle');

      // Note: Analytics page might not exist yet, so we test it from dashboard
      // If page doesn't exist, verify chart exists on dashboard
      const isAnalyticsPage = page.url().includes('/dashboard/analytics');

      if (!isAnalyticsPage) {
        // Go back to dashboard to test analytics chart there
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
      }

      // Verify analytics chart is visible
      const chartTitle = page.getByText(/analytics|30-day/i);
      await expect(chartTitle.first()).toBeVisible({ timeout: 5000 });

      // Verify chart legend
      const legend = page.locator('text=/Search Impressions|Profile Views/i');
      await expect(legend.first()).toBeVisible();
    });

    test('analytics data is displayed', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify stats show numeric values
      const statsSection = page.locator('text=/1,250|348|87|12/');
      await expect(statsSection.first()).toBeVisible({ timeout: 5000 });

      // Verify percentage changes are shown
      const changeIndicator = page.locator('text=/15.5%|8.2%/');
      await expect(changeIndicator.first()).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('5. Profile/Settings Smoke Test', () => {
    test('user profile information is displayed', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify user name or email is displayed in header
      const userInfo = page.locator('text=/Test Owner|owner@test.com/i');
      await expect(userInfo.first()).toBeVisible({ timeout: 5000 });
    });

    test('logout button is accessible', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify logout button exists
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
      await expect(logoutButton).toBeVisible({ timeout: 5000 });
    });

    test('can navigate back to main site', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for logo or home link
      const homeLink = page.getByRole('link', { name: /camping thailand|home/i });
      await expect(homeLink.first()).toBeVisible({ timeout: 5000 });

      // Click home link
      await homeLink.first().click();
      await page.waitForLoadState('networkidle');

      // Verify navigation to home page
      await expect(page).toHaveURL(/^\/$|^\/$/);
    });
  });

  test.describe('6. Mobile Responsiveness Smoke Test', () => {
    test('mobile bottom navigation is visible on small screens', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify mobile navigation exists
      // Navigation items should be visible
      const navItems = page.getByRole('link', { name: /overview|campsites|inquiries|analytics/i });
      const navCount = await navItems.count();

      expect(navCount).toBeGreaterThanOrEqual(3);
    });

    test('dashboard is usable on tablet', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify stats cards are visible and properly laid out
      const statsCards = page.locator('text=/Search Impressions|Profile Views|Booking Clicks/i');
      await expect(statsCards.first()).toBeVisible({ timeout: 5000 });

      // Verify navigation is accessible
      const campsitesLink = page.getByRole('link', { name: /campsites/i }).first();
      await expect(campsitesLink).toBeVisible();
    });
  });

  test.describe('7. Error Handling Smoke Test', () => {
    test('handles API errors gracefully', async ({ page }) => {
      await mockOwnerLogin(page);

      // Mock API to return errors
      await page.route('**/api/dashboard/stats*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      });

      await page.route('**/api/dashboard/analytics*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      });

      await page.route('**/api/dashboard/campsites*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      });

      await page.route('**/api/dashboard/inquiries*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Dashboard should still load even if API fails
      const heading = page.getByRole('heading', { name: /welcome/i });
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Stats should show zero or default values
      const statsCards = page.locator('text=/Search Impressions|Profile Views/i');
      await expect(statsCards.first()).toBeVisible();
    });

    test('handles empty data gracefully', async ({ page }) => {
      await mockOwnerLogin(page);

      // Mock empty responses
      await page.route('**/api/dashboard/stats*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              search_impressions: 0,
              search_impressions_change: 0,
              profile_views: 0,
              profile_views_change: 0,
              booking_clicks: 0,
              booking_clicks_change: 0,
              new_inquiries: 0,
              total_campsites: 0,
              active_campsites: 0,
              pending_campsites: 0,
            },
          }),
        });
      });

      await page.route('**/api/dashboard/analytics*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              chartData: [],
            },
          }),
        });
      });

      await page.route('**/api/dashboard/campsites*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0,
            },
          }),
        });
      });

      await page.route('**/api/dashboard/inquiries*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 20,
              totalPages: 0,
            },
            unread_count: 0,
          }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify empty state messages
      const noInquiriesMessage = page.locator('text=/no inquiries|they will appear here/i');
      await expect(noInquiriesMessage).toBeVisible({ timeout: 5000 });

      // Verify zero values in stats
      const zeroStats = page.locator('text=/^0$/');
      const zeroCount = await zeroStats.count();
      expect(zeroCount).toBeGreaterThan(0);
    });
  });

  test.describe('8. Performance Smoke Test', () => {
    test('dashboard loads within acceptable time', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Dashboard should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);

      // Verify critical content is visible
      const heading = page.getByRole('heading', { name: /welcome/i });
      await expect(heading).toBeVisible();
    });

    test('navigation between pages is responsive', async ({ page }) => {
      await mockOwnerLogin(page);
      await mockDashboardStats(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Measure navigation time to campsites
      const startTime = Date.now();
      const campsitesLink = page.getByRole('link', { name: /campsites/i }).first();
      await campsitesLink.click();
      await page.waitForLoadState('networkidle');
      const navTime = Date.now() - startTime;

      // Navigation should be quick (under 3 seconds)
      expect(navTime).toBeLessThan(3000);

      // Verify page loaded
      await expect(page).toHaveURL(/\/dashboard\/campsites/);
    });
  });
});
