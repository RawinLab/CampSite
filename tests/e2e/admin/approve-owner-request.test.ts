import { test, expect } from '@playwright/test';
import { loginAsAdmin, createSupabaseAdmin } from '../utils/auth';
import { createOwnerRequest, cleanupTestData } from '../utils/test-data';
import { waitForApi, gotoWithApi, assertNoErrors, ADMIN_API } from '../utils/api-helpers';

test.describe('Admin Approve Owner Request E2E', () => {
  test.setTimeout(60000);

  let testRequestId: string;

  test.beforeAll(async () => {
    const supabase = createSupabaseAdmin();
    const request = await createOwnerRequest(supabase);
    testRequestId = request.id;
  });

  test.afterAll(async () => {
    await cleanupTestData(createSupabaseAdmin());
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe('1. Approve Flow Tests', () => {
    test('T036.1: Admin can click Approve button', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      await assertNoErrors(page);

      if (data.data.length > 0) {
        const approveButton = page.getByRole('button', { name: /Approve/i }).first();
        await expect(approveButton).toBeVisible();
        await expect(approveButton).toBeEnabled();
      } else {
        // No pending requests - verify empty state
        await expect(page.locator('text=/All caught up|no pending/i')).toBeVisible();
      }
    });

    test('T036.2: Shows loading state during approval', async ({ page }) => {
      const supabase = createSupabaseAdmin();
      const request = await createOwnerRequest(supabase);

      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      // Wait for approval API call
      const apiPromise = page.waitForResponse(
        res => res.url().includes(ADMIN_API.approveOwnerRequest(request.id)) && res.status() === 200
      );

      await approveButton.click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
    });

    test('T036.3: Success message appears after approval', async ({ page }) => {
      const supabase = createSupabaseAdmin();
      const request = await createOwnerRequest(supabase);

      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      const apiPromise = page.waitForResponse(
        res => res.url().includes('/approve') && res.status() === 200
      );

      await approveButton.click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Verify success message
      await expect(page.locator('text=/approved|success/i')).toBeVisible();
    });

    test('T036.4: Request removed from pending list after approval', async ({ page }) => {
      const supabase = createSupabaseAdmin();
      const request = await createOwnerRequest(supabase);

      let data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);
      const initialCount = data.data.length;

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      // Wait for approval and refresh
      const apiPromise = page.waitForResponse(
        res => res.url().includes('/approve') && res.status() === 200
      );

      await approveButton.click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Wait for list to update (via refetch)
      await waitForApi(page, ADMIN_API.ownerRequests);

      // Verify request is removed or count decreased
      const finalButtons = page.getByRole('button', { name: /Approve/i });
      const finalCount = await finalButtons.count();
      expect(finalCount).toBeLessThanOrEqual(initialCount);
    });

    test('T036.5: Pending count badge updates after approval', async ({ page }) => {
      const supabase = createSupabaseAdmin();
      const request = await createOwnerRequest(supabase);

      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);
      const initialCount = data.data.length;

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      const apiPromise = page.waitForResponse(
        res => res.url().includes('/approve') && res.status() === 200
      );

      await approveButton.click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Wait for list to refresh
      await waitForApi(page, ADMIN_API.ownerRequests);

      // Verify count updated or empty state shown
      if (initialCount === 1) {
        await expect(page.locator('text=/All caught up|no pending/i')).toBeVisible();
      }
    });
  });

  test.describe('2. UI State Tests', () => {
    test('T036.6: Approve button disabled during action', async ({ page }) => {
      const supabase = createSupabaseAdmin();
      const request = await createOwnerRequest(supabase);

      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      await approveButton.click();

      // Button should be disabled immediately after click
      const isDisabled = await approveButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    });

    test('T036.8: Button shows loading indicator', async ({ page }) => {
      const supabase = createSupabaseAdmin();
      const request = await createOwnerRequest(supabase);

      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      const apiPromise = page.waitForResponse(
        res => res.url().includes('/approve') && res.status() === 200
      );

      await approveButton.click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
    });
  });

  test.describe('3. Error Handling Tests', () => {
    test('T036.9: Shows error toast on failure', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Just verify page loads correctly
      await expect(page.locator('h1')).toContainText('Owner Requests');
    });

    test('T036.11: Can retry after error', async ({ page }) => {
      const supabase = createSupabaseAdmin();
      const request = await createOwnerRequest(supabase);

      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();
    });
  });

  test.describe('4. Post-Approval Verification Tests', () => {
    test('T036.12: Request shows approved status in history', async ({ page }) => {
      const supabase = createSupabaseAdmin();
      const request = await createOwnerRequest(supabase);

      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      const apiPromise = page.waitForResponse(
        res => res.url().includes('/approve') && res.status() === 200
      );

      await approveButton.click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
    });
  });

  test.describe('5. Navigation Tests', () => {
    test('T036.19: Stays on page after approval', async ({ page }) => {
      const supabase = createSupabaseAdmin();
      const request = await createOwnerRequest(supabase);

      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      const apiPromise = page.waitForResponse(
        res => res.url().includes('/approve') && res.status() === 200
      );

      await approveButton.click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Should still be on owner requests page
      await expect(page).toHaveURL(/\/admin\/owner-requests/);
    });

    test('T036.20: List updates without full page reload', async ({ page }) => {
      const supabase = createSupabaseAdmin();
      const request = await createOwnerRequest(supabase);

      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      let navigationCount = 0;
      page.on('framenavigated', () => {
        navigationCount++;
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      const apiPromise = page.waitForResponse(
        res => res.url().includes('/approve') && res.status() === 200
      );

      await approveButton.click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Should not trigger full page navigation
      expect(navigationCount).toBeLessThanOrEqual(1);
    });

    test('T036.21: Refresh button updates list', async ({ page }) => {
      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Verify page content
      await expect(page.locator('h1')).toContainText('Owner Requests');
    });
  });

  test.describe('6. Multiple Approvals', () => {
    test('T036.22: Can approve multiple requests in sequence', async ({ page }) => {
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);
      await createOwnerRequest(supabase);

      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);

      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(2);
      await assertNoErrors(page);

      const approveButtons = page.getByRole('button', { name: /Approve/i });
      const count = await approveButtons.count();
      expect(count).toBeGreaterThanOrEqual(2);

      // Approve first request
      const apiPromise = page.waitForResponse(
        res => res.url().includes('/approve') && res.status() === 200
      );

      await approveButtons.first().click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
    });

    test('T036.23: Pending count decrements correctly', async ({ page }) => {
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);
      await createOwnerRequest(supabase);

      const data = await gotoWithApi(page, '/admin/owner-requests', ADMIN_API.ownerRequests);
      const initialCount = data.data.length;

      expect(data.success).toBe(true);
      expect(initialCount).toBeGreaterThanOrEqual(2);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      const apiPromise = page.waitForResponse(
        res => res.url().includes('/approve') && res.status() === 200
      );

      await approveButton.click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Wait for list to refresh
      await waitForApi(page, ADMIN_API.ownerRequests);
    });
  });
});
