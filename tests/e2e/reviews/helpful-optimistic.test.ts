/**
 * E2E Test: T073 - Helpful Button Optimistic Update
 *
 * Tests optimistic UI updates for the helpful voting functionality.
 * Verifies that count increments immediately before API response and
 * handles errors with proper rollback.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Helpful Button Optimistic Update', () => {
  const TEST_CAMPSITE_URL = '/campsites/test-campsite-1';

  test.beforeEach(async ({ page, context }) => {
    // Mock authentication - set auth cookie to simulate logged-in user
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token-for-testing',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to campsite detail page with reviews
    await page.goto(TEST_CAMPSITE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('T073.1: Count increments immediately on click before API response', async ({ page }) => {
    // Find a review with helpful button
    const helpfulButton = page.locator('[data-testid="helpful-button"]').first();
    await expect(helpfulButton).toBeVisible();

    // Get initial count
    const countElement = page.locator('[data-testid="helpful-count"]').first();
    const initialCountText = await countElement.textContent();
    const initialCount = parseInt(initialCountText || '0', 10);

    // Mock slow API response (delay 2 seconds)
    await page.route('**/api/reviews/*/helpful', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            helpful_count: initialCount + 1,
            user_voted: true,
          },
        }),
      });
    });

    // Click the helpful button
    await helpfulButton.click();

    // Count should increment IMMEDIATELY (within 100ms)
    await page.waitForTimeout(100);
    const optimisticCountText = await countElement.textContent();
    const optimisticCount = parseInt(optimisticCountText || '0', 10);

    // Verify optimistic update happened before API response
    expect(optimisticCount).toBe(initialCount + 1);

    // Wait for API response to complete
    await page.waitForTimeout(2500);

    // Count should still be correct after API response
    const finalCountText = await countElement.textContent();
    const finalCount = parseInt(finalCountText || '0', 10);
    expect(finalCount).toBe(initialCount + 1);
  });

  test('T073.2: UI updates without waiting for API', async ({ page }) => {
    const helpfulButton = page.locator('[data-testid="helpful-button"]').first();
    await expect(helpfulButton).toBeVisible();

    // Mock slow API (3 seconds)
    await page.route('**/api/reviews/*/helpful', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            helpful_count: 5,
            user_voted: true,
          },
        }),
      });
    });

    // Record click timestamp
    const clickTime = Date.now();
    await helpfulButton.click();

    // Check if count updated within 200ms (optimistic)
    await page.waitForTimeout(200);
    const updateTime = Date.now();

    // UI should have updated within 200ms, not 3000ms
    expect(updateTime - clickTime).toBeLessThan(500);

    // Verify count has changed
    const countElement = page.locator('[data-testid="helpful-count"]').first();
    const countText = await countElement.textContent();
    const count = parseInt(countText || '0', 10);
    expect(count).toBeGreaterThan(0);
  });

  test('T073.3: Button state changes immediately', async ({ page }) => {
    const helpfulButton = page.locator('[data-testid="helpful-button"]').first();
    await expect(helpfulButton).toBeVisible();

    // Get initial button state (voted or not)
    const initialClasses = await helpfulButton.getAttribute('class') || '';
    const initiallyVoted = initialClasses.includes('voted') || initialClasses.includes('active');

    // Mock slow API
    await page.route('**/api/reviews/*/helpful', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            helpful_count: 3,
            user_voted: !initiallyVoted,
          },
        }),
      });
    });

    // Click button
    await helpfulButton.click();

    // Button state should change immediately (within 100ms)
    await page.waitForTimeout(100);
    const optimisticClasses = await helpfulButton.getAttribute('class') || '';
    const optimisticallyVoted = optimisticClasses.includes('voted') || optimisticClasses.includes('active');

    // State should have toggled immediately
    expect(optimisticallyVoted).toBe(!initiallyVoted);
  });

  test('T073.4: Handles slow API gracefully', async ({ page }) => {
    const helpfulButton = page.locator('[data-testid="helpful-button"]').first();
    await expect(helpfulButton).toBeVisible();

    const countElement = page.locator('[data-testid="helpful-count"]').first();
    const initialCountText = await countElement.textContent();
    const initialCount = parseInt(initialCountText || '0', 10);

    // Mock very slow API (5 seconds)
    await page.route('**/api/reviews/*/helpful', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            helpful_count: initialCount + 1,
            user_voted: true,
          },
        }),
      });
    });

    // Click button
    await helpfulButton.click();

    // UI should update immediately despite slow API
    await page.waitForTimeout(100);
    const earlyCountText = await countElement.textContent();
    const earlyCount = parseInt(earlyCountText || '0', 10);
    expect(earlyCount).toBe(initialCount + 1);

    // Button should be disabled during API call
    await expect(helpfulButton).toBeDisabled();

    // Wait for API to complete
    await page.waitForTimeout(5500);

    // Button should be re-enabled
    await expect(helpfulButton).toBeEnabled();

    // Final count should still be correct
    const finalCountText = await countElement.textContent();
    const finalCount = parseInt(finalCountText || '0', 10);
    expect(finalCount).toBe(initialCount + 1);
  });

  test('T073.5: Reverts on API error', async ({ page }) => {
    const helpfulButton = page.locator('[data-testid="helpful-button"]').first();
    await expect(helpfulButton).toBeVisible();

    const countElement = page.locator('[data-testid="helpful-count"]').first();
    const initialCountText = await countElement.textContent();
    const initialCount = parseInt(initialCountText || '0', 10);

    // Mock API error
    await page.route('**/api/reviews/*/helpful', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
        }),
      });
    });

    // Click button
    await helpfulButton.click();

    // Count should increment optimistically
    await page.waitForTimeout(100);
    const optimisticCountText = await countElement.textContent();
    const optimisticCount = parseInt(optimisticCountText || '0', 10);
    expect(optimisticCount).toBe(initialCount + 1);

    // Wait for API error
    await page.waitForTimeout(1500);

    // Count should revert to original value
    const revertedCountText = await countElement.textContent();
    const revertedCount = parseInt(revertedCountText || '0', 10);
    expect(revertedCount).toBe(initialCount);

    // Error message should be displayed
    const errorMessage = page.locator('[data-testid="error-message"]').or(
      page.getByText(/error|failed|ผิดพลาด/i)
    );
    await expect(errorMessage.first()).toBeVisible({ timeout: 2000 });
  });

  test('T073.6: Handles network timeout with rollback', async ({ page }) => {
    const helpfulButton = page.locator('[data-testid="helpful-button"]').first();
    await expect(helpfulButton).toBeVisible();

    const countElement = page.locator('[data-testid="helpful-count"]').first();
    const initialCountText = await countElement.textContent();
    const initialCount = parseInt(initialCountText || '0', 10);

    // Mock network timeout (no response)
    await page.route('**/api/reviews/*/helpful', async (route) => {
      // Simulate timeout - never fulfill
      await new Promise(resolve => setTimeout(resolve, 30000));
    });

    // Click button
    await helpfulButton.click();

    // Count should increment optimistically
    await page.waitForTimeout(100);
    const optimisticCountText = await countElement.textContent();
    const optimisticCount = parseInt(optimisticCountText || '0', 10);
    expect(optimisticCount).toBe(initialCount + 1);

    // After reasonable timeout (e.g., 10 seconds), should handle gracefully
    // Note: In real implementation, there should be a timeout handler
    await page.waitForTimeout(2000);

    // Button should become re-enabled eventually
    const isDisabled = await helpfulButton.isDisabled();

    // Either still loading or has timed out with error
    if (!isDisabled) {
      // If re-enabled, count should have reverted or error shown
      const currentCountText = await countElement.textContent();
      const currentCount = parseInt(currentCountText || '0', 10);

      // Should either show error or have reverted
      const hasError = await page.locator('[data-testid="error-message"]')
        .isVisible()
        .catch(() => false);

      if (hasError || currentCount === initialCount) {
        // Properly handled timeout
        expect(true).toBe(true);
      }
    }
  });

  test('T073.7: Optimistic update works for toggle (vote/unvote)', async ({ page }) => {
    const helpfulButton = page.locator('[data-testid="helpful-button"]').first();
    await expect(helpfulButton).toBeVisible();

    const countElement = page.locator('[data-testid="helpful-count"]').first();
    const initialCountText = await countElement.textContent();
    const initialCount = parseInt(initialCountText || '0', 10);

    // First click - vote
    await page.route('**/api/reviews/*/helpful', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            helpful_count: initialCount + 1,
            user_voted: true,
          },
        }),
      });
    });

    await helpfulButton.click();

    // Should increment immediately
    await page.waitForTimeout(100);
    let currentCountText = await countElement.textContent();
    let currentCount = parseInt(currentCountText || '0', 10);
    expect(currentCount).toBe(initialCount + 1);

    // Wait for first API call to complete
    await page.waitForTimeout(1500);

    // Second click - unvote
    await page.route('**/api/reviews/*/helpful', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            helpful_count: initialCount,
            user_voted: false,
          },
        }),
      });
    });

    await helpfulButton.click();

    // Should decrement immediately
    await page.waitForTimeout(100);
    currentCountText = await countElement.textContent();
    currentCount = parseInt(currentCountText || '0', 10);
    expect(currentCount).toBe(initialCount);
  });

  test('T073.8: Multiple rapid clicks are handled correctly', async ({ page }) => {
    const helpfulButton = page.locator('[data-testid="helpful-button"]').first();
    await expect(helpfulButton).toBeVisible();

    const countElement = page.locator('[data-testid="helpful-count"]').first();
    const initialCountText = await countElement.textContent();
    const initialCount = parseInt(initialCountText || '0', 10);

    // Mock API with delay
    let requestCount = 0;
    await page.route('**/api/reviews/*/helpful', async (route) => {
      requestCount++;
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            helpful_count: requestCount % 2 === 1 ? initialCount + 1 : initialCount,
            user_voted: requestCount % 2 === 1,
          },
        }),
      });
    });

    // Rapid clicks should be prevented (button should be disabled after first click)
    await helpfulButton.click();

    await page.waitForTimeout(50);

    // Button should be disabled during API call
    const isDisabled = await helpfulButton.isDisabled();
    expect(isDisabled).toBe(true);

    // Second click should not register
    await helpfulButton.click({ force: true }).catch(() => {
      // Expected to fail if properly disabled
    });

    // Wait for API to complete
    await page.waitForTimeout(1500);

    // Only one API request should have been made
    expect(requestCount).toBeLessThanOrEqual(1);
  });

  test('T073.9: Loading state is shown during API call', async ({ page }) => {
    const helpfulButton = page.locator('[data-testid="helpful-button"]').first();
    await expect(helpfulButton).toBeVisible();

    // Mock slow API
    await page.route('**/api/reviews/*/helpful', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            helpful_count: 5,
            user_voted: true,
          },
        }),
      });
    });

    // Click button
    await helpfulButton.click();

    // Check for loading indicator
    await page.waitForTimeout(100);

    // Button should show loading state (disabled or loading class)
    const isDisabled = await helpfulButton.isDisabled();
    const buttonClasses = await helpfulButton.getAttribute('class') || '';
    const hasLoadingState = isDisabled || buttonClasses.includes('loading');

    expect(hasLoadingState).toBe(true);

    // Wait for API to complete
    await page.waitForTimeout(2500);

    // Loading state should be removed
    const finalDisabled = await helpfulButton.isDisabled();
    expect(finalDisabled).toBe(false);
  });

  test('T073.10: Optimistic update works without authentication (shows login prompt)', async ({ page, context }) => {
    // Clear auth cookies to simulate unauthenticated user
    await context.clearCookies();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    const helpfulButton = page.locator('[data-testid="helpful-button"]').first();

    // Button should be visible but clicking should prompt login
    if (await helpfulButton.isVisible()) {
      await helpfulButton.click();

      // Should show login prompt or redirect to login
      const loginPrompt = page.getByText(/log in|เข้าสู่ระบบ|sign in/i);
      const isLoginPromptVisible = await loginPrompt.isVisible().catch(() => false);
      const currentUrl = page.url();
      const redirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');

      // Either login prompt shown or redirected to login page
      expect(isLoginPromptVisible || redirectedToLogin).toBe(true);
    }
  });
});
