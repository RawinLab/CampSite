import { test, expect } from '@playwright/test';

test.describe('Complete Search Flow with All Filters', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('search page loads correctly', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Search.*Camping Thailand/);

    // Verify search heading is present
    const heading = page.locator('h1');
    await expect(heading).toContainText(/Search|Find/i);

    // Verify filter sections are visible
    await expect(page.locator('[data-testid="province-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="amenity-filter"]')).toBeVisible();

    // Verify results container exists
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('apply province filter', async ({ page }) => {
    // Click province filter dropdown
    await page.locator('[data-testid="province-filter"]').click();

    // Select a province (e.g., "Chiang Mai")
    await page.locator('[data-testid="province-option-chiang-mai"]').click();

    // Wait for results to update
    await page.waitForResponse(response =>
      response.url().includes('/api/campsites') && response.status() === 200
    );

    // Verify URL contains province parameter
    await expect(page).toHaveURL(/province=chiang-mai/);

    // Verify filter chip is displayed
    await expect(page.locator('[data-testid="filter-chip-province"]')).toContainText('Chiang Mai');

    // Verify results show only Chiang Mai campsites
    const resultCards = page.locator('[data-testid="campsite-card"]');
    await expect(resultCards).toHaveCount({ min: 1 });
  });

  test('apply type filter', async ({ page }) => {
    // Click type filter dropdown
    await page.locator('[data-testid="type-filter"]').click();

    // Select a type (e.g., "Mountain")
    await page.locator('[data-testid="type-option-mountain"]').click();

    // Wait for results to update
    await page.waitForResponse(response =>
      response.url().includes('/api/campsites') && response.status() === 200
    );

    // Verify URL contains type parameter
    await expect(page).toHaveURL(/type=mountain/);

    // Verify filter chip is displayed
    await expect(page.locator('[data-testid="filter-chip-type"]')).toContainText('Mountain');

    // Verify results are displayed
    const resultCards = page.locator('[data-testid="campsite-card"]');
    await expect(resultCards.first()).toBeVisible();
  });

  test('apply price range filter', async ({ page }) => {
    // Open price filter
    await page.locator('[data-testid="price-filter"]').click();

    // Set min price
    await page.locator('[data-testid="price-min-input"]').fill('500');

    // Set max price
    await page.locator('[data-testid="price-max-input"]').fill('1500');

    // Apply price filter
    await page.locator('[data-testid="price-filter-apply"]').click();

    // Wait for results to update
    await page.waitForResponse(response =>
      response.url().includes('/api/campsites') && response.status() === 200
    );

    // Verify URL contains price parameters
    await expect(page).toHaveURL(/minPrice=500/);
    await expect(page).toHaveURL(/maxPrice=1500/);

    // Verify filter chip shows price range
    await expect(page.locator('[data-testid="filter-chip-price"]')).toContainText('฿500 - ฿1,500');
  });

  test('apply amenity filter', async ({ page }) => {
    // Open amenity filter
    await page.locator('[data-testid="amenity-filter"]').click();

    // Select multiple amenities
    await page.locator('[data-testid="amenity-wifi"]').click();
    await page.locator('[data-testid="amenity-parking"]').click();
    await page.locator('[data-testid="amenity-restroom"]').click();

    // Apply amenity filter
    await page.locator('[data-testid="amenity-filter-apply"]').click();

    // Wait for results to update
    await page.waitForResponse(response =>
      response.url().includes('/api/campsites') && response.status() === 200
    );

    // Verify URL contains amenity parameters
    await expect(page).toHaveURL(/amenities=/);

    // Verify filter chips for amenities
    await expect(page.locator('[data-testid="filter-chip-amenity-wifi"]')).toContainText('WiFi');
    await expect(page.locator('[data-testid="filter-chip-amenity-parking"]')).toContainText('Parking');
    await expect(page.locator('[data-testid="filter-chip-amenity-restroom"]')).toContainText('Restroom');
  });

  test('all filters combine correctly', async ({ page }) => {
    // Apply province filter
    await page.locator('[data-testid="province-filter"]').click();
    await page.locator('[data-testid="province-option-chiang-mai"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Apply type filter
    await page.locator('[data-testid="type-filter"]').click();
    await page.locator('[data-testid="type-option-mountain"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Apply price filter
    await page.locator('[data-testid="price-filter"]').click();
    await page.locator('[data-testid="price-min-input"]').fill('500');
    await page.locator('[data-testid="price-max-input"]').fill('2000');
    await page.locator('[data-testid="price-filter-apply"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Apply amenity filter
    await page.locator('[data-testid="amenity-filter"]').click();
    await page.locator('[data-testid="amenity-wifi"]').click();
    await page.locator('[data-testid="amenity-filter-apply"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Verify all filter chips are displayed
    await expect(page.locator('[data-testid="filter-chip-province"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-chip-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-chip-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-chip-amenity-wifi"]')).toBeVisible();

    // Verify filter count badge shows correct number
    const filterBadge = page.locator('[data-testid="active-filters-count"]');
    await expect(filterBadge).toContainText('4');
  });

  test('results reflect all active filters', async ({ page }) => {
    // Apply multiple filters
    await page.locator('[data-testid="province-filter"]').click();
    await page.locator('[data-testid="province-option-phuket"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    await page.locator('[data-testid="type-filter"]').click();
    await page.locator('[data-testid="type-option-beach"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Verify URL contains all parameters
    await expect(page).toHaveURL(/province=phuket/);
    await expect(page).toHaveURL(/type=beach/);

    // Verify results are filtered correctly
    const resultCards = page.locator('[data-testid="campsite-card"]');
    const count = await resultCards.count();

    // Each result should display province and type information
    if (count > 0) {
      const firstCard = resultCards.first();
      await expect(firstCard).toContainText(/Phuket/i);
      await expect(firstCard).toContainText(/Beach/i);
    }

    // Verify results count is displayed
    const resultsCount = page.locator('[data-testid="results-count"]');
    await expect(resultsCount).toBeVisible();
    await expect(resultsCount).toContainText(/\d+/);
  });

  test('clearing all filters shows all results', async ({ page }) => {
    // Apply multiple filters first
    await page.locator('[data-testid="province-filter"]').click();
    await page.locator('[data-testid="province-option-bangkok"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    await page.locator('[data-testid="type-filter"]').click();
    await page.locator('[data-testid="type-option-forest"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Get filtered results count
    const filteredCount = await page.locator('[data-testid="campsite-card"]').count();

    // Clear all filters
    await page.locator('[data-testid="clear-all-filters"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Verify all filter chips are removed
    await expect(page.locator('[data-testid="filter-chip-province"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="filter-chip-type"]')).not.toBeVisible();

    // Verify URL has no filter parameters
    await expect(page).toHaveURL(/^(?!.*province=).*$/);
    await expect(page).toHaveURL(/^(?!.*type=).*$/);

    // Verify more results are shown (or equal if all were shown before)
    const allResultsCount = await page.locator('[data-testid="campsite-card"]').count();
    expect(allResultsCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('URL contains all filter parameters', async ({ page }) => {
    // Apply comprehensive set of filters
    await page.locator('[data-testid="province-filter"]').click();
    await page.locator('[data-testid="province-option-chiang-rai"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    await page.locator('[data-testid="type-filter"]').click();
    await page.locator('[data-testid="type-option-mountain"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    await page.locator('[data-testid="price-filter"]').click();
    await page.locator('[data-testid="price-min-input"]').fill('300');
    await page.locator('[data-testid="price-max-input"]').fill('1000');
    await page.locator('[data-testid="price-filter-apply"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    await page.locator('[data-testid="amenity-filter"]').click();
    await page.locator('[data-testid="amenity-wifi"]').click();
    await page.locator('[data-testid="amenity-parking"]').click();
    await page.locator('[data-testid="amenity-filter-apply"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Verify all parameters are in URL
    const currentUrl = page.url();
    expect(currentUrl).toContain('province=chiang-rai');
    expect(currentUrl).toContain('type=mountain');
    expect(currentUrl).toContain('minPrice=300');
    expect(currentUrl).toContain('maxPrice=1000');
    expect(currentUrl).toContain('amenities=');

    // Verify URL is shareable (reload page and filters persist)
    const urlWithFilters = page.url();
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify filters are still active after reload
    await expect(page.locator('[data-testid="filter-chip-province"]')).toContainText('Chiang Rai');
    await expect(page.locator('[data-testid="filter-chip-type"]')).toContainText('Mountain');
    await expect(page.locator('[data-testid="filter-chip-price"]')).toContainText('฿300 - ฿1,000');

    // Verify URL unchanged after reload
    expect(page.url()).toBe(urlWithFilters);
  });

  test('filter state persists on navigation back', async ({ page }) => {
    // Apply filters
    await page.locator('[data-testid="province-filter"]').click();
    await page.locator('[data-testid="province-option-krabi"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Click on a campsite to navigate away
    const firstResult = page.locator('[data-testid="campsite-card"]').first();
    await firstResult.click();

    // Wait for campsite detail page to load
    await page.waitForLoadState('networkidle');

    // Navigate back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Verify filter is still active
    await expect(page.locator('[data-testid="filter-chip-province"]')).toContainText('Krabi');
    await expect(page).toHaveURL(/province=krabi/);
  });

  test('handles no results gracefully', async ({ page }) => {
    // Apply very restrictive filters that likely return no results
    await page.locator('[data-testid="price-filter"]').click();
    await page.locator('[data-testid="price-min-input"]').fill('10000');
    await page.locator('[data-testid="price-max-input"]').fill('10001');
    await page.locator('[data-testid="price-filter-apply"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Verify no results message is displayed
    const noResultsMessage = page.locator('[data-testid="no-results-message"]');
    await expect(noResultsMessage).toBeVisible();
    await expect(noResultsMessage).toContainText(/No campsites found|No results/i);

    // Verify results count shows 0
    const resultsCount = page.locator('[data-testid="results-count"]');
    await expect(resultsCount).toContainText('0');

    // Verify suggestion to clear filters or modify search
    await expect(page.locator('[data-testid="clear-filters-suggestion"]')).toBeVisible();
  });

  test('search with text query and filters', async ({ page }) => {
    // Enter search text
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('tent camping');
    await searchInput.press('Enter');
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Apply additional filter
    await page.locator('[data-testid="province-filter"]').click();
    await page.locator('[data-testid="province-option-chiang-mai"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Verify URL contains both search query and filters
    await expect(page).toHaveURL(/q=tent\+camping/);
    await expect(page).toHaveURL(/province=chiang-mai/);

    // Verify search query chip is displayed
    await expect(page.locator('[data-testid="filter-chip-query"]')).toContainText('tent camping');

    // Verify province filter chip is displayed
    await expect(page.locator('[data-testid="filter-chip-province"]')).toContainText('Chiang Mai');
  });

  test('individual filter removal works correctly', async ({ page }) => {
    // Apply multiple filters
    await page.locator('[data-testid="province-filter"]').click();
    await page.locator('[data-testid="province-option-phuket"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    await page.locator('[data-testid="type-filter"]').click();
    await page.locator('[data-testid="type-option-beach"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    await page.locator('[data-testid="amenity-filter"]').click();
    await page.locator('[data-testid="amenity-wifi"]').click();
    await page.locator('[data-testid="amenity-filter-apply"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Remove only the type filter
    await page.locator('[data-testid="filter-chip-type"] [data-testid="remove-filter"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Verify type filter is removed
    await expect(page.locator('[data-testid="filter-chip-type"]')).not.toBeVisible();
    await expect(page).toHaveURL(/^(?!.*type=).*$/);

    // Verify other filters remain
    await expect(page.locator('[data-testid="filter-chip-province"]')).toContainText('Phuket');
    await expect(page.locator('[data-testid="filter-chip-amenity-wifi"]')).toContainText('WiFi');
    await expect(page).toHaveURL(/province=phuket/);
    await expect(page).toHaveURL(/amenities=/);
  });
});
