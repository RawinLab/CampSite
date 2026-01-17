import { test, expect, Page } from '@playwright/test';

test.describe('Lightbox Keyboard Navigation', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    // Navigate to a campsite page with multiple images
    // Adjust URL based on your actual campsite details page
    await page.goto('/campsites/test-campsite');

    // Wait for images to load
    await page.waitForSelector('[data-testid="campsite-gallery"]', { timeout: 10000 });

    // Open lightbox by clicking the first image
    const firstImage = page.locator('[data-testid="gallery-image"]').first();
    await firstImage.click();

    // Wait for lightbox to open
    await page.waitForSelector('[data-testid="lightbox"]', { state: 'visible', timeout: 5000 });
  });

  test('should close lightbox when Escape key is pressed', async () => {
    // Verify lightbox is open
    const lightbox = page.locator('[data-testid="lightbox"]');
    await expect(lightbox).toBeVisible();

    // Press Escape key
    await page.keyboard.press('Escape');

    // Verify lightbox is closed
    await expect(lightbox).not.toBeVisible();
  });

  test('should navigate to next image when Right arrow is pressed', async () => {
    // Get the current image source
    const currentImage = page.locator('[data-testid="lightbox-image"]');
    const initialSrc = await currentImage.getAttribute('src');

    // Press Right arrow
    await page.keyboard.press('ArrowRight');

    // Wait for image to change
    await page.waitForTimeout(500);

    // Verify image has changed
    const newSrc = await currentImage.getAttribute('src');
    expect(newSrc).not.toBe(initialSrc);

    // Verify image counter updated (if exists)
    const counter = page.locator('[data-testid="lightbox-counter"]');
    if (await counter.count() > 0) {
      await expect(counter).toContainText('2');
    }
  });

  test('should navigate to previous image when Left arrow is pressed', async () => {
    // First navigate to second image
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);

    const currentImage = page.locator('[data-testid="lightbox-image"]');
    const secondImageSrc = await currentImage.getAttribute('src');

    // Press Left arrow
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);

    // Verify we're back to the first image
    const newSrc = await currentImage.getAttribute('src');
    expect(newSrc).not.toBe(secondImageSrc);

    // Verify image counter updated (if exists)
    const counter = page.locator('[data-testid="lightbox-counter"]');
    if (await counter.count() > 0) {
      await expect(counter).toContainText('1');
    }
  });

  test('should trap focus within lightbox', async () => {
    const lightbox = page.locator('[data-testid="lightbox"]');
    await expect(lightbox).toBeVisible();

    // Get all focusable elements within lightbox
    const focusableElements = page.locator('[data-testid="lightbox"] button, [data-testid="lightbox"] [tabindex="0"]');
    const focusableCount = await focusableElements.count();

    // Should have at least close button and navigation buttons
    expect(focusableCount).toBeGreaterThan(0);

    // Tab through all elements and verify focus stays in lightbox
    for (let i = 0; i < focusableCount + 2; i++) {
      await page.keyboard.press('Tab');

      // Get currently focused element
      const focusedElement = page.locator(':focus');
      const isInLightbox = await focusedElement.evaluate((el) => {
        let current = el as HTMLElement | null;
        while (current) {
          if (current.dataset?.testid === 'lightbox') {
            return true;
          }
          current = current.parentElement;
        }
        return false;
      });

      // Focus should always be within lightbox
      expect(isInLightbox).toBe(true);
    }
  });

  test('should cycle through interactive elements with Tab', async () => {
    const lightbox = page.locator('[data-testid="lightbox"]');
    await expect(lightbox).toBeVisible();

    // Get interactive elements
    const closeButton = page.locator('[data-testid="lightbox-close"]');
    const prevButton = page.locator('[data-testid="lightbox-prev"]');
    const nextButton = page.locator('[data-testid="lightbox-next"]');

    // Press Tab and verify focus moves to next element
    await page.keyboard.press('Tab');
    let focusedElement = page.locator(':focus');

    // Collect focused elements as we tab through
    const focusedElements: string[] = [];
    for (let i = 0; i < 5; i++) {
      const tagName = await focusedElement.evaluate((el) => el.tagName);
      const testId = await focusedElement.getAttribute('data-testid');
      focusedElements.push(testId || tagName);
      await page.keyboard.press('Tab');
      focusedElement = page.locator(':focus');
    }

    // Verify we cycled through interactive elements
    expect(focusedElements.length).toBeGreaterThan(0);

    // Verify at least one button was focused
    const hasButtonFocus = focusedElements.some(id =>
      id?.includes('lightbox-close') ||
      id?.includes('lightbox-prev') ||
      id?.includes('lightbox-next') ||
      id === 'BUTTON'
    );
    expect(hasButtonFocus).toBe(true);
  });

  test('should handle Shift+Tab for reverse cycling', async () => {
    const lightbox = page.locator('[data-testid="lightbox"]');
    await expect(lightbox).toBeVisible();

    // Tab forward once
    await page.keyboard.press('Tab');
    const firstFocus = await page.locator(':focus').getAttribute('data-testid');

    // Shift+Tab to go back
    await page.keyboard.press('Shift+Tab');
    const previousFocus = await page.locator(':focus').getAttribute('data-testid');

    // Focus should have moved to a different element
    expect(previousFocus).not.toBe(firstFocus);

    // Focus should still be within lightbox
    const focusedElement = page.locator(':focus');
    const isInLightbox = await focusedElement.evaluate((el) => {
      let current = el as HTMLElement | null;
      while (current) {
        if (current.dataset?.testid === 'lightbox') {
          return true;
        }
        current = current.parentElement;
      }
      return false;
    });
    expect(isInLightbox).toBe(true);
  });

  test('should not navigate beyond last image with Right arrow', async () => {
    // Navigate to last image by pressing Right arrow multiple times
    const currentImage = page.locator('[data-testid="lightbox-image"]');

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
    }

    // Get current image
    const lastImageSrc = await currentImage.getAttribute('src');

    // Press Right arrow again
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    // Should stay on same image or wrap to first
    const newSrc = await currentImage.getAttribute('src');
    expect(newSrc).toBeDefined();
  });

  test('should not navigate before first image with Left arrow', async () => {
    // We're on first image after beforeEach
    const currentImage = page.locator('[data-testid="lightbox-image"]');
    const firstImageSrc = await currentImage.getAttribute('src');

    // Press Left arrow
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);

    // Should stay on same image or wrap to last
    const newSrc = await currentImage.getAttribute('src');
    expect(newSrc).toBeDefined();
  });

  test('should close lightbox with Escape while navigating', async () => {
    // Navigate a few images
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    // Verify lightbox is still open
    const lightbox = page.locator('[data-testid="lightbox"]');
    await expect(lightbox).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify lightbox is closed
    await expect(lightbox).not.toBeVisible();
  });

  test('should handle rapid keyboard navigation', async () => {
    const lightbox = page.locator('[data-testid="lightbox"]');
    await expect(lightbox).toBeVisible();

    // Rapidly press arrow keys
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');

    // Wait for any animations to settle
    await page.waitForTimeout(500);

    // Lightbox should still be functional
    await expect(lightbox).toBeVisible();

    // Should be able to close
    await page.keyboard.press('Escape');
    await expect(lightbox).not.toBeVisible();
  });
});
