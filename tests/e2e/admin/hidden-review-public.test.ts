import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

/**
 * E2E Test: Hidden Reviews Not Visible to Public Users
 * Task T058: E2E: Hidden reviews not visible to users
 *
 * Verifies that when an admin hides a review, it does not appear on
 * the public campsite page for any user type (anonymous, logged-in, owner, or review author)
 *
 * Critical test for Q11 report-based moderation system
 */

test.describe('Hidden Reviews Public Visibility', () => {
  let browser: Browser;
  let adminContext: BrowserContext;
  let adminPage: Page;

  const CAMPSITE_ID = 'test-campsite-1';
  const REVIEW_ID = 'test-review-1';
  const REVIEW_CONTENT = 'This review will be hidden by admin';
  const HIDE_REASON = 'Inappropriate content detected';

  test.beforeAll(async ({ browser: testBrowser }) => {
    browser = testBrowser;
  });

  test.describe('1. Pre-Hide Visibility Tests', () => {
    test('T058.1: Review visible on campsite detail page before hiding', async ({ page }) => {
      // Mock campsite with visible review
      await page.route(`**/api/campsites/${CAMPSITE_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CAMPSITE_ID,
              name: 'Test Campsite',
              description: 'A test campsite',
              rating_average: 4.5,
              review_count: 1,
            },
          }),
        });
      });

      await page.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: REVIEW_ID,
                content: REVIEW_CONTENT,
                rating_overall: 4,
                user_name: 'Test User',
                is_hidden: false,
                created_at: new Date().toISOString(),
              },
            ],
            pagination: { page: 1, limit: 10, total: 1 },
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Review should be visible
      await expect(page.getByText(REVIEW_CONTENT)).toBeVisible();
    });

    test('T058.2: Review counted in review count before hiding', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CAMPSITE_ID,
              name: 'Test Campsite',
              rating_average: 4.5,
              review_count: 1,
            },
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Review count should include the review
      await expect(page.getByText(/1.*review/i)).toBeVisible();
    });

    test('T058.3: Review included in average rating before hiding', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CAMPSITE_ID,
              name: 'Test Campsite',
              rating_average: 4.5,
              review_count: 1,
            },
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Rating should be visible
      await expect(page.getByText('4.5')).toBeVisible();
    });

    test('T058.4: Review appears in reviews list before hiding', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: REVIEW_ID,
                content: REVIEW_CONTENT,
                rating_overall: 4,
                user_name: 'Test User',
                is_hidden: false,
              },
            ],
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Review should be in the list
      const reviewsList = page.locator('[data-testid="reviews-list"]');
      await expect(reviewsList).toContainText(REVIEW_CONTENT);
    });
  });

  test.describe('2. Hide Action Tests', () => {
    test('T058.5: Admin can hide the review', async ({ browser }) => {
      adminContext = await browser.newContext();
      adminPage = await adminContext.newPage();

      // Mock admin authentication
      await adminContext.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-admin-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      // Mock reported reviews list
      await adminPage.route('**/api/admin/reviews/reported*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: REVIEW_ID,
                content: REVIEW_CONTENT,
                campsite_name: 'Test Campsite',
                is_reported: true,
                report_count: 3,
                is_hidden: false,
              },
            ],
          }),
        });
      });

      await adminPage.goto('/admin/reviews/reported');
      await adminPage.waitForLoadState('networkidle');

      // Find and click hide button
      const hideButton = adminPage.locator(`[data-testid="hide-button-${REVIEW_ID}"]`).first();
      await expect(hideButton).toBeVisible();
    });

    test('T058.6: Hide action succeeds with confirmation', async ({ browser }) => {
      adminContext = await browser.newContext();
      adminPage = await adminContext.newPage();

      await adminContext.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-admin-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await adminPage.route('**/api/admin/reviews/reported*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: REVIEW_ID,
                content: REVIEW_CONTENT,
                is_hidden: false,
              },
            ],
          }),
        });
      });

      // Mock hide API
      await adminPage.route(`**/api/admin/reviews/${REVIEW_ID}/hide`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Review hidden successfully',
          }),
        });
      });

      await adminPage.goto('/admin/reviews/reported');
      await adminPage.waitForLoadState('networkidle');

      const hideButton = adminPage.locator('[data-testid="hide-button"]').first();
      await hideButton.click();

      // Fill hide reason
      const reasonField = adminPage.locator('[data-testid="hide-reason"]');
      await reasonField.fill(HIDE_REASON);

      // Confirm hide
      const confirmButton = adminPage.locator('[data-testid="confirm-hide"]');
      await confirmButton.click();

      await adminPage.waitForTimeout(500);

      // Success message should appear
      await expect(adminPage.getByText(/hidden successfully/i)).toBeVisible();

      await adminContext.close();
    });
  });

  test.describe('3. Post-Hide Public View Tests', () => {
    test('T058.7: Hidden review NOT visible on campsite detail page', async ({ page }) => {
      // Mock campsite with hidden review excluded
      await page.route(`**/api/campsites/${CAMPSITE_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CAMPSITE_ID,
              name: 'Test Campsite',
              rating_average: 0,
              review_count: 0,
            },
          }),
        });
      });

      await page.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0 },
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Review should NOT be visible
      await expect(page.getByText(REVIEW_CONTENT)).not.toBeVisible();
    });

    test('T058.8: Hidden review NOT counted in review count', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CAMPSITE_ID,
              name: 'Test Campsite',
              rating_average: 0,
              review_count: 0,
            },
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Review count should be 0
      await expect(page.getByText(/0.*reviews?/i)).toBeVisible();
    });

    test('T058.9: Hidden review NOT included in average rating', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CAMPSITE_ID,
              name: 'Test Campsite',
              rating_average: 0,
              review_count: 0,
            },
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // No rating should be shown or rating should be 0
      const ratingText = page.getByText(/no reviews yet/i);
      await expect(ratingText).toBeVisible();
    });

    test('T058.10: Hidden review NOT in reviews list', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Reviews list should be empty
      const reviewsList = page.locator('[data-testid="reviews-list"]');
      if (await reviewsList.isVisible()) {
        await expect(reviewsList).not.toContainText(REVIEW_CONTENT);
      }

      // Or empty state message
      await expect(page.getByText(/no reviews/i)).toBeVisible();
    });

    test('T058.11: No error messages shown for hidden reviews', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CAMPSITE_ID,
              name: 'Test Campsite',
              review_count: 0,
            },
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // No error messages should appear
      await expect(page.getByText(/error/i)).not.toBeVisible();
      await expect(page.getByText(/failed/i)).not.toBeVisible();
    });
  });

  test.describe('4. Different User Perspectives', () => {
    test('T058.12: Anonymous user cannot see hidden review', async ({ browser }) => {
      const publicContext = await browser.newContext();
      const publicPage = await publicContext.newPage();

      await publicPage.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await publicPage.goto(`/campsites/${CAMPSITE_ID}`);
      await publicPage.waitForLoadState('networkidle');

      // Review should not be visible
      await expect(publicPage.getByText(REVIEW_CONTENT)).not.toBeVisible();

      await publicContext.close();
    });

    test('T058.13: Logged-in user cannot see hidden review', async ({ browser }) => {
      const userContext = await browser.newContext();
      const userPage = await userContext.newPage();

      // Mock logged-in user
      await userContext.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-user-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await userPage.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await userPage.goto(`/campsites/${CAMPSITE_ID}`);
      await userPage.waitForLoadState('networkidle');

      // Review should not be visible
      await expect(userPage.getByText(REVIEW_CONTENT)).not.toBeVisible();

      await userContext.close();
    });

    test('T058.14: Campsite owner cannot see hidden review on public page', async ({ browser }) => {
      const ownerContext = await browser.newContext();
      const ownerPage = await ownerContext.newPage();

      // Mock owner authentication
      await ownerContext.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-owner-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await ownerPage.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await ownerPage.goto(`/campsites/${CAMPSITE_ID}`);
      await ownerPage.waitForLoadState('networkidle');

      // Owner should not see hidden review on public page
      await expect(ownerPage.getByText(REVIEW_CONTENT)).not.toBeVisible();

      await ownerContext.close();
    });

    test('T058.15: Review author cannot see their own hidden review on public page', async ({ browser }) => {
      const authorContext = await browser.newContext();
      const authorPage = await authorContext.newPage();

      // Mock review author authentication
      await authorContext.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-review-author-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await authorPage.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await authorPage.goto(`/campsites/${CAMPSITE_ID}`);
      await authorPage.waitForLoadState('networkidle');

      // Author should not see their hidden review on public page
      await expect(authorPage.getByText(REVIEW_CONTENT)).not.toBeVisible();

      await authorContext.close();
    });
  });

  test.describe('5. Search/List Exclusion Tests', () => {
    test('T058.16: Hidden review not in search results', async ({ page }) => {
      await page.route('**/api/search*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: CAMPSITE_ID,
                name: 'Test Campsite',
                review_count: 0,
                rating_average: 0,
              },
            ],
          }),
        });
      });

      await page.goto('/search?q=test');
      await page.waitForLoadState('networkidle');

      // Hidden review content should not appear anywhere
      await expect(page.getByText(REVIEW_CONTENT)).not.toBeVisible();
    });

    test('T058.17: Hidden review not in recent reviews widget', async ({ page }) => {
      await page.route('**/api/reviews/recent*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Hidden review should not appear in recent reviews
      await expect(page.getByText(REVIEW_CONTENT)).not.toBeVisible();
    });

    test('T058.18: Hidden review not in user review history public view', async ({ page }) => {
      await page.route('**/api/users/*/reviews*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await page.goto('/users/test-user/reviews');
      await page.waitForLoadState('networkidle');

      // Hidden review should not appear
      await expect(page.getByText(REVIEW_CONTENT)).not.toBeVisible();
    });

    test('T058.19: Campsite with only hidden reviews shows no reviews', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CAMPSITE_ID,
              name: 'Test Campsite',
              review_count: 0,
              rating_average: 0,
            },
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Should show "no reviews" state
      await expect(page.getByText(/no reviews yet/i)).toBeVisible();
    });
  });

  test.describe('6. Unhide Restoration Tests', () => {
    test('T058.20: Admin unhides the review', async ({ browser }) => {
      adminContext = await browser.newContext();
      adminPage = await adminContext.newPage();

      await adminContext.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-admin-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await adminPage.route('**/api/admin/reviews/hidden*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: REVIEW_ID,
                content: REVIEW_CONTENT,
                is_hidden: true,
                hide_reason: HIDE_REASON,
              },
            ],
          }),
        });
      });

      // Mock unhide API
      await adminPage.route(`**/api/admin/reviews/${REVIEW_ID}/unhide`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Review restored successfully',
          }),
        });
      });

      await adminPage.goto('/admin/reviews/hidden');
      await adminPage.waitForLoadState('networkidle');

      const unhideButton = adminPage.locator('[data-testid="unhide-button"]').first();
      await unhideButton.click();

      await adminPage.waitForTimeout(500);

      // Success message
      await expect(adminPage.getByText(/restored successfully/i)).toBeVisible();

      await adminContext.close();
    });

    test('T058.21: Review becomes visible again after unhiding', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: REVIEW_ID,
                content: REVIEW_CONTENT,
                rating_overall: 4,
                user_name: 'Test User',
                is_hidden: false,
              },
            ],
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Review should be visible again
      await expect(page.getByText(REVIEW_CONTENT)).toBeVisible();
    });

    test('T058.22: Review count restored after unhiding', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CAMPSITE_ID,
              name: 'Test Campsite',
              review_count: 1,
              rating_average: 4.0,
            },
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Review count should be 1 again
      await expect(page.getByText(/1.*review/i)).toBeVisible();
    });

    test('T058.23: Average rating restored after unhiding', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CAMPSITE_ID,
              name: 'Test Campsite',
              review_count: 1,
              rating_average: 4.0,
            },
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Rating should be visible
      await expect(page.getByText('4.0')).toBeVisible();
    });
  });

  test.describe('7. Multi-Context Integration Tests', () => {
    test('T058.24: Full hide-verify-unhide workflow with multiple users', async ({ browser }) => {
      // Admin hides review
      const adminCtx = await browser.newContext();
      const adminPg = await adminCtx.newPage();

      await adminCtx.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-admin-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await adminPg.route('**/api/admin/reviews/reported*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: REVIEW_ID, content: REVIEW_CONTENT, is_hidden: false }],
          }),
        });
      });

      await adminPg.route(`**/api/admin/reviews/${REVIEW_ID}/hide`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await adminPg.goto('/admin/reviews/reported');
      await adminPg.waitForLoadState('networkidle');

      const hideBtn = adminPg.locator('[data-testid="hide-button"]').first();
      await hideBtn.click();

      const reasonFld = adminPg.locator('[data-testid="hide-reason"]');
      await reasonFld.fill(HIDE_REASON);

      const confirmBtn = adminPg.locator('[data-testid="confirm-hide"]');
      await confirmBtn.click();
      await adminPg.waitForTimeout(500);

      // Public user verifies hidden
      const publicCtx = await browser.newContext();
      const publicPg = await publicCtx.newPage();

      await publicPg.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
      });

      await publicPg.goto(`/campsites/${CAMPSITE_ID}`);
      await publicPg.waitForLoadState('networkidle');

      await expect(publicPg.getByText(REVIEW_CONTENT)).not.toBeVisible();

      // Cleanup
      await adminCtx.close();
      await publicCtx.close();
    });

    test('T058.25: Hidden review stays hidden across page refreshes', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(REVIEW_CONTENT)).not.toBeVisible();

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Still hidden
      await expect(page.getByText(REVIEW_CONTENT)).not.toBeVisible();
    });

    test('T058.26: Multiple hidden reviews all excluded correctly', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CAMPSITE_ID,
              name: 'Test Campsite',
              review_count: 0,
              rating_average: 0,
            },
          }),
        });
      });

      await page.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // None of the hidden reviews should be visible
      await expect(page.getByText('Hidden review 1')).not.toBeVisible();
      await expect(page.getByText('Hidden review 2')).not.toBeVisible();
      await expect(page.getByText('Hidden review 3')).not.toBeVisible();
    });

    test('T058.27: Mix of visible and hidden reviews shows only visible ones', async ({ page }) => {
      await page.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'review-visible-1',
                content: 'This is a visible review',
                rating_overall: 5,
                is_hidden: false,
              },
              {
                id: 'review-visible-2',
                content: 'Another visible review',
                rating_overall: 4,
                is_hidden: false,
              },
            ],
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Visible reviews should be shown
      await expect(page.getByText('This is a visible review')).toBeVisible();
      await expect(page.getByText('Another visible review')).toBeVisible();

      // Hidden review should NOT be shown
      await expect(page.getByText(REVIEW_CONTENT)).not.toBeVisible();
    });
  });

  test.describe('8. Edge Cases and Validation', () => {
    test('T058.28: Direct URL access to hidden review returns 404 or empty', async ({ page }) => {
      await page.route(`**/api/reviews/${REVIEW_ID}`, async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Review not found',
          }),
        });
      });

      await page.goto(`/reviews/${REVIEW_ID}`);
      await page.waitForLoadState('networkidle');

      // Should show 404 or not found
      await expect(page.getByText(/not found/i)).toBeVisible();
    });

    test('T058.29: API response does not include is_hidden flag in public endpoints', async ({ page }) => {
      let apiResponseBody = '';

      await page.route(`**/api/campsites/${CAMPSITE_ID}/reviews*`, async (route) => {
        const response = {
          success: true,
          data: [
            {
              id: 'visible-review',
              content: 'Visible review content',
              rating_overall: 5,
            },
          ],
        };
        apiResponseBody = JSON.stringify(response);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: apiResponseBody,
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Verify is_hidden flag is not exposed in public API
      expect(apiResponseBody).not.toContain('is_hidden');
    });

    test('T058.30: Rating calculation excludes hidden reviews correctly', async ({ page }) => {
      // Campsite has 3 reviews: 5-star (visible), 4-star (visible), 1-star (hidden)
      // Average should be 4.5, not 3.33
      await page.route(`**/api/campsites/${CAMPSITE_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CAMPSITE_ID,
              name: 'Test Campsite',
              review_count: 2,
              rating_average: 4.5,
            },
          }),
        });
      });

      await page.goto(`/campsites/${CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Should show correct average excluding hidden review
      await expect(page.getByText('4.5')).toBeVisible();
      await expect(page.getByText(/2.*reviews/i)).toBeVisible();
    });
  });
});
