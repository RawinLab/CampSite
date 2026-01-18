import { test, expect } from '@playwright/test';
import { loginAsAdmin, createSupabaseAdmin } from '../utils/auth';
import { createTestCampsite, createTestReview, createReviewReport, cleanupTestData, TEST_DATA_PREFIX } from '../utils/test-data';

/**
 * E2E Test: Admin Review Deletion (Real API)
 * Task T057: Admin can delete review
 *
 * Tests the complete admin review deletion flow including:
 * - Confirmation dialog
 * - Permanent deletion
 * - Cascade deletion
 * - Error handling
 *
 * Part of Q11 report-based moderation system
 */

test.describe('Admin Review Deletion E2E (Real API)', () => {
  test.setTimeout(60000);

  const supabase = createSupabaseAdmin();
  let testCampsiteId: string;

  test.beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData(supabase);

    // Create test campsite
    const campsite = await createTestCampsite(supabase, {
      id: `${TEST_DATA_PREFIX}campsite-delete-test`,
      name: 'Test Campsite for Delete',
      status: 'approved'
    });
    testCampsiteId = campsite.id;
  });

  test.afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(supabase);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe('1. Delete Confirmation Tests', () => {
    test('T057.1: Delete button shows confirmation dialog', async ({ page }) => {
      // Create review with report
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-delete-confirm-1`,
        comment: 'This place is terrible! Avoid at all costs! Fake fake fake!',
        rating: 1,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Find delete button for first review
      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await expect(deleteButton).toBeVisible();
      await expect(deleteButton).toBeEnabled();

      // Click delete button
      await deleteButton.click();

      // Confirmation dialog should appear
      const dialog = page.locator('[data-testid="delete-review-dialog"]');
      await expect(dialog).toBeVisible();

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });

    test('T057.2: Dialog warns about permanent deletion', async ({ page }) => {
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-delete-warning`,
        comment: 'Test review for warning check',
        rating: 1,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      // Wait for dialog
      await page.waitForTimeout(200);

      // Dialog should contain warning about permanent deletion
      const warningText = page.locator('[data-testid="delete-warning"]');
      await expect(warningText).toBeVisible();
      await expect(warningText).toContainText(/permanent/i);
      await expect(warningText).toContainText(/cannot be undone/i);

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });

    test('T057.4: Has Cancel and Confirm buttons', async ({ page }) => {
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-delete-buttons`,
        comment: 'Test review for buttons check',
        rating: 1,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      // Verify both buttons exist
      const cancelButton = page.locator('[data-testid="delete-cancel-button"]');
      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');

      await expect(cancelButton).toBeVisible();
      await expect(confirmButton).toBeVisible();

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });
  });

  test.describe('2. Delete Flow Tests', () => {
    test('T057.6: Clicking confirm deletes review', async ({ page }) => {
      // Create review with report
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-delete-confirm-flow`,
        comment: 'Review to be deleted permanently',
        rating: 1,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      // Click confirm
      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for deletion
      await page.waitForTimeout(1000);

      // Verify review is gone from database
      const { data } = await supabase
        .from('reviews')
        .select('id')
        .eq('id', review.id)
        .single();

      expect(data).toBeNull();
    });

    test('T057.8: Success message appears', async ({ page }) => {
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-delete-success-msg`,
        comment: 'Review for success message test',
        rating: 1,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for success message
      await page.waitForTimeout(1000);

      // Success toast should appear
      const successToast = page.locator('[data-testid="toast-success"]');
      await expect(successToast).toBeVisible({ timeout: 5000 });
      await expect(successToast).toContainText(/deleted/i);
    });

    test('T057.9: Review removed from list', async ({ page }) => {
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-delete-list-removal`,
        comment: 'Review for list removal test',
        rating: 1,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Verify review is visible before deletion
      await expect(page.getByText('Review for list removal test')).toBeVisible();

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for removal
      await page.waitForTimeout(1000);

      // Review should be removed from list
      await expect(page.getByText('Review for list removal test')).not.toBeVisible();
    });
  });

  test.describe('3. Cancel Tests', () => {
    test('T057.17: Cancel closes dialog', async ({ page }) => {
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-delete-cancel`,
        comment: 'Review for cancel test',
        rating: 1,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      // Verify dialog is open
      const dialog = page.locator('[data-testid="delete-review-dialog"]');
      await expect(dialog).toBeVisible();

      // Click cancel
      const cancelButton = page.locator('[data-testid="delete-cancel-button"]');
      await cancelButton.click();

      // Wait for dialog close
      await page.waitForTimeout(300);

      // Dialog should be closed
      await expect(dialog).not.toBeVisible();

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });

    test('T057.18: Review remains after cancel', async ({ page }) => {
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-delete-cancel-persist`,
        comment: 'Review should remain after cancel',
        rating: 1,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      // Click cancel
      const cancelButton = page.locator('[data-testid="delete-cancel-button"]');
      await cancelButton.click();

      // Wait for dialog close
      await page.waitForTimeout(300);

      // Review should still be visible
      await expect(page.getByText('Review should remain after cancel')).toBeVisible();

      // Verify in database
      const { data } = await supabase
        .from('reviews')
        .select('id')
        .eq('id', review.id)
        .single();

      expect(data).not.toBeNull();

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });
  });

  test.describe('4. Permanent Deletion Verification Tests', () => {
    test('T057.11: Review not in database after deletion', async ({ page }) => {
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-delete-verify-db`,
        comment: 'Review to verify database deletion',
        rating: 1,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      await page.waitForTimeout(1000);

      // Verify review is gone from database
      const { data, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('id', review.id)
        .maybeSingle();

      expect(data).toBeNull();
    });

    test('T057.14: Cannot undo deletion', async ({ page }) => {
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-delete-no-undo`,
        comment: 'Review to verify no undo',
        rating: 1,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      await page.waitForTimeout(1000);

      // No undo button should be present
      const undoButton = page.getByRole('button', { name: /Undo/i });
      await expect(undoButton).not.toBeVisible();

      // Review should not reappear
      await page.waitForTimeout(1000);
      await expect(page.getByText('Review to verify no undo')).not.toBeVisible();
    });
  });
});
