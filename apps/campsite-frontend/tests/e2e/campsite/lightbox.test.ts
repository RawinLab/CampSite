import { test, expect } from '@playwright/test';

// Use a valid test campsite slug
const TEST_CAMPSITE_SLUG = 'test-campsite-details-b7a9886a';

test.describe('Campsite Gallery Lightbox', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a campsite detail page with gallery images
    // Assuming there's a test campsite with ID 1 that has multiple images
    await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`);
    await page.waitForLoadState('networkidle');
  });

  test('clicking main image opens lightbox', async ({ page }) => {
    // Click the main campsite image
    const mainImage = page.locator('[data-testid="campsite-main-image"]').first();
    await mainImage.click();

    // Verify lightbox is visible
    const lightbox = page.locator('[data-testid="lightbox"]');
    await expect(lightbox).toBeVisible();
  });

  test('lightbox displays large image', async ({ page }) => {
    // Open lightbox
    const mainImage = page.locator('[data-testid="campsite-main-image"]').first();
    await mainImage.click();

    // Verify large image is displayed in lightbox
    const lightboxImage = page.locator('[data-testid="lightbox-image"]');
    await expect(lightboxImage).toBeVisible();

    // Verify image has src attribute
    const imageSrc = await lightboxImage.getAttribute('src');
    expect(imageSrc).toBeTruthy();
    expect(imageSrc).toContain('http');
  });

  test('close button closes lightbox', async ({ page }) => {
    // Open lightbox
    const mainImage = page.locator('[data-testid="campsite-main-image"]').first();
    await mainImage.click();

    // Verify lightbox is open
    const lightbox = page.locator('[data-testid="lightbox"]');
    await expect(lightbox).toBeVisible();

    // Click close button
    const closeButton = page.locator('[data-testid="lightbox-close"]');
    await closeButton.click();

    // Verify lightbox is closed
    await expect(lightbox).not.toBeVisible();
  });

  test('clicking backdrop closes lightbox', async ({ page }) => {
    // Open lightbox
    const mainImage = page.locator('[data-testid="campsite-main-image"]').first();
    await mainImage.click();

    // Verify lightbox is open
    const lightbox = page.locator('[data-testid="lightbox"]');
    await expect(lightbox).toBeVisible();

    // Click backdrop (outside the image content)
    const backdrop = page.locator('[data-testid="lightbox-backdrop"]');
    await backdrop.click({ position: { x: 10, y: 10 } });

    // Verify lightbox is closed
    await expect(lightbox).not.toBeVisible();
  });

  test('navigation arrows in lightbox work', async ({ page }) => {
    // Open lightbox
    const mainImage = page.locator('[data-testid="campsite-main-image"]').first();
    await mainImage.click();

    // Verify lightbox is open
    const lightbox = page.locator('[data-testid="lightbox"]');
    await expect(lightbox).toBeVisible();

    // Get initial image src
    const lightboxImage = page.locator('[data-testid="lightbox-image"]');
    const initialSrc = await lightboxImage.getAttribute('src');

    // Click next arrow
    const nextButton = page.locator('[data-testid="lightbox-next"]');
    await expect(nextButton).toBeVisible();
    await nextButton.click();

    // Wait for image to change
    await page.waitForTimeout(300);

    // Verify image has changed
    const newSrc = await lightboxImage.getAttribute('src');
    expect(newSrc).not.toBe(initialSrc);

    // Click previous arrow
    const prevButton = page.locator('[data-testid="lightbox-prev"]');
    await expect(prevButton).toBeVisible();
    await prevButton.click();

    // Wait for image to change back
    await page.waitForTimeout(300);

    // Verify we're back to the initial image
    const returnedSrc = await lightboxImage.getAttribute('src');
    expect(returnedSrc).toBe(initialSrc);
  });

  test('image counter in lightbox is accurate', async ({ page }) => {
    // Open lightbox
    const mainImage = page.locator('[data-testid="campsite-main-image"]').first();
    await mainImage.click();

    // Verify lightbox is open
    const lightbox = page.locator('[data-testid="lightbox"]');
    await expect(lightbox).toBeVisible();

    // Check initial counter (should show 1 of X)
    const counter = page.locator('[data-testid="lightbox-counter"]');
    await expect(counter).toBeVisible();

    const counterText = await counter.textContent();
    expect(counterText).toMatch(/1\s*\/\s*\d+/);

    // Extract total number of images
    const totalMatch = counterText?.match(/1\s*\/\s*(\d+)/);
    const totalImages = totalMatch ? parseInt(totalMatch[1]) : 0;
    expect(totalImages).toBeGreaterThan(0);

    // Click next and verify counter updates
    const nextButton = page.locator('[data-testid="lightbox-next"]');
    await nextButton.click();
    await page.waitForTimeout(300);

    const newCounterText = await counter.textContent();
    expect(newCounterText).toMatch(/2\s*\/\s*\d+/);

    // Verify total stays the same
    const newTotalMatch = newCounterText?.match(/2\s*\/\s*(\d+)/);
    const newTotal = newTotalMatch ? parseInt(newTotalMatch[1]) : 0;
    expect(newTotal).toBe(totalImages);
  });

  test('keyboard navigation works in lightbox', async ({ page }) => {
    // Open lightbox
    const mainImage = page.locator('[data-testid="campsite-main-image"]').first();
    await mainImage.click();

    // Verify lightbox is open
    const lightbox = page.locator('[data-testid="lightbox"]');
    await expect(lightbox).toBeVisible();

    // Get initial image src
    const lightboxImage = page.locator('[data-testid="lightbox-image"]');
    const initialSrc = await lightboxImage.getAttribute('src');

    // Press right arrow key
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    // Verify image changed
    const newSrc = await lightboxImage.getAttribute('src');
    expect(newSrc).not.toBe(initialSrc);

    // Press left arrow key
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);

    // Verify back to initial image
    const returnedSrc = await lightboxImage.getAttribute('src');
    expect(returnedSrc).toBe(initialSrc);

    // Press Escape key
    await page.keyboard.press('Escape');

    // Verify lightbox closed
    await expect(lightbox).not.toBeVisible();
  });
});
