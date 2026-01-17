import { test, expect } from '@playwright/test';

test.describe('Type Filter URL Synchronization', () => {
  const SEARCH_URL = '/search';
  const CAMPSITE_TYPES = ['camping', 'glamping', 'tented-resort', 'bungalow', 'cabin', 'rv-caravan'];

  test.beforeEach(async ({ page }) => {
    await page.goto(SEARCH_URL);
    await page.waitForLoadState('networkidle');
  });

  test('selecting a single type updates URL query param', async ({ page }) => {
    // Find and click the first campsite type checkbox
    const typeCheckbox = page.locator(`input[type="checkbox"][value="${CAMPSITE_TYPES[0]}"]`).first();
    await typeCheckbox.check();

    // Wait for URL to update
    await page.waitForURL(`**?*types=${CAMPSITE_TYPES[0]}*`);

    // Verify URL contains the selected type
    const url = new URL(page.url());
    expect(url.searchParams.get('types')).toBe(CAMPSITE_TYPES[0]);

    // Verify checkbox is checked
    await expect(typeCheckbox).toBeChecked();
  });

  test('selecting multiple types appear in URL comma-separated', async ({ page }) => {
    // Select first type
    const firstTypeCheckbox = page.locator(`input[type="checkbox"][value="${CAMPSITE_TYPES[0]}"]`).first();
    await firstTypeCheckbox.check();
    await page.waitForURL(`**?*types=${CAMPSITE_TYPES[0]}*`);

    // Select second type
    const secondTypeCheckbox = page.locator(`input[type="checkbox"][value="${CAMPSITE_TYPES[1]}"]`).first();
    await secondTypeCheckbox.check();

    // Wait for URL to update with both types
    await page.waitForTimeout(500); // Allow for URL update

    // Verify URL contains both types comma-separated
    const url = new URL(page.url());
    const typesParam = url.searchParams.get('types');
    expect(typesParam).toBeTruthy();

    const selectedTypes = typesParam!.split(',');
    expect(selectedTypes).toHaveLength(2);
    expect(selectedTypes).toContain(CAMPSITE_TYPES[0]);
    expect(selectedTypes).toContain(CAMPSITE_TYPES[1]);

    // Verify both checkboxes are checked
    await expect(firstTypeCheckbox).toBeChecked();
    await expect(secondTypeCheckbox).toBeChecked();
  });

  test('navigating to URL with types pre-selects them', async ({ page }) => {
    // Navigate directly to URL with types parameter
    const selectedTypes = [CAMPSITE_TYPES[0], CAMPSITE_TYPES[2]];
    const typesParam = selectedTypes.join(',');
    await page.goto(`${SEARCH_URL}?types=${typesParam}`);
    await page.waitForLoadState('networkidle');

    // Verify checkboxes are pre-selected
    for (const type of selectedTypes) {
      const checkbox = page.locator(`input[type="checkbox"][value="${type}"]`).first();
      await expect(checkbox).toBeChecked();
    }

    // Verify URL still contains the types
    const url = new URL(page.url());
    expect(url.searchParams.get('types')).toBe(typesParam);
  });

  test('sharing URL loads same filter state', async ({ page }) => {
    // Select multiple types
    const selectedTypes = [CAMPSITE_TYPES[1], CAMPSITE_TYPES[3], CAMPSITE_TYPES[4]];

    for (const type of selectedTypes) {
      const checkbox = page.locator(`input[type="checkbox"][value="${type}"]`).first();
      await checkbox.check();
      await page.waitForTimeout(200); // Allow for state update
    }

    // Get the current URL
    const shareableUrl = page.url();

    // Open the URL in a new context (simulating sharing)
    const newContext = await page.context().browser()!.newContext();
    const newPage = await newContext.newPage();
    await newPage.goto(shareableUrl);
    await newPage.waitForLoadState('networkidle');

    // Verify all selected types are checked in the new page
    for (const type of selectedTypes) {
      const checkbox = newPage.locator(`input[type="checkbox"][value="${type}"]`).first();
      await expect(checkbox).toBeChecked();
    }

    // Verify URL matches
    expect(newPage.url()).toBe(shareableUrl);

    await newContext.close();
  });

  test('browser back button restores previous selection', async ({ page }) => {
    // Initial state: no types selected
    const initialUrl = page.url();

    // Select first type
    const firstTypeCheckbox = page.locator(`input[type="checkbox"][value="${CAMPSITE_TYPES[0]}"]`).first();
    await firstTypeCheckbox.check();
    await page.waitForURL(`**?*types=${CAMPSITE_TYPES[0]}*`);
    const urlAfterFirstSelection = page.url();

    // Select second type
    const secondTypeCheckbox = page.locator(`input[type="checkbox"][value="${CAMPSITE_TYPES[1]}"]`).first();
    await secondTypeCheckbox.check();
    await page.waitForTimeout(500);
    const urlAfterSecondSelection = page.url();

    // Verify both are checked
    await expect(firstTypeCheckbox).toBeChecked();
    await expect(secondTypeCheckbox).toBeChecked();

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Verify we're at the first selection URL
    expect(page.url()).toBe(urlAfterFirstSelection);

    // Verify only first type is checked
    await expect(firstTypeCheckbox).toBeChecked();
    await expect(secondTypeCheckbox).not.toBeChecked();

    // Go back again
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Verify we're at the initial URL
    expect(page.url()).toBe(initialUrl);

    // Verify no types are checked
    await expect(firstTypeCheckbox).not.toBeChecked();
    await expect(secondTypeCheckbox).not.toBeChecked();

    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');

    // Verify first type is checked again
    await expect(firstTypeCheckbox).toBeChecked();
    await expect(secondTypeCheckbox).not.toBeChecked();
  });

  test('deselecting a type removes it from URL', async ({ page }) => {
    // Select two types
    const firstTypeCheckbox = page.locator(`input[type="checkbox"][value="${CAMPSITE_TYPES[0]}"]`).first();
    const secondTypeCheckbox = page.locator(`input[type="checkbox"][value="${CAMPSITE_TYPES[1]}"]`).first();

    await firstTypeCheckbox.check();
    await secondTypeCheckbox.check();
    await page.waitForTimeout(500);

    // Verify both are in URL
    let url = new URL(page.url());
    let typesParam = url.searchParams.get('types');
    expect(typesParam).toContain(CAMPSITE_TYPES[0]);
    expect(typesParam).toContain(CAMPSITE_TYPES[1]);

    // Deselect first type
    await firstTypeCheckbox.uncheck();
    await page.waitForTimeout(500);

    // Verify only second type remains in URL
    url = new URL(page.url());
    typesParam = url.searchParams.get('types');
    expect(typesParam).toBe(CAMPSITE_TYPES[1]);

    // Deselect second type
    await secondTypeCheckbox.uncheck();
    await page.waitForTimeout(500);

    // Verify types parameter is removed from URL
    url = new URL(page.url());
    expect(url.searchParams.has('types')).toBe(false);
  });

  test('URL parameters persist when selecting types', async ({ page }) => {
    // Navigate with existing query parameters
    await page.goto(`${SEARCH_URL}?q=mountain&sort=price_asc&page=2`);
    await page.waitForLoadState('networkidle');

    // Select a type
    const typeCheckbox = page.locator(`input[type="checkbox"][value="${CAMPSITE_TYPES[0]}"]`).first();
    await typeCheckbox.check();
    await page.waitForTimeout(500);

    // Verify URL contains both original and new parameters
    const url = new URL(page.url());
    expect(url.searchParams.get('q')).toBe('mountain');
    expect(url.searchParams.get('sort')).toBe('price_asc');
    expect(url.searchParams.get('types')).toBe(CAMPSITE_TYPES[0]);
    // Note: page should reset to 1 when filters change
    expect(url.searchParams.get('page')).toBe('1');
  });

  test('types parameter handles URL encoding correctly', async ({ page }) => {
    // Navigate to URL with comma-separated types
    const types = [CAMPSITE_TYPES[0], CAMPSITE_TYPES[2], CAMPSITE_TYPES[4]];
    const typesParam = types.join(',');
    await page.goto(`${SEARCH_URL}?types=${encodeURIComponent(typesParam)}`);
    await page.waitForLoadState('networkidle');

    // Verify all types are selected
    for (const type of types) {
      const checkbox = page.locator(`input[type="checkbox"][value="${type}"]`).first();
      await expect(checkbox).toBeChecked();
    }

    // Verify URL is properly formatted
    const url = new URL(page.url());
    const decodedTypes = url.searchParams.get('types');
    expect(decodedTypes).toBe(typesParam);
  });

  test('invalid type in URL is ignored gracefully', async ({ page }) => {
    // Navigate with invalid type
    await page.goto(`${SEARCH_URL}?types=invalid-type,${CAMPSITE_TYPES[0]}`);
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();

    // Valid type should still be selectable/selected if component handles it
    const validCheckbox = page.locator(`input[type="checkbox"][value="${CAMPSITE_TYPES[0]}"]`).first();
    if (await validCheckbox.count() > 0) {
      // If checkbox exists, it may or may not be checked depending on implementation
      // The test verifies the page doesn't crash
      await expect(validCheckbox).toBeVisible();
    }
  });
});
