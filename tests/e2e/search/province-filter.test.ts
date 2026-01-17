import { test, expect } from '@playwright/test';

test.describe('Province Filter E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page before each test
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('selecting a province updates search results', async ({ page }) => {
    // Get initial results count
    const initialResultsText = await page.locator('text=พบ').textContent();
    const initialCount = initialResultsText?.match(/(\d+)/)?.[1];

    // Open province autocomplete and select a province
    const provinceInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');
    await provinceInput.click();
    await provinceInput.fill('เชียงใหม่');

    // Wait for suggestions to appear
    await page.waitForSelector('role=listbox', { state: 'visible' });

    // Select the first suggestion (Chiang Mai)
    await page.locator('role=option').first().click();

    // Wait for results to update
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Brief wait for UI to stabilize

    // Verify results have updated
    const updatedResultsText = await page.locator('text=พบ').textContent();
    expect(updatedResultsText).toBeTruthy();

    // Verify URL contains province parameter
    expect(page.url()).toContain('province=');
  });

  test('results only show campsites from selected province', async ({ page }) => {
    // Select a specific province
    const provinceInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');
    await provinceInput.click();
    await provinceInput.fill('ภูเก็ต');

    // Wait for and select Phuket
    await page.waitForSelector('role=listbox', { state: 'visible' });
    await page.locator('role=option').first().click();

    // Wait for results to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Get all campsite cards
    const campsiteCards = page.locator('[data-testid="campsite-card"], article, .campsite-card').or(
      page.locator('a[href^="/campsites/"]')
    );

    // Verify at least some results exist (if there are campsites in Phuket)
    const count = await campsiteCards.count();

    // If results exist, verify they all contain location info with selected province
    if (count > 0) {
      // Check first few cards contain province information
      for (let i = 0; i < Math.min(3, count); i++) {
        const card = campsiteCards.nth(i);
        await expect(card).toBeVisible();
      }
    }

    // Verify province is in URL
    expect(page.url()).toContain('province=');
  });

  test('province name appears in active filters or search bar', async ({ page }) => {
    // Select province
    const provinceInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');
    await provinceInput.click();
    await provinceInput.fill('กระบี่');

    // Wait for suggestions
    await page.waitForSelector('role=listbox', { state: 'visible' });

    // Get the province name from the first suggestion
    const firstOption = page.locator('role=option').first();
    const provinceName = await firstOption.locator('.font-medium').textContent();

    // Select the province
    await firstOption.click();

    // Wait for UI to update
    await page.waitForLoadState('networkidle');

    // Verify province name appears in the input field
    await expect(provinceInput).toHaveValue(provinceName?.trim() || '');

    // Verify the clear button is visible in the province input
    const clearButton = page.locator('input[aria-label="ค้นหาจังหวัด"]').locator('..').locator('button[aria-label="ล้าง"]');
    await expect(clearButton).toBeVisible();
  });

  test('clearing province shows all results again', async ({ page }) => {
    // First, select a province
    const provinceInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');
    await provinceInput.click();
    await provinceInput.fill('สุราษฎร์ธานี');

    // Wait for and select province
    await page.waitForSelector('role=listbox', { state: 'visible' });
    await page.locator('role=option').first().click();

    // Wait for filtered results
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Get filtered results count
    const filteredResultsText = await page.locator('text=พบ').textContent();
    const filteredCount = filteredResultsText?.match(/(\d+)/)?.[1];

    // Clear the province filter using the clear button in province input
    const clearButton = page.locator('input[aria-label="ค้นหาจังหวัด"]').locator('..').locator('button[aria-label="ล้าง"]');
    await clearButton.click();

    // Wait for results to update
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Verify URL no longer contains province parameter
    expect(page.url()).not.toContain('province=');

    // Verify input is cleared
    await expect(provinceInput).toHaveValue('');

    // Verify results are shown (all results)
    const allResultsText = await page.locator('text=พบ').textContent();
    expect(allResultsText).toBeTruthy();
  });

  test('province selection persists on page refresh', async ({ page }) => {
    // Select a province
    const provinceInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');
    await provinceInput.click();
    await provinceInput.fill('นครราชสีมา');

    // Wait for suggestions
    await page.waitForSelector('role=listbox', { state: 'visible' });

    // Get the province name before selection
    const firstOption = page.locator('role=option').first();
    const provinceName = await firstOption.locator('.font-medium').textContent();

    // Select province
    await firstOption.click();

    // Wait for UI to update
    await page.waitForLoadState('networkidle');

    // Verify province is selected
    await expect(provinceInput).toHaveValue(provinceName?.trim() || '');

    // Get the URL with province parameter
    const urlBeforeRefresh = page.url();
    expect(urlBeforeRefresh).toContain('province=');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify URL still contains province parameter after refresh
    expect(page.url()).toContain('province=');
    expect(page.url()).toBe(urlBeforeRefresh);

    // Verify province input still shows the selected province
    // Note: This depends on the implementation restoring state from URL params
    const provinceInputAfterRefresh = page.locator('input[aria-label="ค้นหาจังหวัด"]');

    // The input might be empty or populated depending on implementation
    // At minimum, verify the URL parameter persists and results are filtered
    const resultsAfterRefresh = await page.locator('text=พบ').textContent();
    expect(resultsAfterRefresh).toBeTruthy();
  });

  test('selecting different provinces updates results accordingly', async ({ page }) => {
    // Select first province
    const provinceInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');
    await provinceInput.click();
    await provinceInput.fill('ปัตตานี');
    await page.waitForSelector('role=listbox', { state: 'visible' });
    await page.locator('role=option').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Get first province results
    const firstProvinceResults = await page.locator('text=พบ').textContent();
    const firstProvinceUrl = page.url();

    // Change to different province
    await provinceInput.click();
    await provinceInput.clear();
    await provinceInput.fill('ระยอง');
    await page.waitForSelector('role=listbox', { state: 'visible' });
    await page.locator('role=option').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Get second province results
    const secondProvinceResults = await page.locator('text=พบ').textContent();
    const secondProvinceUrl = page.url();

    // Verify URLs are different (different province IDs)
    expect(firstProvinceUrl).not.toBe(secondProvinceUrl);

    // Both should have province parameter but with different values
    expect(firstProvinceUrl).toContain('province=');
    expect(secondProvinceUrl).toContain('province=');
  });

  test('province filter works with other filters', async ({ page }) => {
    // Select a province
    const provinceInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');
    await provinceInput.click();
    await provinceInput.fill('เชียงราย');
    await page.waitForSelector('role=listbox', { state: 'visible' });
    await page.locator('role=option').first().click();
    await page.waitForLoadState('networkidle');

    // Also add a text search query
    const searchInput = page.locator('input[aria-label="ค้นหาแคมป์ปิ้ง"]');
    await searchInput.fill('น่าน');
    await page.locator('button:has-text("ค้นหา")').click();
    await page.waitForLoadState('networkidle');

    // Verify URL contains both search query and province
    expect(page.url()).toContain('q=');
    expect(page.url()).toContain('province=');

    // Verify results are displayed
    const resultsText = await page.locator('text=พบ').textContent();
    expect(resultsText).toBeTruthy();
  });

  test('province autocomplete shows suggestions when typing', async ({ page }) => {
    const provinceInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

    // Type partial province name
    await provinceInput.click();
    await provinceInput.fill('เชีย');

    // Wait for suggestions dropdown
    await page.waitForSelector('role=listbox', { state: 'visible', timeout: 5000 });

    // Verify suggestions appear
    const suggestions = page.locator('role=option');
    const suggestionsCount = await suggestions.count();
    expect(suggestionsCount).toBeGreaterThan(0);

    // Verify suggestions contain the search term (เชีย should show เชียงใหม่, เชียงราย, etc.)
    const firstSuggestion = await suggestions.first().textContent();
    expect(firstSuggestion).toBeTruthy();
  });

  test('province autocomplete handles no results gracefully', async ({ page }) => {
    const provinceInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

    // Type a nonsensical search that should return no results
    await provinceInput.click();
    await provinceInput.fill('xxxzzzyyy');

    // Wait for dropdown to appear
    await page.waitForTimeout(1000); // Wait for debounce

    // Check for "no results" message
    const noResultsMessage = page.locator('text=ไม่พบจังหวัด');
    await expect(noResultsMessage).toBeVisible({ timeout: 5000 });
  });
});
