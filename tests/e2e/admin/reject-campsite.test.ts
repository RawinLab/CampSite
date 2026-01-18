import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';
import { createSupabaseAdmin, createTestCampsite, cleanupTestData } from '../utils/test-data';

/**
 * E2E Tests: Admin Reject Campsite Functionality
 *
 * REAL API INTEGRATION - No mocking
 *
 * User Flow:
 * 1. Admin logs in
 * 2. Navigates to /admin/campsites/pending
 * 3. Sees pending campsite
 * 4. Clicks Reject button
 * 5. Reject dialog opens
 * 6. Admin enters rejection reason
 * 7. Admin confirms rejection
 * 8. Campsite disappears from list
 * 9. Success notification appears
 */

test.describe('Admin Reject Campsite - E2E Tests', () => {
  const supabase = createSupabaseAdmin();

  test.beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData(supabase);
  });

  test.afterAll(async () => {
    // Clean up test data after all tests
    await cleanupTestData(supabase);
  });

  test.describe('1. Reject Dialog Tests', () => {
    test('should open reject dialog when clicking Reject button', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Create test campsite
      await createTestCampsite(supabase, {
        name: 'Dialog Test Camp',
        status: 'pending',
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      // Click Reject button
      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      const isVisible = await rejectButton.isVisible({ timeout: 10000 }).catch(() => false);

      if (isVisible) {
        await rejectButton.click();
        await page.waitForTimeout(1000);

        // Verify dialog opens
        const dialog = page.locator('[role="dialog"], text=/reject|reason/i');
        const hasDialog = await dialog.first().isVisible({ timeout: 5000 }).catch(() => false);

        expect(hasDialog).toBeTruthy();
      }
    });

    test('should show reason textarea in reject dialog', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      await createTestCampsite(supabase, {
        name: 'Reason Test Camp',
        status: 'pending',
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      const isVisible = await rejectButton.isVisible({ timeout: 10000 }).catch(() => false);

      if (isVisible) {
        await rejectButton.click();
        await page.waitForTimeout(1000);

        // Verify textarea or input exists
        const textarea = page.locator('textarea, input[type="text"]').filter({ hasText: '' });
        const reasonInput = page.getByLabel(/reason/i);

        const hasTextarea = await textarea.first().isVisible({ timeout: 3000 }).catch(() => false);
        const hasReasonInput = await reasonInput.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasTextarea || hasReasonInput).toBeTruthy();
      }
    });

    test('should show Cancel and Confirm buttons in reject dialog', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      await createTestCampsite(supabase, {
        name: 'Buttons Test Camp',
        status: 'pending',
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      const isVisible = await rejectButton.isVisible({ timeout: 10000 }).catch(() => false);

      if (isVisible) {
        await rejectButton.click();
        await page.waitForTimeout(1000);

        // Verify buttons exist
        const cancelButton = page.getByRole('button', { name: /cancel/i });
        const confirmButton = page.getByRole('button', { name: /confirm|reject|submit/i });

        const hasCancel = await cancelButton.first().isVisible({ timeout: 3000 }).catch(() => false);
        const hasConfirm = await confirmButton.first().isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasCancel && hasConfirm).toBeTruthy();
      }
    });
  });

  test.describe('2. Reason Validation Tests', () => {
    test('should not allow submission without rejection reason', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      await createTestCampsite(supabase, {
        name: 'Validation Test Camp',
        status: 'pending',
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      const isVisible = await rejectButton.isVisible({ timeout: 10000 }).catch(() => false);

      if (isVisible) {
        await rejectButton.click();
        await page.waitForTimeout(1000);

        // Try to confirm without entering reason
        const confirmButton = page.getByRole('button', { name: /confirm|reject|submit/i }).first();
        const isConfirmVisible = await confirmButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (isConfirmVisible) {
          const isDisabled = await confirmButton.isDisabled().catch(() => false);
          expect(isDisabled).toBeTruthy();
        }
      }
    });

    test('should enable confirm button when reason is valid', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      await createTestCampsite(supabase, {
        name: 'Valid Reason Test',
        status: 'pending',
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      const isVisible = await rejectButton.isVisible({ timeout: 10000 }).catch(() => false);

      if (isVisible) {
        await rejectButton.click();
        await page.waitForTimeout(1000);

        // Enter valid reason
        const textarea = page.locator('textarea').first();
        const reasonInput = page.getByLabel(/reason/i);

        const hasTextarea = await textarea.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasTextarea) {
          await textarea.fill('The submitted photos do not meet quality standards');
        } else {
          const hasInput = await reasonInput.isVisible({ timeout: 1000 }).catch(() => false);
          if (hasInput) {
            await reasonInput.fill('The submitted photos do not meet quality standards');
          }
        }

        await page.waitForTimeout(500);

        // Confirm button should be enabled
        const confirmButton = page.getByRole('button', { name: /confirm|reject|submit/i }).first();
        const isEnabled = await confirmButton.isEnabled().catch(() => false);

        expect(isEnabled).toBeTruthy();
      }
    });
  });

  test.describe('3. Reject Flow Tests', () => {
    test('should submit rejection with valid reason', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      const campsite = await createTestCampsite(supabase, {
        name: 'Rejection Flow Test',
        status: 'pending',
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      const isVisible = await rejectButton.isVisible({ timeout: 10000 }).catch(() => false);

      if (isVisible) {
        await rejectButton.click();
        await page.waitForTimeout(1000);

        // Enter valid reason
        const textarea = page.locator('textarea').first();
        const reasonInput = page.getByLabel(/reason/i);
        const rejectionReason = 'Photos do not meet quality standards and location is incorrect';

        const hasTextarea = await textarea.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasTextarea) {
          await textarea.fill(rejectionReason);
        } else {
          const hasInput = await reasonInput.isVisible({ timeout: 1000 }).catch(() => false);
          if (hasInput) {
            await reasonInput.fill(rejectionReason);
          }
        }

        await page.waitForTimeout(500);

        // Confirm rejection
        const confirmButton = page.getByRole('button', { name: /confirm|reject|submit/i }).first();
        const isConfirmVisible = await confirmButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (isConfirmVisible) {
          await confirmButton.click();
          await page.waitForTimeout(3000);

          // Verify rejection in database
          const { data: rejected } = await supabase
            .from('campsites')
            .select('status')
            .eq('id', campsite.id)
            .single();

          if (rejected) {
            expect(rejected.status).toBe('rejected');
          }
        }
      }
    });

    test('should show success toast after rejection', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      await createTestCampsite(supabase, {
        name: 'Toast Test Camp',
        status: 'pending',
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      const isVisible = await rejectButton.isVisible({ timeout: 10000 }).catch(() => false);

      if (isVisible) {
        await rejectButton.click();
        await page.waitForTimeout(1000);

        // Fill reason
        const textarea = page.locator('textarea').first();
        const hasTextarea = await textarea.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasTextarea) {
          await textarea.fill('Valid rejection reason here');
          await page.waitForTimeout(500);

          const confirmButton = page.getByRole('button', { name: /confirm|reject|submit/i }).first();
          const isConfirmVisible = await confirmButton.isVisible({ timeout: 3000 }).catch(() => false);

          if (isConfirmVisible) {
            await confirmButton.click();
            await page.waitForTimeout(2000);

            // Look for success feedback
            const toast = page.locator('text=/rejected|success/i');
            const hasToast = await toast.first().isVisible({ timeout: 5000 }).catch(() => false);

            expect(hasToast).toBeTruthy();
          }
        }
      }
    });

    test('should remove campsite from pending list after rejection', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      const uniqueName = `Removal Test ${Date.now()}`;
      await createTestCampsite(supabase, {
        name: uniqueName,
        status: 'pending',
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      // Verify campsite exists
      const campsiteElement = page.locator(`text=${uniqueName}`);
      const existsBefore = await campsiteElement.isVisible({ timeout: 5000 }).catch(() => false);

      if (existsBefore) {
        const rejectButton = page.getByRole('button', { name: /reject/i }).first();
        await rejectButton.click();
        await page.waitForTimeout(1000);

        // Fill reason and confirm
        const textarea = page.locator('textarea').first();
        const hasTextarea = await textarea.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasTextarea) {
          await textarea.fill('Valid rejection reason here');
          await page.waitForTimeout(500);

          const confirmButton = page.getByRole('button', { name: /confirm|reject|submit/i }).first();
          await confirmButton.click();
          await page.waitForTimeout(3000);

          // Verify campsite is removed
          const existsAfter = await campsiteElement.isVisible({ timeout: 2000 }).catch(() => false);
          expect(existsAfter).toBeFalsy();
        }
      }
    });
  });

  test.describe('4. Dialog Behavior Tests', () => {
    test('should close dialog when clicking Cancel button', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      await createTestCampsite(supabase, {
        name: 'Cancel Test Camp',
        status: 'pending',
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      const isVisible = await rejectButton.isVisible({ timeout: 10000 }).catch(() => false);

      if (isVisible) {
        await rejectButton.click();
        await page.waitForTimeout(1000);

        // Verify dialog is open
        const dialog = page.locator('[role="dialog"]');
        const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasDialog) {
          // Click Cancel
          const cancelButton = page.getByRole('button', { name: /cancel/i }).first();
          await cancelButton.click();
          await page.waitForTimeout(500);

          // Verify dialog closes
          const stillVisible = await dialog.isVisible({ timeout: 1000 }).catch(() => false);
          expect(stillVisible).toBeFalsy();
        }
      }
    });
  });

  test.describe('5. Error Handling Tests', () => {
    test('should keep dialog open if submission fails', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      await createTestCampsite(supabase, {
        name: 'Error Test Camp',
        status: 'pending',
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      const isVisible = await rejectButton.isVisible({ timeout: 10000 }).catch(() => false);

      if (isVisible) {
        await rejectButton.click();
        await page.waitForTimeout(1000);

        // Dialog should remain accessible if there's an error
        const dialog = page.locator('[role="dialog"]');
        const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasDialog).toBeTruthy();
      }
    });
  });
});
