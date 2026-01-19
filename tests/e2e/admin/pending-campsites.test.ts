import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';
import { createSupabaseAdmin, createTestCampsite, cleanupTestData } from '../utils/test-data';
import { waitForApi, waitForApiSuccess, gotoWithApi, assertNoErrors, ADMIN_API } from '../utils/api-helpers';

/**
 * E2E Tests: Admin Pending Campsites Page
 *
 * Tests the admin functionality for viewing and managing pending campsite submissions
 * that require approval before going live on the platform.
 *
 * REAL API INTEGRATION - No mocking
 */

test.describe('Admin Pending Campsites Page', () => {
  const supabase = createSupabaseAdmin();

  test.beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData(supabase);
  });

  test.afterAll(async () => {
    // Clean up test data after all tests
    await cleanupTestData(supabase);
  });

  test.describe('1. Page Access Tests', () => {
    test('allows access for role=admin', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Wait for API call before navigation
      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      // Verify API response
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);

      // Should successfully load the admin page
      await expect(page).toHaveURL(/\/admin\/campsites\/pending/);

      // Verify no errors on page
      await assertNoErrors(page);

      // Verify specific page content
      await expect(page.locator('h1')).toContainText('Pending Campsites');
    });
  });

  test.describe('2. Page Rendering Tests', () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await loginAsAdmin(page);
    });

    test('shows page title "Pending Campsites" or similar', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      // Verify API response
      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Verify exact page title
      await expect(page.locator('h1')).toContainText('Pending Campsites');
    });

    test('shows empty state when no pending campsites', async ({ page }) => {
      // Ensure no pending campsites exist
      const { data: pending } = await supabase
        .from('campsites')
        .select('id')
        .eq('status', 'pending')
        .like('id', 'e2e-test-%');

      if (pending && pending.length > 0) {
        for (const campsite of pending) {
          await supabase
            .from('campsites')
            .update({ status: 'approved' })
            .eq('id', campsite.id);
        }
      }

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      // Verify API returns empty array
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      await assertNoErrors(page);

      // Verify empty state message
      await expect(page.locator('text=/All caught up|no pending campsites/i')).toBeVisible();
    });

    test('shows pending campsites list when data exists', async ({ page }) => {
      // Create test campsites
      await createTestCampsite(supabase, {
        name: 'E2E Test Camp 1',
        status: 'pending',
      });
      await createTestCampsite(supabase, {
        name: 'E2E Test Camp 2',
        status: 'pending',
      });

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      // Verify API returns data
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(2);
      await assertNoErrors(page);

      // Verify campsites appear in UI
      await expect(page.locator('text=E2E Test Camp 1')).toBeVisible();
      await expect(page.locator('text=E2E Test Camp 2')).toBeVisible();
    });
  });

  test.describe('3. Campsite Card Display Tests', () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await loginAsAdmin(page);

      // Create test campsite for display tests
      await cleanupTestData(supabase);
      await createTestCampsite(supabase, {
        name: 'Display Test Camp',
        description: 'Beautiful camping spot for testing',
        status: 'pending',
        price_min: 500,
        price_max: 1500,
      });
    });

    test('shows campsite name and basic info', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(1);
      await assertNoErrors(page);

      await expect(page.locator('text=Display Test Camp')).toBeVisible();
    });

    test('shows campsite description or province', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Verify description is shown in UI
      await expect(page.locator('text=Beautiful camping spot for testing')).toBeVisible();
    });
  });

  test.describe('4. Card Actions Tests', () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await loginAsAdmin(page);

      // Create test campsites for action tests
      await cleanupTestData(supabase);
      await createTestCampsite(supabase, {
        name: 'Action Test Camp 1',
        status: 'pending',
      });
      await createTestCampsite(supabase, {
        name: 'Action Test Camp 2',
        status: 'pending',
      });
    });

    test('shows Approve and Reject buttons on each card', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(2);
      await assertNoErrors(page);

      const approveButtons = page.getByRole('button', { name: /approve/i });
      const rejectButtons = page.getByRole('button', { name: /reject/i });

      const approveCount = await approveButtons.count();
      const rejectCount = await rejectButtons.count();

      // Should have at least 2 approve and 2 reject buttons
      expect(approveCount).toBeGreaterThanOrEqual(2);
      expect(rejectCount).toBeGreaterThanOrEqual(2);
    });

    test('Approve button has green color styling', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /approve/i }).first();
      await expect(approveButton).toBeVisible();

      const buttonClasses = await approveButton.getAttribute('class');
      const hasGreenColor = buttonClasses?.includes('green') || buttonClasses?.includes('success');
      expect(hasGreenColor).toBeTruthy();
    });

    test('Reject button has red color styling', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      await expect(rejectButton).toBeVisible();

      const buttonClasses = await rejectButton.getAttribute('class');
      const hasRedColor = buttonClasses?.includes('red') || buttonClasses?.includes('destructive') || buttonClasses?.includes('danger');
      expect(hasRedColor).toBeTruthy();
    });
  });

  test.describe('5. Navigation Tests', () => {
    test('sidebar shows admin navigation', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Verify admin navigation elements are present
      const adminNav = page.locator('nav, aside, [role="navigation"]');
      await expect(adminNav.first()).toBeVisible();
    });
  });

  test.describe('6. Action Functionality Tests', () => {
    test('clicking Approve button triggers approval flow', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Create a test campsite to approve
      const campsite = await createTestCampsite(supabase, {
        name: 'Approval Flow Test',
        status: 'pending',
      });

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /approve/i }).first();
      await expect(approveButton).toBeVisible();

      // Wait for approve API call
      const apiPromise = page.waitForResponse(
        res => res.url().includes(`/api/admin/campsites/${campsite.id}/approve`) && res.status() === 200
      );

      await approveButton.click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Verify success feedback
      await expect(page.locator('text=/approved|success/i')).toBeVisible();

      // Clean up
      await supabase.from('campsites').delete().eq('id', campsite.id);
    });

    test('clicking Reject button opens rejection dialog', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Create a test campsite to reject
      await createTestCampsite(supabase, {
        name: 'Rejection Flow Test',
        status: 'pending',
      });

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      await expect(rejectButton).toBeVisible();

      await rejectButton.click();

      // Verify dialog opens
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=/reason|reject/i')).toBeVisible();
    });
  });

  test.describe('7. Error Handling Tests', () => {
    test('handles empty state gracefully', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Ensure no pending campsites
      await cleanupTestData(supabase);

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      // Verify API returns empty array
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      await assertNoErrors(page);

      // Verify empty state message
      await expect(page.locator('text=/All caught up|no pending campsites/i')).toBeVisible();
    });
  });

  test.describe('8. Responsive Design Tests', () => {
    test('page is usable on mobile viewport', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Verify page heading is visible
      await expect(page.locator('h1')).toContainText('Pending Campsites');
    });
  });
});
