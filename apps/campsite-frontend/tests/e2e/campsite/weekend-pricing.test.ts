import { test, expect } from '@playwright/test';

/**
 * E2E Test: Weekend Pricing Display
 *
 * Tests weekend pricing functionality for accommodation types:
 * 1. Weekday price displayed
 * 2. Weekend price shown if different
 * 3. Price formatting correct (Thai Baht)
 * 4. Price difference indicator visible
 * 5. Both prices visible in accommodation card
 */

test.describe('Weekend Pricing Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a campsite detail page
    // Note: This assumes a campsite with ID exists.
    // In real implementation, you should seed test data or use fixtures
    await page.goto('/campsites/test-campsite-id');
    await page.waitForLoadState('networkidle');
  });

  test('should display weekday price for accommodation', async ({ page }) => {
    // Locate the accommodation types section
    const accommodationSection = page.locator('[data-testid="accommodation-types"]');
    await expect(accommodationSection).toBeVisible();

    // Find the first accommodation card
    const accommodationCard = accommodationSection.locator('[data-testid="accommodation-card"]').first();
    await expect(accommodationCard).toBeVisible();

    // Verify weekday price is displayed
    const weekdayPrice = accommodationCard.locator('[data-testid="weekday-price"]');
    await expect(weekdayPrice).toBeVisible();

    // Verify price contains Thai Baht symbol
    const priceText = await weekdayPrice.textContent();
    expect(priceText).toMatch(/฿\s*[\d,]+/);
  });

  test('should display weekend price if different from weekday', async ({ page }) => {
    // Locate accommodation card with weekend pricing
    const accommodationCard = page.locator('[data-testid="accommodation-card"]').first();

    // Check if weekend price exists
    const weekendPrice = accommodationCard.locator('[data-testid="weekend-price"]');

    // If weekend price is present, verify it's visible and formatted
    const isWeekendPriceVisible = await weekendPrice.isVisible().catch(() => false);

    if (isWeekendPriceVisible) {
      await expect(weekendPrice).toBeVisible();

      // Verify weekend price formatting
      const weekendPriceText = await weekendPrice.textContent();
      expect(weekendPriceText).toMatch(/฿\s*[\d,]+/);

      // Verify weekend price is different from weekday
      const weekdayPrice = accommodationCard.locator('[data-testid="weekday-price"]');
      const weekdayPriceText = await weekdayPrice.textContent();
      expect(weekendPriceText).not.toBe(weekdayPriceText);
    }
  });

  test('should format prices correctly in Thai Baht', async ({ page }) => {
    const accommodationCards = page.locator('[data-testid="accommodation-card"]');
    const cardCount = await accommodationCards.count();

    expect(cardCount).toBeGreaterThan(0);

    // Check each accommodation card for proper price formatting
    for (let i = 0; i < cardCount; i++) {
      const card = accommodationCards.nth(i);

      // Weekday price
      const weekdayPrice = card.locator('[data-testid="weekday-price"]');
      const weekdayText = await weekdayPrice.textContent();

      // Verify format: ฿ followed by comma-separated number
      expect(weekdayText).toMatch(/฿\s*[\d,]+/);

      // Verify no decimal places (Thai Baht doesn't use decimals typically)
      expect(weekdayText).not.toMatch(/\.\d+/);

      // Weekend price (if exists)
      const weekendPrice = card.locator('[data-testid="weekend-price"]');
      const isWeekendVisible = await weekendPrice.isVisible().catch(() => false);

      if (isWeekendVisible) {
        const weekendText = await weekendPrice.textContent();
        expect(weekendText).toMatch(/฿\s*[\d,]+/);
        expect(weekendText).not.toMatch(/\.\d+/);
      }
    }
  });

  test('should show price difference indicator when weekend price differs', async ({ page }) => {
    const accommodationCards = page.locator('[data-testid="accommodation-card"]');
    const cardCount = await accommodationCards.count();

    for (let i = 0; i < cardCount; i++) {
      const card = accommodationCards.nth(i);

      // Check if weekend price exists
      const weekendPrice = card.locator('[data-testid="weekend-price"]');
      const isWeekendVisible = await weekendPrice.isVisible().catch(() => false);

      if (isWeekendVisible) {
        // Look for price difference indicator (e.g., badge, label, icon)
        const priceDiffIndicator = card.locator('[data-testid="price-difference-indicator"]');
        await expect(priceDiffIndicator).toBeVisible();

        // Verify indicator has appropriate text
        const indicatorText = await priceDiffIndicator.textContent();
        expect(indicatorText).toBeTruthy();
      }
    }
  });

  test('should display both prices clearly in accommodation card layout', async ({ page }) => {
    const accommodationCard = page.locator('[data-testid="accommodation-card"]').first();
    await expect(accommodationCard).toBeVisible();

    // Verify card contains name
    const accommodationName = accommodationCard.locator('[data-testid="accommodation-name"]');
    await expect(accommodationName).toBeVisible();

    // Verify card contains capacity
    const capacity = accommodationCard.locator('[data-testid="accommodation-capacity"]');
    await expect(capacity).toBeVisible();

    // Verify weekday price is visible
    const weekdayPrice = accommodationCard.locator('[data-testid="weekday-price"]');
    await expect(weekdayPrice).toBeVisible();

    // Get card bounding box to verify layout
    const cardBox = await accommodationCard.boundingBox();
    expect(cardBox).toBeTruthy();
    expect(cardBox!.width).toBeGreaterThan(0);
    expect(cardBox!.height).toBeGreaterThan(0);

    // Verify prices are within the card boundaries
    const weekdayPriceBox = await weekdayPrice.boundingBox();
    expect(weekdayPriceBox).toBeTruthy();
    expect(weekdayPriceBox!.y).toBeGreaterThanOrEqual(cardBox!.y);
    expect(weekdayPriceBox!.y + weekdayPriceBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height);
  });

  test('should display price labels for weekday and weekend', async ({ page }) => {
    const accommodationCard = page.locator('[data-testid="accommodation-card"]').first();

    // Check for weekday label
    const weekdayLabel = accommodationCard.locator('[data-testid="weekday-label"]');
    const weekdayLabelText = await weekdayLabel.textContent().catch(() => null);

    if (weekdayLabelText) {
      expect(weekdayLabelText.toLowerCase()).toMatch(/weekday|จันทร์-ศุกร์|mon-fri/);
    }

    // Check for weekend label (if weekend price exists)
    const weekendPrice = accommodationCard.locator('[data-testid="weekend-price"]');
    const isWeekendVisible = await weekendPrice.isVisible().catch(() => false);

    if (isWeekendVisible) {
      const weekendLabel = accommodationCard.locator('[data-testid="weekend-label"]');
      const weekendLabelText = await weekendLabel.textContent();
      expect(weekendLabelText?.toLowerCase()).toMatch(/weekend|เสาร์-อาทิตย์|sat-sun/);
    }
  });

  test('should handle mobile viewport for weekend pricing', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const accommodationCard = page.locator('[data-testid="accommodation-card"]').first();
    await expect(accommodationCard).toBeVisible();

    // Verify weekday price visible on mobile
    const weekdayPrice = accommodationCard.locator('[data-testid="weekday-price"]');
    await expect(weekdayPrice).toBeVisible();

    // Verify weekend price visible on mobile (if exists)
    const weekendPrice = accommodationCard.locator('[data-testid="weekend-price"]');
    const isWeekendVisible = await weekendPrice.isVisible().catch(() => false);

    if (isWeekendVisible) {
      await expect(weekendPrice).toBeVisible();

      // Verify prices don't overflow on mobile
      const cardBox = await accommodationCard.boundingBox();
      const weekdayBox = await weekdayPrice.boundingBox();
      const weekendBox = await weekendPrice.boundingBox();

      expect(weekdayBox!.x + weekdayBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width);
      expect(weekendBox!.x + weekendBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width);
    }
  });

  test('should display price per night indicator', async ({ page }) => {
    const accommodationCards = page.locator('[data-testid="accommodation-card"]');
    const firstCard = accommodationCards.first();

    // Look for "per night" or equivalent text
    const perNightText = await firstCard.textContent();
    expect(perNightText).toMatch(/per night|\/night|ต่อคืน/i);
  });

  test('should maintain price visibility when hovering over accommodation card', async ({ page }) => {
    const accommodationCard = page.locator('[data-testid="accommodation-card"]').first();

    // Get initial visibility
    const weekdayPrice = accommodationCard.locator('[data-testid="weekday-price"]');
    await expect(weekdayPrice).toBeVisible();

    // Hover over card
    await accommodationCard.hover();

    // Verify price still visible after hover
    await expect(weekdayPrice).toBeVisible();

    // Check weekend price if exists
    const weekendPrice = accommodationCard.locator('[data-testid="weekend-price"]');
    const isWeekendVisible = await weekendPrice.isVisible().catch(() => false);

    if (isWeekendVisible) {
      await expect(weekendPrice).toBeVisible();
    }
  });

  test('should display correct number formatting with thousand separators', async ({ page }) => {
    const accommodationCard = page.locator('[data-testid="accommodation-card"]').first();
    const weekdayPrice = accommodationCard.locator('[data-testid="weekday-price"]');

    const priceText = await weekdayPrice.textContent();

    // Extract numeric value
    const numericPart = priceText?.replace(/[^\d,]/g, '');

    // If price is 1000 or more, should have comma separator
    if (numericPart && numericPart.replace(/,/g, '').length >= 4) {
      expect(numericPart).toMatch(/\d{1,3}(,\d{3})*/);
    }
  });
});

test.describe('Weekend Pricing - Search Results', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search/browse page
    await page.goto('/campsites');
    await page.waitForLoadState('networkidle');
  });

  test('should display weekend pricing in search result cards', async ({ page }) => {
    const resultCards = page.locator('[data-testid="campsite-card"]');
    const cardCount = await resultCards.count();

    expect(cardCount).toBeGreaterThan(0);

    // Check first result card
    const firstCard = resultCards.first();
    await expect(firstCard).toBeVisible();

    // Look for price information
    const priceDisplay = firstCard.locator('[data-testid="price-display"]');
    await expect(priceDisplay).toBeVisible();

    // Verify Thai Baht symbol
    const priceText = await priceDisplay.textContent();
    expect(priceText).toMatch(/฿/);
  });

  test('should show price range when multiple accommodation types exist', async ({ page }) => {
    const resultCard = page.locator('[data-testid="campsite-card"]').first();

    // Look for price range display (e.g., "฿1,500 - ฿3,000")
    const priceDisplay = resultCard.locator('[data-testid="price-display"]');
    const priceText = await priceDisplay.textContent();

    // Could be single price or range
    const hasPriceRange = priceText?.includes('-') || priceText?.includes('to');
    const hasSinglePrice = /฿\s*[\d,]+/.test(priceText || '');

    expect(hasPriceRange || hasSinglePrice).toBeTruthy();
  });
});
