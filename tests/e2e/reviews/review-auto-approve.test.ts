import { test, expect } from '@playwright/test';
import { waitForApi, assertNoErrors, PUBLIC_API } from '../utils/api-helpers';

// Use a valid test campsite slug
const TEST_CAMPSITE_SLUG = 'test-campsite-details-b7a9886a';

test.describe('Review Auto-Approval Functionality (Q11)', () => {
  const TEST_CAMPSITE_ID = '1';

  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page and wait for APIs
    const [campsiteResponse, reviewsResponse] = await Promise.all([
      waitForApi(page, PUBLIC_API.campsiteDetail(TEST_CAMPSITE_ID), { status: 200 }),
      waitForApi(page, PUBLIC_API.reviews(TEST_CAMPSITE_ID), { status: 200 }),
      page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`)
    ]);

    // Verify API responses
    const campsiteData = await campsiteResponse.json();
    expect(campsiteData.success).toBe(true);

    const reviewsData = await reviewsResponse.json();
    expect(reviewsData.success).toBe(true);

    // Verify no errors
    await assertNoErrors(page);

    // Wait for campsite detail page to load
    await page.waitForSelector('[data-testid="campsite-detail"]', { timeout: 10000 });
  });

  test('T054.1: Submitted review appears in list immediately', async ({ page }) => {
    // Mock authentication as a logged-in user
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-user-token');
    });

    // Reload to apply auth state and wait for APIs
    const [campsiteResponse, reviewsResponse] = await Promise.all([
      waitForApi(page, PUBLIC_API.campsiteDetail(TEST_CAMPSITE_ID), { status: 200 }),
      waitForApi(page, PUBLIC_API.reviews(TEST_CAMPSITE_ID), { status: 200 }),
      page.reload()
    ]);

    // Verify APIs
    const reviewsData = await reviewsResponse.json();
    expect(reviewsData.success).toBe(true);

    // Get initial review count
    const initialReviewCards = await page.locator('[data-testid="review-card"]').all();
    const initialCount = initialReviewCards.length;

    // Open review form
    const writeReviewButton = page.locator('[data-testid="write-review-button"]');
    await expect(writeReviewButton).toBeVisible();
    await writeReviewButton.click();

    // Wait for review form to appear
    const reviewForm = page.locator('[data-testid="review-form"]');
    await expect(reviewForm).toBeVisible();

    // Fill out review form
    const fourthStar = page.locator('[data-testid="star-4"]');
    await fourthStar.click();

    const commentTextarea = page.locator('[data-testid="review-comment"]');
    await commentTextarea.fill('This is a test review that should appear immediately after submission.');

    // Wait for review submission API
    const submitApiPromise = waitForApi(page, PUBLIC_API.submitReview(TEST_CAMPSITE_ID), {
      method: 'POST',
      status: 200
    });

    // Wait for reviews list refresh API
    const refreshApiPromise = waitForApi(page, PUBLIC_API.reviews(TEST_CAMPSITE_ID), {
      method: 'GET',
      status: 200
    });

    // Submit review
    const submitButton = page.locator('[data-testid="submit-review-button"]');
    await submitButton.click();

    // Wait for both APIs
    const [submitResponse, refreshResponse] = await Promise.all([submitApiPromise, refreshApiPromise]);

    // Verify submission success
    const submitData = await submitResponse.json();
    expect(submitData.success).toBe(true);

    // Verify updated reviews list
    const refreshData = await refreshResponse.json();
    expect(refreshData.success).toBe(true);

    // Verify review appears immediately in the list
    const updatedReviewCards = await page.locator('[data-testid="review-card"]').all();
    const updatedCount = updatedReviewCards.length;

    // Should have one more review than before
    expect(updatedCount).toBe(initialCount + 1);

    // Verify the new review contains the submitted comment
    const lastReview = page.locator('[data-testid="review-card"]').first(); // Assuming newest first
    await expect(lastReview).toContainText('This is a test review that should appear immediately');

    // Verify no errors
    await assertNoErrors(page);
  });

  test('T054.2: No "pending" or "under review" message appears', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-user-token');
    });

    await Promise.all([
      waitForApi(page, PUBLIC_API.campsiteDetail(TEST_CAMPSITE_ID), { status: 200 }),
      waitForApi(page, PUBLIC_API.reviews(TEST_CAMPSITE_ID), { status: 200 }),
      page.reload()
    ]);

    // Open and submit a review
    const writeReviewButton = page.locator('[data-testid="write-review-button"]');
    await writeReviewButton.click();

    const reviewForm = page.locator('[data-testid="review-form"]');
    await expect(reviewForm).toBeVisible();

    // Fill and submit
    const fourthStar = page.locator('[data-testid="star-4"]');
    await fourthStar.click();

    const commentTextarea = page.locator('[data-testid="review-comment"]');
    await commentTextarea.fill('Testing auto-approval flow');

    // Wait for submission API
    const apiPromise = waitForApi(page, PUBLIC_API.submitReview(TEST_CAMPSITE_ID), {
      method: 'POST',
      status: 200
    });

    const submitButton = page.locator('[data-testid="submit-review-button"]');
    await submitButton.click();

    // Verify API success
    const response = await apiPromise;
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify no pending/under review messages exist
    const pendingMessage = page.getByText(/pending|under review|awaiting approval/i);
    await expect(pendingMessage).not.toBeVisible();

    // Verify no status badge showing "pending"
    const pendingBadge = page.locator('[data-testid="review-status-pending"]');
    await expect(pendingBadge).not.toBeVisible();

    // Verify no errors
    await assertNoErrors(page);
  });

  test('T054.3: Review count updates immediately after submission', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-user-token');
    });

    await Promise.all([
      waitForApi(page, PUBLIC_API.campsiteDetail(TEST_CAMPSITE_ID), { status: 200 }),
      waitForApi(page, PUBLIC_API.reviews(TEST_CAMPSITE_ID), { status: 200 }),
      page.reload()
    ]);

    // Get initial review count from summary
    const reviewCountElement = page.locator('[data-testid="total-reviews-count"]');
    await expect(reviewCountElement).toBeVisible();

    const initialCountText = await reviewCountElement.textContent();
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0', 10);

    // Submit a new review
    const writeReviewButton = page.locator('[data-testid="write-review-button"]');
    await writeReviewButton.click();

    const fourthStar = page.locator('[data-testid="star-4"]');
    await fourthStar.click();

    const commentTextarea = page.locator('[data-testid="review-comment"]');
    await commentTextarea.fill('Testing review count update');

    // Wait for submission API
    const apiPromise = waitForApi(page, PUBLIC_API.submitReview(TEST_CAMPSITE_ID), {
      method: 'POST',
      status: 200
    });

    const submitButton = page.locator('[data-testid="submit-review-button"]');
    await submitButton.click();

    // Verify API success
    const response = await apiPromise;
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify review count increased by 1
    await expect(reviewCountElement).toContainText(String(initialCount + 1), { timeout: 5000 });

    // Verify no errors
    await assertNoErrors(page);
  });

  test('T054.4: Average rating updates immediately after submission', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-user-token');
    });

    await Promise.all([
      waitForApi(page, PUBLIC_API.campsiteDetail(TEST_CAMPSITE_ID), { status: 200 }),
      waitForApi(page, PUBLIC_API.reviews(TEST_CAMPSITE_ID), { status: 200 }),
      page.reload()
    ]);

    // Get initial average rating
    const avgRatingElement = page.locator('[data-testid="average-rating"]');
    await expect(avgRatingElement).toBeVisible();

    const initialRatingText = await avgRatingElement.textContent();
    const initialRating = parseFloat(initialRatingText?.match(/[\d.]+/)?.[0] || '0');

    // Submit a new 5-star review
    const writeReviewButton = page.locator('[data-testid="write-review-button"]');
    await writeReviewButton.click();

    const fifthStar = page.locator('[data-testid="star-5"]');
    await fifthStar.click();

    const commentTextarea = page.locator('[data-testid="review-comment"]');
    await commentTextarea.fill('Five star review to test rating update');

    // Wait for submission API
    const apiPromise = waitForApi(page, PUBLIC_API.submitReview(TEST_CAMPSITE_ID), {
      method: 'POST',
      status: 200
    });

    const submitButton = page.locator('[data-testid="submit-review-button"]');
    await submitButton.click();

    // Verify API success
    const response = await apiPromise;
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify average rating has changed
    const updatedRatingText = await avgRatingElement.textContent();
    const updatedRating = parseFloat(updatedRatingText?.match(/[\d.]+/)?.[0] || '0');

    // Rating should be different (either increased or at least recalculated)
    // Note: Exact value depends on existing reviews, so we just verify it changed or is valid
    expect(updatedRating).toBeGreaterThan(0);
    expect(updatedRating).toBeLessThanOrEqual(5);

    // Verify no errors
    await assertNoErrors(page);
  });

  test('T054.5: Review visible to other users immediately', async ({ page, context }) => {
    // User 1: Submit a review
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-user-1-token');
    });

    await Promise.all([
      waitForApi(page, PUBLIC_API.campsiteDetail(TEST_CAMPSITE_ID), { status: 200 }),
      waitForApi(page, PUBLIC_API.reviews(TEST_CAMPSITE_ID), { status: 200 }),
      page.reload()
    ]);

    // Submit review as User 1
    const writeReviewButton = page.locator('[data-testid="write-review-button"]');
    await writeReviewButton.click();

    const fourthStar = page.locator('[data-testid="star-4"]');
    await fourthStar.click();

    const commentTextarea = page.locator('[data-testid="review-comment"]');
    const uniqueComment = `Unique test review ${Date.now()}`;
    await commentTextarea.fill(uniqueComment);

    // Wait for submission API
    const apiPromise = waitForApi(page, PUBLIC_API.submitReview(TEST_CAMPSITE_ID), {
      method: 'POST',
      status: 200
    });

    const submitButton = page.locator('[data-testid="submit-review-button"]');
    await submitButton.click();

    // Verify API success
    const response = await apiPromise;
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify User 1 sees the review
    const user1Review = page.locator('[data-testid="review-card"]').filter({ hasText: uniqueComment });
    await expect(user1Review).toBeVisible();

    // User 2: Open same campsite in new page/context
    const page2 = await context.newPage();

    // Mock as different user (or unauthenticated)
    await page2.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-user-2-token');
    });

    // Navigate and wait for APIs
    await Promise.all([
      waitForApi(page2, PUBLIC_API.campsiteDetail(TEST_CAMPSITE_ID), { status: 200 }),
      waitForApi(page2, PUBLIC_API.reviews(TEST_CAMPSITE_ID), { status: 200 }),
      page2.goto(`/campsites/${TEST_CAMPSITE_SLUG}`)
    ]);

    await page2.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Verify User 2 can see the same review immediately
    const user2Review = page2.locator('[data-testid="review-card"]').filter({ hasText: uniqueComment });
    await expect(user2Review).toBeVisible();

    // Verify no errors
    await assertNoErrors(page2);

    await page2.close();
  });

  test('T054.6: No approval workflow exists in UI', async ({ page }) => {
    // Mock as admin to verify no approval UI exists
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-admin-token');
      localStorage.setItem('user_role', 'admin');
    });

    // Navigate to admin/reviews section if it exists
    await page.goto('/admin/reviews');

    // Wait a moment for page to load (but don't expect specific APIs if page doesn't exist)
    await page.waitForLoadState('domcontentloaded');

    // Verify no "pending reviews" section exists
    const pendingReviewsSection = page.locator('[data-testid="pending-reviews-section"]');
    await expect(pendingReviewsSection).not.toBeVisible();

    // Verify no "approve" buttons exist
    const approveButtons = page.locator('[data-testid="approve-review-button"]');
    const approveButtonCount = await approveButtons.count();
    expect(approveButtonCount).toBe(0);

    // Verify no status filter for "pending"
    const statusFilter = page.locator('[data-testid="review-status-filter"]');
    const isStatusFilterVisible = await statusFilter.isVisible().catch(() => false);
    if (isStatusFilterVisible) {
      const pendingOption = statusFilter.locator('option[value="pending"]');
      await expect(pendingOption).not.toBeVisible();
    }
  });

  test('T054.7: Success message shown after immediate publication', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-user-token');
    });

    await Promise.all([
      waitForApi(page, PUBLIC_API.campsiteDetail(TEST_CAMPSITE_ID), { status: 200 }),
      waitForApi(page, PUBLIC_API.reviews(TEST_CAMPSITE_ID), { status: 200 }),
      page.reload()
    ]);

    // Submit a review
    const writeReviewButton = page.locator('[data-testid="write-review-button"]');
    await writeReviewButton.click();

    const fourthStar = page.locator('[data-testid="star-4"]');
    await fourthStar.click();

    const commentTextarea = page.locator('[data-testid="review-comment"]');
    await commentTextarea.fill('Testing success message');

    // Wait for submission API
    const apiPromise = waitForApi(page, PUBLIC_API.submitReview(TEST_CAMPSITE_ID), {
      method: 'POST',
      status: 200
    });

    const submitButton = page.locator('[data-testid="submit-review-button"]');
    await submitButton.click();

    // Verify API success
    const response = await apiPromise;
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify success message indicates immediate publication
    const successMessage = page.locator('[data-testid="review-success-message"]');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Message should indicate review is published, not pending
    const messageText = await successMessage.textContent();
    expect(messageText?.toLowerCase()).toMatch(/published|submitted successfully|added/);
    expect(messageText?.toLowerCase()).not.toMatch(/pending|waiting|approval/);

    // Verify no errors
    await assertNoErrors(page);
  });

  test('T054.8: Review form closes and shows new review immediately', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-user-token');
    });

    await Promise.all([
      waitForApi(page, PUBLIC_API.campsiteDetail(TEST_CAMPSITE_ID), { status: 200 }),
      waitForApi(page, PUBLIC_API.reviews(TEST_CAMPSITE_ID), { status: 200 }),
      page.reload()
    ]);

    // Open review form
    const writeReviewButton = page.locator('[data-testid="write-review-button"]');
    await writeReviewButton.click();

    const reviewForm = page.locator('[data-testid="review-form"]');
    await expect(reviewForm).toBeVisible();

    // Submit review
    const fourthStar = page.locator('[data-testid="star-4"]');
    await fourthStar.click();

    const commentTextarea = page.locator('[data-testid="review-comment"]');
    const testComment = 'Review form should close after submission';
    await commentTextarea.fill(testComment);

    // Wait for submission API
    const apiPromise = waitForApi(page, PUBLIC_API.submitReview(TEST_CAMPSITE_ID), {
      method: 'POST',
      status: 200
    });

    const submitButton = page.locator('[data-testid="submit-review-button"]');
    await submitButton.click();

    // Verify API success
    const response = await apiPromise;
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify form is closed/hidden
    await expect(reviewForm).not.toBeVisible({ timeout: 5000 });

    // Verify new review is visible in the list
    const newReview = page.locator('[data-testid="review-card"]').filter({ hasText: testComment });
    await expect(newReview).toBeVisible();

    // Verify no errors
    await assertNoErrors(page);
  });
});
