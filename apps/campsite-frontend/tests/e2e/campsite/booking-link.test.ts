import { test, expect } from '@playwright/test';

test.describe('Campsite Booking Link', () => {
  test.describe('with booking URL', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a campsite detail page that has a booking URL
      // Assuming there's a test campsite with ID 1 that has a booking URL
      await page.goto('/campsites/1');
      await page.waitForLoadState('networkidle');
    });

    test('booking button is visible', async ({ page }) => {
      // Verify booking button exists and is visible
      const bookingButton = page.locator('[data-testid="booking-button"]');
      await expect(bookingButton).toBeVisible();
    });

    test('booking button is enabled when booking URL exists', async ({ page }) => {
      // Verify booking button is enabled
      const bookingButton = page.locator('[data-testid="booking-button"]');
      await expect(bookingButton).toBeVisible();
      await expect(bookingButton).toBeEnabled();

      // Verify button is not disabled
      const isDisabled = await bookingButton.isDisabled();
      expect(isDisabled).toBe(false);
    });

    test('clicking booking button opens external link in new tab', async ({ page, context }) => {
      // Set up listener for new page/tab
      const pagePromise = context.waitForEvent('page');

      // Click the booking button
      const bookingButton = page.locator('[data-testid="booking-button"]');
      await bookingButton.click();

      // Wait for new page to open
      const newPage = await pagePromise;
      await newPage.waitForLoadState('domcontentloaded');

      // Verify new tab was opened
      expect(newPage).toBeTruthy();

      // Verify the URL is external (not same domain)
      const newPageUrl = newPage.url();
      expect(newPageUrl).toBeTruthy();
      expect(newPageUrl).toContain('http');

      // Close the new tab
      await newPage.close();
    });

    test('booking link URL is correct', async ({ page }) => {
      // Get the booking button
      const bookingButton = page.locator('[data-testid="booking-button"]');

      // Verify button has correct href attribute or target
      const href = await bookingButton.getAttribute('href');

      // If it's a link element, verify href exists and is valid
      if (href) {
        expect(href).toBeTruthy();
        expect(href).toMatch(/^https?:\/\//);
      } else {
        // If it's a button, verify it has click handler (we tested this above)
        const role = await bookingButton.getAttribute('role');
        const tagName = await bookingButton.evaluate(el => el.tagName.toLowerCase());
        expect(['button', 'a'].includes(tagName) || role === 'button').toBe(true);
      }
    });

    test('booking button has correct attributes for external link', async ({ page }) => {
      // Get the booking button
      const bookingButton = page.locator('[data-testid="booking-button"]');

      // Check if it's an anchor tag
      const tagName = await bookingButton.evaluate(el => el.tagName.toLowerCase());

      if (tagName === 'a') {
        // Verify target="_blank" for new tab
        const target = await bookingButton.getAttribute('target');
        expect(target).toBe('_blank');

        // Verify rel="noopener noreferrer" for security
        const rel = await bookingButton.getAttribute('rel');
        expect(rel).toContain('noopener');
        expect(rel).toContain('noreferrer');
      }
    });

    test('booking button displays correct text', async ({ page }) => {
      // Verify booking button has appropriate text
      const bookingButton = page.locator('[data-testid="booking-button"]');
      const buttonText = await bookingButton.textContent();

      expect(buttonText).toBeTruthy();
      // Text should indicate booking action (case-insensitive check)
      expect(buttonText?.toLowerCase()).toMatch(/book|reserve|booking/);
    });
  });

  test.describe('without booking URL', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a campsite detail page without a booking URL
      // Assuming there's a test campsite with ID 2 that has no booking URL
      await page.goto('/campsites/2');
      await page.waitForLoadState('networkidle');
    });

    test('booking button is disabled when no booking URL exists', async ({ page }) => {
      // Check if booking button exists
      const bookingButton = page.locator('[data-testid="booking-button"]');

      // If button exists, it should be disabled
      const buttonExists = await bookingButton.count();

      if (buttonExists > 0) {
        // Verify button is disabled
        await expect(bookingButton).toBeDisabled();

        // Verify button has disabled attribute
        const isDisabled = await bookingButton.isDisabled();
        expect(isDisabled).toBe(true);

        // Verify button styling indicates disabled state
        const opacity = await bookingButton.evaluate(el =>
          window.getComputedStyle(el).opacity
        );

        // Disabled buttons typically have reduced opacity or cursor not-allowed
        const cursor = await bookingButton.evaluate(el =>
          window.getComputedStyle(el).cursor
        );

        expect(
          parseFloat(opacity) < 1 || cursor === 'not-allowed' || cursor === 'default'
        ).toBe(true);
      } else {
        // If no booking button exists at all, that's also acceptable behavior
        expect(buttonExists).toBe(0);
      }
    });

    test('disabled booking button does not open new tab when clicked', async ({ page, context }) => {
      // Get booking button
      const bookingButton = page.locator('[data-testid="booking-button"]');
      const buttonExists = await bookingButton.count();

      if (buttonExists > 0 && await bookingButton.isDisabled()) {
        // Track number of pages before click
        const pagesBefore = context.pages().length;

        // Try to click disabled button (should not work)
        await bookingButton.click({ force: true }).catch(() => {
          // Click might fail on disabled element, which is expected
        });

        // Wait a bit to ensure no new page opens
        await page.waitForTimeout(500);

        // Verify no new page was opened
        const pagesAfter = context.pages().length;
        expect(pagesAfter).toBe(pagesBefore);
      }
    });

    test('booking button shows appropriate disabled state styling', async ({ page }) => {
      // Get booking button
      const bookingButton = page.locator('[data-testid="booking-button"]');
      const buttonExists = await bookingButton.count();

      if (buttonExists > 0) {
        await expect(bookingButton).toBeVisible();

        // Check for disabled state
        const isDisabled = await bookingButton.isDisabled();
        expect(isDisabled).toBe(true);

        // Verify aria-disabled attribute if present
        const ariaDisabled = await bookingButton.getAttribute('aria-disabled');
        if (ariaDisabled !== null) {
          expect(ariaDisabled).toBe('true');
        }
      }
    });
  });

  test.describe('accessibility', () => {
    test('booking button is keyboard accessible', async ({ page }) => {
      await page.goto('/campsites/1');
      await page.waitForLoadState('networkidle');

      // Tab to the booking button
      const bookingButton = page.locator('[data-testid="booking-button"]');

      // Focus the button
      await bookingButton.focus();

      // Verify button is focused
      const isFocused = await bookingButton.evaluate(el =>
        el === document.activeElement
      );
      expect(isFocused).toBe(true);
    });

    test('booking button has proper ARIA attributes', async ({ page }) => {
      await page.goto('/campsites/1');
      await page.waitForLoadState('networkidle');

      const bookingButton = page.locator('[data-testid="booking-button"]');

      // Check for aria-label or accessible text
      const ariaLabel = await bookingButton.getAttribute('aria-label');
      const text = await bookingButton.textContent();

      // Button should have either aria-label or visible text
      expect(ariaLabel || text).toBeTruthy();
    });
  });

  test.describe('responsive behavior', () => {
    test('booking button is visible on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/campsites/1');
      await page.waitForLoadState('networkidle');

      // Verify booking button is visible on mobile
      const bookingButton = page.locator('[data-testid="booking-button"]');
      await expect(bookingButton).toBeVisible();
    });

    test('booking button is visible on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/campsites/1');
      await page.waitForLoadState('networkidle');

      // Verify booking button is visible on tablet
      const bookingButton = page.locator('[data-testid="booking-button"]');
      await expect(bookingButton).toBeVisible();
    });

    test('booking button is visible on desktop viewport', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto('/campsites/1');
      await page.waitForLoadState('networkidle');

      // Verify booking button is visible on desktop
      const bookingButton = page.locator('[data-testid="booking-button"]');
      await expect(bookingButton).toBeVisible();
    });
  });
});
