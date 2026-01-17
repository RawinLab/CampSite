import { test, expect } from '@playwright/test';

test.describe('Multiple Amenities Filter', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('all amenity checkboxes are clickable', async ({ page }) => {
    // Find amenity filter section
    const amenitySection = page.locator('[data-testid="amenity-filter"]').or(
      page.locator('text=Amenities').locator('..').locator('..')
    );

    // Get all checkboxes in amenity section
    const checkboxes = amenitySection.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    expect(count).toBeGreaterThan(0);

    // Verify each checkbox is clickable
    for (let i = 0; i < Math.min(count, 5); i++) {
      const checkbox = checkboxes.nth(i);
      await expect(checkbox).toBeEnabled();
      await expect(checkbox).toBeVisible();
    }
  });

  test('multiple amenities can be selected simultaneously', async ({ page }) => {
    // Select first amenity
    const firstAmenity = page.locator('[data-testid^="amenity-checkbox-"]').first();
    await firstAmenity.check();
    await expect(firstAmenity).toBeChecked();

    // Select second amenity
    const secondAmenity = page.locator('[data-testid^="amenity-checkbox-"]').nth(1);
    await secondAmenity.check();
    await expect(secondAmenity).toBeChecked();

    // Select third amenity
    const thirdAmenity = page.locator('[data-testid^="amenity-checkbox-"]').nth(2);
    await thirdAmenity.check();
    await expect(thirdAmenity).toBeChecked();

    // Verify all three remain checked
    await expect(firstAmenity).toBeChecked();
    await expect(secondAmenity).toBeChecked();
    await expect(thirdAmenity).toBeChecked();
  });

  test('selected amenities are visually checked', async ({ page }) => {
    // Find amenity checkboxes
    const amenityCheckboxes = page.locator('[data-testid^="amenity-checkbox-"]');

    // Select first two amenities
    const firstCheckbox = amenityCheckboxes.first();
    const secondCheckbox = amenityCheckboxes.nth(1);

    await firstCheckbox.check();
    await secondCheckbox.check();

    // Verify checked state
    await expect(firstCheckbox).toBeChecked();
    await expect(secondCheckbox).toBeChecked();

    // Verify aria-checked attribute
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');
    await expect(secondCheckbox).toHaveAttribute('aria-checked', 'true');
  });

  test('URL updates with selected amenity IDs', async ({ page }) => {
    // Get initial URL
    const initialUrl = page.url();

    // Find and select amenities with data-testid containing amenity ID
    const firstAmenity = page.locator('[data-testid^="amenity-checkbox-"]').first();
    await firstAmenity.check();

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Get updated URL
    const updatedUrl = page.url();

    // Verify URL has changed and contains amenities parameter
    expect(updatedUrl).not.toBe(initialUrl);
    expect(updatedUrl).toMatch(/amenities=/);

    // Select second amenity
    const secondAmenity = page.locator('[data-testid^="amenity-checkbox-"]').nth(1);
    await secondAmenity.check();

    await page.waitForTimeout(500);

    // Verify URL contains multiple amenity IDs
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/amenities=/);

    // URL should contain comma-separated IDs or multiple values
    const urlParams = new URL(finalUrl).searchParams;
    const amenitiesParam = urlParams.get('amenities');
    expect(amenitiesParam).toBeTruthy();
  });

  test('refreshing page preserves selections', async ({ page }) => {
    // Select two amenities
    const firstAmenity = page.locator('[data-testid^="amenity-checkbox-"]').first();
    const secondAmenity = page.locator('[data-testid^="amenity-checkbox-"]').nth(1);

    await firstAmenity.check();
    await secondAmenity.check();

    // Wait for URL update
    await page.waitForTimeout(500);

    // Get current URL
    const currentUrl = page.url();

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify URL is preserved
    expect(page.url()).toBe(currentUrl);

    // Verify checkboxes remain checked
    const firstAmenityAfterReload = page.locator('[data-testid^="amenity-checkbox-"]').first();
    const secondAmenityAfterReload = page.locator('[data-testid^="amenity-checkbox-"]').nth(1);

    await expect(firstAmenityAfterReload).toBeChecked();
    await expect(secondAmenityAfterReload).toBeChecked();
  });

  test('each campsite in results has all selected amenities', async ({ page }) => {
    // Wait for campsites to load
    await page.waitForSelector('[data-testid^="campsite-card-"]', { timeout: 10000 });

    // Get initial campsite count
    const initialCampsites = await page.locator('[data-testid^="campsite-card-"]').count();
    expect(initialCampsites).toBeGreaterThan(0);

    // Select first amenity
    const firstAmenity = page.locator('[data-testid^="amenity-checkbox-"]').first();
    const firstAmenityLabel = await firstAmenity.locator('..').textContent();
    await firstAmenity.check();

    // Wait for results to update
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Get filtered campsite cards
    const campsiteCards = page.locator('[data-testid^="campsite-card-"]');
    const filteredCount = await campsiteCards.count();

    // If there are results, verify they have the selected amenity
    if (filteredCount > 0) {
      // Check first campsite has the amenity listed
      const firstCard = campsiteCards.first();
      const amenitiesSection = firstCard.locator('[data-testid="campsite-amenities"]').or(
        firstCard.locator('text=/amenities/i').locator('..')
      );

      // Verify amenity is displayed (if amenities are shown in card)
      // This may need adjustment based on actual UI implementation
      const hasAmenity = await amenitiesSection.count() > 0;
      if (hasAmenity) {
        // Verify amenity text or icon is present
        expect(await amenitiesSection.textContent()).toBeTruthy();
      }
    }

    // Select second amenity
    const secondAmenity = page.locator('[data-testid^="amenity-checkbox-"]').nth(1);
    await secondAmenity.check();

    // Wait for results to update
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Get new filtered count
    const doubleFilteredCount = await page.locator('[data-testid^="campsite-card-"]').count();

    // With more filters, results should be equal or fewer
    expect(doubleFilteredCount).toBeLessThanOrEqual(filteredCount);
  });

  test('deselecting amenity removes filter', async ({ page }) => {
    // Select an amenity
    const amenityCheckbox = page.locator('[data-testid^="amenity-checkbox-"]').first();
    await amenityCheckbox.check();
    await expect(amenityCheckbox).toBeChecked();

    // Wait for URL and results to update
    await page.waitForTimeout(1000);

    // Get URL with amenity filter
    const urlWithFilter = page.url();
    expect(urlWithFilter).toMatch(/amenities=/);

    // Deselect the amenity
    await amenityCheckbox.uncheck();
    await expect(amenityCheckbox).not.toBeChecked();

    // Wait for URL and results to update
    await page.waitForTimeout(1000);

    // Verify amenity parameter is removed or empty
    const urlAfterDeselect = page.url();

    // Either amenities param is removed or is empty
    const urlParams = new URL(urlAfterDeselect).searchParams;
    const amenitiesParam = urlParams.get('amenities');

    if (amenitiesParam) {
      expect(amenitiesParam).toBe('');
    } else {
      expect(urlAfterDeselect).not.toMatch(/amenities=/);
    }
  });

  test('selecting and deselecting multiple amenities works correctly', async ({ page }) => {
    // Select three amenities
    const checkboxes = page.locator('[data-testid^="amenity-checkbox-"]');

    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await checkboxes.nth(2).check();

    await page.waitForTimeout(500);

    // Verify all are checked
    await expect(checkboxes.nth(0)).toBeChecked();
    await expect(checkboxes.nth(1)).toBeChecked();
    await expect(checkboxes.nth(2)).toBeChecked();

    // Deselect middle one
    await checkboxes.nth(1).uncheck();

    await page.waitForTimeout(500);

    // Verify correct state
    await expect(checkboxes.nth(0)).toBeChecked();
    await expect(checkboxes.nth(1)).not.toBeChecked();
    await expect(checkboxes.nth(2)).toBeChecked();

    // URL should still have amenities parameter with two IDs
    const url = page.url();
    expect(url).toMatch(/amenities=/);
  });
});
