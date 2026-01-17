import { test, expect } from '@playwright/test';

test.describe('Campsite Selection for Comparison', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to wishlist page where comparison is available
    await page.goto('/wishlist');
    await page.waitForLoadState('networkidle');
  });

  test('T101.1: Single campsite can be selected with checkbox', async ({ page }) => {
    // Find the first campsite checkbox
    const firstCheckbox = page.locator('[data-testid="compare-checkbox"]').first();

    // Click to select
    await firstCheckbox.click();

    // Verify checkbox is checked
    await expect(firstCheckbox).toBeChecked();

    // Verify selection count updates
    const selectionCount = page.locator('[data-testid="selection-count"]');
    await expect(selectionCount).toContainText('1');
  });

  test('T101.2: Multiple campsites can be selected', async ({ page }) => {
    // Select first two campsites
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Verify both are checked
    await expect(checkboxes.nth(0)).toBeChecked();
    await expect(checkboxes.nth(1)).toBeChecked();

    // Verify selection count shows 2
    const selectionCount = page.locator('[data-testid="selection-count"]');
    await expect(selectionCount).toContainText('2');
  });

  test('T101.3: Campsite can be deselected by unchecking', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');

    // Select and then deselect
    await checkboxes.first().click();
    await expect(checkboxes.first()).toBeChecked();

    await checkboxes.first().click();
    await expect(checkboxes.first()).not.toBeChecked();

    // Verify selection count returns to 0
    const selectionCount = page.locator('[data-testid="selection-count"]');
    await expect(selectionCount).toContainText('0');
  });

  test('T101.4: Selection state persists when scrolling', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');

    // Select first campsite
    await checkboxes.first().click();
    await expect(checkboxes.first()).toBeChecked();

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(200);

    // Scroll back up
    await page.evaluate(() => window.scrollBy(0, -500));
    await page.waitForTimeout(200);

    // Verify selection is still active
    await expect(checkboxes.first()).toBeChecked();
  });

  test('T101.5: Three campsites can be selected', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');

    // Select three campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Verify all are checked
    await expect(checkboxes.nth(0)).toBeChecked();
    await expect(checkboxes.nth(1)).toBeChecked();
    await expect(checkboxes.nth(2)).toBeChecked();

    // Verify selection count shows 3
    const selectionCount = page.locator('[data-testid="selection-count"]');
    await expect(selectionCount).toContainText('3');
  });

  test('T101.6: Selection highlights the campsite card', async ({ page }) => {
    const firstCard = page.locator('[data-testid="campsite-card"]').first();
    const firstCheckbox = page.locator('[data-testid="compare-checkbox"]').first();

    // Get initial card styling
    const initialBorderColor = await firstCard.evaluate((el) =>
      window.getComputedStyle(el).borderColor
    );

    // Select the campsite
    await firstCheckbox.click();

    // Wait for visual update
    await page.waitForTimeout(100);

    // Verify card has selection styling (border color changes or has selected class)
    const selectedBorderColor = await firstCard.evaluate((el) =>
      window.getComputedStyle(el).borderColor
    );

    // Border color should change or card should have selected class
    const hasSelectedClass = await firstCard.evaluate((el) =>
      el.classList.contains('selected') || el.classList.contains('border-primary')
    );

    expect(selectedBorderColor !== initialBorderColor || hasSelectedClass).toBeTruthy();
  });

  test('T101.7: Clear all selections button works', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');

    // Select two campsites
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Click clear all button
    const clearButton = page.locator('[data-testid="clear-selection-btn"]');
    await clearButton.click();

    // Verify all checkboxes are unchecked
    await expect(checkboxes.nth(0)).not.toBeChecked();
    await expect(checkboxes.nth(1)).not.toBeChecked();

    // Verify selection count is 0
    const selectionCount = page.locator('[data-testid="selection-count"]');
    await expect(selectionCount).toContainText('0');
  });

  test('T101.8: Selection count badge displays correctly', async ({ page }) => {
    const checkboxes = page.locator('[data-testid="compare-checkbox"]');
    const selectionCount = page.locator('[data-testid="selection-count"]');

    // Initially should show 0
    await expect(selectionCount).toContainText('0');

    // Select one
    await checkboxes.nth(0).click();
    await expect(selectionCount).toContainText('1');

    // Select second
    await checkboxes.nth(1).click();
    await expect(selectionCount).toContainText('2');

    // Select third
    await checkboxes.nth(2).click();
    await expect(selectionCount).toContainText('3');
  });
});
