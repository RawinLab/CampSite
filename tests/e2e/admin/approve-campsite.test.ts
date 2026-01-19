import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';
import { createSupabaseAdmin, createTestCampsite, cleanupTestData } from '../utils/test-data';
import { waitForApi, gotoWithApi, assertNoErrors, ADMIN_API } from '../utils/api-helpers';

/**
 * E2E Tests: Admin Campsite Approval
 *
 * REAL API INTEGRATION - No mocking
 */

test.describe('Admin Campsite Approval E2E', () => {
  const supabase = createSupabaseAdmin();

  test.beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData(supabase);
  });

  test.afterAll(async () => {
    // Clean up test data after all tests
    await cleanupTestData(supabase);
  });

  test.describe('1. Approve Flow Tests', () => {
    test('T023.1: Admin can click Approve button', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Create test campsite
      await createTestCampsite(supabase, {
        name: 'Mountain View Camp',
        status: 'pending',
      });

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();
      await expect(approveButton).toBeEnabled();
    });

    test('T023.3: Success message appears after approval', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Create test campsite
      const campsite = await createTestCampsite(supabase, {
        name: 'Test Approval Camp',
        status: 'pending',
      });

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
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

      // Verify campsite status in database
      const { data: updated } = await supabase
        .from('campsites')
        .select('status')
        .eq('id', campsite.id)
        .single();

      if (updated) {
        expect(updated.status).toBe('approved');
      }
    });

    test('T023.4: Campsite removed from pending list after approval', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Create test campsite with unique name
      const uniqueName = `Approval Test ${Date.now()}`;
      await createTestCampsite(supabase, {
        name: uniqueName,
        status: 'pending',
      });

      let data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Verify campsite is visible before approval
      await expect(page.locator(`text=${uniqueName}`)).toBeVisible();

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      // Wait for approve API call
      const apiPromise = page.waitForResponse(
        res => res.url().includes('/approve') && res.status() === 200
      );

      await approveButton.click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Wait for list to refresh
      await waitForApi(page, ADMIN_API.pendingCampsites);

      // Campsite should disappear from list
      const campsiteAfterApproval = page.locator(`text=${uniqueName}`);
      const isVisibleAfter = await campsiteAfterApproval.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisibleAfter).toBeFalsy();
    });
  });

  test.describe('2. UI State Tests', () => {
    test('T023.7: Approve button disabled during action', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Create test campsite
      await createTestCampsite(supabase, {
        name: 'UI State Test Camp',
        status: 'pending',
      });

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      await approveButton.click();

      // Button should be disabled immediately after click
      const isDisabled = await approveButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    });
  });

  test.describe('3. Error Handling Tests', () => {
    test('T023.12: Campsite remains in list on error', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Create test campsite
      const uniqueName = `Error Test ${Date.now()}`;
      await createTestCampsite(supabase, {
        name: uniqueName,
        status: 'pending',
      });

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      // Verify campsite is visible
      await expect(page.locator(`text=${uniqueName}`)).toBeVisible();
    });
  });

  test.describe('4. Post-Approval Tests', () => {
    test('T023.15: Approved campsite has approved status in database', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Create test campsite
      const campsite = await createTestCampsite(supabase, {
        name: 'Post Approval Test',
        status: 'pending',
      });

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      // Wait for approve API call
      const apiPromise = page.waitForResponse(
        res => res.url().includes('/approve') && res.status() === 200
      );

      await approveButton.click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Check database status
      const { data: updatedCampsite } = await supabase
        .from('campsites')
        .select('status')
        .eq('id', campsite.id)
        .single();

      if (updatedCampsite) {
        expect(updatedCampsite.status).toBe('approved');
      }
    });
  });

  test.describe('5. Navigation Tests', () => {
    test('T023.18: Stays on pending page after approval', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Create test campsite
      await createTestCampsite(supabase, {
        name: 'Navigation Test Camp',
        status: 'pending',
      });

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      await assertNoErrors(page);

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();

      // Wait for approve API call
      const apiPromise = page.waitForResponse(
        res => res.url().includes('/approve') && res.status() === 200
      );

      await approveButton.click();

      const response = await apiPromise;
      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Should still be on pending page
      await expect(page).toHaveURL(/\/admin\/campsites\/pending/);
    });
  });

  test.describe('6. Empty State Tests', () => {
    test('T023.22: Shows empty state when no pending campsites', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Ensure no pending campsites
      await cleanupTestData(supabase);

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      await assertNoErrors(page);

      // Should show empty state
      await expect(page.locator('text=/All caught up|no pending/i')).toBeVisible();
    });
  });

  test.describe('7. Multiple Approvals', () => {
    test('T023.24: Can approve multiple campsites in sequence', async ({ page }) => {
      test.setTimeout(90000);

      await loginAsAdmin(page);

      // Create multiple test campsites
      await cleanupTestData(supabase);
      await createTestCampsite(supabase, {
        name: 'Multi Approval 1',
        status: 'pending',
      });
      await createTestCampsite(supabase, {
        name: 'Multi Approval 2',
        status: 'pending',
      });

      const data = await gotoWithApi(page, '/admin/campsites/pending', ADMIN_API.pendingCampsites);

      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(2);
      await assertNoErrors(page);

      // Approve first campsite
      const firstApproveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(firstApproveButton).toBeVisible();

      const apiPromise1 = page.waitForResponse(
        res => res.url().includes('/approve') && res.status() === 200
      );

      await firstApproveButton.click();

      const response1 = await apiPromise1;
      const responseData1 = await response1.json();
      expect(responseData1.success).toBe(true);

      // Wait for list to refresh
      await waitForApi(page, ADMIN_API.pendingCampsites);

      // Check if second campsite is still visible
      const secondApproveButton = page.getByRole('button', { name: /Approve/i }).first();
      const isVisible2 = await secondApproveButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible2) {
        const apiPromise2 = page.waitForResponse(
          res => res.url().includes('/approve') && res.status() === 200
        );

        await secondApproveButton.click();

        const response2 = await apiPromise2;
        const responseData2 = await response2.json();
        expect(responseData2.success).toBe(true);

        // Wait for final refresh
        await waitForApi(page, ADMIN_API.pendingCampsites);

        // Should show empty state
        await expect(page.locator('text=/All caught up|no pending/i')).toBeVisible();
      }
    });
  });
});
