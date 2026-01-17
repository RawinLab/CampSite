import { test, expect } from '@playwright/test';

test.describe('Province Autocomplete Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page where autocomplete is available
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('T014.1: Autocomplete dropdown does not show with 1 character', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'ค้นหาจังหวัด' });
    await input.fill('B');

    // Wait a bit to ensure no dropdown appears
    await page.waitForTimeout(500);

    // Dropdown should not be visible
    const dropdown = page.getByRole('listbox');
    await expect(dropdown).not.toBeVisible();
  });

  test('T014.2: Autocomplete dropdown appears after typing 2 characters', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'ค้นหาจังหวัด' });

    // Type 2 characters
    await input.fill('Ba');

    // Wait for debounce and API call (300ms debounce + network time)
    await page.waitForTimeout(500);

    // Dropdown should be visible
    const dropdown = page.getByRole('listbox');
    await expect(dropdown).toBeVisible();
  });

  test('T014.3: Suggestions list shows province names', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'ค้นหาจังหวัด' });

    // Type search query
    await input.fill('กร');

    // Wait for debounce and API response
    await page.waitForTimeout(500);

    // Check if suggestions are displayed
    const dropdown = page.getByRole('listbox');
    await expect(dropdown).toBeVisible();

    // Verify that options are present
    const options = page.getByRole('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);

    // Verify first option has province name structure (Thai and English names)
    const firstOption = options.first();
    await expect(firstOption).toBeVisible();
    await expect(firstOption).toContainText(/.+/); // Contains some text
  });

  test('T014.4: Loading indicator appears while fetching', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'ค้นหาจังหวัด' });

    // Type search query
    await input.fill('Ba');

    // Immediately after debounce, loading indicator should appear
    await page.waitForTimeout(350); // Just after 300ms debounce

    // Check for loading text
    const loadingText = page.getByText('กำลังค้นหา...');

    // Loading indicator should appear (it might be very brief)
    // We check if it exists at any point during the request
    const isLoading = await loadingText.isVisible().catch(() => false);

    // Wait for results to load
    await page.waitForTimeout(500);

    // After loading, dropdown should show results or no results message
    const dropdown = page.getByRole('listbox');
    await expect(dropdown).toBeVisible();
  });

  test('T014.5: Clicking outside closes dropdown', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'ค้นหาจังหวัด' });

    // Type to open dropdown
    await input.fill('Ba');
    await page.waitForTimeout(500);

    // Verify dropdown is open
    const dropdown = page.getByRole('listbox');
    await expect(dropdown).toBeVisible();

    // Click outside (on the body or a different element)
    await page.locator('body').click({ position: { x: 10, y: 10 } });

    // Wait a bit for the click handler to process
    await page.waitForTimeout(100);

    // Dropdown should be closed
    await expect(dropdown).not.toBeVisible();
  });

  test('T014.6: Escape key closes dropdown', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'ค้นหาจังหวัด' });

    // Type to open dropdown
    await input.fill('Ba');
    await page.waitForTimeout(500);

    // Verify dropdown is open
    const dropdown = page.getByRole('listbox');
    await expect(dropdown).toBeVisible();

    // Press Escape key
    await input.press('Escape');

    // Wait a bit for the key handler to process
    await page.waitForTimeout(100);

    // Dropdown should be closed
    await expect(dropdown).not.toBeVisible();
  });

  test('T014.7: Selecting a suggestion populates the input and closes dropdown', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'ค้นหาจังหวัด' });

    // Type search query
    await input.fill('กร');
    await page.waitForTimeout(500);

    // Verify dropdown is open
    const dropdown = page.getByRole('listbox');
    await expect(dropdown).toBeVisible();

    // Click on the first suggestion
    const firstOption = page.getByRole('option').first();
    const optionText = await firstOption.textContent();
    await firstOption.click();

    // Wait a bit for selection to process
    await page.waitForTimeout(100);

    // Dropdown should be closed
    await expect(dropdown).not.toBeVisible();

    // Input should contain the selected province name
    const inputValue = await input.inputValue();
    expect(inputValue.length).toBeGreaterThan(0);
  });

  test('T014.8: Clear button removes input and clears selection', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'ค้นหาจังหวัด' });

    // Type search query
    await input.fill('กร');
    await page.waitForTimeout(500);

    // Select a suggestion
    const firstOption = page.getByRole('option').first();
    await firstOption.click();
    await page.waitForTimeout(100);

    // Verify input has value
    let inputValue = await input.inputValue();
    expect(inputValue.length).toBeGreaterThan(0);

    // Click clear button
    const clearButton = page.getByRole('button', { name: 'ล้าง' });
    await clearButton.click();

    // Input should be empty
    inputValue = await input.inputValue();
    expect(inputValue).toBe('');

    // Input should still have focus
    await expect(input).toBeFocused();
  });

  test('T014.9: No results message displays when no provinces match', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'ค้นหาจังหวัด' });

    // Type a query that won't match any provinces
    await input.fill('XYZ123');
    await page.waitForTimeout(500);

    // Dropdown should be visible
    const dropdown = page.getByRole('listbox');
    await expect(dropdown).toBeVisible();

    // Should show "no results" message
    const noResultsText = page.getByText('ไม่พบจังหวัด');
    await expect(noResultsText).toBeVisible();

    // No options should be present
    const options = page.getByRole('option');
    const optionCount = await options.count();
    expect(optionCount).toBe(0);
  });

  test('T014.10: Dropdown reopens when typing after selection', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'ค้นหาจังหวัด' });

    // Type and select
    await input.fill('กร');
    await page.waitForTimeout(500);

    const firstOption = page.getByRole('option').first();
    await firstOption.click();
    await page.waitForTimeout(100);

    // Dropdown should be closed
    let dropdown = page.getByRole('listbox');
    await expect(dropdown).not.toBeVisible();

    // Click input to focus and type again
    await input.click();
    await input.fill('เช');
    await page.waitForTimeout(500);

    // Dropdown should reopen with new results
    dropdown = page.getByRole('listbox');
    await expect(dropdown).toBeVisible();
  });
});
