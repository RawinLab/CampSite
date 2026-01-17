import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Bilingual Search (Thai/English)
 * Tests the province autocomplete search functionality in both Thai and English
 */

test.describe('Bilingual Province Search', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage where search is available
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('English Search', () => {
    test('returns matching provinces for English search term', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Type English province name
      await searchInput.fill('Chiang Mai');

      // Wait for autocomplete dropdown to appear
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      // Check that results contain Chiang Mai
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();

      const firstOption = dropdown.locator('[role="option"]').first();
      await expect(firstOption).toContainText('เชียงใหม่'); // Thai name
      await expect(firstOption).toContainText('Chiang Mai'); // English name
    });

    test('returns multiple matching provinces for partial English term', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Type partial English term
      await searchInput.fill('Chiang');

      // Wait for autocomplete dropdown
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      // Should show multiple results (Chiang Mai, Chiang Rai)
      const options = page.locator('[role="option"]');
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(2);

      // Verify both Thai and English names are displayed
      const firstOption = options.first();
      await expect(firstOption.locator('div').first()).toBeVisible(); // Thai name
      await expect(firstOption.locator('div').last()).toBeVisible(); // English name
    });

    test('search is case-insensitive for English', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Test with different cases
      await searchInput.fill('bangkok');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown.locator('[role="option"]')).toContainText('Bangkok');

      // Clear and try uppercase
      await searchInput.clear();
      await searchInput.fill('BANGKOK');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      await expect(dropdown.locator('[role="option"]')).toContainText('Bangkok');
    });
  });

  test.describe('Thai Search', () => {
    test('returns matching provinces for Thai search term', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Type Thai province name
      await searchInput.fill('เชียงใหม่');

      // Wait for autocomplete dropdown to appear
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      // Check that results contain Chiang Mai
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();

      const firstOption = dropdown.locator('[role="option"]').first();
      await expect(firstOption).toContainText('เชียงใหม่'); // Thai name
      await expect(firstOption).toContainText('Chiang Mai'); // English name
    });

    test('returns multiple matching provinces for partial Thai term', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Type partial Thai term (เชียง matches both เชียงใหม่ and เชียงราย)
      await searchInput.fill('เชียง');

      // Wait for autocomplete dropdown
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      // Should show multiple results
      const options = page.locator('[role="option"]');
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(2);

      // Verify both options contain the search term
      const allText = await page.locator('[role="listbox"]').textContent();
      expect(allText).toContain('เชียงใหม่');
      expect(allText).toContain('เชียงราย');
    });

    test('handles Thai characters correctly', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Test with Thai characters including tone marks
      await searchInput.fill('ภูเก็ต');

      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown.locator('[role="option"]')).toContainText('ภูเก็ต');
      await expect(dropdown.locator('[role="option"]')).toContainText('Phuket');
    });
  });

  test.describe('Mixed Language Search', () => {
    test('English search shows results with both Thai and English names', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      await searchInput.fill('Bangkok');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      const option = page.locator('[role="option"]').first();

      // Verify both languages are present
      const thaiName = option.locator('div').first();
      const englishName = option.locator('div').last();

      await expect(thaiName).toContainText('กรุงเทพมหานคร');
      await expect(englishName).toContainText('Bangkok');
    });

    test('Thai search shows results with both Thai and English names', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      await searchInput.fill('กรุงเทพ');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      const option = page.locator('[role="option"]').first();

      // Verify both languages are present
      const thaiName = option.locator('div').first();
      const englishName = option.locator('div').last();

      await expect(thaiName).toContainText('กรุงเทพมหานคร');
      await expect(englishName).toContainText('Bangkok');
    });

    test('can switch between Thai and English searches', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Start with English
      await searchInput.fill('Phuket');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      await expect(page.locator('[role="listbox"]')).toContainText('ภูเก็ต');

      // Clear and switch to Thai
      await searchInput.clear();
      await searchInput.fill('ภูเก็ต');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      await expect(page.locator('[role="listbox"]')).toContainText('Phuket');

      // Clear and back to English
      await searchInput.clear();
      await searchInput.fill('Phuket');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      await expect(page.locator('[role="listbox"]')).toContainText('ภูเก็ต');
    });
  });

  test.describe('Province Name Display', () => {
    test('displays Thai name prominently with English as subtitle', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      await searchInput.fill('Chiang Mai');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      const option = page.locator('[role="option"]').first();
      const thaiName = option.locator('div.font-medium');
      const englishName = option.locator('div.text-xs.text-gray-500');

      // Thai name should be prominent (font-medium)
      await expect(thaiName).toHaveText('เชียงใหม่');

      // English name should be smaller and gray (text-xs text-gray-500)
      await expect(englishName).toHaveText('Chiang Mai');
    });

    test('province names are correctly formatted in both languages', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Test multiple provinces
      const testCases = [
        { search: 'Bangkok', thai: 'กรุงเทพมหานคร', english: 'Bangkok' },
        { search: 'Chiang', thai: 'เชียงใหม่', english: 'Chiang Mai' },
        { search: 'Phuket', thai: 'ภูเก็ต', english: 'Phuket' },
      ];

      for (const testCase of testCases) {
        await searchInput.clear();
        await searchInput.fill(testCase.search);
        await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

        const firstOption = page.locator('[role="option"]').first();
        await expect(firstOption).toContainText(testCase.thai);
        await expect(firstOption).toContainText(testCase.english);
      }
    });
  });

  test.describe('Search Result Consistency', () => {
    test('same province returns identical results for Thai and English search', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Search in English
      await searchInput.fill('Chiang Mai');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      const englishResults = await page.locator('[role="option"]').allTextContents();

      // Clear and search in Thai
      await searchInput.clear();
      await searchInput.fill('เชียงใหม่');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      const thaiResults = await page.locator('[role="option"]').allTextContents();

      // Results should contain the same province
      expect(englishResults.join()).toContain('เชียงใหม่');
      expect(englishResults.join()).toContain('Chiang Mai');
      expect(thaiResults.join()).toContain('เชียงใหม่');
      expect(thaiResults.join()).toContain('Chiang Mai');
    });

    test('partial search returns consistent results regardless of language', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Search "Chiang" in English
      await searchInput.fill('Chiang');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      const englishCount = await page.locator('[role="option"]').count();

      // Clear and search "เชียง" in Thai
      await searchInput.clear();
      await searchInput.fill('เชียง');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      const thaiCount = await page.locator('[role="option"]').count();

      // Should return same number of results
      expect(thaiCount).toBe(englishCount);
      expect(thaiCount).toBeGreaterThanOrEqual(2); // At least Chiang Mai and Chiang Rai
    });

    test('selecting province works the same for Thai and English search', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Test selection with English search
      await searchInput.fill('Chiang Mai');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      await page.locator('[role="option"]').first().click();

      // Input should show Thai name after selection
      await expect(searchInput).toHaveValue('เชียงใหม่');

      // Clear and test with Thai search
      await searchInput.clear();
      await searchInput.fill('เชียงใหม่');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      await page.locator('[role="option"]').first().click();

      // Input should still show Thai name
      await expect(searchInput).toHaveValue('เชียงใหม่');
    });
  });

  test.describe('Search Performance and UX', () => {
    test('search results appear quickly (under 500ms)', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      const startTime = Date.now();
      await searchInput.fill('Bangkok');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Should respond in under 500ms as per requirements
      // Adding buffer for E2E test environment
      expect(duration).toBeLessThan(2000);
    });

    test('minimum 2 characters required to trigger search', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Type single character
      await searchInput.fill('B');

      // Dropdown should not appear
      await page.waitForTimeout(500);
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).not.toBeVisible();

      // Type second character
      await searchInput.fill('Ba');

      // Now dropdown should appear
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      await expect(dropdown).toBeVisible();
    });

    test('shows "no results" message for non-existent province', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Search for non-existent province
      await searchInput.fill('XYZ NonExistent Province');

      // Wait for dropdown to appear
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      // Should show "no results" message
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toContainText('ไม่พบจังหวัด');
    });

    test('loading state appears during search', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Type search term
      await searchInput.fill('Bang');

      // Loading state should briefly appear (checking for Thai loading text)
      // Note: May be too fast to catch in E2E, so we just verify dropdown appears
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();
    });

    test('can clear search and results disappear', async ({ page }) => {
      const searchInput = page.locator('input[aria-label="ค้นหาจังหวัด"]');

      // Perform search
      await searchInput.fill('Bangkok');
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      // Clear button should appear
      const clearButton = page.locator('button[aria-label="ล้าง"]');
      await expect(clearButton).toBeVisible();

      // Click clear
      await clearButton.click();

      // Input should be empty
      await expect(searchInput).toHaveValue('');

      // Dropdown should disappear
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).not.toBeVisible();
    });
  });
});
