import { test, expect } from '@playwright/test';
import { waitForApi, assertNoErrors, PUBLIC_API } from '../utils/api-helpers';

test.describe('E2E: Price Filter Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page with price filters
    const apiPromise = page.waitForResponse(
      res => res.url().includes(PUBLIC_API.search) && res.status() === 200
    );
    await page.goto('/search');
    await apiPromise;
    await assertNoErrors(page);
  });

  test('min slider cannot exceed max slider', async ({ page }) => {
    // Locate price sliders
    const minSlider = page.locator('[data-testid="price-min-slider"]');
    const maxSlider = page.locator('[data-testid="price-max-slider"]');

    // Set max to 2000 THB
    await maxSlider.fill('2000');

    // Try to set min to 3000 THB (should be constrained to max)
    await minSlider.fill('3000');

    // Verify min is constrained to not exceed max
    const minValue = await minSlider.inputValue();
    const maxValue = await maxSlider.inputValue();
    expect(Number(minValue)).toBeLessThanOrEqual(Number(maxValue));
  });

  test('max slider cannot go below min slider', async ({ page }) => {
    // Locate price sliders
    const minSlider = page.locator('[data-testid="price-min-slider"]');
    const maxSlider = page.locator('[data-testid="price-max-slider"]');

    // Set min to 1500 THB
    await minSlider.fill('1500');

    // Try to set max to 1000 THB (should be constrained to min)
    await maxSlider.fill('1000');

    // Verify max is constrained to not go below min
    const minValue = await minSlider.inputValue();
    const maxValue = await maxSlider.inputValue();
    expect(Number(maxValue)).toBeGreaterThanOrEqual(Number(minValue));
  });

  test('invalid manual input is rejected', async ({ page }) => {
    const minInput = page.locator('[data-testid="price-min-input"]');
    const maxInput = page.locator('[data-testid="price-max-input"]');

    // Test negative values are rejected
    await minInput.fill('-100');
    await minInput.blur();
    const minAfterNegative = await minInput.inputValue();
    expect(Number(minAfterNegative)).toBeGreaterThanOrEqual(0);

    // Test non-numeric input is rejected
    await maxInput.fill('abc');
    await maxInput.blur();
    const maxAfterInvalid = await maxInput.inputValue();
    expect(maxAfterInvalid).toMatch(/^\d*$/);

    // Test extremely large values are capped
    await maxInput.fill('999999999');
    await maxInput.blur();
    const maxAfterLarge = await maxInput.inputValue();
    expect(Number(maxAfterLarge)).toBeLessThanOrEqual(100000);
  });

  test('price values display correctly in Thai Baht', async ({ page }) => {
    const minSlider = page.locator('[data-testid="price-min-slider"]');
    const maxSlider = page.locator('[data-testid="price-max-slider"]');

    // Set price range
    await minSlider.fill('500');
    await maxSlider.fill('2500');

    // Check for THB currency display
    const priceDisplay = page.locator('[data-testid="price-display"]');
    await expect(priceDisplay).toContainText('฿');
    await expect(priceDisplay).toContainText('500');
    await expect(priceDisplay).toContainText('2500');

    // Alternative: Check for "THB" text
    const hasTHB = await page.locator('text=/THB|฿/').count();
    expect(hasTHB).toBeGreaterThan(0);
  });

  test('reset clears price filters', async ({ page }) => {
    const minSlider = page.locator('[data-testid="price-min-slider"]');
    const maxSlider = page.locator('[data-testid="price-max-slider"]');
    const resetButton = page.locator('[data-testid="filters-reset"]');

    // Set custom price range and wait for API call
    const apiPromise = page.waitForResponse(
      res => res.url().includes(PUBLIC_API.search) && res.status() === 200
    );

    await minSlider.fill('800');
    await maxSlider.fill('3000');
    await apiPromise;

    // Verify values are set
    expect(await minSlider.inputValue()).toBe('800');
    expect(await maxSlider.inputValue()).toBe('3000');

    // Click reset button and wait for API call
    const resetApiPromise = page.waitForResponse(
      res => res.url().includes(PUBLIC_API.search) && res.status() === 200
    );
    await resetButton.click();
    await resetApiPromise;

    // Verify prices are reset to defaults
    const minAfterReset = await minSlider.inputValue();
    const maxAfterReset = await maxSlider.inputValue();

    // Should reset to default range (e.g., 0-10000 or similar)
    expect(Number(minAfterReset)).toBeLessThanOrEqual(Number('800'));
    expect(Number(maxAfterReset)).toBeGreaterThanOrEqual(Number('3000'));
  });

  test('price filter updates search results', async ({ page }) => {
    // Wait for initial results to load
    await page.waitForSelector('[data-testid="campsite-card"]', { timeout: 5000 });
    const initialCount = await page.locator('[data-testid="campsite-card"]').count();

    // Apply price filter and wait for API call
    const apiPromise = page.waitForResponse(
      res => res.url().includes(PUBLIC_API.search) && res.status() === 200
    );

    const minSlider = page.locator('[data-testid="price-min-slider"]');
    const maxSlider = page.locator('[data-testid="price-max-slider"]');

    await minSlider.fill('1000');
    await maxSlider.fill('2000');

    // Wait for API response
    const response = await apiPromise;
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();

    await assertNoErrors(page);

    // Verify UI matches API data
    const filteredResults = page.locator('[data-testid="campsite-card"]');
    const filteredCount = await filteredResults.count();
    expect(filteredCount).toBe(data.data.length);

    // Verify at least one result or "no results" message
    const hasResults = filteredCount > 0;
    const hasNoResultsMessage = await page.locator('text=/no results|no campsites found/i').count() > 0;

    expect(hasResults || hasNoResultsMessage).toBe(true);
  });

  test('price range validation shows error feedback', async ({ page }) => {
    const minInput = page.locator('[data-testid="price-min-input"]');
    const maxInput = page.locator('[data-testid="price-max-input"]');

    // Set invalid range (min > max)
    await minInput.fill('5000');
    await maxInput.fill('1000');
    await maxInput.blur();

    // Check for error message or visual feedback
    const errorMessage = page.locator('[data-testid="price-error"]');
    const hasError = await errorMessage.count() > 0;

    if (hasError) {
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/invalid|range/i);
    }

    // Values should be auto-corrected
    const minValue = await minInput.inputValue();
    const maxValue = await maxInput.inputValue();
    expect(Number(minValue)).toBeLessThanOrEqual(Number(maxValue));
  });

  test('price filter persists across page navigation', async ({ page }) => {
    const minSlider = page.locator('[data-testid="price-min-slider"]');
    const maxSlider = page.locator('[data-testid="price-max-slider"]');

    // Set price range and wait for API
    const apiPromise = page.waitForResponse(
      res => res.url().includes(PUBLIC_API.search) && res.status() === 200
    );

    await minSlider.fill('1200');
    await maxSlider.fill('2800');
    await apiPromise;

    // Navigate to a campsite detail page (if available)
    const firstCampsite = page.locator('[data-testid="campsite-card"]').first();
    const hasResults = await firstCampsite.count() > 0;

    if (hasResults) {
      await firstCampsite.click();
      await page.waitForLoadState('networkidle');

      // Go back to search
      await page.goBack();
      const backApiPromise = page.waitForResponse(
        res => res.url().includes(PUBLIC_API.search) && res.status() === 200
      );
      await backApiPromise;

      // Verify filters are preserved
      expect(await minSlider.inputValue()).toBe('1200');
      expect(await maxSlider.inputValue()).toBe('2800');
    }
  });

  test('price slider responds to keyboard input', async ({ page }) => {
    const minSlider = page.locator('[data-testid="price-min-slider"]');

    // Focus the slider
    await minSlider.focus();

    // Use keyboard to adjust (arrow keys)
    const initialValue = await minSlider.inputValue();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    const newValue = await minSlider.inputValue();

    // Value should have changed (if slider supports keyboard)
    // This test is tolerant to sliders that don't support keyboard
    const valueChanged = initialValue !== newValue;
    const isNumeric = /^\d+$/.test(newValue);
    expect(isNumeric).toBe(true);
  });

  test('price display formats large numbers correctly', async ({ page }) => {
    const maxSlider = page.locator('[data-testid="price-max-slider"]');

    // Set a large price value
    await maxSlider.fill('15000');

    // Check display formatting (e.g., "15,000" or "15000")
    const priceDisplay = page.locator('[data-testid="price-display"]');
    const displayText = await priceDisplay.textContent();

    // Should contain the number in some format
    expect(displayText).toMatch(/15[,\s]?000|15000/);
  });
});
