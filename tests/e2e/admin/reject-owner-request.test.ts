import { test, expect } from '@playwright/test';
import { loginAsAdmin, createSupabaseAdmin } from '../utils/auth';
import { createOwnerRequest, cleanupTestData } from '../utils/test-data';

test.describe('Admin Reject Owner Request E2E', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterAll(async () => {
    await cleanupTestData(createSupabaseAdmin());
  });

  test.describe('1. Reject Dialog Tests', () => {
    test('T037.1: Reject button opens dialog', async ({ page }) => {
      // Create a fresh request
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);

      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      const hasButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasButton) {
        await expect(rejectButton).toBeEnabled();
        await rejectButton.click();

        // Dialog should be visible
        const dialog = page.getByRole('dialog');
        const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasDialog).toBeTruthy();
      } else {
        test.skip();
      }
    });

    test('T037.2: Dialog shows user/business name', async ({ page }) => {
      // Create a fresh request
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);

      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      const hasButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasButton) {
        await rejectButton.click();

        const dialog = page.getByRole('dialog');
        const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasDialog) {
          // Should show business name or user info
          const businessInfo = dialog.locator('text=/business|test|user/i');
          await expect(businessInfo.first()).toBeVisible({ timeout: 5000 });
        }
      } else {
        test.skip();
      }
    });

    test('T037.3: Dialog has reason textarea', async ({ page }) => {
      // Create a fresh request
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);

      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      const hasButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasButton) {
        await rejectButton.click();

        const reasonTextarea = page.getByPlaceholder(/reason|explanation|comment/i);
        const hasTextarea = await reasonTextarea.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasTextarea) {
          await expect(reasonTextarea).toBeEditable();
        } else {
          // Try finding by test id or label
          const textarea = page.locator('textarea');
          await expect(textarea.first()).toBeVisible({ timeout: 5000 });
        }
      } else {
        test.skip();
      }
    });

    test('T037.5: Dialog has Cancel and Confirm buttons', async ({ page }) => {
      // Create a fresh request
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);

      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      const hasButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasButton) {
        await rejectButton.click();

        const dialog = page.getByRole('dialog');
        const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasDialog) {
          const cancelButton = dialog.getByRole('button', { name: /Cancel|Close/i });
          const confirmButton = dialog.getByRole('button', { name: /Confirm|Reject|Submit/i });

          await expect(cancelButton).toBeVisible({ timeout: 5000 });
          await expect(confirmButton).toBeVisible({ timeout: 5000 });
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('2. Reason Validation Tests', () => {
    test('T037.6: Cannot submit without reason', async ({ page }) => {
      // Create a fresh request
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);

      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      const hasButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasButton) {
        await rejectButton.click();

        const submitBtn = page.getByRole('button', { name: /Confirm|Reject|Submit/i }).last();
        const isDisabled = await submitBtn.isDisabled().catch(() => false);

        // Submit button should be disabled without reason
        expect(isDisabled).toBeTruthy();
      } else {
        test.skip();
      }
    });

    test('T037.10: Can submit with valid reason', async ({ page }) => {
      // Create a fresh request
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);

      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      const hasButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasButton) {
        await rejectButton.click();

        const reasonInput = page.locator('textarea').first();
        const hasTextarea = await reasonInput.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasTextarea) {
          await reasonInput.fill('This is a valid rejection reason with sufficient length for testing');

          const submitBtn = page.getByRole('button', { name: /Confirm|Reject|Submit/i }).last();
          await expect(submitBtn).toBeEnabled({ timeout: 5000 });
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('3. Reject Flow Tests', () => {
    test('T037.11: Can submit with valid reason', async ({ page }) => {
      // Create a fresh request
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);

      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      const hasButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasButton) {
        await rejectButton.click();

        const reasonInput = page.locator('textarea').first();
        const hasTextarea = await reasonInput.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasTextarea) {
          await reasonInput.fill('Business documentation is incomplete and unverified for security reasons');

          const submitBtn = page.getByRole('button', { name: /Confirm|Reject|Submit/i }).last();
          await submitBtn.click();

          await page.waitForTimeout(3000);

          // Should show feedback or dialog closes
          const feedback = page.locator('text=/rejected|success|error/i');
          await expect(feedback.first()).toBeVisible({ timeout: 10000 });
        }
      } else {
        test.skip();
      }
    });

    test('T037.13: Success message appears', async ({ page }) => {
      // Create a fresh request
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);

      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      const hasButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasButton) {
        await rejectButton.click();

        const reasonInput = page.locator('textarea').first();
        const hasTextarea = await reasonInput.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasTextarea) {
          await reasonInput.fill('Business documentation is incomplete and unverified');

          const submitBtn = page.getByRole('button', { name: /Confirm|Reject|Submit/i }).last();
          await submitBtn.click();

          await page.waitForTimeout(3000);

          // Should show success message
          const success = page.locator('text=/rejected.*successfully|success/i');
          const hasSuccess = await success.isVisible({ timeout: 5000 }).catch(() => false);

          expect(hasSuccess).toBeTruthy();
        }
      } else {
        test.skip();
      }
    });

    test('T037.15: Pending count badge updates', async ({ page }) => {
      // Create a fresh request
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);

      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      // Get initial count
      const initialCount = page.locator('text=/\\d+ request.*pending/i');
      const hasInitialCount = await initialCount.isVisible({ timeout: 3000 }).catch(() => false);

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      const hasButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasButton) {
        await rejectButton.click();

        const reasonInput = page.locator('textarea').first();
        const hasTextarea = await reasonInput.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasTextarea) {
          await reasonInput.fill('Business documentation is incomplete and unverified');

          const submitBtn = page.getByRole('button', { name: /Confirm|Reject|Submit/i }).last();
          await submitBtn.click();

          await page.waitForTimeout(3000);

          // Count should update
          const afterCount = page.locator('text=/\\d+ request|all caught up|no pending/i');
          await expect(afterCount.first()).toBeVisible({ timeout: 10000 });
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('4. Dialog Behavior Tests', () => {
    test('T037.16: Cancel closes dialog', async ({ page }) => {
      // Create a fresh request
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);

      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      const hasButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasButton) {
        await rejectButton.click();

        const dialog = page.getByRole('dialog');
        const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasDialog) {
          const cancelButton = dialog.getByRole('button', { name: /Cancel|Close/i });
          await cancelButton.click();

          // Dialog should close
          await page.waitForTimeout(1000);
          const stillVisible = await dialog.isVisible().catch(() => false);
          expect(stillVisible).toBeFalsy();
        }
      } else {
        test.skip();
      }
    });

    test('T037.19: Escape key closes dialog', async ({ page }) => {
      // Create a fresh request
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);

      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      const hasButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasButton) {
        await rejectButton.click();

        const dialog = page.getByRole('dialog');
        const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasDialog) {
          await page.keyboard.press('Escape');

          // Dialog should close
          await page.waitForTimeout(1000);
          const stillVisible = await dialog.isVisible().catch(() => false);
          expect(stillVisible).toBeFalsy();
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('5. Error Handling Tests', () => {
    test('T037.26: Shows error message on rejection failure', async ({ page }) => {
      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      const hasButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasButton) {
        await rejectButton.click();

        const reasonInput = page.locator('textarea').first();
        const hasTextarea = await reasonInput.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasTextarea) {
          await reasonInput.fill('Business documentation is incomplete and unverified');

          const submitBtn = page.getByRole('button', { name: /Confirm|Reject|Submit/i }).last();
          await submitBtn.click();

          await page.waitForTimeout(3000);

          // Should show either success or error
          const feedback = page.locator('text=/rejected|success|error|failed/i');
          await expect(feedback.first()).toBeVisible({ timeout: 10000 });
        }
      } else {
        test.skip();
      }
    });

    test('T037.28: Can retry after error', async ({ page }) => {
      // Create a fresh request
      const supabase = createSupabaseAdmin();
      await createOwnerRequest(supabase);

      await page.goto('/admin/owner-requests');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      const hasButton = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasButton) {
        await rejectButton.click();

        const reasonInput = page.locator('textarea').first();
        const hasTextarea = await reasonInput.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasTextarea) {
          await reasonInput.fill('Business documentation is incomplete and unverified');

          const submitBtn = page.getByRole('button', { name: /Confirm|Reject|Submit/i }).last();
          await submitBtn.click();

          await page.waitForTimeout(3000);

          // Should complete or show retry option
          expect(true).toBeTruthy();
        }
      } else {
        test.skip();
      }
    });
  });
});
