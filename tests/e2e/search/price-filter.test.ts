import { test, expect } from '@playwright/test';

test.describe('E2E: Price Slider Filter Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page before each test
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('price slider has min and max handles', async ({ page }) => {
    // Locate both price range sliders
    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');
    const maxSlider = page.locator('input[type="range"][aria-label="ราคาสูงสุด"]');

    // Verify both sliders are visible
    await expect(minSlider).toBeVisible();
    await expect(maxSlider).toBeVisible();

    // Verify sliders have correct attributes
    await expect(minSlider).toHaveAttribute('type', 'range');
    await expect(maxSlider).toHaveAttribute('type', 'range');

    // Verify sliders have min, max, and step attributes
    await expect(minSlider).toHaveAttribute('min');
    await expect(minSlider).toHaveAttribute('max');
    await expect(minSlider).toHaveAttribute('step');
    await expect(maxSlider).toHaveAttribute('min');
    await expect(maxSlider).toHaveAttribute('max');
    await expect(maxSlider).toHaveAttribute('step');
  });

  test('dragging min handle updates minimum price', async ({ page }) => {
    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');
    const priceDisplay = page.locator('text=/฿/').first();

    // Get initial value
    const initialValue = await minSlider.inputValue();

    // Update min slider to 1000
    await minSlider.fill('1000');

    // Trigger change event (simulate mouse up)
    await minSlider.dispatchEvent('mouseup');

    // Wait for display to update
    await page.waitForTimeout(300);

    // Verify new value
    const newValue = await minSlider.inputValue();
    expect(Number(newValue)).toBe(1000);
    expect(Number(newValue)).toBeGreaterThan(Number(initialValue));

    // Verify price display shows updated value
    await expect(priceDisplay).toContainText('฿1,000');
  });

  test('dragging max handle updates maximum price', async ({ page }) => {
    const maxSlider = page.locator('input[type="range"][aria-label="ราคาสูงสุด"]');
    const priceDisplay = page.locator('.text-gray-700').last();

    // Get initial value
    const initialValue = await maxSlider.inputValue();

    // Update max slider to 5000
    await maxSlider.fill('5000');

    // Trigger change event (simulate mouse up)
    await maxSlider.dispatchEvent('mouseup');

    // Wait for display to update
    await page.waitForTimeout(300);

    // Verify new value
    const newValue = await maxSlider.inputValue();
    expect(Number(newValue)).toBe(5000);
    expect(Number(newValue)).toBeLessThan(Number(initialValue));

    // Verify price display shows updated value
    await expect(priceDisplay).toContainText('฿5,000');
  });

  test('results update after slider change', async ({ page }) => {
    // Wait for initial results to load
    await page.waitForSelector('.campsite-card, article, [data-testid="search-results"]', {
      timeout: 10000,
      state: 'attached',
    });

    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');
    const maxSlider = page.locator('input[type="range"][aria-label="ราคาสูงสุด"]');

    // Set price range
    await minSlider.fill('500');
    await minSlider.dispatchEvent('mouseup');
    await page.waitForTimeout(300);

    await maxSlider.fill('2000');
    await maxSlider.dispatchEvent('mouseup');

    // Wait for results to update
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Verify URL contains price parameters
    const url = page.url();
    expect(url).toContain('minPrice=500');
    expect(url).toContain('maxPrice=2000');

    // Verify results section exists (with or without results)
    const resultsSection = page.locator('.campsite-card, article, [data-testid="search-results"]').first();
    await expect(resultsSection).toBeAttached();
  });

  test('results only show campsites within price range', async ({ page }) => {
    // Set a specific price range
    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');
    const maxSlider = page.locator('input[type="range"][aria-label="ราคาสูงสุด"]');

    await minSlider.fill('1000');
    await minSlider.dispatchEvent('mouseup');
    await page.waitForTimeout(300);

    await maxSlider.fill('2000');
    await maxSlider.dispatchEvent('mouseup');
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Check if there are results
    const campsiteCards = page.locator('.campsite-card, article');
    const resultCount = await campsiteCards.count();

    if (resultCount > 0) {
      // Verify each visible campsite card has price within range
      for (let i = 0; i < Math.min(resultCount, 5); i++) {
        const card = campsiteCards.nth(i);
        const priceText = await card.locator('text=/฿[\\d,]+/').first().textContent();

        if (priceText) {
          // Extract numeric value from price (e.g., "฿1,500/คืน" -> 1500)
          const priceMatch = priceText.match(/฿([\d,]+)/);
          if (priceMatch) {
            const price = Number(priceMatch[1].replace(/,/g, ''));
            expect(price).toBeGreaterThanOrEqual(1000);
            expect(price).toBeLessThanOrEqual(2000);
          }
        }
      }
    } else {
      // If no results, verify "no results" message or empty state
      const noResultsMessage = page.locator('text=/ไม่พบ|no results|not found/i');
      const hasNoResults = (await noResultsMessage.count()) > 0;
      expect(hasNoResults).toBe(true);
    }
  });

  test('quick preset buttons work - budget (under 500)', async ({ page }) => {
    // Find and click budget preset button
    const budgetButton = page.locator('button:has-text("ต่ำกว่า ฿500")');
    await expect(budgetButton).toBeVisible();

    await budgetButton.click();

    // Verify button is highlighted
    await expect(budgetButton).toHaveClass(/bg-green-500/);
    await expect(budgetButton).toHaveClass(/text-white/);

    // Verify sliders are updated
    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');
    const maxSlider = page.locator('input[type="range"][aria-label="ราคาสูงสุด"]');

    await page.waitForTimeout(300);

    expect(await minSlider.inputValue()).toBe('0');
    expect(await maxSlider.inputValue()).toBe('500');

    // Verify URL parameters
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('minPrice=0');
    expect(url).toContain('maxPrice=500');
  });

  test('quick preset buttons work - mid-range (500-1000)', async ({ page }) => {
    // Find and click mid-range preset button
    const midRangeButton = page.locator('button:has-text("฿500-1,000")');
    await expect(midRangeButton).toBeVisible();

    await midRangeButton.click();

    // Verify button is highlighted
    await expect(midRangeButton).toHaveClass(/bg-green-500/);
    await expect(midRangeButton).toHaveClass(/text-white/);

    // Verify sliders are updated
    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');
    const maxSlider = page.locator('input[type="range"][aria-label="ราคาสูงสุด"]');

    await page.waitForTimeout(300);

    expect(await minSlider.inputValue()).toBe('500');
    expect(await maxSlider.inputValue()).toBe('1000');

    // Verify URL parameters
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('minPrice=500');
    expect(url).toContain('maxPrice=1000');
  });

  test('quick preset buttons work - luxury (over 2000)', async ({ page }) => {
    // Find and click luxury preset button
    const luxuryButton = page.locator('button:has-text("มากกว่า ฿2,000")');
    await expect(luxuryButton).toBeVisible();

    await luxuryButton.click();

    // Verify button is highlighted
    await expect(luxuryButton).toHaveClass(/bg-green-500/);
    await expect(luxuryButton).toHaveClass(/text-white/);

    // Verify sliders are updated
    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');
    const maxSlider = page.locator('input[type="range"][aria-label="ราคาสูงสุด"]');

    await page.waitForTimeout(300);

    expect(await minSlider.inputValue()).toBe('2000');
    expect(await maxSlider.inputValue()).toBe('10000');

    // Verify URL parameters
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('minPrice=2000');
    expect(url).toContain('maxPrice=10000');
  });

  test('preset button visual state changes when selected', async ({ page }) => {
    const button1 = page.locator('button:has-text("ต่ำกว่า ฿500")');
    const button2 = page.locator('button:has-text("฿500-1,000")');

    // Initially, buttons should not be highlighted
    await expect(button1).toHaveClass(/bg-gray-100/);
    await expect(button2).toHaveClass(/bg-gray-100/);

    // Click first button
    await button1.click();
    await page.waitForTimeout(200);

    // First button should be highlighted
    await expect(button1).toHaveClass(/bg-green-500/);
    await expect(button1).toHaveClass(/text-white/);

    // Second button should still be unhighlighted
    await expect(button2).toHaveClass(/bg-gray-100/);

    // Click second button
    await button2.click();
    await page.waitForTimeout(200);

    // Second button should now be highlighted
    await expect(button2).toHaveClass(/bg-green-500/);

    // First button should be unhighlighted
    await expect(button1).toHaveClass(/bg-gray-100/);
  });

  test('reset button clears custom price range', async ({ page }) => {
    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');
    const maxSlider = page.locator('input[type="range"][aria-label="ราคาสูงสุด"]');
    const resetButton = page.locator('button:has-text("รีเซ็ต")');

    // Set custom price range
    await minSlider.fill('800');
    await minSlider.dispatchEvent('mouseup');
    await page.waitForTimeout(300);

    await maxSlider.fill('3000');
    await maxSlider.dispatchEvent('mouseup');
    await page.waitForTimeout(300);

    // Reset button should now be visible
    await expect(resetButton).toBeVisible();

    // Click reset
    await resetButton.click();
    await page.waitForTimeout(300);

    // Verify values are reset to defaults (0 and 10000)
    expect(await minSlider.inputValue()).toBe('0');
    expect(await maxSlider.inputValue()).toBe('10000');

    // Reset button should be hidden
    await expect(resetButton).not.toBeVisible();
  });

  test('reset button only appears when price is modified', async ({ page }) => {
    const resetButton = page.locator('button:has-text("รีเซ็ต")');
    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');

    // Initially, reset button should not be visible (default state)
    await expect(resetButton).not.toBeVisible();

    // Modify price
    await minSlider.fill('1000');
    await minSlider.dispatchEvent('mouseup');
    await page.waitForTimeout(300);

    // Reset button should now be visible
    await expect(resetButton).toBeVisible();
  });

  test('price display shows formatted currency', async ({ page }) => {
    // Verify price section header
    const header = page.locator('h3:has-text("ช่วงราคา")');
    await expect(header).toBeVisible();

    // Verify price display contains Thai Baht symbol
    const priceDisplay = page.locator('.text-gray-700');
    const displayText = await priceDisplay.first().textContent();
    expect(displayText).toContain('฿');
  });

  test('all four preset buttons are available', async ({ page }) => {
    // Verify all preset buttons exist
    await expect(page.locator('button:has-text("ต่ำกว่า ฿500")')).toBeVisible();
    await expect(page.locator('button:has-text("฿500-1,000")')).toBeVisible();
    await expect(page.locator('button:has-text("฿1,000-2,000")')).toBeVisible();
    await expect(page.locator('button:has-text("มากกว่า ฿2,000")')).toBeVisible();
  });

  test('min slider cannot exceed max slider', async ({ page }) => {
    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');
    const maxSlider = page.locator('input[type="range"][aria-label="ราคาสูงสุด"]');

    // Set max to 2000
    await maxSlider.fill('2000');
    await maxSlider.dispatchEvent('mouseup');
    await page.waitForTimeout(300);

    // Try to set min above max
    await minSlider.fill('3000');
    await minSlider.dispatchEvent('mouseup');
    await page.waitForTimeout(300);

    // Verify min is constrained to max
    const minValue = await minSlider.inputValue();
    const maxValue = await maxSlider.inputValue();
    expect(Number(minValue)).toBeLessThanOrEqual(Number(maxValue));
  });

  test('max slider cannot go below min slider', async ({ page }) => {
    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');
    const maxSlider = page.locator('input[type="range"][aria-label="ราคาสูงสุด"]');

    // Set min to 1500
    await minSlider.fill('1500');
    await minSlider.dispatchEvent('mouseup');
    await page.waitForTimeout(300);

    // Try to set max below min
    await maxSlider.fill('1000');
    await maxSlider.dispatchEvent('mouseup');
    await page.waitForTimeout(300);

    // Verify max is constrained to min
    const minValue = await minSlider.inputValue();
    const maxValue = await maxSlider.inputValue();
    expect(Number(maxValue)).toBeGreaterThanOrEqual(Number(minValue));
  });

  test('price filter section header is visible', async ({ page }) => {
    const header = page.locator('h3:has-text("ช่วงราคา")');
    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/font-medium/);
  });

  test('slider visual track updates correctly', async ({ page }) => {
    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');
    const maxSlider = page.locator('input[type="range"][aria-label="ราคาสูงสุด"]');
    const activeTrack = page.locator('.bg-green-500').first();

    // Verify active track exists
    await expect(activeTrack).toBeVisible();

    // Change slider values
    await minSlider.fill('1000');
    await maxSlider.fill('5000');
    await page.waitForTimeout(200);

    // Active track should still be visible (visual feedback)
    await expect(activeTrack).toBeVisible();
  });

  test('preset button for 1000-2000 range works', async ({ page }) => {
    const presetButton = page.locator('button:has-text("฿1,000-2,000")');
    await expect(presetButton).toBeVisible();

    await presetButton.click();

    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');
    const maxSlider = page.locator('input[type="range"][aria-label="ราคาสูงสุด"]');

    await page.waitForTimeout(300);

    expect(await minSlider.inputValue()).toBe('1000');
    expect(await maxSlider.inputValue()).toBe('2000');

    await expect(presetButton).toHaveClass(/bg-green-500/);
  });

  test('multiple slider adjustments work correctly', async ({ page }) => {
    const minSlider = page.locator('input[type="range"][aria-label="ราคาต่ำสุด"]');
    const maxSlider = page.locator('input[type="range"][aria-label="ราคาสูงสุด"]');

    // First adjustment
    await minSlider.fill('500');
    await minSlider.dispatchEvent('mouseup');
    await page.waitForTimeout(200);
    expect(await minSlider.inputValue()).toBe('500');

    // Second adjustment
    await maxSlider.fill('3000');
    await maxSlider.dispatchEvent('mouseup');
    await page.waitForTimeout(200);
    expect(await maxSlider.inputValue()).toBe('3000');

    // Third adjustment
    await minSlider.fill('1000');
    await minSlider.dispatchEvent('mouseup');
    await page.waitForTimeout(200);
    expect(await minSlider.inputValue()).toBe('1000');

    // All values should persist
    expect(Number(await minSlider.inputValue())).toBe(1000);
    expect(Number(await maxSlider.inputValue())).toBe(3000);
  });
});
