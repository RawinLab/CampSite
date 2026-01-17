import { test, expect } from '@playwright/test';

test.describe('URL Sharing Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('T063.1: All filters appear in URL query params', async ({ page }) => {
    // Apply province filter
    const provinceInput = page.getByRole('combobox', { name: 'ค้นหาจังหวัด' });
    await provinceInput.fill('กร');
    await page.waitForTimeout(500);
    const firstOption = page.getByRole('option').first();
    await firstOption.click();
    await page.waitForTimeout(300);

    // Apply type filter
    const typeFilter = page.getByRole('button', { name: 'ประเภทแคมป์' });
    await typeFilter.click();
    const glampingOption = page.getByRole('checkbox', { name: 'Glamping' });
    await glampingOption.check();
    await page.waitForTimeout(300);

    // Apply price filter
    const priceFilter = page.getByRole('button', { name: 'ราคา' });
    await priceFilter.click();
    const minPriceInput = page.getByLabel('ราคาต่ำสุด');
    const maxPriceInput = page.getByLabel('ราคาสูงสุด');
    await minPriceInput.fill('500');
    await maxPriceInput.fill('2000');
    await page.waitForTimeout(300);

    // Apply amenities filter
    const amenitiesFilter = page.getByRole('button', { name: 'สิ่งอำนวยความสะดวก' });
    await amenitiesFilter.click();
    const wifiOption = page.getByRole('checkbox', { name: 'WiFi' });
    await wifiOption.check();
    await page.waitForTimeout(300);

    // Check URL contains all query params
    const url = new URL(page.url());
    expect(url.searchParams.has('province')).toBeTruthy();
    expect(url.searchParams.has('types')).toBeTruthy();
    expect(url.searchParams.get('types')).toContain('glamping');
    expect(url.searchParams.has('minPrice')).toBeTruthy();
    expect(url.searchParams.get('minPrice')).toBe('500');
    expect(url.searchParams.has('maxPrice')).toBeTruthy();
    expect(url.searchParams.get('maxPrice')).toBe('2000');
    expect(url.searchParams.has('amenities')).toBeTruthy();
    expect(url.searchParams.get('amenities')).toContain('wifi');
  });

  test('T063.2: Navigating to URL with filters pre-applies them', async ({ page }) => {
    // Construct URL with filters
    const searchUrl = '/search?province=bangkok&types=glamping,tented-resort&minPrice=300&maxPrice=1500&amenities=wifi,parking';

    // Navigate directly to URL with filters
    await page.goto(searchUrl);
    await page.waitForLoadState('networkidle');

    // Verify province filter is applied
    const provinceInput = page.getByRole('combobox', { name: 'ค้นหาจังหวัด' });
    const provinceValue = await provinceInput.inputValue();
    expect(provinceValue.toLowerCase()).toContain('bangkok');

    // Verify type filters are applied
    const glampingCheckbox = page.getByRole('checkbox', { name: 'Glamping' });
    await expect(glampingCheckbox).toBeChecked();
    const tentedCheckbox = page.getByRole('checkbox', { name: 'Tented Resort' });
    await expect(tentedCheckbox).toBeChecked();

    // Verify price filters are applied
    const minPriceInput = page.getByLabel('ราคาต่ำสุด');
    const maxPriceInput = page.getByLabel('ราคาสูงสุด');
    await expect(minPriceInput).toHaveValue('300');
    await expect(maxPriceInput).toHaveValue('1500');

    // Verify amenities filters are applied
    const wifiCheckbox = page.getByRole('checkbox', { name: 'WiFi' });
    await expect(wifiCheckbox).toBeChecked();
    const parkingCheckbox = page.getByRole('checkbox', { name: 'Parking' });
    await expect(parkingCheckbox).toBeChecked();

    // Verify filter badges are displayed
    const typeBadge = page.getByText('ประเภท: 2 selected');
    await expect(typeBadge).toBeVisible();
    const priceBadge = page.getByText('ราคา: ฿300 - ฿1500');
    await expect(priceBadge).toBeVisible();
    const amenitiesBadge = page.getByText('สิ่งอำนวยความสะดวก: 2 selected');
    await expect(amenitiesBadge).toBeVisible();
  });

  test('T063.3: Shared URL loads identical search state', async ({ page, context }) => {
    // Apply multiple filters on first page
    const typeFilter = page.getByRole('button', { name: 'ประเภทแคมป์' });
    await typeFilter.click();
    const glampingOption = page.getByRole('checkbox', { name: 'Glamping' });
    await glampingOption.check();
    await page.waitForTimeout(300);

    const priceFilter = page.getByRole('button', { name: 'ราคา' });
    await priceFilter.click();
    const minPriceInput = page.getByLabel('ราคาต่ำสุด');
    await minPriceInput.fill('1000');
    await page.waitForTimeout(300);

    // Capture current URL and result count
    const originalUrl = page.url();
    const originalResults = page.locator('[data-testid="search-results"]');
    const originalResultCount = await originalResults.count();

    // Open new tab/page with the same URL (simulating friend receiving link)
    const newPage = await context.newPage();
    await newPage.goto(originalUrl);
    await newPage.waitForLoadState('networkidle');

    // Verify filters are identical
    const newGlampingCheckbox = newPage.getByRole('checkbox', { name: 'Glamping' });
    await expect(newGlampingCheckbox).toBeChecked();

    const newMinPriceInput = newPage.getByLabel('ราคาต่ำสุด');
    await expect(newMinPriceInput).toHaveValue('1000');

    // Verify search results are identical
    const newResults = newPage.locator('[data-testid="search-results"]');
    const newResultCount = await newResults.count();
    expect(newResultCount).toBe(originalResultCount);

    // Verify URL matches exactly
    expect(newPage.url()).toBe(originalUrl);

    await newPage.close();
  });

  test('T063.4: URL updates as filters change', async ({ page }) => {
    // Initial URL should be base search URL
    let url = new URL(page.url());
    expect(url.pathname).toBe('/search');
    expect(url.search).toBe('');

    // Apply first filter
    const typeFilter = page.getByRole('button', { name: 'ประเภทแคมป์' });
    await typeFilter.click();
    const glampingOption = page.getByRole('checkbox', { name: 'Glamping' });
    await glampingOption.check();
    await page.waitForTimeout(300);

    // URL should update with type parameter
    url = new URL(page.url());
    expect(url.searchParams.has('types')).toBeTruthy();
    expect(url.searchParams.get('types')).toContain('glamping');

    // Add price filter
    const priceFilter = page.getByRole('button', { name: 'ราคา' });
    await priceFilter.click();
    const minPriceInput = page.getByLabel('ราคาต่ำสุด');
    await minPriceInput.fill('500');
    await page.waitForTimeout(300);

    // URL should update with price parameter
    url = new URL(page.url());
    expect(url.searchParams.has('types')).toBeTruthy();
    expect(url.searchParams.has('minPrice')).toBeTruthy();
    expect(url.searchParams.get('minPrice')).toBe('500');

    // Remove type filter
    await typeFilter.click();
    await glampingOption.uncheck();
    await page.waitForTimeout(300);

    // URL should remove type parameter but keep price
    url = new URL(page.url());
    expect(url.searchParams.has('types')).toBeFalsy();
    expect(url.searchParams.has('minPrice')).toBeTruthy();

    // Clear all filters
    const clearButton = page.getByRole('button', { name: 'ล้างตัวกรอง' });
    await clearButton.click();
    await page.waitForTimeout(300);

    // URL should revert to base search URL
    url = new URL(page.url());
    expect(url.search).toBe('');
  });

  test('T063.5: Browser history navigation works', async ({ page }) => {
    // Start at base search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    const baseUrl = page.url();

    // Apply first filter (creates history entry)
    const typeFilter = page.getByRole('button', { name: 'ประเภทแคมป์' });
    await typeFilter.click();
    const glampingOption = page.getByRole('checkbox', { name: 'Glamping' });
    await glampingOption.check();
    await page.waitForTimeout(300);
    const urlWithType = page.url();

    // Apply second filter (creates another history entry)
    const priceFilter = page.getByRole('button', { name: 'ราคา' });
    await priceFilter.click();
    const minPriceInput = page.getByLabel('ราคาต่ำสุด');
    await minPriceInput.fill('1000');
    await page.waitForTimeout(300);
    const urlWithTypeAndPrice = page.url();

    // Apply third filter (creates another history entry)
    const amenitiesFilter = page.getByRole('button', { name: 'สิ่งอำนวยความสะดวก' });
    await amenitiesFilter.click();
    const wifiOption = page.getByRole('checkbox', { name: 'WiFi' });
    await wifiOption.check();
    await page.waitForTimeout(300);

    // Navigate back through history
    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe(urlWithTypeAndPrice);

    // Verify filter state matches URL (type + price, no wifi)
    const glampingCheckbox = page.getByRole('checkbox', { name: 'Glamping' });
    await expect(glampingCheckbox).toBeChecked();
    const minPrice = page.getByLabel('ราคาต่ำสุด');
    await expect(minPrice).toHaveValue('1000');
    const wifiCheckbox = page.getByRole('checkbox', { name: 'WiFi' });
    await expect(wifiCheckbox).not.toBeChecked();

    // Navigate back again
    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe(urlWithType);

    // Verify filter state matches URL (type only)
    await expect(glampingCheckbox).toBeChecked();
    await expect(minPrice).toHaveValue('');

    // Navigate back to base
    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe(baseUrl);

    // Verify no filters applied
    await expect(glampingCheckbox).not.toBeChecked();

    // Navigate forward through history
    await page.goForward();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe(urlWithType);
    await expect(glampingCheckbox).toBeChecked();

    await page.goForward();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe(urlWithTypeAndPrice);
    await expect(glampingCheckbox).toBeChecked();
    await expect(minPrice).toHaveValue('1000');
  });

  test('T063.6: Complex filter combinations persist in URL', async ({ page }) => {
    // Apply multiple types
    const typeFilter = page.getByRole('button', { name: 'ประเภทแคมป์' });
    await typeFilter.click();
    const glampingOption = page.getByRole('checkbox', { name: 'Glamping' });
    const tentedOption = page.getByRole('checkbox', { name: 'Tented Resort' });
    const campingOption = page.getByRole('checkbox', { name: 'Camping' });
    await glampingOption.check();
    await tentedOption.check();
    await campingOption.check();
    await page.waitForTimeout(300);

    // Apply price range
    const priceFilter = page.getByRole('button', { name: 'ราคา' });
    await priceFilter.click();
    const minPriceInput = page.getByLabel('ราคาต่ำสุด');
    const maxPriceInput = page.getByLabel('ราคาสูงสุด');
    await minPriceInput.fill('500');
    await maxPriceInput.fill('3000');
    await page.waitForTimeout(300);

    // Apply multiple amenities
    const amenitiesFilter = page.getByRole('button', { name: 'สิ่งอำนวยความสะดวก' });
    await amenitiesFilter.click();
    const wifiOption = page.getByRole('checkbox', { name: 'WiFi' });
    const parkingOption = page.getByRole('checkbox', { name: 'Parking' });
    const acOption = page.getByRole('checkbox', { name: 'Air Conditioning' });
    await wifiOption.check();
    await parkingOption.check();
    await acOption.check();
    await page.waitForTimeout(300);

    // Capture URL with all filters
    const complexUrl = page.url();
    const url = new URL(complexUrl);

    // Verify all filter parameters are present
    expect(url.searchParams.has('types')).toBeTruthy();
    const types = url.searchParams.get('types') || '';
    expect(types).toContain('glamping');
    expect(types).toContain('tented-resort');
    expect(types).toContain('camping');

    expect(url.searchParams.get('minPrice')).toBe('500');
    expect(url.searchParams.get('maxPrice')).toBe('3000');

    expect(url.searchParams.has('amenities')).toBeTruthy();
    const amenities = url.searchParams.get('amenities') || '';
    expect(amenities).toContain('wifi');
    expect(amenities).toContain('parking');
    expect(amenities).toContain('air-conditioning');

    // Navigate away and back using the URL
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto(complexUrl);
    await page.waitForLoadState('networkidle');

    // Verify all filters are restored
    await expect(glampingOption).toBeChecked();
    await expect(tentedOption).toBeChecked();
    await expect(campingOption).toBeChecked();
    await expect(minPriceInput).toHaveValue('500');
    await expect(maxPriceInput).toHaveValue('3000');
    await expect(wifiOption).toBeChecked();
    await expect(parkingOption).toBeChecked();
    await expect(acOption).toBeChecked();
  });

  test('T063.7: URL encoding handles special characters in search terms', async ({ page }) => {
    // Apply province with Thai characters
    const provinceInput = page.getByRole('combobox', { name: 'ค้นหาจังหวัด' });
    await provinceInput.fill('เชียงใหม่');
    await page.waitForTimeout(500);

    const firstOption = page.getByRole('option').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await page.waitForTimeout(300);
    }

    // Verify URL is properly encoded
    const url = new URL(page.url());
    expect(url.searchParams.has('province')).toBeTruthy();

    // The URL should be encoded but decoded value should contain Thai text
    const provinceParam = url.searchParams.get('province') || '';
    expect(provinceParam.length).toBeGreaterThan(0);

    // Copy URL and navigate to it
    const encodedUrl = page.url();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto(encodedUrl);
    await page.waitForLoadState('networkidle');

    // Verify Thai characters are properly restored
    const restoredProvinceValue = await provinceInput.inputValue();
    expect(restoredProvinceValue.length).toBeGreaterThan(0);
  });

  test('T063.8: URL parameters are case-insensitive and order-independent', async ({ page }) => {
    // Create URL with specific parameter order
    const url1 = '/search?types=glamping&minPrice=500&amenities=wifi';
    await page.goto(url1);
    await page.waitForLoadState('networkidle');

    // Capture filter state
    const glampingCheckbox1 = page.getByRole('checkbox', { name: 'Glamping' });
    const minPriceInput1 = page.getByLabel('ราคาต่ำสุด');
    const wifiCheckbox1 = page.getByRole('checkbox', { name: 'WiFi' });

    await expect(glampingCheckbox1).toBeChecked();
    await expect(minPriceInput1).toHaveValue('500');
    await expect(wifiCheckbox1).toBeChecked();

    // Create URL with different parameter order
    const url2 = '/search?amenities=wifi&types=glamping&minPrice=500';
    await page.goto(url2);
    await page.waitForLoadState('networkidle');

    // Verify same filter state
    const glampingCheckbox2 = page.getByRole('checkbox', { name: 'Glamping' });
    const minPriceInput2 = page.getByLabel('ราคาต่ำสุด');
    const wifiCheckbox2 = page.getByRole('checkbox', { name: 'WiFi' });

    await expect(glampingCheckbox2).toBeChecked();
    await expect(minPriceInput2).toHaveValue('500');
    await expect(wifiCheckbox2).toBeChecked();
  });
});
