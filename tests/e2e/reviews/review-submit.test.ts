import { test, expect } from '@playwright/test';
import { waitForApi, waitForApiSuccess, assertNoErrors, PUBLIC_API, interceptApi } from '../utils/api-helpers';

/**
 * E2E Tests: Review Submission Flow (T053)
 * Tests the complete user journey for submitting a review
 *
 * Test Coverage:
 * - Form displays when logged in
 * - Select overall rating (required)
 * - Select reviewer type (required)
 * - Enter review content (required)
 * - Optional title field
 * - Optional sub-ratings
 * - Submit button enabled when valid
 * - Successful submission shows success message
 * - Form resets after submission
 */

test.describe('Review Submission Flow', () => {
  const TEST_CAMPSITE_SLUG = 'test-campsite-for-reviews';
  const TEST_CAMPSITE_ID = 'test-campsite-for-reviews'; // Assuming slug is used as ID

  // Mock authentication state
  test.beforeEach(async ({ page }) => {
    // Mock authentication by setting localStorage/cookies
    // This simulates a logged-in user
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-auth-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User'
      }));
    });

    // Navigate and wait for APIs
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
  });

  test('T053.1: Review form displays when logged in', async ({ page }) => {
    // Scroll to review section
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    // Check if review form is visible
    const reviewForm = page.locator('[data-testid="review-form"]');
    await expect(reviewForm).toBeVisible();

    // Verify form elements exist
    await expect(page.getByLabel(/overall rating/i)).toBeVisible();
    await expect(page.getByLabel(/reviewer type/i)).toBeVisible();
    await expect(page.getByLabel(/review content/i)).toBeVisible();
  });

  test('T053.2: Select overall rating (required)', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    // Find rating stars
    const ratingStars = page.locator('[data-testid="rating-stars"]');
    await expect(ratingStars).toBeVisible();

    // Click on 4-star rating
    const fourthStar = ratingStars.locator('[data-rating="4"]');
    await fourthStar.click();

    // Verify rating is selected
    await expect(fourthStar).toHaveAttribute('aria-checked', 'true');
  });

  test('T053.3: Select reviewer type (required)', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    // Find reviewer type selector
    const reviewerTypeSelect = page.getByLabel(/reviewer type/i);
    await expect(reviewerTypeSelect).toBeVisible();

    // Select reviewer type
    await reviewerTypeSelect.click();
    await page.getByRole('option', { name: /solo/i }).click();

    // Verify selection
    await expect(reviewerTypeSelect).toHaveValue('solo');
  });

  test('T053.4: Enter review content (required)', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    // Find content textarea
    const contentTextarea = page.getByLabel(/review content/i);
    await expect(contentTextarea).toBeVisible();

    // Type review content
    const reviewContent = 'This is a great campsite with beautiful views and friendly staff. Highly recommended for anyone looking for a peaceful getaway!';
    await contentTextarea.fill(reviewContent);

    // Verify content is entered
    await expect(contentTextarea).toHaveValue(reviewContent);

    // Verify character count if displayed
    const charCount = page.locator('[data-testid="char-count"]');
    if (await charCount.isVisible()) {
      await expect(charCount).toContainText(`${reviewContent.length}`);
    }
  });

  test('T053.5: Optional title field', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    // Find optional title input
    const titleInput = page.getByLabel(/title/i).first();
    await expect(titleInput).toBeVisible();

    // Enter title
    const reviewTitle = 'Excellent Experience';
    await titleInput.fill(reviewTitle);

    // Verify title is entered
    await expect(titleInput).toHaveValue(reviewTitle);
  });

  test('T053.6: Optional sub-ratings', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    // Check if sub-ratings section exists
    const subRatingsSection = page.locator('[data-testid="sub-ratings"]');

    if (await subRatingsSection.isVisible()) {
      // Rate cleanliness
      const cleanlinessRating = page.locator('[data-testid="rating-cleanliness"]');
      await cleanlinessRating.locator('[data-rating="5"]').click();

      // Rate staff
      const staffRating = page.locator('[data-testid="rating-staff"]');
      await staffRating.locator('[data-rating="4"]').click();

      // Rate facilities
      const facilitiesRating = page.locator('[data-testid="rating-facilities"]');
      await facilitiesRating.locator('[data-rating="4"]').click();

      // Verify ratings are selected
      await expect(cleanlinessRating.locator('[data-rating="5"]')).toHaveAttribute('aria-checked', 'true');
      await expect(staffRating.locator('[data-rating="4"]')).toHaveAttribute('aria-checked', 'true');
      await expect(facilitiesRating.locator('[data-rating="4"]')).toHaveAttribute('aria-checked', 'true');
    }
  });

  test('T053.7: Submit button enabled when valid', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    const submitButton = page.getByRole('button', { name: /submit review/i });

    // Initially, submit button should be disabled
    await expect(submitButton).toBeDisabled();

    // Fill required fields
    // Overall rating
    await page.locator('[data-testid="rating-stars"]').locator('[data-rating="4"]').click();

    // Reviewer type
    const reviewerTypeSelect = page.getByLabel(/reviewer type/i);
    await reviewerTypeSelect.click();
    await page.getByRole('option', { name: /solo/i }).click();

    // Review content (minimum 20 characters)
    const contentTextarea = page.getByLabel(/review content/i);
    await contentTextarea.fill('This is a great campsite with beautiful views and friendly staff.');

    // Wait for form validation to complete
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
  });

  test('T053.8: Successful submission shows success message', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    // Fill required fields
    await page.locator('[data-testid="rating-stars"]').locator('[data-rating="4"]').click();

    const reviewerTypeSelect = page.getByLabel(/reviewer type/i);
    await reviewerTypeSelect.click();
    await page.getByRole('option', { name: /solo/i }).click();

    const contentTextarea = page.getByLabel(/review content/i);
    await contentTextarea.fill('This is a great campsite with beautiful views and friendly staff. Highly recommended!');

    // Intercept review submission API
    const apiPromise = waitForApi(page, PUBLIC_API.submitReview(TEST_CAMPSITE_ID), {
      method: 'POST',
      status: 200
    });

    // Submit the form
    const submitButton = page.getByRole('button', { name: /submit review/i });
    await submitButton.click();

    // Wait for API response
    const response = await apiPromise;
    const data = await response.json();
    expect(data.success).toBe(true);

    // Check for success message
    const successMessage = page.locator('[data-testid="success-message"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText(/success/i);

    // Verify no errors
    await assertNoErrors(page);
  });

  test('T053.9: Form resets after submission', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    // Fill required fields
    await page.locator('[data-testid="rating-stars"]').locator('[data-rating="4"]').click();

    const reviewerTypeSelect = page.getByLabel(/reviewer type/i);
    await reviewerTypeSelect.click();
    await page.getByRole('option', { name: /solo/i }).click();

    const titleInput = page.getByLabel(/title/i).first();
    await titleInput.fill('Great Place');

    const contentTextarea = page.getByLabel(/review content/i);
    await contentTextarea.fill('This is a great campsite with beautiful views and friendly staff. Highly recommended!');

    // Intercept review submission API
    const apiPromise = waitForApi(page, PUBLIC_API.submitReview(TEST_CAMPSITE_ID), {
      method: 'POST',
      status: 200
    });

    // Submit the form
    const submitButton = page.getByRole('button', { name: /submit review/i });
    await submitButton.click();

    // Wait for API response
    const response = await apiPromise;
    const data = await response.json();
    expect(data.success).toBe(true);

    // Check that form fields are reset
    await expect(contentTextarea).toHaveValue('');
    await expect(titleInput).toHaveValue('');

    // Rating should be reset
    const ratingStars = page.locator('[data-testid="rating-stars"]');
    const checkedStars = ratingStars.locator('[aria-checked="true"]');
    const count = await checkedStars.count();
    expect(count).toBe(0);
  });

  test('T053.10: Content validation - minimum 20 characters', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    const contentTextarea = page.getByLabel(/review content/i);

    // Enter content less than 20 characters
    await contentTextarea.fill('Too short');

    // Blur to trigger validation
    await contentTextarea.blur();

    // Check for validation error
    const errorMessage = page.locator('[data-testid="content-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
    await expect(errorMessage).toContainText(/20.*character/i);

    // Submit button should be disabled
    const submitButton = page.getByRole('button', { name: /submit review/i });
    await expect(submitButton).toBeDisabled();
  });

  test('T053.11: All required fields filled enables submit', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    const submitButton = page.getByRole('button', { name: /submit review/i });

    // Initially disabled
    await expect(submitButton).toBeDisabled();

    // Fill all required fields step by step

    // 1. Overall rating
    await page.locator('[data-testid="rating-stars"]').locator('[data-rating="5"]').click();

    // 2. Reviewer type
    const reviewerTypeSelect = page.getByLabel(/reviewer type/i);
    await reviewerTypeSelect.click();
    await page.getByRole('option', { name: /family/i }).click();

    // 3. Review content
    const contentTextarea = page.getByLabel(/review content/i);
    await contentTextarea.fill('Amazing campsite for families! Our kids loved the playground and the clean facilities. Staff was very helpful and friendly.');

    // Submit button should be enabled
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
  });

  test('T053.12: Rating stars are interactive', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    const ratingStars = page.locator('[data-testid="rating-stars"]');

    // Hover over 3rd star
    const thirdStar = ratingStars.locator('[data-rating="3"]');
    await thirdStar.hover();

    // First 3 stars should be highlighted (if hover effect exists)
    // This is a visual check - implementation may vary

    // Click 3rd star
    await thirdStar.click();
    await expect(thirdStar).toHaveAttribute('aria-checked', 'true');

    // Click 5th star to change rating
    const fifthStar = ratingStars.locator('[data-rating="5"]');
    await fifthStar.click();
    await expect(fifthStar).toHaveAttribute('aria-checked', 'true');
  });

  test('T053.13: Reviewer type dropdown shows all options', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    const reviewerTypeSelect = page.getByLabel(/reviewer type/i);
    await reviewerTypeSelect.click();

    // Check for expected reviewer types
    await expect(page.getByRole('option', { name: /solo/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /couple/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /family/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /group/i })).toBeVisible();
  });

  test('T053.14: Character count updates as user types', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    const contentTextarea = page.getByLabel(/review content/i);
    const charCount = page.locator('[data-testid="char-count"]');

    // Check if char count exists
    const charCountVisible = await charCount.isVisible().catch(() => false);
    if (charCountVisible) {
      // Type content
      const content = 'This is my review content.';
      await contentTextarea.fill(content);

      // Wait for char count to update
      await expect(charCount).toContainText(`${content.length}`, { timeout: 2000 });

      // Type more
      await contentTextarea.fill(content + ' Adding more text.');

      // Count should update
      const newLength = (content + ' Adding more text.').length;
      await expect(charCount).toContainText(`${newLength}`, { timeout: 2000 });
    }
  });

  test('T053.15: Form shows validation errors for required fields', async ({ page }) => {
    await page.locator('[data-testid="review-section"]').scrollIntoViewIfNeeded();

    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /submit review/i });

    // Submit button should be disabled when fields are empty
    await expect(submitButton).toBeDisabled();

    // Fill only rating
    await page.locator('[data-testid="rating-stars"]').locator('[data-rating="4"]').click();

    // Still disabled (missing reviewer type and content)
    await expect(submitButton).toBeDisabled();

    // Add reviewer type
    const reviewerTypeSelect = page.getByLabel(/reviewer type/i);
    await reviewerTypeSelect.click();
    await page.getByRole('option', { name: /solo/i }).click();

    // Still disabled (missing content)
    await expect(submitButton).toBeDisabled();

    // Add content
    const contentTextarea = page.getByLabel(/review content/i);
    await contentTextarea.fill('This campsite exceeded all my expectations. Great location and amenities!');

    // Now should be enabled
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
  });
});
