/**
 * E2E Test: Report Button Visibility on Own Reviews
 * Task T067: E2E test for report button hidden on user's own reviews
 *
 * Tests that:
 * - Report button is hidden on user's own review
 * - Report button is visible on other users' reviews
 * - Visibility is correct in same page view
 * - Visibility persists after page refresh
 */

import { test, expect } from '@playwright/test';

test.describe('Review Report Button Visibility', () => {
  const mockCampsiteId = 'campsite-123';
  const mockUserId = 'user-123';
  const mockOtherUserId = 'user-456';

  test.beforeEach(async ({ page }) => {
    // Mock authentication for the logged-in user
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: mockUserId,
            email: 'testuser@example.com',
            role: 'user',
          },
        }),
      });
    });

    // Mock reviews API to return both own review and other user's review
    await page.route(`**/api/campsites/${mockCampsiteId}/reviews`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviews: [
            {
              id: 'review-own',
              user_id: mockUserId,
              campsite_id: mockCampsiteId,
              rating: 5,
              comment: 'My own review - great campsite!',
              created_at: new Date().toISOString(),
              user: {
                id: mockUserId,
                name: 'Test User',
              },
            },
            {
              id: 'review-other',
              user_id: mockOtherUserId,
              campsite_id: mockCampsiteId,
              rating: 4,
              comment: 'Another user review - nice place',
              created_at: new Date().toISOString(),
              user: {
                id: mockOtherUserId,
                name: 'Other User',
              },
            },
          ],
        }),
      });
    });

    // Navigate to campsite detail page with reviews
    await page.goto(`/campsites/${mockCampsiteId}`);
    await page.waitForLoadState('networkidle');
  });

  test('T067.1: Report button is hidden on user own review', async ({ page }) => {
    // Find the user's own review
    const ownReview = page.locator('[data-testid="review-own"]').or(
      page.locator('text=My own review - great campsite!').locator('xpath=ancestor::div[contains(@class, "review")]')
    );

    await expect(ownReview).toBeVisible();

    // Report button should not be visible within this review
    const reportButton = ownReview.locator('[data-testid="report-button"]').or(
      ownReview.locator('button:has-text("Report")').or(
        ownReview.locator('button:has-text("รายงาน")')
      )
    );

    await expect(reportButton).not.toBeVisible();
  });

  test('T067.2: Report button is visible on other users reviews', async ({ page }) => {
    // Find another user's review
    const otherReview = page.locator('[data-testid="review-other"]').or(
      page.locator('text=Another user review - nice place').locator('xpath=ancestor::div[contains(@class, "review")]')
    );

    await expect(otherReview).toBeVisible();

    // Report button should be visible within this review
    const reportButton = otherReview.locator('[data-testid="report-button"]').or(
      otherReview.locator('button:has-text("Report")').or(
        otherReview.locator('button:has-text("รายงาน")')
      )
    );

    await expect(reportButton).toBeVisible();
  });

  test('T067.3: Both visibility states correct in same page view', async ({ page }) => {
    // Wait for reviews to load
    await page.waitForSelector('text=My own review - great campsite!');
    await page.waitForSelector('text=Another user review - nice place');

    // Check own review - no report button
    const ownReview = page.locator('text=My own review - great campsite!').locator('xpath=ancestor::div[contains(@class, "review")]');
    const ownReportButton = ownReview.locator('[data-testid="report-button"]').or(
      ownReview.locator('button:has-text("Report")').or(
        ownReview.locator('button:has-text("รายงาน")')
      )
    );
    await expect(ownReportButton).not.toBeVisible();

    // Check other user's review - has report button
    const otherReview = page.locator('text=Another user review - nice place').locator('xpath=ancestor::div[contains(@class, "review")]');
    const otherReportButton = otherReview.locator('[data-testid="report-button"]').or(
      otherReview.locator('button:has-text("Report")').or(
        otherReview.locator('button:has-text("รายงาน")')
      )
    );
    await expect(otherReportButton).toBeVisible();
  });

  test('T067.4: Report button visibility persists after page refresh', async ({ page }) => {
    // Initial check
    const ownReview = page.locator('text=My own review - great campsite!').locator('xpath=ancestor::div[contains(@class, "review")]');
    const ownReportButton = ownReview.locator('[data-testid="report-button"]').or(
      ownReview.locator('button:has-text("Report")').or(
        ownReview.locator('button:has-text("รายงาน")')
      )
    );
    await expect(ownReportButton).not.toBeVisible();

    const otherReview = page.locator('text=Another user review - nice place').locator('xpath=ancestor::div[contains(@class, "review")]');
    const otherReportButton = otherReview.locator('[data-testid="report-button"]').or(
      otherReview.locator('button:has-text("Report")').or(
        otherReview.locator('button:has-text("รายงาน")')
      )
    );
    await expect(otherReportButton).toBeVisible();

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for reviews to load again
    await page.waitForSelector('text=My own review - great campsite!');
    await page.waitForSelector('text=Another user review - nice place');

    // Check visibility again after refresh
    const ownReviewAfterRefresh = page.locator('text=My own review - great campsite!').locator('xpath=ancestor::div[contains(@class, "review")]');
    const ownReportButtonAfterRefresh = ownReviewAfterRefresh.locator('[data-testid="report-button"]').or(
      ownReviewAfterRefresh.locator('button:has-text("Report")').or(
        ownReviewAfterRefresh.locator('button:has-text("รายงาน")')
      )
    );
    await expect(ownReportButtonAfterRefresh).not.toBeVisible();

    const otherReviewAfterRefresh = page.locator('text=Another user review - nice place').locator('xpath=ancestor::div[contains(@class, "review")]');
    const otherReportButtonAfterRefresh = otherReviewAfterRefresh.locator('[data-testid="report-button"]').or(
      otherReviewAfterRefresh.locator('button:has-text("Report")').or(
        otherReviewAfterRefresh.locator('button:has-text("รายงาน")')
      )
    );
    await expect(otherReportButtonAfterRefresh).toBeVisible();
  });

  test('T067.5: No report button visible when not authenticated', async ({ page }) => {
    // Mock unauthenticated state
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Not authenticated',
        }),
      });
    });

    // Reload page to apply unauthenticated state
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for reviews to load
    await page.waitForSelector('text=My own review - great campsite!').catch(() => {});
    await page.waitForSelector('text=Another user review - nice place').catch(() => {});

    // All report buttons should be hidden when not authenticated
    const reportButtons = page.locator('[data-testid="report-button"]').or(
      page.locator('button:has-text("Report")').or(
        page.locator('button:has-text("รายงาน")')
      )
    );

    const count = await reportButtons.count();
    expect(count).toBe(0);
  });

  test('T067.6: Report button only visible on reviews, not elsewhere', async ({ page }) => {
    // Wait for reviews to load
    await page.waitForSelector('text=Another user review - nice place');

    // Get the other user's review
    const otherReview = page.locator('text=Another user review - nice place').locator('xpath=ancestor::div[contains(@class, "review")]');

    // Report button should be visible within the review
    const reportButtonInReview = otherReview.locator('[data-testid="report-button"]').or(
      otherReview.locator('button:has-text("Report")').or(
        otherReview.locator('button:has-text("รายงาน")')
      )
    );
    await expect(reportButtonInReview).toBeVisible();

    // Check that report button is scoped to reviews (not appearing in navigation, header, etc.)
    const allReportButtons = page.locator('[data-testid="report-button"]').or(
      page.locator('button:has-text("Report")').or(
        page.locator('button:has-text("รายงาน")')
      )
    );

    // Count should only include buttons within other users' reviews
    const buttonCount = await allReportButtons.count();

    // Should have exactly 1 report button (only on other user's review)
    expect(buttonCount).toBe(1);
  });
});
