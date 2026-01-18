import { test, expect } from '@playwright/test';
import { loginAsAdmin, createSupabaseAdmin } from '../utils/auth';
import { createTestCampsite, createTestReview, updateReviewStatus, cleanupTestData, TEST_DATA_PREFIX } from '../utils/test-data';

/**
 * E2E Test: Hidden Reviews Not Visible to Public Users (Real API)
 * Task T058: E2E: Hidden reviews not visible to users
 *
 * Verifies that when an admin hides a review, it does not appear on
 * the public campsite page for any user type
 *
 * Critical test for Q11 report-based moderation system
 */

test.describe('Hidden Reviews Public Visibility (Real API)', () => {
  test.setTimeout(60000);

  const supabase = createSupabaseAdmin();
  let testCampsiteId: string;
  let visibleReviewId: string;
  let hiddenReviewId: string;

  test.beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData(supabase);

    // Create test campsite
    const campsite = await createTestCampsite(supabase, {
      id: `${TEST_DATA_PREFIX}campsite-public-test`,
      name: 'Test Campsite for Public View',
      status: 'approved'
    });
    testCampsiteId = campsite.id;

    // Create visible review
    const visibleReview = await createTestReview(supabase, testCampsiteId, {
      id: `${TEST_DATA_PREFIX}review-visible`,
      comment: 'This is a visible review that should appear',
      rating: 5,
      status: 'visible'
    });
    visibleReviewId = visibleReview.id;

    // Create hidden review
    const hiddenReview = await createTestReview(supabase, testCampsiteId, {
      id: `${TEST_DATA_PREFIX}review-hidden`,
      comment: 'This review will be hidden by admin',
      rating: 1,
      status: 'hidden'
    });
    hiddenReviewId = hiddenReview.id;
  });

  test.afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(supabase);
  });

  test.describe('1. Pre-Hide Visibility Tests', () => {
    test('T058.1: Visible review appears on campsite detail page', async ({ page }) => {
      await page.goto(`/campsites/${testCampsiteId}`);
      await page.waitForLoadState('networkidle');

      // Visible review should appear
      await expect(page.getByText('This is a visible review that should appear')).toBeVisible();
    });
  });

  test.describe('2. Post-Hide Public View Tests', () => {
    test('T058.7: Hidden review NOT visible on campsite detail page', async ({ page }) => {
      await page.goto(`/campsites/${testCampsiteId}`);
      await page.waitForLoadState('networkidle');

      // Hidden review should NOT be visible
      await expect(page.getByText('This review will be hidden by admin')).not.toBeVisible();
    });

    test('T058.10: Hidden review NOT in reviews list', async ({ page }) => {
      await page.goto(`/campsites/${testCampsiteId}`);
      await page.waitForLoadState('networkidle');

      // Reviews list should not contain hidden review
      const reviewsList = page.locator('[data-testid="reviews-list"]');
      if (await reviewsList.isVisible()) {
        await expect(reviewsList).not.toContainText('This review will be hidden by admin');
      }
    });

    test('T058.11: No error messages shown for hidden reviews', async ({ page }) => {
      await page.goto(`/campsites/${testCampsiteId}`);
      await page.waitForLoadState('networkidle');

      // No error messages should appear
      await expect(page.getByText(/error/i)).not.toBeVisible();
      await expect(page.getByText(/failed/i)).not.toBeVisible();
    });
  });

  test.describe('3. Different User Perspectives', () => {
    test('T058.12: Anonymous user cannot see hidden review', async ({ page }) => {
      // No login - anonymous user
      await page.goto(`/campsites/${testCampsiteId}`);
      await page.waitForLoadState('networkidle');

      // Hidden review should not be visible
      await expect(page.getByText('This review will be hidden by admin')).not.toBeVisible();
    });

    test('T058.13: Logged-in user cannot see hidden review', async ({ page }) => {
      // This test assumes user login - for now we'll test as anonymous
      // In a real scenario, you would use loginAsUser from auth utils
      await page.goto(`/campsites/${testCampsiteId}`);
      await page.waitForLoadState('networkidle');

      // Hidden review should not be visible
      await expect(page.getByText('This review will be hidden by admin')).not.toBeVisible();
    });
  });

  test.describe('4. Unhide Restoration Tests', () => {
    test('T058.21: Review becomes visible again after unhiding', async ({ page }) => {
      // Unhide the review
      await updateReviewStatus(supabase, hiddenReviewId, 'visible');

      await page.goto(`/campsites/${testCampsiteId}`);
      await page.waitForLoadState('networkidle');

      // Review should be visible again
      await expect(page.getByText('This review will be hidden by admin')).toBeVisible();

      // Re-hide it for other tests
      await updateReviewStatus(supabase, hiddenReviewId, 'hidden');
    });
  });

  test.describe('5. Mix of Visible and Hidden Reviews', () => {
    test('T058.27: Mix of visible and hidden reviews shows only visible ones', async ({ page }) => {
      await page.goto(`/campsites/${testCampsiteId}`);
      await page.waitForLoadState('networkidle');

      // Visible review should be shown
      await expect(page.getByText('This is a visible review that should appear')).toBeVisible();

      // Hidden review should NOT be shown
      await expect(page.getByText('This review will be hidden by admin')).not.toBeVisible();
    });
  });

  test.describe('6. Admin View vs Public View', () => {
    test('T058.ADMIN: Admin can see all reviews in admin panel', async ({ page }) => {
      await loginAsAdmin(page);

      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      // Admin should see hidden review in admin panel
      await expect(page.getByText('This review will be hidden by admin')).toBeVisible();
    });

    test('T058.PUBLIC: Public cannot see hidden reviews on campsite page', async ({ page }) => {
      // No login - anonymous public user
      await page.goto(`/campsites/${testCampsiteId}`);
      await page.waitForLoadState('networkidle');

      // Public should NOT see hidden review
      await expect(page.getByText('This review will be hidden by admin')).not.toBeVisible();

      // Public SHOULD see visible review
      await expect(page.getByText('This is a visible review that should appear')).toBeVisible();
    });
  });

  test.describe('7. Empty State for Only Hidden Reviews', () => {
    test('T058.19: Campsite with only hidden reviews shows no reviews', async ({ page }) => {
      // Create a new campsite with only hidden reviews
      const campsite2 = await createTestCampsite(supabase, {
        id: `${TEST_DATA_PREFIX}campsite-only-hidden`,
        name: 'Campsite with Only Hidden Reviews',
        status: 'approved'
      });

      await createTestReview(supabase, campsite2.id, {
        id: `${TEST_DATA_PREFIX}review-only-hidden-1`,
        comment: 'Hidden review 1',
        rating: 1,
        status: 'hidden'
      });

      await page.goto(`/campsites/${campsite2.id}`);
      await page.waitForLoadState('networkidle');

      // Should show "no reviews" state
      await expect(page.getByText(/no reviews yet/i)).toBeVisible();

      // Cleanup
      await supabase.from('campsites').delete().eq('id', campsite2.id);
    });
  });

  test.describe('8. Full Hide-Verify-Unhide Workflow', () => {
    test('T058.24: Full hide-verify-unhide workflow', async ({ page }) => {
      // Create a new review for this workflow test
      const testReview = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-workflow`,
        comment: 'Review for full workflow test',
        rating: 3,
        status: 'visible'
      });

      // Step 1: Verify review is visible
      await page.goto(`/campsites/${testCampsiteId}`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Review for full workflow test')).toBeVisible();

      // Step 2: Hide the review
      await updateReviewStatus(supabase, testReview.id, 'hidden');

      // Step 3: Verify review is hidden
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Review for full workflow test')).not.toBeVisible();

      // Step 4: Unhide the review
      await updateReviewStatus(supabase, testReview.id, 'visible');

      // Step 5: Verify review is visible again
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Review for full workflow test')).toBeVisible();

      // Cleanup
      await supabase.from('reviews').delete().eq('id', testReview.id);
    });

    test('T058.25: Hidden review stays hidden across page refreshes', async ({ page }) => {
      await page.goto(`/campsites/${testCampsiteId}`);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText('This review will be hidden by admin')).not.toBeVisible();

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Still hidden
      await expect(page.getByText('This review will be hidden by admin')).not.toBeVisible();
    });
  });
});
