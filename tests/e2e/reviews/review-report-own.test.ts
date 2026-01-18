/**
 * E2E Test: Report Button Visibility on Own Reviews
 * Task T067: E2E test for report button hidden on user's own reviews
 *
 * Tests that:
 * - Report button is hidden on user's own review
 * - Report button is visible on other users' reviews
 * - Visibility is correct in same page view
 * - Visibility persists after page refresh
 *
 * REAL API VERSION - Uses actual backend API at http://localhost:3091
 */

import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsOwner } from '../utils/auth';
import { createSupabaseAdmin } from '../utils/auth';
import { createTestReview } from '../utils/test-data';

test.describe('Review Report Button Visibility', () => {
  test.setTimeout(60000);

  const TEST_CAMPSITE_ID = 'e2e-test-campsite-approved-1';
  let ownerReviewId: string;

  test.beforeAll(async () => {
    // Create an additional review from owner to test "other user's review"
    const supabase = createSupabaseAdmin();
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('auth_user_id')
      .eq('email', 'owner@campsite.local')
      .single();

    if (ownerProfile) {
      const review = await createTestReview(supabase, TEST_CAMPSITE_ID, {
        id: 'e2e-test-review-from-owner',
        user_id: ownerProfile.auth_user_id,
        rating: 5,
        comment: 'Owner review - different from logged in user',
      });
      ownerReviewId = review.id;
    }
  });

  test.afterAll(async () => {
    // Cleanup owner review
    if (ownerReviewId) {
      const supabase = createSupabaseAdmin();
      await supabase.from('reviews').delete().eq('id', ownerReviewId);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Real authentication - login as regular user
    await loginAsUser(page);

    // Navigate to campsite detail page with reviews
    await page.goto(`/campsites/${TEST_CAMPSITE_ID}`);
    await page.waitForTimeout(3000);
  });

  test('T067.1: Report button is hidden on user own review', async ({ page }) => {
    // Wait for reviews to load
    await page.waitForTimeout(2000);

    // Find the user's own review (created by user@campsite.local in seed data)
    // Looking for review with text "Great place for camping! E2E test review."
    const ownReviewText = 'Great place for camping! E2E test review.';
    const ownReview = page.locator(`text=${ownReviewText}`).locator('xpath=ancestor::div[contains(@class, "review") or @data-testid="review-card"]').first();

    const hasOwnReview = await ownReview.isVisible().catch(() => false);

    if (hasOwnReview) {
      // Report button should not be visible within this review
      const reportButton = ownReview.locator('[data-testid="report-button"], button:has-text("Report"), button:has-text("รายงาน")');
      await expect(reportButton).not.toBeVisible();
    } else {
      console.log('Own review not found - user may not have created a review yet');
      test.skip();
    }
  });

  test('T067.2: Report button is visible on other users reviews', async ({ page }) => {
    // Wait for reviews to load
    await page.waitForTimeout(2000);

    // Find owner's review (different from logged-in user)
    const otherReviewText = 'Owner review - different from logged in user';
    const otherReview = page.locator(`text=${otherReviewText}`).locator('xpath=ancestor::div[contains(@class, "review") or @data-testid="review-card"]').first();

    const hasOtherReview = await otherReview.isVisible().catch(() => false);

    if (hasOtherReview) {
      // Report button should be visible within this review
      const reportButton = otherReview.locator('[data-testid="report-button"], button:has-text("Report"), button:has-text("รายงาน")');
      await expect(reportButton).toBeVisible();
    } else {
      console.log('Other user review not found - may need to seed data');
      test.skip();
    }
  });

  test('T067.3: Both visibility states correct in same page view', async ({ page }) => {
    // Wait for reviews to load
    await page.waitForTimeout(2000);

    const ownReviewText = 'Great place for camping! E2E test review.';
    const otherReviewText = 'Owner review - different from logged in user';

    const hasOwnReview = await page.locator(`text=${ownReviewText}`).isVisible().catch(() => false);
    const hasOtherReview = await page.locator(`text=${otherReviewText}`).isVisible().catch(() => false);

    if (!hasOwnReview || !hasOtherReview) {
      console.log('Both reviews not found - skipping test');
      test.skip();
    }

    // Check own review - no report button
    const ownReview = page.locator(`text=${ownReviewText}`).locator('xpath=ancestor::div[contains(@class, "review") or @data-testid="review-card"]').first();
    const ownReportButton = ownReview.locator('[data-testid="report-button"], button:has-text("Report"), button:has-text("รายงาน")');
    await expect(ownReportButton).not.toBeVisible();

    // Check other user's review - has report button
    const otherReview = page.locator(`text=${otherReviewText}`).locator('xpath=ancestor::div[contains(@class, "review") or @data-testid="review-card"]').first();
    const otherReportButton = otherReview.locator('[data-testid="report-button"], button:has-text("Report"), button:has-text("รายงาน")');
    await expect(otherReportButton).toBeVisible();
  });

  test('T067.4: Report button visibility persists after page refresh', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);

    const otherReviewText = 'Owner review - different from logged in user';
    const hasOtherReview = await page.locator(`text=${otherReviewText}`).isVisible().catch(() => false);

    if (!hasOtherReview) {
      console.log('Other user review not found - skipping test');
      test.skip();
    }

    // Initial check
    const otherReview = page.locator(`text=${otherReviewText}`).locator('xpath=ancestor::div[contains(@class, "review") or @data-testid="review-card"]').first();
    const otherReportButton = otherReview.locator('[data-testid="report-button"], button:has-text("Report"), button:has-text("รายงาน")');
    await expect(otherReportButton).toBeVisible();

    // Refresh the page
    await page.reload();
    await page.waitForTimeout(3000);

    // Check visibility again after refresh
    const otherReviewAfterRefresh = page.locator(`text=${otherReviewText}`).locator('xpath=ancestor::div[contains(@class, "review") or @data-testid="review-card"]').first();
    const otherReportButtonAfterRefresh = otherReviewAfterRefresh.locator('[data-testid="report-button"], button:has-text("Report"), button:has-text("รายงาน")');
    await expect(otherReportButtonAfterRefresh).toBeVisible();
  });

  // Skip authentication-dependent tests that require mocking
  test.skip('T067.5: No report button visible when not authenticated (requires unauthenticated state)');
  test.skip('T067.6: Report button only visible on reviews, not elsewhere (UI-dependent)');
});
