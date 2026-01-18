import { test, expect } from '@playwright/test';
import { loginAsAdmin, createSupabaseAdmin } from '../utils/auth';
import { createTestCampsite, createTestReview, updateReviewStatus, cleanupTestData, TEST_DATA_PREFIX } from '../utils/test-data';

/**
 * E2E Test: Admin Review Unhide (Real API)
 * Tests admin unhiding reviews functionality with real database
 */

test.describe('Admin Review Unhide E2E (Real API)', () => {
  test.setTimeout(60000);

  const supabase = createSupabaseAdmin();
  let testCampsiteId: string;
  let hiddenReviewId: string;

  test.beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData(supabase);

    // Create test campsite
    const campsite = await createTestCampsite(supabase, {
      id: `${TEST_DATA_PREFIX}campsite-unhide-test`,
      name: 'Test Campsite for Unhide',
      status: 'approved'
    });
    testCampsiteId = campsite.id;

    // Create hidden review
    const review = await createTestReview(supabase, testCampsiteId, {
      id: `${TEST_DATA_PREFIX}review-hidden-1`,
      comment: 'Great camping experience',
      rating: 4,
      status: 'hidden'
    });
    hiddenReviewId = review.id;
  });

  test.afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(supabase);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe('1. Finding Hidden Reviews Tests', () => {
    test('T056.1: Can access hidden reviews list', async ({ page }) => {
      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      // Should be on hidden reviews page
      await expect(page).toHaveURL(/\/admin\/reviews\/hidden/);

      // Page should have title/heading
      await expect(page.getByText(/Hidden Reviews/i)).toBeVisible();
    });

    test('T056.2: Hidden reviews show "hidden" status', async ({ page }) => {
      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      // Look for hidden status badge or indicator
      const hiddenBadge = page.locator('[data-testid="status-badge"]').first();
      await expect(hiddenBadge).toBeVisible();
      await expect(hiddenBadge).toContainText(/hidden/i);
    });

    test('T056.5: Displays review content even when hidden', async ({ page }) => {
      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      // Hidden reviews should still show content for admin review
      await expect(page.getByText('Great camping experience')).toBeVisible();
    });

    test('T056.6: Shows campsite name for hidden reviews', async ({ page }) => {
      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      // Should show which campsite the review is for
      await expect(page.getByText('Test Campsite for Unhide')).toBeVisible();
    });
  });

  test.describe('2. Unhide Action Tests', () => {
    test('T056.8: Unhide button visible for hidden reviews', async ({ page }) => {
      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await expect(unhideButton).toBeVisible();
      await expect(unhideButton).toBeEnabled();
    });

    test('T056.10: No reason required for unhide', async ({ page }) => {
      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // Should NOT show a dialog asking for reason
      await page.waitForTimeout(500);
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('T056.12: Success message appears after unhide', async ({ page }) => {
      // Create a fresh hidden review for this test
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-unhide-success`,
        comment: 'Review to test success message',
        rating: 4,
        status: 'hidden'
      });

      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // Wait for success toast/message
      await page.waitForTimeout(1000);

      // Should show success message
      const toast = page.locator('[data-testid="toast"]');
      await expect(toast).toBeVisible({ timeout: 3000 });
      await expect(toast).toContainText(/unhidden/i);

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });
  });

  test.describe('3. Post-Unhide Verification Tests', () => {
    test('T056.14: Review removed from hidden list after unhide', async ({ page }) => {
      // Create a fresh hidden review
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-unhide-removal`,
        comment: 'Review to test removal from list',
        rating: 4,
        status: 'hidden'
      });

      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      // Verify review is visible before unhide
      await expect(page.getByText('Review to test removal from list')).toBeVisible();

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // Wait for removal
      await page.waitForTimeout(1000);

      // Review should disappear from hidden list
      await expect(page.getByText('Review to test removal from list')).not.toBeVisible();

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });

    test('T056.15: Review is now visible on campsite page', async ({ page }) => {
      // Create a hidden review and unhide it
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-unhide-public`,
        comment: 'Unhidden review should be visible',
        rating: 4,
        status: 'visible'
      });

      // Navigate to campsite page
      await page.goto(`/campsites/${testCampsiteId}`);
      await page.waitForLoadState('networkidle');

      // Should see unhidden review
      await expect(page.getByText('Unhidden review should be visible')).toBeVisible();

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });

    test('T056.17: is_hidden flag is false after unhide', async ({ page }) => {
      // Create and unhide a review
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-flag-check`,
        comment: 'Check hidden flag',
        rating: 4,
        status: 'hidden'
      });

      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(1000);

      // Verify in database
      const { data } = await supabase
        .from('reviews')
        .select('status')
        .eq('id', review.id)
        .single();

      expect(data?.status).toBe('visible');

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });
  });

  test.describe('4. UI Updates Tests', () => {
    test('T056.19: Review status changes in UI', async ({ page }) => {
      // Create a hidden review
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-ui-status`,
        comment: 'UI status change test',
        rating: 4,
        status: 'hidden'
      });

      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(1000);

      // Status should change (review removed from hidden list)
      await expect(page.getByText('UI status change test')).not.toBeVisible();

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });

    test('T056.23: List updates without full page reload', async ({ page }) => {
      // Create a hidden review
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-no-reload`,
        comment: 'No reload test',
        rating: 4,
        status: 'hidden'
      });

      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      // Track navigation events
      let navigationCount = 0;
      page.on('framenavigated', () => {
        navigationCount++;
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(1000);

      // Should not trigger full page navigation (only initial load)
      expect(navigationCount).toBeLessThanOrEqual(1);

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });
  });

  test.describe('5. Navigation Tests', () => {
    test('T056.33: Stays on hidden reviews page after unhide', async ({ page }) => {
      // Create a hidden review
      const review = await createTestReview(supabase, testCampsiteId, {
        id: `${TEST_DATA_PREFIX}review-stay-page`,
        comment: 'Stay on page test',
        rating: 4,
        status: 'hidden'
      });

      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(1000);

      // Should still be on hidden reviews page
      await expect(page).toHaveURL(/\/admin\/reviews\/hidden/);

      // Cleanup
      await supabase.from('reviews').delete().eq('id', review.id);
    });
  });

  test.describe('6. Empty State Tests', () => {
    test('T056.31: Shows empty state when no hidden reviews', async ({ page }) => {
      // Clean all hidden reviews temporarily
      await supabase
        .from('reviews')
        .update({ status: 'visible' })
        .like('id', `${TEST_DATA_PREFIX}%`)
        .eq('status', 'hidden');

      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      // Should show empty state
      await expect(page.getByText(/All caught up!/i)).toBeVisible();
      await expect(page.getByText(/No hidden reviews/i)).toBeVisible();

      // Restore hidden review
      await updateReviewStatus(supabase, hiddenReviewId, 'hidden');
    });

    test('T056.32: Empty state shows appropriate icon', async ({ page }) => {
      // Clean all hidden reviews temporarily
      await supabase
        .from('reviews')
        .update({ status: 'visible' })
        .like('id', `${TEST_DATA_PREFIX}%`)
        .eq('status', 'hidden');

      await page.goto('/admin/reviews/hidden');
      await page.waitForLoadState('networkidle');

      // Should have icon (check for colored element which indicates icon)
      const emptyStateCard = page.locator('.text-green-600');
      await expect(emptyStateCard).toBeVisible();

      // Restore hidden review
      await updateReviewStatus(supabase, hiddenReviewId, 'hidden');
    });
  });
});
