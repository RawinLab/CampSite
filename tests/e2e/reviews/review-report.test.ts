import { test, expect } from '@playwright/test';

/**
 * E2E Test: Review Report Functionality
 * Task T066: User can report review
 *
 * Tests the report review dialog and flow
 * Part of Q11 report-based moderation system
 */

test.describe('Review Report Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a campsite detail page with reviews
    // Assuming campsite ID 1 exists with reviews for testing
    await page.goto('/campsites/1');
    await page.waitForLoadState('networkidle');

    // Wait for reviews section to load
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });
  });

  test('T066.1: Report button visible on reviews when logged in', async ({ page, context }) => {
    // Mock authentication by setting auth cookie/session
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-user-token-123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Reload page to apply auth state
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Verify report button is visible on review cards
    const reportButtons = page.locator('[data-testid="review-report-button"]');
    const count = await reportButtons.count();
    expect(count).toBeGreaterThan(0);

    // Verify first report button is visible
    await expect(reportButtons.first()).toBeVisible();
  });

  test('T066.2: Report button not visible when not logged in', async ({ page }) => {
    // Ensure no auth state
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Report button should not be visible without authentication
    const reportButtons = page.locator('[data-testid="review-report-button"]');
    const count = await reportButtons.count();
    expect(count).toBe(0);
  });

  test('T066.3: Clicking report button opens report dialog', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-user-token-123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Click first report button
    const reportButton = page.locator('[data-testid="review-report-button"]').first();
    await reportButton.click();

    // Wait for dialog to appear
    await page.waitForTimeout(200);

    // Verify report dialog is visible
    const dialog = page.locator('[data-testid="report-review-dialog"]');
    await expect(dialog).toBeVisible();

    // Verify dialog title
    const dialogTitle = page.locator('[data-testid="report-dialog-title"]');
    await expect(dialogTitle).toBeVisible();
    await expect(dialogTitle).toContainText('รายงานรีวิว');
  });

  test('T066.4: Report dialog shows all reason options', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-user-token-123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Open report dialog
    const reportButton = page.locator('[data-testid="review-report-button"]').first();
    await reportButton.click();
    await page.waitForTimeout(200);

    // Verify all reason options are present
    const spamOption = page.locator('[data-testid="report-reason-spam"]');
    const inappropriateOption = page.locator('[data-testid="report-reason-inappropriate"]');
    const fakeOption = page.locator('[data-testid="report-reason-fake"]');
    const otherOption = page.locator('[data-testid="report-reason-other"]');

    await expect(spamOption).toBeVisible();
    await expect(inappropriateOption).toBeVisible();
    await expect(fakeOption).toBeVisible();
    await expect(otherOption).toBeVisible();
  });

  test('T066.5: Must select reason to submit report', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-user-token-123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Open report dialog
    const reportButton = page.locator('[data-testid="review-report-button"]').first();
    await reportButton.click();
    await page.waitForTimeout(200);

    // Try to submit without selecting reason
    const submitButton = page.locator('[data-testid="report-submit-button"]');
    await submitButton.click();

    // Wait a bit
    await page.waitForTimeout(300);

    // Dialog should still be visible (validation failed)
    const dialog = page.locator('[data-testid="report-review-dialog"]');
    await expect(dialog).toBeVisible();

    // Error message or validation should appear
    const errorMessage = page.locator('[data-testid="report-reason-error"]');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText('เลือกเหตุผล');
    }
  });

  test('T066.6: Optional details field is present', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-user-token-123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Open report dialog
    const reportButton = page.locator('[data-testid="review-report-button"]').first();
    await reportButton.click();
    await page.waitForTimeout(200);

    // Verify details textarea is present
    const detailsField = page.locator('[data-testid="report-details-field"]');
    await expect(detailsField).toBeVisible();

    // Verify it's a textarea
    const tagName = await detailsField.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('textarea');

    // Verify placeholder or label
    const placeholder = await detailsField.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
  });

  test('T066.7: Can submit report with reason only', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-user-token-123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Open report dialog
    const reportButton = page.locator('[data-testid="review-report-button"]').first();
    await reportButton.click();
    await page.waitForTimeout(200);

    // Select spam reason
    const spamOption = page.locator('[data-testid="report-reason-spam"]');
    await spamOption.click();

    // Submit report
    const submitButton = page.locator('[data-testid="report-submit-button"]');
    await submitButton.click();

    // Wait for submission
    await page.waitForTimeout(500);

    // Success message should appear
    const successMessage = page.locator('[data-testid="report-success-message"]');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('T066.8: Can submit report with reason and details', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-user-token-123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Open report dialog
    const reportButton = page.locator('[data-testid="review-report-button"]').first();
    await reportButton.click();
    await page.waitForTimeout(200);

    // Select inappropriate reason
    const inappropriateOption = page.locator('[data-testid="report-reason-inappropriate"]');
    await inappropriateOption.click();

    // Fill in details
    const detailsField = page.locator('[data-testid="report-details-field"]');
    await detailsField.fill('This review contains offensive language and inappropriate content.');

    // Submit report
    const submitButton = page.locator('[data-testid="report-submit-button"]');
    await submitButton.click();

    // Wait for submission
    await page.waitForTimeout(500);

    // Success message should appear
    const successMessage = page.locator('[data-testid="report-success-message"]');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('T066.9: Success message shown after report submission', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-user-token-123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Open report dialog
    const reportButton = page.locator('[data-testid="review-report-button"]').first();
    await reportButton.click();
    await page.waitForTimeout(200);

    // Select reason and submit
    const fakeOption = page.locator('[data-testid="report-reason-fake"]');
    await fakeOption.click();

    const submitButton = page.locator('[data-testid="report-submit-button"]');
    await submitButton.click();

    // Wait for success message
    await page.waitForTimeout(500);

    // Verify success message appears
    const successMessage = page.locator('[data-testid="report-success-message"]');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Verify message contains expected text
    await expect(successMessage).toContainText('รายงาน');
  });

  test('T066.10: Dialog closes after successful report', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-user-token-123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Open report dialog
    const reportButton = page.locator('[data-testid="review-report-button"]').first();
    await reportButton.click();
    await page.waitForTimeout(200);

    // Verify dialog is open
    const dialog = page.locator('[data-testid="report-review-dialog"]');
    await expect(dialog).toBeVisible();

    // Select reason and submit
    const otherOption = page.locator('[data-testid="report-reason-other"]');
    await otherOption.click();

    const submitButton = page.locator('[data-testid="report-submit-button"]');
    await submitButton.click();

    // Wait for submission and dialog close
    await page.waitForTimeout(1000);

    // Dialog should be closed
    await expect(dialog).not.toBeVisible();
  });

  test('T066.11: Can cancel report dialog', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-user-token-123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Open report dialog
    const reportButton = page.locator('[data-testid="review-report-button"]').first();
    await reportButton.click();
    await page.waitForTimeout(200);

    // Verify dialog is open
    const dialog = page.locator('[data-testid="report-review-dialog"]');
    await expect(dialog).toBeVisible();

    // Click cancel button
    const cancelButton = page.locator('[data-testid="report-cancel-button"]');
    await cancelButton.click();

    // Wait for dialog close
    await page.waitForTimeout(300);

    // Dialog should be closed
    await expect(dialog).not.toBeVisible();
  });

  test('T066.12: Each review has its own report button', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-user-token-123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Count review cards
    const reviewCards = await page.locator('[data-testid="review-card"]').all();
    const reviewCount = reviewCards.length;

    // Count report buttons
    const reportButtons = await page.locator('[data-testid="review-report-button"]').all();
    const reportButtonCount = reportButtons.length;

    // Should have one report button per review (excluding user's own reviews)
    expect(reportButtonCount).toBeGreaterThan(0);
    expect(reportButtonCount).toBeLessThanOrEqual(reviewCount);
  });

  test('T066.13: Cannot report own review', async ({ page, context }) => {
    // Mock authentication with specific user ID
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-review-owner-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Find user's own review (should not have report button)
    const ownReview = page.locator('[data-testid="review-card"][data-is-own="true"]').first();

    if (await ownReview.isVisible()) {
      // Report button should not exist on own review
      const reportButton = ownReview.locator('[data-testid="review-report-button"]');
      await expect(reportButton).not.toBeVisible();
    }
  });

  test('T066.14: All reason options are selectable', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-user-token-123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Open report dialog
    const reportButton = page.locator('[data-testid="review-report-button"]').first();
    await reportButton.click();
    await page.waitForTimeout(200);

    // Test selecting each reason option
    const reasons = ['spam', 'inappropriate', 'fake', 'other'];

    for (const reason of reasons) {
      const reasonOption = page.locator(`[data-testid="report-reason-${reason}"]`);
      await reasonOption.click();
      await page.waitForTimeout(100);

      // Verify option is selected
      const isChecked = await reasonOption.isChecked();
      expect(isChecked).toBe(true);
    }
  });

  test('T066.15: Details field has character limit', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-user-token-123',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="reviews-section"]', { timeout: 10000 });

    // Open report dialog
    const reportButton = page.locator('[data-testid="review-report-button"]').first();
    await reportButton.click();
    await page.waitForTimeout(200);

    // Get details field
    const detailsField = page.locator('[data-testid="report-details-field"]');

    // Check if maxlength attribute exists
    const maxLength = await detailsField.getAttribute('maxlength');
    expect(maxLength).toBeTruthy();
    expect(parseInt(maxLength || '0', 10)).toBeLessThanOrEqual(500);
  });
});
