import { test, expect } from '@playwright/test';

test.describe('Review Helpful Vote Persistence', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authenticated session using new token storage
    const mockToken = 'mock-authenticated-user-token';
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

    // Navigate to a campsite detail page with reviews
    await page.goto('/campsites/test-campsite-1');
    await page.waitForLoadState('networkidle');
  });

  test('T074.1: Vote persists after page refresh', async ({ page }) => {
    // Find the first review with a helpful button
    const helpfulButton = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();

    // Wait for button to be visible
    await expect(helpfulButton).toBeVisible();

    // Get initial count
    const initialText = await helpfulButton.textContent();
    const initialCountMatch = initialText?.match(/\d+/);
    const initialCount = initialCountMatch ? parseInt(initialCountMatch[0]) : 0;

    // Click to vote
    await helpfulButton.click();

    // Wait for update - count should increase by 1
    await page.waitForTimeout(500);

    // Verify button shows voted state (might have different styling or text)
    const votedText = await helpfulButton.textContent();
    const votedCountMatch = votedText?.match(/\d+/);
    const votedCount = votedCountMatch ? parseInt(votedCountMatch[0]) : 0;
    expect(votedCount).toBe(initialCount + 1);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Find the same helpful button after refresh
    const helpfulButtonAfterRefresh = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(helpfulButtonAfterRefresh).toBeVisible();

    // Verify count persists
    const persistedText = await helpfulButtonAfterRefresh.textContent();
    const persistedCountMatch = persistedText?.match(/\d+/);
    const persistedCount = persistedCountMatch ? parseInt(persistedCountMatch[0]) : 0;
    expect(persistedCount).toBe(votedCount);

    // Verify voted state is maintained (button should still show as voted)
    // This could be checked via aria-pressed, data-voted attribute, or class
    const isPressed = await helpfulButtonAfterRefresh.getAttribute('aria-pressed');
    const isVoted = await helpfulButtonAfterRefresh.getAttribute('data-voted');
    const hasVotedClass = await helpfulButtonAfterRefresh.evaluate((el) =>
      el.classList.contains('voted') || el.classList.contains('active')
    );

    // At least one indicator should show voted state
    expect(isPressed === 'true' || isVoted === 'true' || hasVotedClass).toBeTruthy();
  });

  test('T074.2: Vote state shows as voted after refresh', async ({ page }) => {
    // Find helpful button
    const helpfulButton = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(helpfulButton).toBeVisible();

    // Vote on the review
    await helpfulButton.click();
    await page.waitForTimeout(500);

    // Store the review ID or unique identifier
    const reviewId = await helpfulButton.getAttribute('data-review-id');

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Find the button again
    const buttonAfterRefresh = reviewId
      ? page.locator(`[data-review-id="${reviewId}"]`)
      : page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();

    await expect(buttonAfterRefresh).toBeVisible();

    // Check if button shows voted state
    const ariaPressed = await buttonAfterRefresh.getAttribute('aria-pressed');
    const dataVoted = await buttonAfterRefresh.getAttribute('data-voted');

    // Button should indicate it has been voted
    expect(ariaPressed === 'true' || dataVoted === 'true').toBeTruthy();
  });

  test('T074.3: Count is correct after page refresh', async ({ page }) => {
    // Find helpful button and get initial count
    const helpfulButton = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(helpfulButton).toBeVisible();

    const beforeVoteText = await helpfulButton.textContent();
    const beforeVoteMatch = beforeVoteText?.match(/\d+/);
    const beforeVoteCount = beforeVoteMatch ? parseInt(beforeVoteMatch[0]) : 0;

    // Click to vote
    await helpfulButton.click();
    await page.waitForTimeout(500);

    // Get count after voting
    const afterVoteText = await helpfulButton.textContent();
    const afterVoteMatch = afterVoteText?.match(/\d+/);
    const afterVoteCount = afterVoteMatch ? parseInt(afterVoteMatch[0]) : 0;

    // Count should have increased
    expect(afterVoteCount).toBe(beforeVoteCount + 1);

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Get count after refresh
    const buttonAfterRefresh = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(buttonAfterRefresh).toBeVisible();

    const refreshedText = await buttonAfterRefresh.textContent();
    const refreshedMatch = refreshedText?.match(/\d+/);
    const refreshedCount = refreshedMatch ? parseInt(refreshedMatch[0]) : 0;

    // Count should match the voted count
    expect(refreshedCount).toBe(afterVoteCount);
  });

  test('T074.4: Can unvote after page refresh', async ({ page }) => {
    // Vote on a review
    const helpfulButton = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(helpfulButton).toBeVisible();

    await helpfulButton.click();
    await page.waitForTimeout(500);

    // Get count after voting
    const votedText = await helpfulButton.textContent();
    const votedMatch = votedText?.match(/\d+/);
    const votedCount = votedMatch ? parseInt(votedMatch[0]) : 0;

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Find button after refresh
    const buttonAfterRefresh = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(buttonAfterRefresh).toBeVisible();

    // Verify button is in voted state
    const isVotedAfterRefresh = await buttonAfterRefresh.evaluate((el) =>
      el.getAttribute('aria-pressed') === 'true' ||
      el.getAttribute('data-voted') === 'true' ||
      el.classList.contains('voted')
    );
    expect(isVotedAfterRefresh).toBeTruthy();

    // Click again to unvote
    await buttonAfterRefresh.click();
    await page.waitForTimeout(500);

    // Count should decrease by 1
    const unvotedText = await buttonAfterRefresh.textContent();
    const unvotedMatch = unvotedText?.match(/\d+/);
    const unvotedCount = unvotedMatch ? parseInt(unvotedMatch[0]) : 0;
    expect(unvotedCount).toBe(votedCount - 1);

    // Button should show unvoted state
    const isUnvoted = await buttonAfterRefresh.evaluate((el) =>
      el.getAttribute('aria-pressed') === 'false' ||
      el.getAttribute('data-voted') === 'false' ||
      !el.classList.contains('voted')
    );
    expect(isUnvoted).toBeTruthy();
  });

  test('T074.5: Unvote persists after page refresh', async ({ page }) => {
    // Vote on a review
    const helpfulButton = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(helpfulButton).toBeVisible();

    // Vote
    await helpfulButton.click();
    await page.waitForTimeout(500);

    // Refresh to ensure vote is persisted
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Unvote
    const buttonAfterFirstRefresh = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(buttonAfterFirstRefresh).toBeVisible();
    await buttonAfterFirstRefresh.click();
    await page.waitForTimeout(500);

    // Get count after unvoting
    const unvotedText = await buttonAfterFirstRefresh.textContent();
    const unvotedMatch = unvotedText?.match(/\d+/);
    const unvotedCount = unvotedMatch ? parseInt(unvotedMatch[0]) : 0;

    // Verify unvoted state
    const isUnvotedBeforeRefresh = await buttonAfterFirstRefresh.evaluate((el) =>
      el.getAttribute('aria-pressed') === 'false' ||
      el.getAttribute('data-voted') === 'false' ||
      !el.classList.contains('voted')
    );
    expect(isUnvotedBeforeRefresh).toBeTruthy();

    // Refresh page again
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Find button after second refresh
    const buttonAfterSecondRefresh = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(buttonAfterSecondRefresh).toBeVisible();

    // Verify unvoted state persists
    const isUnvotedAfterRefresh = await buttonAfterSecondRefresh.evaluate((el) =>
      el.getAttribute('aria-pressed') === 'false' ||
      el.getAttribute('data-voted') === 'false' ||
      !el.classList.contains('voted')
    );
    expect(isUnvotedAfterRefresh).toBeTruthy();

    // Verify count persists
    const persistedText = await buttonAfterSecondRefresh.textContent();
    const persistedMatch = persistedText?.match(/\d+/);
    const persistedCount = persistedMatch ? parseInt(persistedMatch[0]) : 0;
    expect(persistedCount).toBe(unvotedCount);
  });

  test('T074.6: Multiple votes and refreshes maintain correct state', async ({ page }) => {
    // This test ensures database persistence through multiple vote/unvote cycles with refreshes
    const helpfulButton = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(helpfulButton).toBeVisible();

    // Get initial count
    const initialText = await helpfulButton.textContent();
    const initialMatch = initialText?.match(/\d+/);
    const initialCount = initialMatch ? parseInt(initialMatch[0]) : 0;

    // First vote
    await helpfulButton.click();
    await page.waitForTimeout(500);

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify count increased and persisted
    let button = page.getByRole('button', { name: /helpful|เป็นประโยचน์/i }).first();
    await expect(button).toBeVisible();

    let text = await button.textContent();
    let match = text?.match(/\d+/);
    let count = match ? parseInt(match[0]) : 0;
    expect(count).toBe(initialCount + 1);

    // Unvote
    await button.click();
    await page.waitForTimeout(500);

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify count decreased and persisted
    button = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(button).toBeVisible();

    text = await button.textContent();
    match = text?.match(/\d+/);
    count = match ? parseInt(match[0]) : 0;
    expect(count).toBe(initialCount);

    // Vote again
    await button.click();
    await page.waitForTimeout(500);

    // Final refresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify final state
    button = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(button).toBeVisible();

    text = await button.textContent();
    match = text?.match(/\d+/);
    count = match ? parseInt(match[0]) : 0;
    expect(count).toBe(initialCount + 1);

    // Verify voted state
    const isVoted = await button.evaluate((el) =>
      el.getAttribute('aria-pressed') === 'true' ||
      el.getAttribute('data-voted') === 'true' ||
      el.classList.contains('voted')
    );
    expect(isVoted).toBeTruthy();
  });

  test('T074.7: Vote persistence across browser tabs', async ({ page, context }) => {
    // Vote in first tab
    const helpfulButton = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(helpfulButton).toBeVisible();

    await helpfulButton.click();
    await page.waitForTimeout(500);

    const votedText = await helpfulButton.textContent();
    const votedMatch = votedText?.match(/\d+/);
    const votedCount = votedMatch ? parseInt(votedMatch[0]) : 0;

    // Open same page in new tab
    const newPage = await context.newPage();
    await newPage.goto('/campsites/test-campsite-1');
    await newPage.waitForLoadState('networkidle');

    // Verify vote is visible in new tab
    const buttonInNewTab = newPage.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(buttonInNewTab).toBeVisible();

    const newTabText = await buttonInNewTab.textContent();
    const newTabMatch = newTabText?.match(/\d+/);
    const newTabCount = newTabMatch ? parseInt(newTabMatch[0]) : 0;
    expect(newTabCount).toBe(votedCount);

    // Verify voted state in new tab
    const isVotedInNewTab = await buttonInNewTab.evaluate((el) =>
      el.getAttribute('aria-pressed') === 'true' ||
      el.getAttribute('data-voted') === 'true' ||
      el.classList.contains('voted')
    );
    expect(isVotedInNewTab).toBeTruthy();

    await newPage.close();
  });

  test('T074.8: Vote count consistency after multiple user interactions', async ({ page }) => {
    // Test that the database maintains count consistency
    const helpfulButton = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(helpfulButton).toBeVisible();

    // Perform rapid vote/unvote cycles
    for (let i = 0; i < 3; i++) {
      await helpfulButton.click();
      await page.waitForTimeout(300);
      await helpfulButton.click();
      await page.waitForTimeout(300);
    }

    // Get current state
    const currentText = await helpfulButton.textContent();
    const currentMatch = currentText?.match(/\d+/);
    const currentCount = currentMatch ? parseInt(currentMatch[0]) : 0;

    const isVoted = await helpfulButton.evaluate((el) =>
      el.getAttribute('aria-pressed') === 'true' ||
      el.getAttribute('data-voted') === 'true' ||
      el.classList.contains('voted')
    );

    // Refresh to verify database state
    await page.reload();
    await page.waitForLoadState('networkidle');

    const buttonAfterRefresh = page.getByRole('button', { name: /helpful|เป็นประโยชน์/i }).first();
    await expect(buttonAfterRefresh).toBeVisible();

    const refreshedText = await buttonAfterRefresh.textContent();
    const refreshedMatch = refreshedText?.match(/\d+/);
    const refreshedCount = refreshedMatch ? parseInt(refreshedMatch[0]) : 0;

    // Count should match
    expect(refreshedCount).toBe(currentCount);

    // Voted state should match
    const isVotedAfterRefresh = await buttonAfterRefresh.evaluate((el) =>
      el.getAttribute('aria-pressed') === 'true' ||
      el.getAttribute('data-voted') === 'true' ||
      el.classList.contains('voted')
    );
    expect(isVotedAfterRefresh).toBe(isVoted);
  });
});
