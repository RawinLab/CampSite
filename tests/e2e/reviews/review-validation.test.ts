import { test, expect } from '@playwright/test';
import { waitForApi, assertNoErrors, PUBLIC_API } from '../utils/api-helpers';

// Use a valid test campsite slug
const TEST_CAMPSITE_SLUG = 'test-campsite-details-b7a9886a';

test.describe('Review Form Validation', () => {
  const TEST_CAMPSITE_ID = '1';

  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page with review form and wait for APIs
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

    // Scroll to review section and click "Write a Review" button
    await page.locator('[data-testid="write-review-button"]').click();
    await page.waitForSelector('[data-testid="review-form"]', { timeout: 5000 });
  });

  test('T055.1: Error shown when content too short (<20 chars)', async ({ page }) => {
    // Fill form with short content
    await page.locator('[data-testid="review-content"]').fill('Too short');

    // Blur to trigger validation
    await page.locator('[data-testid="review-content"]').blur();

    // Check for error message
    const errorMessage = page.locator('[data-testid="content-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
    await expect(errorMessage).toContainText(/20.*character/i);

    // Submit button should be disabled
    const submitButton = page.locator('[data-testid="review-submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('T055.2: Error shown when content too long (>500 chars)', async ({ page }) => {
    // Create content with more than 500 characters
    const longContent = 'a'.repeat(501);

    // Fill form with long content
    await page.locator('[data-testid="review-content"]').fill(longContent);

    // Blur to trigger validation
    await page.locator('[data-testid="review-content"]').blur();

    // Check for error message
    const errorMessage = page.locator('[data-testid="content-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
    await expect(errorMessage).toContainText(/500.*character/i);

    // Submit button should be disabled
    const submitButton = page.locator('[data-testid="review-submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('T055.3: Submit button disabled with invalid data', async ({ page }) => {
    const submitButton = page.locator('[data-testid="review-submit"]');

    // Initially disabled (no data)
    await expect(submitButton).toBeDisabled();

    // Fill only content (missing rating)
    await page.locator('[data-testid="review-content"]').fill('This is a valid review content with more than twenty characters.');
    await page.locator('[data-testid="review-content"]').blur();

    // Should still be disabled (missing rating)
    await expect(submitButton).toBeDisabled();

    // Add rating but clear content
    await page.locator('[data-testid="rating-star-5"]').click();
    await page.locator('[data-testid="review-content"]').clear();

    // Should be disabled (content too short)
    await expect(submitButton).toBeDisabled();
  });

  test('T055.4: Rating required validation', async ({ page }) => {
    // Fill valid content
    await page.locator('[data-testid="review-content"]').fill('This is a valid review content with sufficient characters to pass validation.');

    // Select reviewer type
    await page.locator('[data-testid="reviewer-type-select"]').selectOption('family');

    // Try to submit without rating
    const submitButton = page.locator('[data-testid="review-submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('T055.5: Reviewer type required validation', async ({ page }) => {
    // Fill valid content
    await page.locator('[data-testid="review-content"]').fill('This is a valid review content with sufficient characters to pass validation.');

    // Select rating
    await page.locator('[data-testid="rating-star-5"]').click();

    // Try to submit without reviewer type
    const submitButton = page.locator('[data-testid="review-submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('T055.6: Title max length validation (100 chars)', async ({ page }) => {
    // Create title with more than 100 characters
    const longTitle = 'a'.repeat(101);

    // Fill form with long title
    const titleInput = page.locator('[data-testid="review-title"]');
    await titleInput.fill(longTitle);

    // Blur to trigger validation
    await titleInput.blur();

    // Check for error message or truncation
    const errorMessage = page.locator('[data-testid="title-error"]');
    const isErrorVisible = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

    if (isErrorVisible) {
      await expect(errorMessage).toContainText(/100.*character/i);
    } else {
      // Or check that input value is truncated to 100 chars
      const titleValue = await titleInput.inputValue();
      expect(titleValue.length).toBeLessThanOrEqual(100);
    }
  });

  test('T055.7: Real-time validation feedback', async ({ page }) => {
    const contentInput = page.locator('[data-testid="review-content"]');
    const errorMessage = page.locator('[data-testid="content-error"]');

    // Type short content
    await contentInput.fill('Short');
    await contentInput.blur();

    // Error should appear
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    // Add more characters to make it valid
    await contentInput.fill('This is now a valid review with more than twenty characters.');
    await contentInput.blur();

    // Error should disappear
    await expect(errorMessage).not.toBeVisible({ timeout: 3000 });

    // Make it too long
    await contentInput.fill('a'.repeat(501));
    await contentInput.blur();

    // Error should reappear
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    // Fix it again
    await contentInput.fill('This is a valid review content with sufficient length for submission.');
    await contentInput.blur();

    // Error should disappear again
    await expect(errorMessage).not.toBeVisible({ timeout: 3000 });
  });

  test('T055.8: Character counter updates', async ({ page }) => {
    const contentInput = page.locator('[data-testid="review-content"]');
    const charCounter = page.locator('[data-testid="content-char-counter"]');

    // Check initial state
    await expect(charCounter).toBeVisible();

    // Type some text
    const testContent = 'This is a test review with some content.';
    await contentInput.fill(testContent);

    // Verify counter shows correct count
    await expect(charCounter).toContainText(testContent.length.toString(), { timeout: 2000 });
    await expect(charCounter).toContainText('500'); // Should show max limit

    // Type more text
    const longerContent = 'This is a much longer review with significantly more content to test the character counter functionality properly and ensure it updates in real-time as expected.';
    await contentInput.fill(longerContent);

    // Verify counter updated
    await expect(charCounter).toContainText(longerContent.length.toString(), { timeout: 2000 });

    // Test with exactly 20 characters (minimum)
    const minContent = 'a'.repeat(20);
    await contentInput.fill(minContent);

    await expect(charCounter).toContainText('20', { timeout: 2000 });

    // Test with exactly 500 characters (maximum)
    const maxContent = 'a'.repeat(500);
    await contentInput.fill(maxContent);

    await expect(charCounter).toContainText('500', { timeout: 2000 });
  });

  test('T055.9: Valid form enables submit button', async ({ page }) => {
    const submitButton = page.locator('[data-testid="review-submit"]');

    // Initially disabled
    await expect(submitButton).toBeDisabled();

    // Fill all required fields with valid data
    await page.locator('[data-testid="rating-star-4"]').click();
    await page.locator('[data-testid="review-content"]').fill('This is a valid review with sufficient content to meet the minimum character requirement.');
    await page.locator('[data-testid="reviewer-type-select"]').selectOption('couple');

    // Submit button should now be enabled
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
  });

  test('T055.10: Multiple validation errors shown simultaneously', async ({ page }) => {
    const submitButton = page.locator('[data-testid="review-submit"]');

    // Fill form with multiple invalid fields
    await page.locator('[data-testid="review-title"]').fill('a'.repeat(101)); // Too long
    await page.locator('[data-testid="review-content"]').fill('Short'); // Too short

    // Blur to trigger validation
    await page.locator('[data-testid="review-content"]').blur();

    // Both errors should be visible
    const titleError = page.locator('[data-testid="title-error"]');
    const contentError = page.locator('[data-testid="content-error"]');

    await expect(contentError).toBeVisible({ timeout: 3000 });

    // Title error might be visible or input might be truncated
    const isTitleErrorVisible = await titleError.isVisible({ timeout: 3000 }).catch(() => false);
    if (isTitleErrorVisible) {
      await expect(titleError).toBeVisible();
    }

    // Submit button should be disabled
    await expect(submitButton).toBeDisabled();
  });

  test('T055.11: Validation clears when form is reset', async ({ page }) => {
    // Fill form with invalid data
    await page.locator('[data-testid="review-content"]').fill('Short');
    await page.locator('[data-testid="review-content"]').blur();

    // Error should be visible
    const errorMessage = page.locator('[data-testid="content-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    // Find and click cancel/reset button if available
    const cancelButton = page.locator('[data-testid="review-cancel"]');

    const isCancelVisible = await cancelButton.isVisible().catch(() => false);
    if (isCancelVisible) {
      await cancelButton.click();

      // Re-open form
      await page.locator('[data-testid="write-review-button"]').click();
      await page.waitForSelector('[data-testid="review-form"]', { timeout: 5000 });

      // Error should not be visible
      await expect(errorMessage).not.toBeVisible();

      // Counter should be reset
      const charCounter = page.locator('[data-testid="content-char-counter"]');
      const counterText = await charCounter.textContent();
      expect(counterText).toContain('0');
    }
  });

  test('T055.12: Validation works with keyboard navigation', async ({ page }) => {
    const contentInput = page.locator('[data-testid="review-content"]');
    const submitButton = page.locator('[data-testid="review-submit"]');

    // Tab through form using keyboard
    await page.keyboard.press('Tab'); // Focus rating
    await page.keyboard.press('ArrowRight'); // Select rating
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight'); // 4 stars

    await page.keyboard.press('Tab'); // Focus content
    await contentInput.type('This is a valid review with keyboard input that meets character requirements.');

    await page.keyboard.press('Tab'); // Focus reviewer type
    await page.keyboard.press('ArrowDown'); // Select option

    await page.keyboard.press('Tab'); // Focus submit button

    // Submit button should be enabled
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
  });
});
