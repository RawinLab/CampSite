import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORT = {
  width: 375,
  height: 812,
};

const DESKTOP_VIEWPORT = {
  width: 1280,
  height: 720,
};

test.describe('Mobile Sticky Booking Bar', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a campsite detail page
    // Update this URL to match an actual campsite in your system
    await page.goto('/campsites/1');
  });

  test('should display sticky bar on mobile viewport', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    // Scroll down to trigger sticky bar
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300); // Wait for scroll animation

    const stickyBar = page.getByTestId('mobile-sticky-booking-bar');
    await expect(stickyBar).toBeVisible();
  });

  test('should appear after scrolling past hero section', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    // Initially, sticky bar should not be visible at top
    const stickyBar = page.getByTestId('mobile-sticky-booking-bar');
    const isVisibleAtTop = await stickyBar.isVisible().catch(() => false);

    // If visible at top, check if it has hidden/inactive state
    if (isVisibleAtTop) {
      const hasHiddenClass = await stickyBar.evaluate((el) => {
        return el.classList.contains('translate-y-full') ||
               el.classList.contains('opacity-0') ||
               el.classList.contains('hidden');
      });
      expect(hasHiddenClass).toBe(true);
    }

    // Scroll past hero section (typically 400-600px)
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);

    // Now sticky bar should be visible
    await expect(stickyBar).toBeVisible();

    // Verify it doesn't have hidden classes
    const hasHiddenClass = await stickyBar.evaluate((el) => {
      return el.classList.contains('translate-y-full') ||
             el.classList.contains('opacity-0') ||
             el.classList.contains('hidden');
    });
    expect(hasHiddenClass).toBe(false);
  });

  test('should show price range in sticky bar', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    // Scroll to make sticky bar visible
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);

    const stickyBar = page.getByTestId('mobile-sticky-booking-bar');
    await expect(stickyBar).toBeVisible();

    // Check for price display (looking for price format or specific test id)
    const priceElement = stickyBar.getByTestId('sticky-bar-price').or(
      stickyBar.locator('text=/฿\\s*\\d+/')
    );
    await expect(priceElement).toBeVisible();

    // Verify price text contains Thai Baht symbol and numbers
    const priceText = await priceElement.textContent();
    expect(priceText).toMatch(/฿|THB|\d+/);
  });

  test('should have clickable Book Now button', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    // Scroll to make sticky bar visible
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);

    const stickyBar = page.getByTestId('mobile-sticky-booking-bar');
    await expect(stickyBar).toBeVisible();

    // Find Book Now button
    const bookButton = stickyBar.getByRole('button', { name: /book now|จอง/i }).or(
      stickyBar.getByTestId('sticky-book-button')
    );

    await expect(bookButton).toBeVisible();
    await expect(bookButton).toBeEnabled();

    // Verify button is clickable (click and check for navigation or modal)
    await bookButton.click();

    // Wait for either navigation or booking modal to appear
    await page.waitForTimeout(500);

    // Check if booking section is visible or URL changed
    const urlAfterClick = page.url();
    const bookingSectionVisible = await page.getByTestId('booking-section').isVisible().catch(() => false);
    const bookingModalVisible = await page.getByTestId('booking-modal').isVisible().catch(() => false);

    expect(
      urlAfterClick.includes('#booking') ||
      bookingSectionVisible ||
      bookingModalVisible
    ).toBe(true);
  });

  test('should hide when scrolling back to top', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    // Scroll down to show sticky bar
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);

    const stickyBar = page.getByTestId('mobile-sticky-booking-bar');
    await expect(stickyBar).toBeVisible();

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    // Sticky bar should be hidden or have hidden class
    const isHidden = await stickyBar.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return (
        el.classList.contains('translate-y-full') ||
        el.classList.contains('opacity-0') ||
        el.classList.contains('hidden') ||
        styles.display === 'none' ||
        styles.opacity === '0' ||
        !el.offsetParent
      );
    }).catch(() => true);

    expect(isHidden).toBe(true);
  });

  test('should not be visible on desktop viewport', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);

    // Scroll down (where mobile sticky bar would appear)
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);

    const stickyBar = page.getByTestId('mobile-sticky-booking-bar');

    // On desktop, the element should either not exist or be hidden
    const isVisible = await stickyBar.isVisible().catch(() => false);

    if (isVisible) {
      // If element exists, check if it's hidden via CSS
      const isDisplayed = await stickyBar.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.display !== 'none' &&
               styles.visibility !== 'hidden' &&
               styles.opacity !== '0';
      });
      expect(isDisplayed).toBe(false);
    } else {
      expect(isVisible).toBe(false);
    }
  });

  test('should maintain visibility during scroll down', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    // Scroll to trigger sticky bar
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);

    const stickyBar = page.getByTestId('mobile-sticky-booking-bar');
    await expect(stickyBar).toBeVisible();

    // Continue scrolling down
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(300);

    // Sticky bar should remain visible
    await expect(stickyBar).toBeVisible();

    // Scroll even further
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(300);

    // Should still be visible
    await expect(stickyBar).toBeVisible();
  });

  test('should have proper z-index and not be obscured', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    // Scroll to show sticky bar
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);

    const stickyBar = page.getByTestId('mobile-sticky-booking-bar');
    await expect(stickyBar).toBeVisible();

    // Check z-index is high enough (typically 40-50 for sticky elements)
    const zIndex = await stickyBar.evaluate((el) => {
      return parseInt(window.getComputedStyle(el).zIndex || '0', 10);
    });

    expect(zIndex).toBeGreaterThanOrEqual(40);

    // Verify position is fixed or sticky
    const position = await stickyBar.evaluate((el) => {
      return window.getComputedStyle(el).position;
    });

    expect(['fixed', 'sticky']).toContain(position);
  });
});
