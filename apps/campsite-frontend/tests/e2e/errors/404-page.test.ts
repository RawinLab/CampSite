import { test, expect } from '@playwright/test';

test.describe('404 Not Found Page', () => {
  test('displays 404 page for invalid root-level route', async ({ page }) => {
    // Navigate to non-existent page
    const response = await page.goto('/invalid-page-that-does-not-exist');

    // Verify 404 status code
    expect(response?.status()).toBe(404);

    // Verify 404 heading
    await expect(page.locator('h1')).toContainText('404');

    // Verify Thai title
    await expect(page.locator('h2')).toContainText('ไม่พบหน้าที่คุณกำลังค้นหา');
  });

  test('displays 404 page for invalid campsite ID', async ({ page }) => {
    // Navigate to non-existent campsite
    const response = await page.goto('/campsites/invalid-campsite-id-99999');

    // Verify 404 status code
    expect(response?.status()).toBe(404);

    // Verify 404 content is shown
    await expect(page.locator('h1')).toContainText('404');
  });

  test('displays 404 page for invalid search route', async ({ page }) => {
    // Navigate to invalid search path
    const response = await page.goto('/search/invalid/route/path');

    // Verify 404 status code
    expect(response?.status()).toBe(404);

    // Verify page shows 404 content
    await expect(page.locator('h1')).toContainText('404');
  });

  test('shows tent icon on 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    // Verify tent icon SVG is visible
    const tentIcon = page.locator('svg.w-24.h-24.text-green-500');
    await expect(tentIcon).toBeVisible();

    // Verify it has correct viewBox
    const viewBox = await tentIcon.getAttribute('viewBox');
    expect(viewBox).toBe('0 0 24 24');
  });

  test('displays descriptive error message in Thai', async ({ page }) => {
    await page.goto('/non-existent-page');

    // Verify description text
    const description = page.locator('text=หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบไปแล้ว หรือไม่เคยมีอยู่');
    await expect(description).toBeVisible();
  });

  test('shows search input field on 404 page', async ({ page }) => {
    await page.goto('/invalid-route');

    // Verify search input exists
    const searchInput = page.locator('input[name="q"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'ค้นหาแคมป์ไซต์...');

    // Verify search form action
    const form = page.locator('form[action="/search"]');
    await expect(form).toBeVisible();
  });

  test('search functionality works on 404 page', async ({ page }) => {
    await page.goto('/invalid-page');

    // Fill in search query
    await page.fill('input[name="q"]', 'เชียงใหม่');

    // Click search button
    await page.click('button[type="submit"]:has-text("ค้นหา")');

    // Wait for navigation to search page
    await page.waitForURL(/\/search\?q=/);

    // Verify we're on search page with query
    expect(page.url()).toContain('/search?q=');
    expect(page.url()).toContain('เชียงใหม่');
  });

  test('shows home page link with icon', async ({ page }) => {
    await page.goto('/non-existent');

    // Verify home link
    const homeLink = page.locator('a[href="/"]').filter({ hasText: 'กลับหน้าหลัก' });
    await expect(homeLink).toBeVisible();

    // Verify home icon exists
    const homeIcon = homeLink.locator('svg.w-4.h-4');
    await expect(homeIcon).toBeVisible();
  });

  test('shows search campsites link with icon', async ({ page }) => {
    await page.goto('/invalid');

    // Verify search link
    const searchLink = page.locator('a[href="/search"]').filter({ hasText: 'ค้นหาแคมป์ไซต์' });
    await expect(searchLink).toBeVisible();

    // Verify search icon exists
    const searchIcon = searchLink.locator('svg.w-4.h-4');
    await expect(searchIcon).toBeVisible();
  });

  test('home link navigation works correctly', async ({ page }) => {
    await page.goto('/does-not-exist');

    // Click home link
    await page.click('a[href="/"]:has-text("กลับหน้าหลัก")');

    // Wait for navigation
    await page.waitForURL('/');

    // Verify we're on home page
    expect(page.url()).toBe('http://localhost:3090/');
  });

  test('search link navigation works correctly', async ({ page }) => {
    await page.goto('/invalid-url');

    // Click search link
    await page.click('a[href="/search"]:has-text("ค้นหาแคมป์ไซต์")');

    // Wait for navigation
    await page.waitForURL('/search');

    // Verify we're on search page
    expect(page.url()).toContain('/search');
  });

  test('displays popular suggestions section', async ({ page }) => {
    await page.goto('/non-existent-page');

    // Verify suggestions header
    await expect(page.locator('text=แคมป์ไซต์ยอดนิยม:')).toBeVisible();

    // Verify suggestion chips exist
    await expect(page.locator('text=แคมป์ปิ้ง')).toBeVisible();
    await expect(page.locator('text=แกลมปิ้ง')).toBeVisible();
    await expect(page.locator('text=บังกะโล')).toBeVisible();
    await expect(page.locator('text=เชียงใหม่')).toBeVisible();
    await expect(page.locator('text=กาญจนบุรี')).toBeVisible();
  });

  test('popular suggestion links work correctly', async ({ page }) => {
    await page.goto('/invalid-page');

    // Click on camping type suggestion
    await page.click('a[href="/search?type=camping"]:has-text("แคมป์ปิ้ง")');

    // Wait for navigation
    await page.waitForURL('/search?type=camping');

    // Verify we're on filtered search page
    expect(page.url()).toContain('/search?type=camping');
  });

  test('glamping suggestion link works', async ({ page }) => {
    await page.goto('/not-found');

    // Click glamping suggestion
    await page.click('a[href="/search?type=glamping"]');

    // Verify navigation
    await page.waitForURL('/search?type=glamping');
    expect(page.url()).toContain('type=glamping');
  });

  test('province suggestion links work', async ({ page }) => {
    await page.goto('/invalid');

    // Click Chiang Mai suggestion
    await page.click('a[href="/provinces/chiang-mai"]');

    // Wait for navigation
    await page.waitForURL('/provinces/chiang-mai');
    expect(page.url()).toContain('/provinces/chiang-mai');
  });

  test('404 page is mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/non-existent-mobile');

    // Verify main elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[name="q"]')).toBeVisible();
    await expect(page.locator('a[href="/"]')).toBeVisible();

    // Verify buttons stack vertically on mobile (flex-col)
    const buttonContainer = page.locator('.flex.flex-col.sm\\:flex-row').first();
    await expect(buttonContainer).toBeVisible();
  });

  test('404 page works on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/invalid-tablet');

    // Verify content is visible and properly laid out
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.max-w-lg')).toBeVisible();
    await expect(page.locator('input[name="q"]')).toBeVisible();
  });

  test('404 page works on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/desktop-not-found');

    // Verify all elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.max-w-lg')).toBeVisible();

    // Verify suggestion chips are displayed in a row
    const suggestionsContainer = page.locator('.flex.flex-wrap.justify-center.gap-2');
    await expect(suggestionsContainer).toBeVisible();
  });

  test('404 page has proper gradient background', async ({ page }) => {
    await page.goto('/not-found-styling');

    // Verify background gradient classes
    const container = page.locator('.min-h-screen.flex.items-center.justify-center.bg-gradient-to-b.from-green-50.to-white');
    await expect(container).toBeVisible();
  });

  test('404 page uses card component with proper styling', async ({ page }) => {
    await page.goto('/invalid-card-test');

    // Verify card container exists
    const card = page.locator('.max-w-lg.w-full').first();
    await expect(card).toBeVisible();

    // Verify card content padding
    const cardContent = page.locator('.pt-8.pb-8.text-center');
    await expect(cardContent).toBeVisible();
  });

  test('suggestion chips have proper color coding', async ({ page }) => {
    await page.goto('/not-found-colors');

    // Verify camping chip has green styling
    const campingChip = page.locator('a[href="/search?type=camping"]');
    await expect(campingChip).toHaveClass(/bg-green-100/);
    await expect(campingChip).toHaveClass(/text-green-700/);

    // Verify glamping chip has purple styling
    const glampingChip = page.locator('a[href="/search?type=glamping"]');
    await expect(glampingChip).toHaveClass(/bg-purple-100/);
    await expect(glampingChip).toHaveClass(/text-purple-700/);

    // Verify bungalow chip has blue styling
    const bungalowChip = page.locator('a[href="/search?type=bungalow"]');
    await expect(bungalowChip).toHaveClass(/bg-blue-100/);
    await expect(bungalowChip).toHaveClass(/text-blue-700/);
  });

  test('suggestion chips have hover effects', async ({ page }) => {
    await page.goto('/not-found-hover');

    // Get camping chip
    const campingChip = page.locator('a[href="/search?type=camping"]');

    // Verify it has hover class
    await expect(campingChip).toHaveClass(/hover:bg-green-200/);
  });

  test('multiple concurrent 404 requests work correctly', async ({ page, context }) => {
    // Create multiple pages
    const page2 = await context.newPage();
    const page3 = await context.newPage();

    // Navigate all pages to different 404 routes simultaneously
    await Promise.all([
      page.goto('/invalid-1'),
      page2.goto('/invalid-2'),
      page3.goto('/invalid-3'),
    ]);

    // Verify all show 404 content
    await expect(page.locator('h1')).toContainText('404');
    await expect(page2.locator('h1')).toContainText('404');
    await expect(page3.locator('h1')).toContainText('404');

    // Cleanup
    await page2.close();
    await page3.close();
  });

  test('404 page search form uses GET method', async ({ page }) => {
    await page.goto('/not-found-form');

    // Verify form method is GET
    const form = page.locator('form[action="/search"]');
    const method = await form.getAttribute('method');
    expect(method).toBe('get');
  });

  test('404 page has proper semantic structure', async ({ page }) => {
    await page.goto('/semantic-404');

    // Verify h1 exists (important for SEO and accessibility)
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Verify h2 exists
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThanOrEqual(1);
  });

  test('404 page returns correct HTTP status code', async ({ page }) => {
    const response = await page.goto('/this-will-404');

    // Verify status code is exactly 404
    expect(response?.status()).toBe(404);

    // Verify content-type is HTML
    const contentType = response?.headers()['content-type'];
    expect(contentType).toContain('text/html');
  });

  test('404 page handles special characters in URL', async ({ page }) => {
    const response = await page.goto('/invalid-路徑-😀');

    // Should still return 404
    expect(response?.status()).toBe(404);

    // Should still show 404 page
    await expect(page.locator('h1')).toContainText('404');
  });

  test('404 page handles very long URLs gracefully', async ({ page }) => {
    const longPath = '/invalid-' + 'a'.repeat(500);
    const response = await page.goto(longPath);

    // Should return 404
    expect(response?.status()).toBe(404);

    // Page should still render properly
    await expect(page.locator('h1')).toBeVisible();
  });
});
