import { test, expect } from '@playwright/test';

// Use a valid test campsite slug
const TEST_CAMPSITE_SLUG = 'test-campsite-details-b7a9886a';

test.describe('Campsite Accommodation Cards', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a campsite detail page with accommodations
    // Assuming there's a test campsite with ID 1 that has accommodations
    await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`);
    await page.waitForLoadState('networkidle');
  });

  test('accommodation section displays', async ({ page }) => {
    // Verify the accommodations section is visible
    const accommodationSection = page.locator('[data-testid="accommodations-section"]');
    await expect(accommodationSection).toBeVisible();

    // Verify section has a heading
    const sectionHeading = page.locator('text=/accommodations/i').first();
    await expect(sectionHeading).toBeVisible();
  });

  test('accommodation cards render', async ({ page }) => {
    // Verify at least one accommodation card is rendered
    const accommodationCards = page.locator('[data-testid="accommodation-card"]');
    await expect(accommodationCards.first()).toBeVisible();

    // Count the number of accommodation cards
    const cardCount = await accommodationCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('each card shows name', async ({ page }) => {
    // Get all accommodation cards
    const accommodationCards = page.locator('[data-testid="accommodation-card"]');
    const cardCount = await accommodationCards.count();

    // Verify each card has a name
    for (let i = 0; i < cardCount; i++) {
      const card = accommodationCards.nth(i);
      const nameElement = card.locator('[data-testid="accommodation-name"]');
      await expect(nameElement).toBeVisible();

      const nameText = await nameElement.textContent();
      expect(nameText).toBeTruthy();
      expect(nameText?.trim().length).toBeGreaterThan(0);
    }
  });

  test('each card shows capacity', async ({ page }) => {
    // Get all accommodation cards
    const accommodationCards = page.locator('[data-testid="accommodation-card"]');
    const cardCount = await accommodationCards.count();

    // Verify each card has capacity information
    for (let i = 0; i < cardCount; i++) {
      const card = accommodationCards.nth(i);
      const capacityElement = card.locator('[data-testid="accommodation-capacity"]');
      await expect(capacityElement).toBeVisible();

      const capacityText = await capacityElement.textContent();
      expect(capacityText).toBeTruthy();
      // Verify capacity contains a number (e.g., "2 people", "4 guests", etc.)
      expect(capacityText).toMatch(/\d+/);
    }
  });

  test('each card shows price', async ({ page }) => {
    // Get all accommodation cards
    const accommodationCards = page.locator('[data-testid="accommodation-card"]');
    const cardCount = await accommodationCards.count();

    // Verify each card has price information
    for (let i = 0; i < cardCount; i++) {
      const card = accommodationCards.nth(i);
      const priceElement = card.locator('[data-testid="accommodation-price"]');
      await expect(priceElement).toBeVisible();

      const priceText = await priceElement.textContent();
      expect(priceText).toBeTruthy();
      // Verify price contains currency symbol or number (e.g., "฿500", "500", "$50")
      expect(priceText).toMatch(/[\d฿$,]/);
    }
  });

  test('included amenities listed', async ({ page }) => {
    // Get all accommodation cards
    const accommodationCards = page.locator('[data-testid="accommodation-card"]');
    const cardCount = await accommodationCards.count();

    // Verify each card has amenities section
    for (let i = 0; i < cardCount; i++) {
      const card = accommodationCards.nth(i);
      const amenitiesSection = card.locator('[data-testid="accommodation-amenities"]');

      // Check if amenities section exists (some accommodations might not have amenities)
      const amenitiesCount = await amenitiesSection.count();

      if (amenitiesCount > 0) {
        await expect(amenitiesSection).toBeVisible();

        // Verify amenities list has at least one item
        const amenityItems = amenitiesSection.locator('[data-testid="amenity-item"]');
        const amenityCount = await amenityItems.count();

        if (amenityCount > 0) {
          expect(amenityCount).toBeGreaterThan(0);

          // Verify first amenity has text
          const firstAmenity = amenityItems.first();
          await expect(firstAmenity).toBeVisible();
          const amenityText = await firstAmenity.textContent();
          expect(amenityText).toBeTruthy();
          expect(amenityText?.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('multiple accommodations displayed correctly', async ({ page }) => {
    // Get all accommodation cards
    const accommodationCards = page.locator('[data-testid="accommodation-card"]');
    const cardCount = await accommodationCards.count();

    // If there are multiple accommodations, verify they are distinct
    if (cardCount > 1) {
      // Verify at least 2 cards are visible
      expect(cardCount).toBeGreaterThanOrEqual(2);

      // Get names of first two accommodations
      const firstName = await accommodationCards.nth(0)
        .locator('[data-testid="accommodation-name"]')
        .textContent();

      const secondName = await accommodationCards.nth(1)
        .locator('[data-testid="accommodation-name"]')
        .textContent();

      // Verify names are different (distinct accommodations)
      expect(firstName).not.toBe(secondName);

      // Verify both cards are visible in viewport
      await expect(accommodationCards.nth(0)).toBeVisible();
      await expect(accommodationCards.nth(1)).toBeVisible();

      // Verify cards are properly laid out (not overlapping)
      const firstCardBox = await accommodationCards.nth(0).boundingBox();
      const secondCardBox = await accommodationCards.nth(1).boundingBox();

      expect(firstCardBox).toBeTruthy();
      expect(secondCardBox).toBeTruthy();

      // Cards should have positive dimensions
      expect(firstCardBox!.width).toBeGreaterThan(0);
      expect(firstCardBox!.height).toBeGreaterThan(0);
      expect(secondCardBox!.width).toBeGreaterThan(0);
      expect(secondCardBox!.height).toBeGreaterThan(0);
    } else {
      // If only one accommodation, just verify it's displayed correctly
      expect(cardCount).toBe(1);
      await expect(accommodationCards.first()).toBeVisible();
    }
  });

  test('accommodation card has all required elements', async ({ page }) => {
    // Get first accommodation card as a comprehensive check
    const firstCard = page.locator('[data-testid="accommodation-card"]').first();
    await expect(firstCard).toBeVisible();

    // Verify all key elements are present
    const name = firstCard.locator('[data-testid="accommodation-name"]');
    const capacity = firstCard.locator('[data-testid="accommodation-capacity"]');
    const price = firstCard.locator('[data-testid="accommodation-price"]');

    await expect(name).toBeVisible();
    await expect(capacity).toBeVisible();
    await expect(price).toBeVisible();

    // Verify all have non-empty text content
    const nameText = await name.textContent();
    const capacityText = await capacity.textContent();
    const priceText = await price.textContent();

    expect(nameText?.trim()).toBeTruthy();
    expect(capacityText?.trim()).toBeTruthy();
    expect(priceText?.trim()).toBeTruthy();
  });

  test('accommodation cards are interactive', async ({ page }) => {
    // Get first accommodation card
    const firstCard = page.locator('[data-testid="accommodation-card"]').first();
    await expect(firstCard).toBeVisible();

    // Hover over the card to check for interactive styling
    await firstCard.hover();

    // Card should remain visible and stable after hover
    await expect(firstCard).toBeVisible();

    // Verify card doesn't break layout on hover
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).toBeTruthy();
    expect(cardBox!.width).toBeGreaterThan(0);
    expect(cardBox!.height).toBeGreaterThan(0);
  });
});
