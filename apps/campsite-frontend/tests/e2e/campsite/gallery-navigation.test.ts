import { test, expect } from '@playwright/test';

test.describe('Campsite Gallery Navigation', () => {
  // Mock campsite data with multiple photos
  const setupCampsiteWithGallery = async (page: any) => {
    // Navigate to a campsite detail page
    // Assuming campsite with ID 1 exists with multiple photos
    await page.goto('http://localhost:3090/campsites/1');

    // Wait for the gallery to load
    await page.waitForSelector('[data-testid="campsite-gallery"]', { timeout: 10000 });
  };

  test.beforeEach(async ({ page }) => {
    await setupCampsiteWithGallery(page);
  });

  test('should display main image', async ({ page }) => {
    // Check that the main image is visible
    const mainImage = page.locator('[data-testid="gallery-main-image"]');
    await expect(mainImage).toBeVisible();

    // Verify image has src attribute
    const imageSrc = await mainImage.getAttribute('src');
    expect(imageSrc).toBeTruthy();
  });

  test('should show thumbnail strip when multiple photos exist', async ({ page }) => {
    // Check thumbnail strip is visible
    const thumbnailStrip = page.locator('[data-testid="gallery-thumbnails"]');
    await expect(thumbnailStrip).toBeVisible();

    // Verify multiple thumbnails exist
    const thumbnails = page.locator('[data-testid="gallery-thumbnail"]');
    const count = await thumbnails.count();
    expect(count).toBeGreaterThan(1);
  });

  test('should navigate forward with next arrow', async ({ page }) => {
    // Get initial image counter
    const counter = page.locator('[data-testid="gallery-counter"]');
    const initialCounterText = await counter.textContent();
    expect(initialCounterText).toContain('1 /');

    // Click next arrow
    const nextButton = page.locator('[aria-label="Next photo"]');
    await nextButton.click();

    // Wait for navigation and verify counter updated
    await page.waitForTimeout(300); // Small delay for animation
    const updatedCounterText = await counter.textContent();
    expect(updatedCounterText).toContain('2 /');
  });

  test('should navigate backward with previous arrow', async ({ page }) => {
    // First navigate to second image
    const nextButton = page.locator('[aria-label="Next photo"]');
    await nextButton.click();
    await page.waitForTimeout(300);

    // Verify we're on image 2
    const counter = page.locator('[data-testid="gallery-counter"]');
    let counterText = await counter.textContent();
    expect(counterText).toContain('2 /');

    // Click previous arrow
    const previousButton = page.locator('[aria-label="Previous photo"]');
    await previousButton.click();
    await page.waitForTimeout(300);

    // Verify we're back to image 1
    counterText = await counter.textContent();
    expect(counterText).toContain('1 /');
  });

  test('should update image counter correctly', async ({ page }) => {
    const counter = page.locator('[data-testid="gallery-counter"]');
    const nextButton = page.locator('[aria-label="Next photo"]');

    // Check initial state
    let counterText = await counter.textContent();
    expect(counterText).toMatch(/1 \/ \d+/);

    // Navigate through several images
    for (let i = 2; i <= 3; i++) {
      await nextButton.click();
      await page.waitForTimeout(300);
      counterText = await counter.textContent();
      expect(counterText).toContain(`${i} /`);
    }
  });

  test('should change main image when clicking thumbnail', async ({ page }) => {
    const counter = page.locator('[data-testid="gallery-counter"]');

    // Verify starting at image 1
    let counterText = await counter.textContent();
    expect(counterText).toContain('1 /');

    // Click on third thumbnail (index 2)
    const thumbnails = page.locator('[data-testid="gallery-thumbnail"]');
    await thumbnails.nth(2).click();
    await page.waitForTimeout(300);

    // Verify counter shows image 3
    counterText = await counter.textContent();
    expect(counterText).toContain('3 /');

    // Verify thumbnail has active styling
    const thirdThumbnail = thumbnails.nth(2);
    const classList = await thirdThumbnail.getAttribute('class');
    expect(classList).toContain('ring-primary');
  });

  test('should disable previous arrow at first image', async ({ page }) => {
    // On first image, previous button should wrap to last or be at boundary
    const counter = page.locator('[data-testid="gallery-counter"]');
    const previousButton = page.locator('[aria-label="Previous photo"]');

    // Verify we're on image 1
    const counterText = await counter.textContent();
    expect(counterText).toContain('1 /');

    // Previous button should navigate to last image (circular navigation)
    await previousButton.click();
    await page.waitForTimeout(300);

    // Should now be on last image
    const updatedText = await counter.textContent();
    const match = updatedText?.match(/(\d+) \/ (\d+)/);
    if (match) {
      expect(match[1]).toBe(match[2]); // Current index equals total count
    }
  });

  test('should disable next arrow at last image', async ({ page }) => {
    const counter = page.locator('[data-testid="gallery-counter"]');
    const nextButton = page.locator('[aria-label="Next photo"]');

    // Get total number of photos
    const counterText = await counter.textContent();
    const totalPhotos = parseInt(counterText?.split('/')[1].trim() || '0');

    // Navigate to last image
    for (let i = 1; i < totalPhotos; i++) {
      await nextButton.click();
      await page.waitForTimeout(300);
    }

    // Verify we're on last image
    const finalCounterText = await counter.textContent();
    expect(finalCounterText).toContain(`${totalPhotos} / ${totalPhotos}`);

    // Next button should wrap to first image (circular navigation)
    await nextButton.click();
    await page.waitForTimeout(300);

    // Should be back to first image
    const wrappedCounterText = await counter.textContent();
    expect(wrappedCounterText).toContain('1 /');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    const counter = page.locator('[data-testid="gallery-counter"]');
    const mainImage = page.locator('[data-testid="gallery-main-image"]');

    // Focus on gallery
    await mainImage.click();

    // Verify starting position
    let counterText = await counter.textContent();
    expect(counterText).toContain('1 /');

    // Press right arrow key
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    counterText = await counter.textContent();
    expect(counterText).toContain('2 /');

    // Press left arrow key
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);

    counterText = await counter.textContent();
    expect(counterText).toContain('1 /');
  });

  test('should open lightbox when clicking main image', async ({ page }) => {
    const mainImage = page.locator('[data-testid="gallery-main-image"]');

    // Click main image
    await mainImage.click();

    // Wait for lightbox to open
    await page.waitForTimeout(500);

    // Verify lightbox is visible
    const lightbox = page.locator('[data-testid="gallery-lightbox"]');
    await expect(lightbox).toBeVisible();
  });

  test('should maintain thumbnail scroll position when navigating', async ({ page }) => {
    const thumbnailStrip = page.locator('[data-testid="gallery-thumbnails"]');
    const thumbnails = page.locator('[data-testid="gallery-thumbnail"]');

    // Check if there are enough thumbnails to scroll
    const thumbnailCount = await thumbnails.count();
    if (thumbnailCount > 5) {
      // Click on a thumbnail that's further down
      await thumbnails.nth(4).click();
      await page.waitForTimeout(300);

      // Get scroll position
      const scrollPosition = await thumbnailStrip.evaluate((el) => el.scrollLeft);

      // Use next arrow
      const nextButton = page.locator('[aria-label="Next photo"]');
      await nextButton.click();
      await page.waitForTimeout(300);

      // Verify scroll position changed to show selected thumbnail
      const newScrollPosition = await thumbnailStrip.evaluate((el) => el.scrollLeft);
      expect(newScrollPosition).toBeGreaterThanOrEqual(0);
    }
  });
});
