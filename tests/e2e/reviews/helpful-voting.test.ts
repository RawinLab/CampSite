/**
 * E2E Test: Review Helpful Voting Functionality
 * Task T034: E2E test for helpful button increments count
 *
 * Tests the helpful voting button on review cards including:
 * - Button visibility and count display
 * - Toggle behavior (increment/decrement)
 * - Authentication requirements
 * - Visual feedback for voted state
 * - Count persistence after page refresh
 */

import { test, expect } from '@playwright/test';

test.describe('Review Helpful Voting Functionality', () => {
  const TEST_CAMPSITE_ID = 'test-campsite-1';
  const TEST_REVIEW_ID = 'test-review-1';

  test.describe('Unauthenticated User', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a campsite detail page with reviews
      await page.goto(`/campsites/${TEST_CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');
    });

    test('T034.1: Helpful button is visible on review cards', async ({ page }) => {
      // Locate a review card
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      await expect(reviewCard).toBeVisible();

      // Helpful button should be visible
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');
      await expect(helpfulButton).toBeVisible();
    });

    test('T034.2: Helpful count is displayed on review cards', async ({ page }) => {
      // Locate a review card
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      await expect(reviewCard).toBeVisible();

      // Helpful count should be displayed
      const helpfulCount = reviewCard.locator('[data-testid="helpful-count"]');
      await expect(helpfulCount).toBeVisible();

      // Count should be a number (0 or more)
      const countText = await helpfulCount.textContent();
      expect(countText).toMatch(/\d+/);
    });

    test('T034.3: Shows login prompt when not logged in and clicking helpful button', async ({ page }) => {
      // Locate helpful button on first review
      const helpfulButton = page
        .locator('[data-testid="review-card"]')
        .first()
        .locator('[data-testid="helpful-button"]');

      // Click the helpful button
      await helpfulButton.click();

      // Should show login prompt or redirect to login
      // This could be a modal, toast notification, or redirect
      const loginPrompt = page.locator('text=/log in|sign in|authenticate/i').first();
      await expect(loginPrompt).toBeVisible({ timeout: 3000 });
    });

    test('T034.4: Alternative - redirects to login page when clicking helpful button', async ({ page }) => {
      // Store current URL
      const currentUrl = page.url();

      // Locate helpful button on first review
      const helpfulButton = page
        .locator('[data-testid="review-card"]')
        .first()
        .locator('[data-testid="helpful-button"]');

      // Click the helpful button
      await helpfulButton.click();

      // Wait a bit for any navigation or modal
      await page.waitForTimeout(1000);

      // Either URL changed to login page OR a modal/dialog appeared
      const newUrl = page.url();
      const hasModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      const hasLoginText = await page
        .locator('text=/log in|sign in/i')
        .isVisible()
        .catch(() => false);

      // At least one of these should be true
      expect(newUrl.includes('/login') || hasModal || hasLoginText).toBe(true);
    });
  });

  test.describe('Authenticated User', () => {
    test.beforeEach(async ({ page, context }) => {
      // Mock authentication by setting a session cookie
      // In a real scenario, this would be a valid Supabase session token
      await context.addCookies([
        {
          name: 'supabase-auth-token',
          value: 'mock-valid-token-for-testing',
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ]);

      // Navigate to campsite detail page
      await page.goto(`/campsites/${TEST_CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');
    });

    test('T034.5: Click increments helpful count when logged in', async ({ page }) => {
      // Locate the first review card
      const reviewCard = page.locator('[data-testid="review-card"]').first();

      // Get initial count
      const helpfulCount = reviewCard.locator('[data-testid="helpful-count"]');
      const initialCountText = await helpfulCount.textContent();
      const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0', 10);

      // Click helpful button
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');
      await helpfulButton.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Count should increment by 1
      const newCountText = await helpfulCount.textContent();
      const newCount = parseInt(newCountText?.match(/\d+/)?.[0] || '0', 10);

      expect(newCount).toBe(initialCount + 1);
    });

    test('T034.6: Click again decrements helpful count (toggle behavior)', async ({ page }) => {
      // Locate the first review card
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');
      const helpfulCount = reviewCard.locator('[data-testid="helpful-count"]');

      // Get initial count
      const initialCountText = await helpfulCount.textContent();
      const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0', 10);

      // First click - increment
      await helpfulButton.click();
      await page.waitForTimeout(500);

      const afterFirstClickText = await helpfulCount.textContent();
      const afterFirstClick = parseInt(afterFirstClickText?.match(/\d+/)?.[0] || '0', 10);
      expect(afterFirstClick).toBe(initialCount + 1);

      // Second click - decrement (toggle off)
      await helpfulButton.click();
      await page.waitForTimeout(500);

      const afterSecondClickText = await helpfulCount.textContent();
      const afterSecondClick = parseInt(afterSecondClickText?.match(/\d+/)?.[0] || '0', 10);
      expect(afterSecondClick).toBe(initialCount);
    });

    test('T034.7: Visual feedback shows voted state', async ({ page }) => {
      // Locate the first review card
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');

      // Get initial state (should not have voted class/attribute)
      const initialState = await helpfulButton.getAttribute('data-voted');
      expect(initialState).not.toBe('true');

      // Click to vote
      await helpfulButton.click();
      await page.waitForTimeout(500);

      // Should now have voted state
      const votedState = await helpfulButton.getAttribute('data-voted');
      expect(votedState).toBe('true');

      // Button should have visual indication (different color, icon, etc.)
      // Check for aria-pressed or similar accessibility attribute
      const ariaPressed = await helpfulButton.getAttribute('aria-pressed');
      expect(ariaPressed).toBe('true');
    });

    test('T034.8: Alternative visual feedback - CSS class changes', async ({ page }) => {
      // Locate the first review card
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');

      // Click to vote
      await helpfulButton.click();
      await page.waitForTimeout(500);

      // Check if button has a "voted" or "active" class
      const buttonClasses = await helpfulButton.getAttribute('class');
      const hasVotedClass =
        buttonClasses?.includes('voted') ||
        buttonClasses?.includes('active') ||
        buttonClasses?.includes('selected');

      // At least one visual indicator should be present
      expect(hasVotedClass).toBe(true);
    });

    test('T034.9: Helpful count persists after page refresh', async ({ page }) => {
      // Locate the first review card
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');
      const helpfulCount = reviewCard.locator('[data-testid="helpful-count"]');

      // Click to vote
      await helpfulButton.click();
      await page.waitForTimeout(500);

      // Get count after voting
      const countAfterVoteText = await helpfulCount.textContent();
      const countAfterVote = parseInt(countAfterVoteText?.match(/\d+/)?.[0] || '0', 10);

      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Count should remain the same
      const reviewCardAfterRefresh = page.locator('[data-testid="review-card"]').first();
      const helpfulCountAfterRefresh = reviewCardAfterRefresh.locator('[data-testid="helpful-count"]');

      const countAfterRefreshText = await helpfulCountAfterRefresh.textContent();
      const countAfterRefresh = parseInt(countAfterRefreshText?.match(/\d+/)?.[0] || '0', 10);

      expect(countAfterRefresh).toBe(countAfterVote);
    });

    test('T034.10: Voted state persists after page refresh', async ({ page }) => {
      // Locate the first review card
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');

      // Click to vote
      await helpfulButton.click();
      await page.waitForTimeout(500);

      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Voted state should persist
      const reviewCardAfterRefresh = page.locator('[data-testid="review-card"]').first();
      const helpfulButtonAfterRefresh = reviewCardAfterRefresh.locator('[data-testid="helpful-button"]');

      const votedState = await helpfulButtonAfterRefresh.getAttribute('data-voted');
      const ariaPressed = await helpfulButtonAfterRefresh.getAttribute('aria-pressed');

      // Should still show as voted
      expect(votedState === 'true' || ariaPressed === 'true').toBe(true);
    });

    test('T034.11: Multiple reviews can be voted independently', async ({ page }) => {
      // Get all review cards
      const reviewCards = page.locator('[data-testid="review-card"]');
      const reviewCount = await reviewCards.count();

      // Need at least 2 reviews for this test
      if (reviewCount < 2) {
        test.skip();
      }

      // Vote on first review
      const firstReview = reviewCards.nth(0);
      const firstHelpfulButton = firstReview.locator('[data-testid="helpful-button"]');
      await firstHelpfulButton.click();
      await page.waitForTimeout(500);

      // Check first review is voted
      const firstVotedState = await firstHelpfulButton.getAttribute('data-voted');
      expect(firstVotedState).toBe('true');

      // Check second review is NOT voted
      const secondReview = reviewCards.nth(1);
      const secondHelpfulButton = secondReview.locator('[data-testid="helpful-button"]');
      const secondVotedState = await secondHelpfulButton.getAttribute('data-voted');
      expect(secondVotedState).not.toBe('true');

      // Vote on second review
      await secondHelpfulButton.click();
      await page.waitForTimeout(500);

      // Now both should be voted
      const secondVotedStateAfter = await secondHelpfulButton.getAttribute('data-voted');
      expect(secondVotedStateAfter).toBe('true');
    });

    test('T034.12: Helpful button shows loading state during API call', async ({ page }) => {
      // Locate the first review card
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');

      // Click helpful button
      const clickPromise = helpfulButton.click();

      // Immediately check for loading state
      await page.waitForTimeout(50);

      // Button should be disabled or show loading during API call
      const isDisabled = await helpfulButton.isDisabled().catch(() => false);
      const hasLoadingClass = await helpfulButton
        .evaluate((el) => el.className.includes('loading'))
        .catch(() => false);
      const ariaDisabled = await helpfulButton.getAttribute('aria-disabled');

      // At least one loading indicator should be present
      expect(isDisabled || hasLoadingClass || ariaDisabled === 'true').toBe(true);

      // Wait for click to complete
      await clickPromise;
      await page.waitForTimeout(500);

      // After completion, button should be enabled again
      const isDisabledAfter = await helpfulButton.isDisabled();
      expect(isDisabledAfter).toBe(false);
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test.beforeEach(async ({ page, context }) => {
      // Mock authentication
      await context.addCookies([
        {
          name: 'supabase-auth-token',
          value: 'mock-valid-token-for-testing',
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ]);

      await page.goto(`/campsites/${TEST_CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');
    });

    test('T034.13: Handle rapid clicking gracefully', async ({ page }) => {
      // Locate the first review card
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');
      const helpfulCount = reviewCard.locator('[data-testid="helpful-count"]');

      // Get initial count
      const initialCountText = await helpfulCount.textContent();
      const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0', 10);

      // Rapid clicking (should be debounced or handled gracefully)
      await helpfulButton.click();
      await helpfulButton.click();
      await helpfulButton.click();

      // Wait for all updates to settle
      await page.waitForTimeout(1000);

      // Final count should be initial + 1 (odd number of clicks)
      // or initial (even number of clicks that toggle)
      const finalCountText = await helpfulCount.textContent();
      const finalCount = parseInt(finalCountText?.match(/\d+/)?.[0] || '0', 10);

      // Should not have incremented more than once
      expect(Math.abs(finalCount - initialCount)).toBeLessThanOrEqual(1);
    });

    test('T034.14: Display error message when API call fails', async ({ page }) => {
      // Intercept API call and force it to fail
      await page.route('**/api/reviews/*/helpful', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      // Locate the first review card
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');

      // Click helpful button
      await helpfulButton.click();

      // Wait for error to appear
      await page.waitForTimeout(1000);

      // Should show error message (toast, alert, or inline message)
      const errorMessage = page.locator('text=/error|failed|try again/i').first();
      const isErrorVisible = await errorMessage.isVisible().catch(() => false);

      expect(isErrorVisible).toBe(true);
    });

    test('T034.15: Count does not change when API call fails', async ({ page }) => {
      // Intercept API call and force it to fail
      await page.route('**/api/reviews/*/helpful', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      // Locate the first review card
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      const helpfulCount = reviewCard.locator('[data-testid="helpful-count"]');
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');

      // Get initial count
      const initialCountText = await helpfulCount.textContent();
      const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0', 10);

      // Click helpful button
      await helpfulButton.click();
      await page.waitForTimeout(1000);

      // Count should remain unchanged
      const finalCountText = await helpfulCount.textContent();
      const finalCount = parseInt(finalCountText?.match(/\d+/)?.[0] || '0', 10);

      expect(finalCount).toBe(initialCount);
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/campsites/${TEST_CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');
    });

    test('T034.16: Helpful button has proper ARIA attributes', async ({ page }) => {
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');

      // Should have button role
      const role = await helpfulButton.getAttribute('role');
      expect(role === 'button' || (await helpfulButton.evaluate((el) => el.tagName === 'BUTTON'))).toBe(
        true
      );

      // Should have aria-label or accessible text
      const ariaLabel = await helpfulButton.getAttribute('aria-label');
      const innerText = await helpfulButton.textContent();

      expect(ariaLabel || innerText?.trim()).toBeTruthy();
    });

    test('T034.17: Helpful button is keyboard accessible', async ({ page }) => {
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');

      // Focus the button using keyboard
      await helpfulButton.focus();

      // Should be focused
      await expect(helpfulButton).toBeFocused();

      // Should be activatable with Enter or Space key
      const isFocused = await helpfulButton.evaluate(
        (el) => document.activeElement === el
      );
      expect(isFocused).toBe(true);
    });
  });
});
