import { test, expect } from '@playwright/test';

test.describe('Maximum Selection Limit (3 Campsites)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');
  });

  test('T103.1: Fourth checkbox becomes disabled after selecting 3', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');

    // Select first three campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Wait for state update
    await page.waitForTimeout(200);

    // Fourth checkbox should be disabled
    await expect(checkboxes.nth(3)).toBeDisabled();
  });

  test('T103.2: Warning message appears when trying to select 4th item', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');

    // Select first three campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Try to click fourth checkbox (might be disabled, but try the card or label)
    const fourthCard = page.locator('[data-testid="campsite-card"]').nth(3);
    await fourthCard.click();

    // Warning message should appear
    const warningMessage = page.locator('[data-testid="max-selection-warning"]');
    await expect(warningMessage).toBeVisible();
    await expect(warningMessage).toContainText(/maximum.*3|สูงสุด.*3|เปรียบเทียบได้สูงสุด/i);
  });

  test('T103.3: Warning message contains helpful text', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');

    // Select three campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Try to select another
    const fourthCard = page.locator('[data-testid="campsite-card"]').nth(3);
    await fourthCard.click();

    // Check warning message content
    const warningMessage = page.locator('[data-testid="max-selection-warning"]');
    await expect(warningMessage).toBeVisible();

    // Should explain the limitation
    const messageText = await warningMessage.textContent();
    expect(messageText?.toLowerCase()).toMatch(/3|three|deselect|ยกเลิก/);
  });

  test('T103.4: Warning toast appears with max selection message', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');

    // Select three campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Try to click disabled checkbox or card
    const fourthCheckbox = checkboxes.nth(3);
    await fourthCheckbox.click({ force: true });

    // Toast notification should appear
    const toast = page.locator('[role="alert"], [data-testid="toast"]').filter({ hasText: /maximum|สูงสุด|3/ });
    await expect(toast.first()).toBeVisible({ timeout: 2000 });
  });

  test('T103.5: Can select 4th item after deselecting one', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');

    // Select first three
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Verify fourth is disabled
    await expect(checkboxes.nth(3)).toBeDisabled();

    // Deselect second item
    await checkboxes.nth(1).click();
    await page.waitForTimeout(200);

    // Fourth checkbox should now be enabled
    await expect(checkboxes.nth(3)).toBeEnabled();

    // Should be able to select it
    await checkboxes.nth(3).click();
    await expect(checkboxes.nth(3)).toBeChecked();
  });

  test('T103.6: All unselected checkboxes disabled when 3 selected', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    const totalCheckboxes = await checkboxes.count();

    // Select first three
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    await page.waitForTimeout(200);

    // Check all unselected checkboxes are disabled
    for (let i = 3; i < Math.min(totalCheckboxes, 6); i++) {
      await expect(checkboxes.nth(i)).toBeDisabled();
    }
  });

  test('T103.7: Visual indicator shows maximum selections reached', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    const compareBar = page.locator('[data-testid="compare-bar"]');

    // Select three campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Compare bar should indicate max reached
    await expect(compareBar).toBeVisible();

    // Look for max indicator (text or badge)
    const hasMaxIndicator = await compareBar.evaluate((el) => {
      const text = el.textContent || '';
      return text.includes('3/3') || text.includes('สูงสุด') || text.includes('max');
    });

    expect(hasMaxIndicator).toBeTruthy();
  });

  test('T103.8: Warning message auto-dismisses after few seconds', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');

    // Select three campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Trigger warning
    const fourthCard = page.locator('[data-testid="campsite-card"]').nth(3);
    await fourthCard.click();

    // Warning should appear
    const toast = page.locator('[role="alert"], [data-testid="toast"]').filter({ hasText: /maximum|สูงสุด/ });
    await expect(toast.first()).toBeVisible();

    // Wait for auto-dismiss (usually 3-5 seconds)
    await page.waitForTimeout(6000);

    // Toast should be gone
    await expect(toast.first()).not.toBeVisible();
  });

  test('T103.9: Selection count shows 3/3 when maximum reached', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    const selectionCount = page.locator('[data-testid="selection-count"]');

    // Select three campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Count should show 3
    await expect(selectionCount).toContainText('3');
  });

  test('T103.10: Cannot programmatically add 4th item via selection', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');

    // Select three campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Try to force-click the fourth checkbox
    await checkboxes.nth(3).click({ force: true });

    // Should still only have 3 selected
    const checkedCount = await page.locator('[data-testid="compare-checkbox"]:checked').count();
    expect(checkedCount).toBe(3);

    // Fourth should not be checked
    await expect(checkboxes.nth(3)).not.toBeChecked();
  });
});
