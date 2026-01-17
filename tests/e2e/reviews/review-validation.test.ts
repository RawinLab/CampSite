import { test, expect } from '@playwright/test';

test.describe('Review Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page with review form
    // Assuming campsite ID 1 exists for testing
    await page.goto('/campsites/1');
    await page.waitForLoadState('networkidle');

    // Scroll to review section and click "Write a Review" button
    await page.locator('[data-testid="write-review-button"]').click();
    await page.waitForSelector('[data-testid="review-form"]', { timeout: 5000 });
  });

  test('T055.1: Error shown when content too short (<20 chars)', async ({ page }) => {
    // Fill form with short content
    await page.locator('[data-testid="review-content"]').fill('Too short');

    // Blur to trigger validation
    await page.locator('[data-testid="review-content"]').blur();

    // Wait for validation error
    await page.waitForTimeout(200);

    // Check for error message
    const errorMessage = page.locator('[data-testid="content-error"]');
    await expect(errorMessage).toBeVisible();
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

    // Wait for validation error
    await page.waitForTimeout(200);

    // Check for error message
    const errorMessage = page.locator('[data-testid="content-error"]');
    await expect(errorMessage).toBeVisible();
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

    // Check for rating error message
    const ratingError = page.locator('[data-testid="rating-error"]');

    // Try clicking submit to trigger error
    await submitButton.click({ force: true });
    await page.waitForTimeout(200);

    // Error should be visible or button should remain disabled
    const isErrorVisible = await ratingError.isVisible().catch(() => false);
    const isButtonDisabled = await submitButton.isDisabled();

    expect(isErrorVisible || isButtonDisabled).toBe(true);
  });

  test('T055.5: Reviewer type required validation', async ({ page }) => {
    // Fill valid content
    await page.locator('[data-testid="review-content"]').fill('This is a valid review content with sufficient characters to pass validation.');

    // Select rating
    await page.locator('[data-testid="rating-star-5"]').click();

    // Try to submit without reviewer type
    const submitButton = page.locator('[data-testid="review-submit"]');
    await expect(submitButton).toBeDisabled();

    // Check for reviewer type error
    const reviewerTypeError = page.locator('[data-testid="reviewer-type-error"]');

    // Try clicking submit to trigger error
    await submitButton.click({ force: true });
    await page.waitForTimeout(200);

    // Error should be visible or button should remain disabled
    const isErrorVisible = await reviewerTypeError.isVisible().catch(() => false);
    const isButtonDisabled = await submitButton.isDisabled();

    expect(isErrorVisible || isButtonDisabled).toBe(true);
  });

  test('T055.6: Title max length validation (100 chars)', async ({ page }) => {
    // Create title with more than 100 characters
    const longTitle = 'a'.repeat(101);

    // Fill form with long title
    const titleInput = page.locator('[data-testid="review-title"]');
    await titleInput.fill(longTitle);

    // Blur to trigger validation
    await titleInput.blur();

    // Wait for validation error
    await page.waitForTimeout(200);

    // Check for error message
    const errorMessage = page.locator('[data-testid="title-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/100.*character/i);

    // Or check that input value is truncated to 100 chars
    const titleValue = await titleInput.inputValue();
    expect(titleValue.length).toBeLessThanOrEqual(100);
  });

  test('T055.7: Real-time validation feedback', async ({ page }) => {
    const contentInput = page.locator('[data-testid="review-content"]');
    const errorMessage = page.locator('[data-testid="content-error"]');

    // Type short content
    await contentInput.fill('Short');
    await contentInput.blur();
    await page.waitForTimeout(200);

    // Error should appear
    await expect(errorMessage).toBeVisible();

    // Add more characters to make it valid
    await contentInput.fill('This is now a valid review with more than twenty characters.');
    await contentInput.blur();
    await page.waitForTimeout(200);

    // Error should disappear
    await expect(errorMessage).not.toBeVisible();

    // Make it too long
    await contentInput.fill('a'.repeat(501));
    await contentInput.blur();
    await page.waitForTimeout(200);

    // Error should reappear
    await expect(errorMessage).toBeVisible();

    // Fix it again
    await contentInput.fill('This is a valid review content with sufficient length for submission.');
    await contentInput.blur();
    await page.waitForTimeout(200);

    // Error should disappear again
    await expect(errorMessage).not.toBeVisible();
  });

  test('T055.8: Character counter updates', async ({ page }) => {
    const contentInput = page.locator('[data-testid="review-content"]');
    const charCounter = page.locator('[data-testid="content-char-counter"]');

    // Check initial state
    await expect(charCounter).toBeVisible();

    // Type some text
    const testContent = 'This is a test review with some content.';
    await contentInput.fill(testContent);

    // Wait for counter to update
    await page.waitForTimeout(200);

    // Verify counter shows correct count
    const counterText = await charCounter.textContent();
    expect(counterText).toContain(testContent.length.toString());
    expect(counterText).toContain('500'); // Should show max limit

    // Type more text
    const longerContent = 'This is a much longer review with significantly more content to test the character counter functionality properly and ensure it updates in real-time as expected.';
    await contentInput.fill(longerContent);

    // Wait for counter to update
    await page.waitForTimeout(200);

    // Verify counter updated
    const updatedCounterText = await charCounter.textContent();
    expect(updatedCounterText).toContain(longerContent.length.toString());

    // Test with exactly 20 characters (minimum)
    const minContent = 'a'.repeat(20);
    await contentInput.fill(minContent);
    await page.waitForTimeout(200);

    const minCounterText = await charCounter.textContent();
    expect(minCounterText).toContain('20');

    // Test with exactly 500 characters (maximum)
    const maxContent = 'a'.repeat(500);
    await contentInput.fill(maxContent);
    await page.waitForTimeout(200);

    const maxCounterText = await charCounter.textContent();
    expect(maxCounterText).toContain('500');
  });

  test('T055.9: Valid form enables submit button', async ({ page }) => {
    const submitButton = page.locator('[data-testid="review-submit"]');

    // Initially disabled
    await expect(submitButton).toBeDisabled();

    // Fill all required fields with valid data
    await page.locator('[data-testid="rating-star-4"]').click();
    await page.locator('[data-testid="review-content"]').fill('This is a valid review with sufficient content to meet the minimum character requirement.');
    await page.locator('[data-testid="reviewer-type-select"]').selectOption('couple');

    // Wait for validation
    await page.waitForTimeout(300);

    // Submit button should now be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('T055.10: Multiple validation errors shown simultaneously', async ({ page }) => {
    const submitButton = page.locator('[data-testid="review-submit"]');

    // Fill form with multiple invalid fields
    await page.locator('[data-testid="review-title"]').fill('a'.repeat(101)); // Too long
    await page.locator('[data-testid="review-content"]').fill('Short'); // Too short

    // Blur to trigger validation
    await page.locator('[data-testid="review-content"]').blur();
    await page.waitForTimeout(300);

    // Both errors should be visible
    const titleError = page.locator('[data-testid="title-error"]');
    const contentError = page.locator('[data-testid="content-error"]');

    await expect(titleError).toBeVisible();
    await expect(contentError).toBeVisible();

    // Submit button should be disabled
    await expect(submitButton).toBeDisabled();
  });

  test('T055.11: Validation clears when form is reset', async ({ page }) => {
    // Fill form with invalid data
    await page.locator('[data-testid="review-content"]').fill('Short');
    await page.locator('[data-testid="review-content"]').blur();
    await page.waitForTimeout(200);

    // Error should be visible
    const errorMessage = page.locator('[data-testid="content-error"]');
    await expect(errorMessage).toBeVisible();

    // Find and click cancel/reset button if available
    const cancelButton = page.locator('[data-testid="review-cancel"]');

    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.waitForTimeout(300);

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

    // Wait for validation
    await page.waitForTimeout(300);

    // Submit button should be enabled
    await expect(submitButton).toBeEnabled();
  });
});
