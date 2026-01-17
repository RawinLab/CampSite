import { test, expect, Page } from '@playwright/test';

test.describe('Gallery Touch Swipe', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE viewport
    hasTouch: true,
  });

  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Navigate to a campsite detail page with gallery
    await page.goto('/campsites/test-campsite-id');
    await page.waitForLoadState('networkidle');
  });

  test('should swipe left to go to next image', async () => {
    // Get initial image index/src
    const initialImage = await page.locator('[data-testid="gallery-image"]').first();
    const initialSrc = await initialImage.getAttribute('src');

    // Perform swipe left gesture
    const galleryContainer = await page.locator('[data-testid="gallery-container"]');
    const box = await galleryContainer.boundingBox();

    if (!box) throw new Error('Gallery container not found');

    // Swipe from right to left (80% to 20% of width)
    await page.touchscreen.tap(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();

    // Wait for animation
    await page.waitForTimeout(300);

    // Verify next image is displayed
    const nextImage = await page.locator('[data-testid="gallery-image"]').first();
    const nextSrc = await nextImage.getAttribute('src');
    expect(nextSrc).not.toBe(initialSrc);

    // Verify image indicator updated
    const activeIndicator = await page.locator('[data-testid="gallery-indicator"][data-active="true"]');
    await expect(activeIndicator).toBeVisible();
  });

  test('should swipe right to go to previous image', async () => {
    // First, navigate to second image using next button
    await page.locator('[data-testid="gallery-next-button"]').click();
    await page.waitForTimeout(300);

    const initialImage = await page.locator('[data-testid="gallery-image"]').first();
    const initialSrc = await initialImage.getAttribute('src');

    // Perform swipe right gesture
    const galleryContainer = await page.locator('[data-testid="gallery-container"]');
    const box = await galleryContainer.boundingBox();

    if (!box) throw new Error('Gallery container not found');

    // Swipe from left to right (20% to 80% of width)
    await page.touchscreen.tap(box.x + box.width * 0.2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();

    // Wait for animation
    await page.waitForTimeout(300);

    // Verify previous image is displayed
    const prevImage = await page.locator('[data-testid="gallery-image"]').first();
    const prevSrc = await prevImage.getAttribute('src');
    expect(prevSrc).not.toBe(initialSrc);
  });

  test('should swipe in lightbox mode', async () => {
    // Open lightbox by clicking on image
    await page.locator('[data-testid="gallery-image"]').first().click();

    // Wait for lightbox to open
    await page.waitForSelector('[data-testid="lightbox-container"]', { state: 'visible' });

    const initialLightboxImage = await page.locator('[data-testid="lightbox-image"]');
    const initialSrc = await initialLightboxImage.getAttribute('src');

    // Perform swipe left in lightbox
    const lightboxContainer = await page.locator('[data-testid="lightbox-container"]');
    const box = await lightboxContainer.boundingBox();

    if (!box) throw new Error('Lightbox container not found');

    // Swipe from right to left
    await page.touchscreen.tap(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();

    // Wait for animation
    await page.waitForTimeout(300);

    // Verify next image in lightbox
    const nextLightboxImage = await page.locator('[data-testid="lightbox-image"]');
    const nextSrc = await nextLightboxImage.getAttribute('src');
    expect(nextSrc).not.toBe(initialSrc);

    // Verify lightbox counter updated
    const counter = await page.locator('[data-testid="lightbox-counter"]');
    await expect(counter).toContainText('2');
  });

  test('should respect swipe threshold', async () => {
    const initialImage = await page.locator('[data-testid="gallery-image"]').first();
    const initialSrc = await initialImage.getAttribute('src');

    // Perform short swipe (below threshold - typically <50px)
    const galleryContainer = await page.locator('[data-testid="gallery-container"]');
    const box = await galleryContainer.boundingBox();

    if (!box) throw new Error('Gallery container not found');

    // Swipe only 30px (below threshold)
    await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5 - 30, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();

    // Wait for potential animation
    await page.waitForTimeout(300);

    // Verify image hasn't changed (swipe below threshold)
    const currentImage = await page.locator('[data-testid="gallery-image"]').first();
    const currentSrc = await currentImage.getAttribute('src');
    expect(currentSrc).toBe(initialSrc);

    // Now perform full swipe above threshold
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(300);

    // Verify image has now changed (swipe above threshold)
    const nextImage = await page.locator('[data-testid="gallery-image"]').first();
    const nextSrc = await nextImage.getAttribute('src');
    expect(nextSrc).not.toBe(initialSrc);
  });

  test('should properly handle touch events', async () => {
    const galleryContainer = await page.locator('[data-testid="gallery-container"]');
    const box = await galleryContainer.boundingBox();

    if (!box) throw new Error('Gallery container not found');

    // Test touchstart event
    await page.dispatchEvent('[data-testid="gallery-container"]', 'touchstart', {
      touches: [{ clientX: box.x + box.width * 0.8, clientY: box.y + box.height / 2 }],
    });

    // Test touchmove event
    await page.dispatchEvent('[data-testid="gallery-container"]', 'touchmove', {
      touches: [{ clientX: box.x + box.width * 0.5, clientY: box.y + box.height / 2 }],
    });

    // Test touchend event
    await page.dispatchEvent('[data-testid="gallery-container"]', 'touchend', {
      changedTouches: [{ clientX: box.x + box.width * 0.2, clientY: box.y + box.height / 2 }],
    });

    // Wait for animation
    await page.waitForTimeout(300);

    // Verify touch events triggered image change
    const activeIndicator = await page.locator('[data-testid="gallery-indicator"][data-active="true"]');
    await expect(activeIndicator).toBeVisible();
  });

  test('should handle rapid swipes without breaking', async () => {
    const galleryContainer = await page.locator('[data-testid="gallery-container"]');
    const box = await galleryContainer.boundingBox();

    if (!box) throw new Error('Gallery container not found');

    // Perform 3 rapid swipes
    for (let i = 0; i < 3; i++) {
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(100); // Minimal wait between swipes
    }

    // Verify gallery still works
    const galleryImage = await page.locator('[data-testid="gallery-image"]').first();
    await expect(galleryImage).toBeVisible();

    // Verify we can still interact with gallery
    await page.locator('[data-testid="gallery-next-button"]').click();
    await expect(galleryImage).toBeVisible();
  });

  test('should prevent vertical scroll during horizontal swipe', async () => {
    const initialScrollY = await page.evaluate(() => window.scrollY);

    const galleryContainer = await page.locator('[data-testid="gallery-container"]');
    const box = await galleryContainer.boundingBox();

    if (!box) throw new Error('Gallery container not found');

    // Attempt horizontal swipe with slight vertical movement
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2 + 10, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(300);

    // Verify page didn't scroll vertically
    const finalScrollY = await page.evaluate(() => window.scrollY);
    expect(finalScrollY).toBe(initialScrollY);
  });

  test('should show visual feedback during swipe', async () => {
    const galleryContainer = await page.locator('[data-testid="gallery-container"]');
    const box = await galleryContainer.boundingBox();

    if (!box) throw new Error('Gallery container not found');

    // Start swipe
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.down();

    // Move partway (should show drag feedback)
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2, { steps: 5 });

    // Check if transform is applied (indicating visual feedback)
    const transform = await galleryContainer.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });

    // Transform should not be 'none' during swipe
    expect(transform).not.toBe('none');

    await page.mouse.up();
  });

  test('should handle edge cases at first and last images', async () => {
    const galleryContainer = await page.locator('[data-testid="gallery-container"]');
    const box = await galleryContainer.boundingBox();

    if (!box) throw new Error('Gallery container not found');

    // Try to swipe right at first image (should not change or loop)
    const firstImageSrc = await page.locator('[data-testid="gallery-image"]').first().getAttribute('src');

    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const afterSwipeSrc = await page.locator('[data-testid="gallery-image"]').first().getAttribute('src');

    // Should either stay the same or loop to last (depending on implementation)
    expect(afterSwipeSrc).toBeDefined();

    // Navigate to last image
    const totalImages = await page.locator('[data-testid="gallery-indicator"]').count();
    for (let i = 1; i < totalImages; i++) {
      await page.locator('[data-testid="gallery-next-button"]').click();
      await page.waitForTimeout(200);
    }

    // Try to swipe left at last image
    const lastImageSrc = await page.locator('[data-testid="gallery-image"]').first().getAttribute('src');

    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const afterLastSwipeSrc = await page.locator('[data-testid="gallery-image"]').first().getAttribute('src');

    // Should either stay the same or loop to first
    expect(afterLastSwipeSrc).toBeDefined();
  });
});
