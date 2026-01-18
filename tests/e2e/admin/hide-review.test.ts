import { test, expect } from '@playwright/test';
import { loginAsAdmin, createSupabaseAdmin } from '../utils/auth';
import { createTestCampsite, createTestReview, createReviewReport, updateReviewStatus, cleanupTestData, TEST_DATA_PREFIX } from '../utils/test-data';

/**
 * E2E Test: Admin Hide Review Functionality (Real API)
 * Task T055: Admin can hide review
 *
 * Tests the admin hide review flow including:
 * - Navigation to reported reviews
 * - Hide reason dialog/form
 * - Validation and submission
 * - Post-hide verification
 * Part of Q11 report-based moderation system
 */

test.describe('Admin Hide Review E2E (Real API)', () => {
  test.setTimeout(60000);

  const supabase = createSupabaseAdmin();
  let testCampsiteId: string;
  let testReviewId: string;

  test.beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData(supabase);

    // Create test campsite
    const campsite = await createTestCampsite(supabase, {
      id: `${TEST_DATA_PREFIX}campsite-hide-review`,
      name: 'Test Campsite for Hide Review',
      status: 'approved'
    });
    testCampsiteId = campsite.id;

    // Create test review
    const review = await createTestReview(supabase, testCampsiteId, {
      id: `${TEST_DATA_PREFIX}review-hide-test`,
      comment: 'Terrible place, complete scam! This is spam content.',
      rating: 2,
      status: 'visible'
    });
    testReviewId = review.id;

    // Create report for the review
    await createReviewReport(supabase, testReviewId);
  });

  test.afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(supabase);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe('1. Hide Dialog/Form Tests', () => {
    test('T055.1: Hide button opens reason input', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Find and click hide button
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await expect(hideButton).toBeVisible();
      await hideButton.click();

      // Wait for dialog
      await page.waitForTimeout(200);

      // Verify hide reason dialog/form is visible
      const dialog = page.locator('[data-testid="hide-review-dialog"]');
      await expect(dialog).toBeVisible();
    });

    test('T055.2: Shows minimum character requirement (5 chars)', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Check for character requirement message
      const requirementText = page.locator('text=/minimum.*5.*character/i');
      await expect(requirementText).toBeVisible();
    });

    test('T055.3: Has Cancel and Confirm buttons', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Verify both buttons exist
      const cancelButton = page.locator('[data-testid="hide-cancel-button"]');
      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');

      await expect(cancelButton).toBeVisible();
      await expect(confirmButton).toBeVisible();
    });

    test('T055.4: Shows review being hidden', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Open hide dialog for first review
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Verify review content is shown in dialog
      const dialog = page.locator('[data-testid="hide-review-dialog"]');
      await expect(dialog).toContainText('Terrible place');
    });
  });

  test.describe('2. Reason Validation Tests', () => {
    test('T055.5: Cannot submit without reason', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Try to confirm without entering reason
      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');

      // Button should be disabled
      await expect(confirmButton).toBeDisabled();
    });

    test('T055.6: Cannot submit with reason < 5 chars', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter short reason (less than 5 characters)
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Bad');

      // Confirm button should be disabled
      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await expect(confirmButton).toBeDisabled();
    });

    test('T055.7: Shows error for short reason', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter short reason
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('No');

      // Blur to trigger validation
      await reasonInput.blur();
      await page.waitForTimeout(100);

      // Error message should appear
      const errorMessage = page.locator('[data-testid="hide-reason-error"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('at least 5 characters');
    });

    test('T055.8: Confirm button disabled when invalid', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');

      // Initially disabled (no input)
      await expect(confirmButton).toBeDisabled();

      // Still disabled with short reason
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Bad');
      await expect(confirmButton).toBeDisabled();
    });

    test('T055.9: Confirm button enabled when valid', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter valid reason (>= 5 characters)
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Violates community guidelines');

      // Confirm button should be enabled
      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await expect(confirmButton).toBeEnabled();
    });
  });

  test.describe('3. Hide Flow Tests', () => {
    test('T055.10: Can submit with valid reason', async ({ page }) => {
      // Create fresh review for this test
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-submit-test`,
        comment: 'Test review for submit validation',
        rating: 2,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter valid reason
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Violates community guidelines');

      // Submit
      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();

      // Wait for completion
      await page.waitForTimeout(1000);

      // Success (dialog should close or show success)
      const dialog = page.locator('[data-testid="hide-review-dialog"]');
      await expect(dialog).not.toBeVisible();

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });

    test('T055.11: Shows loading state during hide', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter valid reason
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Spam content');

      // Submit
      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();

      // Should show loading state (check immediately)
      await expect(confirmButton).toBeDisabled();
    });

    test('T055.12: Success message appears', async ({ page }) => {
      // Create fresh review for this test
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-success-msg-test`,
        comment: 'Test review for success message',
        rating: 2,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter valid reason and submit
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Inappropriate content');

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();

      // Wait for success
      await page.waitForTimeout(1000);

      // Success toast should appear
      const toast = page.locator('[data-testid="toast"]');
      await expect(toast).toBeVisible({ timeout: 3000 });
      await expect(toast).toContainText(/hidden/i);

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });

    test('T055.15: Can cancel hide action', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter reason
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Test reason');

      // Click cancel
      const cancelButton = page.locator('[data-testid="hide-cancel-button"]');
      await cancelButton.click();

      // Wait for dialog close
      await page.waitForTimeout(300);

      // Dialog should be closed
      const dialog = page.locator('[data-testid="hide-review-dialog"]');
      await expect(dialog).not.toBeVisible();

      // Review should still be visible
      await expect(page.getByText('Terrible place')).toBeVisible();
    });
  });

  test.describe('4. Post-Hide Verification Tests', () => {
    test('T055.16: Review not visible on campsite page', async ({ page }) => {
      // Create and hide a review
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-public-check`,
        comment: 'Hidden review should not appear',
        rating: 2,
        status: 'hidden'
      });

      // Navigate to campsite page
      await page.goto(`/campsites/${testCampsiteId}`);
      await page.waitForLoadState('networkidle');

      // Hidden review should not appear
      await expect(page.getByText('Hidden review should not appear')).not.toBeVisible();

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });
  });
});
