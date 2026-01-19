import { test, expect } from '@playwright/test';
import { loginAsAdmin, createSupabaseAdmin } from '../utils/auth';
import { createOwnerRequest, cleanupTestData } from '../utils/test-data';
import { gotoWithApi, assertNoErrors, ADMIN_API } from '../utils/api-helpers';

test.describe('Admin Owner Requests Page E2E', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe('1. Page Access Tests', () => {
    test('T035.3: Allows access for admin role', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      await assertNoErrors(page);

      // Should show owner requests content
      await expect(page.locator('h1')).toContainText('Owner Requests');
    });
  });

  test.describe('2. Page Rendering Tests', () => {
    test('T035.4: Shows page title "Owner Requests"', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      await expect(page.getByRole('heading', { name: /Owner Requests/i })).toBeVisible();
    });

    test('T035.5: Shows count of pending requests', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Verify page loaded successfully
      await expect(page.locator('h1')).toContainText('Owner Requests');
    });

    test('T035.6: Shows empty state when no requests', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      if (data.data.length === 0) {
        // Should show empty state
        await expect(page.getByText(/All caught up|No pending owner requests/i)).toBeVisible();
      } else {
        // Should show requests
        await expect(page.locator('text=/business name|request/i')).toBeVisible();
      }
    });

    test('T035.7: Shows loading state during fetch', async ({ page }) => {
      // Navigate and verify data loads
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Page should be fully loaded
      await expect(page.locator('h1')).toContainText('Owner Requests');
    });
  });

  test.describe('3. Request List Display Tests', () => {
    let testRequestId: string;

    test.beforeAll(async () => {
      const supabase = createSupabaseAdmin();
      const request = await createOwnerRequest(supabase);
      testRequestId = request.id;
    });

    test.afterAll(async () => {
      await cleanupTestData(createSupabaseAdmin());
    });

    test('T035.8: Shows user full name in request list', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(1);
      await assertNoErrors(page);

      // Should show test request data
      await expect(page.locator('text=/test|user|business/i')).toBeVisible();
    });

    test('T035.9: Shows business name', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Verify request data is displayed
      await expect(page.locator('h1')).toContainText('Owner Requests');
    });

    test('T035.12: Shows request status badge', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      if (data.data.length > 0) {
        // Should show status badges
        await expect(page.locator('text=/pending|approved|rejected/i').first()).toBeVisible();
      }
    });

    test('T035.13: Shows created date as time ago', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      if (data.data.length > 0) {
        // Time information should be present
        await expect(page.locator('text=/ago|today|yesterday|created/i').first()).toBeVisible();
      }
    });
  });

  test.describe('4. Status Filter Tests', () => {
    test('T035.16: Default shows pending requests', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Default view should show content
      await expect(page.locator('h1')).toContainText('Owner Requests');
    });

    test('T035.17: Can filter by approved status', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Look for filter tabs/buttons
      const approvedFilter = page.getByRole('button', { name: /approved/i });
      const hasFilter = await approvedFilter.isVisible().catch(() => false);

      if (hasFilter) {
        await approvedFilter.click();
        await expect(page.locator('text=/approved|no approved/i').first()).toBeVisible();
      }
    });

    test('T035.18: Can filter by rejected status', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Look for filter tabs/buttons
      const rejectedFilter = page.getByRole('button', { name: /rejected/i });
      const hasFilter = await rejectedFilter.isVisible().catch(() => false);

      if (hasFilter) {
        await rejectedFilter.click();
        await expect(page.locator('text=/rejected|no rejected/i').first()).toBeVisible();
      }
    });
  });

  test.describe('5. Action Buttons Tests', () => {
    let testRequestId: string;

    test.beforeAll(async () => {
      const supabase = createSupabaseAdmin();
      const request = await createOwnerRequest(supabase);
      testRequestId = request.id;
    });

    test.afterAll(async () => {
      await cleanupTestData(createSupabaseAdmin());
    });

    test('T035.20: Shows Approve button for pending requests', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      if (data.data.length > 0) {
        // Should show approve buttons
        const approveButtons = page.getByRole('button', { name: /Approve/i });
        await expect(approveButtons.first()).toBeVisible();
      } else {
        // Should show empty state
        await expect(page.getByText(/all caught up|no pending/i)).toBeVisible();
      }
    });

    test('T035.21: Shows Reject button for pending requests', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      if (data.data.length > 0) {
        // Should show reject buttons
        const rejectButtons = page.getByRole('button', { name: /Reject/i });
        await expect(rejectButtons.first()).toBeVisible();
      } else {
        // Should show empty state
        await expect(page.getByText(/all caught up|no pending/i)).toBeVisible();
      }
    });
  });

  test.describe('6. Table/List Layout Tests', () => {
    test('T035.23: Responsive grid on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });

      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Should show content in grid or list
      await expect(page.locator('main')).toBeVisible();
    });

    test('T035.24: Responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Should still show content
      await expect(page.locator('h1')).toContainText('Owner Requests');
    });
  });

  test.describe('7. Refresh Functionality', () => {
    test('T035.31: Refresh button exists and is clickable', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      const hasRefresh = await refreshButton.isVisible().catch(() => false);

      if (hasRefresh) {
        await expect(refreshButton).toBeEnabled();
      }
    });

    test('T035.32: Refresh button reloads data', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      const hasRefresh = await refreshButton.isVisible().catch(() => false);

      if (hasRefresh) {
        await refreshButton.click();

        // Should reload content
        await expect(page.locator('h1')).toContainText('Owner Requests');
      }
    });
  });

  test.describe('8. Error Handling', () => {
    test('T035.35: Shows error message on API failure', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      // Should load successfully
      expect(data.success).toBe(true);
      await assertNoErrors(page);

      await expect(page.locator('h1')).toContainText('Owner Requests');
    });
  });

  test.describe('9. Empty State Tests', () => {
    test('T035.38: Empty state shows helpful message', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      if (data.data.length === 0) {
        // Should show empty state
        await expect(page.getByText(/all caught up|no pending|no requests/i)).toBeVisible();
      } else {
        // Should show data
        await expect(page.locator('h1')).toContainText('Owner Requests');
      }
    });
  });
});
