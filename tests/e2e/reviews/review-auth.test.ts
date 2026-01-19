import { test, expect } from '@playwright/test';
import { waitForApi, assertNoErrors, PUBLIC_API } from '../utils/api-helpers';

test.describe('Review Submission Authentication Requirement', () => {
  const TEST_CAMPSITE_ID = 'test-campsite-1';

  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page and wait for APIs
    const [campsiteResponse, reviewsResponse] = await Promise.all([
      waitForApi(page, PUBLIC_API.campsiteDetail(TEST_CAMPSITE_ID), { status: 200 }),
      waitForApi(page, PUBLIC_API.reviews(TEST_CAMPSITE_ID), { status: 200 }),
      page.goto('/campsites/test-campsite-1')
    ]);

    // Verify API responses
    const campsiteData = await campsiteResponse.json();
    expect(campsiteData.success).toBe(true);

    const reviewsData = await reviewsResponse.json();
    expect(reviewsData.success).toBe(true);

    // Verify no errors
    await assertNoErrors(page);
  });

  test('T052.1: Review form area shows login prompt when not logged in', async ({ page }) => {
    // Scroll to review section
    const reviewSection = page.locator('[data-testid="review-section"]');
    const isReviewSectionVisible = await reviewSection.isVisible().catch(() => false);

    if (isReviewSectionVisible) {
      await reviewSection.scrollIntoViewIfNeeded();
    }

    // Check for login prompt in review form area
    const loginPrompt = page.locator('[data-testid="review-login-prompt"]');
    await expect(loginPrompt).toBeVisible({ timeout: 5000 });
  });

  test('T052.2: Login button/link is visible for unauthenticated users', async ({ page }) => {
    // Look for login button in review section
    const loginButton = page.locator('[data-testid="review-login-button"]');
    await expect(loginButton).toBeVisible({ timeout: 5000 });
  });

  test('T052.3: Clicking login redirects to login page', async ({ page }) => {
    // Find and click login button in review section
    const loginButton = page.locator('[data-testid="review-login-button"]');
    await loginButton.click();

    // Wait for navigation to login page
    await page.waitForURL(/\/(login|auth\/login|signin)/, { timeout: 10000 });

    // Verify we're on the login page
    expect(page.url()).toMatch(/\/(login|auth\/login|signin)/);

    // Verify no errors
    await assertNoErrors(page);
  });

  test('T052.4: Review form is not visible when not authenticated', async ({ page }) => {
    // Review form elements should not be accessible
    const reviewForm = page.locator('[data-testid="review-form"]');
    await expect(reviewForm).not.toBeVisible();

    const ratingInput = page.locator('[data-testid="rating-input"]');
    await expect(ratingInput).not.toBeVisible();

    const reviewTextarea = page.locator('[data-testid="review-content"]');
    await expect(reviewTextarea).not.toBeVisible();

    const submitButton = page.locator('[data-testid="review-submit"]');
    await expect(submitButton).not.toBeVisible();
  });

  test('T052.5: Review form elements only accessible when authenticated', async ({ page, context }) => {
    // Simulate authenticated session using the new token storage system
    const mockToken = 'mock-token-for-testing';
    await context.addCookies([
      {
        name: 'campsite_access_token',
        value: mockToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'campsite_refresh_token',
        value: mockToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    // Also set localStorage tokens
    await page.addInitScript((tokenData) => {
      localStorage.setItem('campsite_access_token', tokenData.token);
      localStorage.setItem('campsite_refresh_token', tokenData.token);
      localStorage.setItem('campsite_token_expiry', tokenData.expiry);
    }, {
      token: mockToken,
      expiry: (Date.now() + 3600000).toString(),
    });

    // Reload page to apply authentication and wait for APIs
    const [campsiteResponse, reviewsResponse] = await Promise.all([
      waitForApi(page, PUBLIC_API.campsiteDetail(TEST_CAMPSITE_ID), { status: 200 }),
      waitForApi(page, PUBLIC_API.reviews(TEST_CAMPSITE_ID), { status: 200 }),
      page.reload()
    ]);

    // Verify APIs
    const campsiteData = await campsiteResponse.json();
    expect(campsiteData.success).toBe(true);

    // With authentication, login prompt should not be visible
    const loginPrompt = page.locator('[data-testid="review-login-prompt"]');
    await expect(loginPrompt).not.toBeVisible();

    // Review form should be accessible (write review button or form itself)
    const writeReviewButton = page.locator('[data-testid="write-review-button"]');
    const isButtonVisible = await writeReviewButton.isVisible().catch(() => false);
    expect(isButtonVisible).toBe(true);

    // Verify no errors
    await assertNoErrors(page);
  });

  test('T052.6: Unauthenticated user cannot access review submission endpoint', async ({ page }) => {
    // Try to submit a review directly without auth
    const response = await page.request.post(`http://localhost:3091${PUBLIC_API.submitReview(TEST_CAMPSITE_ID)}`, {
      data: {
        campsite_id: TEST_CAMPSITE_ID,
        rating: 5,
        comment: 'Test review',
        reviewer_type: 'solo',
      },
    });

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);

    // Verify response body indicates unauthorized
    const data = await response.json().catch(() => ({}));
    expect(data.success).toBe(false);
  });

  test('T052.7: Login prompt includes helpful message', async ({ page }) => {
    // Check that the login prompt message is informative
    const loginPrompt = page.locator('[data-testid="review-login-prompt"]');
    await expect(loginPrompt).toBeVisible({ timeout: 5000 });

    // Message should contain keywords about logging in and writing reviews
    const text = await loginPrompt.textContent();
    expect(text?.toLowerCase()).toMatch(/(log|sign|login)/i);
    expect(text?.toLowerCase()).toMatch(/review/i);
  });

  test('T052.8: Review section shows existing reviews regardless of auth state', async ({ page }) => {
    // Existing reviews should be visible even without authentication
    const reviewsSection = page.locator('[data-testid="reviews-section"]');
    await expect(reviewsSection).toBeVisible({ timeout: 5000 });

    // Reviews list should be accessible
    const reviewsList = page.locator('[data-testid="reviews-list"]');
    const isListVisible = await reviewsList.isVisible().catch(() => false);

    // If there are reviews, the list should be visible
    // If no reviews, a "no reviews" message should be visible
    if (!isListVisible) {
      const noReviewsMessage = page.locator('[data-testid="no-reviews"]');
      const isNoReviewsVisible = await noReviewsMessage.isVisible().catch(() => false);
      expect(isNoReviewsVisible).toBe(true);
    }
  });

  test('T052.9: Page remains functional after failed auth check', async ({ page }) => {
    // Verify that the page doesn't break when checking auth status fails
    // Page should still be interactive
    await expect(page.locator('body')).toBeVisible();

    // Main campsite content should be visible
    const campsiteDetail = page.locator('[data-testid="campsite-detail"]');
    await expect(campsiteDetail).toBeVisible();

    // No error messages should be shown
    await assertNoErrors(page);
  });
});
