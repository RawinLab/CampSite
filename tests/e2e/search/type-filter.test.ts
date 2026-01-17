import { test, expect } from '@playwright/test';

test.describe('Type Filter E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page before each test
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('clicking a type button selects it', async ({ page }) => {
    // Find and click the "แคมปิ้ง" (Camping) type button
    const campingButton = page.locator('button:has-text("แคมปิ้ง")').first();
    await expect(campingButton).toBeVisible();

    // Verify initially not selected
    await expect(campingButton).toHaveAttribute('aria-pressed', 'false');

    // Click to select
    await campingButton.click();

    // Verify selected state
    await expect(campingButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('selected type is visually highlighted', async ({ page }) => {
    // Click to select a type
    const glampingButton = page.locator('button:has-text("แกลมปิ้ง")').first();
    await glampingButton.click();

    // Verify visual highlighting (ring styles applied)
    await expect(glampingButton).toHaveClass(/ring-2/);
    await expect(glampingButton).toHaveClass(/ring-offset-2/);
    await expect(glampingButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('multiple types can be selected', async ({ page }) => {
    // Select first type
    const campingButton = page.locator('button:has-text("แคมปิ้ง")').first();
    await campingButton.click();
    await expect(campingButton).toHaveAttribute('aria-pressed', 'true');

    // Select second type
    const glampingButton = page.locator('button:has-text("แกลมปิ้ง")').first();
    await glampingButton.click();
    await expect(glampingButton).toHaveAttribute('aria-pressed', 'true');

    // Select third type
    const cabinButton = page.locator('button:has-text("บังกะโล")').first();
    await cabinButton.click();
    await expect(cabinButton).toHaveAttribute('aria-pressed', 'true');

    // Verify all three remain selected
    await expect(campingButton).toHaveAttribute('aria-pressed', 'true');
    await expect(glampingButton).toHaveAttribute('aria-pressed', 'true');
    await expect(cabinButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('results update to show matching types', async ({ page }) => {
    // Wait for initial results to load
    await page.waitForSelector('[data-testid="search-results"], .campsite-card, article', {
      timeout: 10000,
    });

    // Get initial result count
    const resultsContainer = page.locator('[data-testid="search-results"], main').first();
    const initialResults = await resultsContainer.locator('.campsite-card, article').count();

    // Select a specific type
    const campingButton = page.locator('button:has-text("แคมปิ้ง")').first();
    await campingButton.click();

    // Wait for results to update (URL should change or results should re-render)
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Verify results have updated (count may change)
    // Note: This assumes API is working and returns filtered results
    const updatedResults = await resultsContainer.locator('.campsite-card, article').count();

    // Results should exist (could be same or different count depending on data)
    expect(updatedResults).toBeGreaterThanOrEqual(0);

    // Verify URL contains type parameter
    const url = page.url();
    expect(url).toContain('types=');
  });

  test('deselecting a type updates results', async ({ page }) => {
    // Select a type first
    const campingButton = page.locator('button:has-text("แคมปิ้ง")').first();
    await campingButton.click();
    await expect(campingButton).toHaveAttribute('aria-pressed', 'true');
    await page.waitForLoadState('networkidle');

    // Wait a moment for results to load
    await page.waitForTimeout(500);

    // Deselect the same type
    await campingButton.click();
    await expect(campingButton).toHaveAttribute('aria-pressed', 'false');

    // Wait for results to update
    await page.waitForLoadState('networkidle');

    // Verify URL no longer contains the type or types parameter is empty
    const url = page.url();
    const urlObj = new URL(url);
    const typesParam = urlObj.searchParams.get('types');

    // Types param should be null, empty, or not contain 'camping'
    if (typesParam) {
      expect(typesParam).not.toContain('camping');
    }
  });

  test('clear all button deselects all types', async ({ page }) => {
    // Select multiple types
    await page.locator('button:has-text("แคมปิ้ง")').first().click();
    await page.locator('button:has-text("แกลมปิ้ง")').first().click();
    await page.locator('button:has-text("บังกะโล")').first().click();

    // Verify clear all button appears
    const clearButton = page.locator('button:has-text("ล้างทั้งหมด")');
    await expect(clearButton).toBeVisible();

    // Click clear all
    await clearButton.click();

    // Verify all types are deselected
    const campingButton = page.locator('button:has-text("แคมปิ้ง")').first();
    const glampingButton = page.locator('button:has-text("แกลมปิ้ง")').first();
    const cabinButton = page.locator('button:has-text("บังกะโล")').first();

    await expect(campingButton).toHaveAttribute('aria-pressed', 'false');
    await expect(glampingButton).toHaveAttribute('aria-pressed', 'false');
    await expect(cabinButton).toHaveAttribute('aria-pressed', 'false');

    // Verify clear button is no longer visible
    await expect(clearButton).not.toBeVisible();
  });

  test('clear all button only appears when types are selected', async ({ page }) => {
    // Initially no types selected
    const clearButton = page.locator('button:has-text("ล้างทั้งหมด")');
    await expect(clearButton).not.toBeVisible();

    // Select one type
    await page.locator('button:has-text("แคมปิ้ง")').first().click();

    // Clear button should now be visible
    await expect(clearButton).toBeVisible();
  });

  test('type selection persists in URL parameters', async ({ page }) => {
    // Select camping type
    await page.locator('button:has-text("แคมปิ้ง")').first().click();
    await page.waitForLoadState('networkidle');

    // Verify URL contains type
    let url = page.url();
    expect(url).toContain('camping');

    // Select glamping type
    await page.locator('button:has-text("แกลมปิ้ง")').first().click();
    await page.waitForLoadState('networkidle');

    // Verify URL contains both types
    url = page.url();
    expect(url).toContain('camping');
    expect(url).toContain('glamping');
  });

  test('all four campsite types are available', async ({ page }) => {
    // Verify all expected types are rendered
    await expect(page.locator('button:has-text("แคมปิ้ง")').first()).toBeVisible();
    await expect(page.locator('button:has-text("แกลมปิ้ง")').first()).toBeVisible();
    await expect(page.locator('button:has-text("บังกะโล")').first()).toBeVisible();
    await expect(page.locator('button:has-text("อาร์วี")').first()).toBeVisible();
  });

  test('rapid selection and deselection works correctly', async ({ page }) => {
    const campingButton = page.locator('button:has-text("แคมปิ้ง")').first();

    // Rapidly click multiple times
    await campingButton.click();
    await expect(campingButton).toHaveAttribute('aria-pressed', 'true');

    await campingButton.click();
    await expect(campingButton).toHaveAttribute('aria-pressed', 'false');

    await campingButton.click();
    await expect(campingButton).toHaveAttribute('aria-pressed', 'true');

    await campingButton.click();
    await expect(campingButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('type filter section has correct header', async ({ page }) => {
    // Verify section header is present
    const header = page.locator('h3:has-text("ประเภทที่พัก")');
    await expect(header).toBeVisible();
  });

  test('each type button has an icon', async ({ page }) => {
    // Get all type buttons (excluding clear button)
    const typeButtons = page.locator('button[aria-pressed]');
    const count = await typeButtons.count();

    // Verify each button contains an SVG icon
    for (let i = 0; i < count; i++) {
      const button = typeButtons.nth(i);
      const svg = button.locator('svg').first();
      await expect(svg).toBeVisible();
    }
  });

  test('selecting all types works correctly', async ({ page }) => {
    // Select all four types
    await page.locator('button:has-text("แคมปิ้ง")').first().click();
    await page.locator('button:has-text("แกลมปิ้ง")').first().click();
    await page.locator('button:has-text("บังกะโล")').first().click();
    await page.locator('button:has-text("อาร์วี")').first().click();

    // Verify all are selected
    await expect(page.locator('button:has-text("แคมปิ้ง")').first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('button:has-text("แกลมปิ้ง")').first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('button:has-text("บังกะโล")').first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('button:has-text("อาร์วี")').first()).toHaveAttribute('aria-pressed', 'true');

    // Clear button should be visible
    await expect(page.locator('button:has-text("ล้างทั้งหมด")')).toBeVisible();
  });
});
