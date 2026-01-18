import { test, expect } from '@playwright/test';
import { loginAsAdmin, createSupabaseAdmin } from '../utils/auth';
import { createTestCampsite, createTestReview, createReviewReport, cleanupTestData, TEST_DATA_PREFIX } from '../utils/test-data';

/**
 * E2E Test: Admin Reported Reviews Page (Real API)
 * Tests the reported reviews management page with real database
 */

test.describe('Admin Reported Reviews Page E2E (Real API)', () => {
  test.setTimeout(60000);

  const supabase = createSupabaseAdmin();
  let testCampsiteId: string;
  let reportedReviewId: string;

  test.beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData(supabase);

    // Create test campsite
    const campsite = await createTestCampsite(supabase, {
      id: `${TEST_DATA_PREFIX}campsite-reported-page`,
      name: 'Mountain View Camp',
      status: 'approved'
    });
    testCampsiteId = campsite.id;

    // Create reported review
    const review = await createTestReview(supabase, testCampsiteId, {
      id: `${TEST_DATA_PREFIX}review-reported-main`,
      comment: 'This campsite was awful. The facilities were dirty and the staff was rude. Would not recommend to anyone.',
      rating: 1,
      status: 'visible'
    });
    reportedReviewId = review.id;

    // Create report for the review
    await createReviewReport(supabase, reportedReviewId);
  });

  test.afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(supabase);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe('1. Page Access Tests', () => {
    test('T054.3: Allows access for admin role', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Should show reported reviews page
      await expect(page.getByText('Reported Reviews')).toBeVisible();
    });
  });

  test.describe('2. Page Rendering Tests', () => {
    test('T054.4: Shows page title "Reported Reviews"', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: 'Reported Reviews' })).toBeVisible();
    });

    test('T054.6: Shows empty state when no reported reviews', async ({ page }) => {
      // Temporarily remove all reports
      await supabase
        .from('review_reports')
        .delete()
        .like('id', `${TEST_DATA_PREFIX}%`);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText('All caught up!')).toBeVisible();
      await expect(page.getByText(/No reported reviews to moderate/i)).toBeVisible();

      // Restore report
      await createReviewReport(supabase, reportedReviewId);
    });
  });

  test.describe('3. Review Card Display Tests', () => {
    test('T054.8: Shows review content and title', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/This campsite was awful/i)).toBeVisible();
    });

    test('T054.11: Shows campsite name', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/Mountain View Camp/i)).toBeVisible();
    });

    test('T054.12: Shows report count badge', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/1.*report/i).first()).toBeVisible();
    });
  });

  test.describe('4. Action Buttons Tests', () => {
    test('T054.20: Shows Dismiss button', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const dismissButton = page.getByRole('button', { name: /Dismiss/i }).first();
      await expect(dismissButton).toBeVisible();
    });

    test('T054.21: Shows Hide button', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await expect(hideButton).toBeVisible();
    });

    test('T054.22: Shows Delete button', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await expect(deleteButton).toBeVisible();
    });

    test('T054.26: Hide button opens dialog', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();

      // Should show hide dialog
      await expect(page.getByText('Hide Review')).toBeVisible();
      await expect(page.getByText(/provide a reason/i)).toBeVisible();
    });
  });

  test.describe('5. Moderation Actions Tests', () => {
    test('T054.29: Can hide review with reason', async ({ page }) => {
      // Create fresh review for this test
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-hide-action`,
        comment: 'Test review for hiding',
        rating: 1,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();

      // Fill in reason
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Contains inappropriate content');

      // Confirm hide
      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();

      // Wait for action to complete
      await page.waitForTimeout(1000);

      // Review should be removed or status updated
      await expect(page.getByText('Test review for hiding')).not.toBeVisible();

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });

    test('T054.30: Can delete review permanently', async ({ page }) => {
      // Create fresh review for this test
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-delete-action`,
        comment: 'Test review for deletion',
        rating: 1,
        status: 'visible'
      });
      await createReviewReport(supabase, review.id);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      // Wait for confirmation dialog
      await page.waitForTimeout(200);

      // Confirm deletion
      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for action to complete
      await page.waitForTimeout(1000);

      // Review should be removed
      await expect(page.getByText('Test review for deletion')).not.toBeVisible();

      // Verify deletion in database
      const { data } = await supabase
        .from('reviews')
        .select('id')
        .eq('id', review.id)
        .maybeSingle();

      expect(data).toBeNull();
    });
  });

  test.describe('6. Refresh Functionality Tests', () => {
    test('T054.36: Shows refresh button', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      await expect(refreshButton).toBeVisible();
    });

    test('T054.37: Refresh button reloads data', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Create a new review after page load
      const newReview = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-refresh-test`,
        comment: 'New review after page load',
        rating: 1,
        status: 'visible'
      });
      await createReviewReport(supabase, newReview.id);

      // Click refresh
      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      await refreshButton.click();

      await page.waitForTimeout(1000);

      // New review should appear
      await expect(page.getByText('New review after page load')).toBeVisible();

      // Cleanup
      await supabase.from('reviews').delete().eq('id', newReview.id);
    });
  });

  test.describe('7. Empty State Tests', () => {
    test('T054.45: Shows empty state icon', async ({ page }) => {
      // Remove all reports
      await supabase
        .from('review_reports')
        .delete()
        .like('id', `${TEST_DATA_PREFIX}%`);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Should show icon (MessageSquareWarning component)
      const emptyIcon = page.locator('.text-green-600');
      await expect(emptyIcon).toBeVisible();

      // Restore report
      await createReviewReport(supabase, reportedReviewId);
    });
  });
});
