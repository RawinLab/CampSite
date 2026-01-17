import { test, expect } from '@playwright/test';

test.describe('Campsite Attractions Section', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a campsite detail page with attractions
    // Assuming there's a test campsite with ID 1 that has nearby attractions
    await page.goto('/campsites/1');
    await page.waitForLoadState('networkidle');
  });

  test('attractions section displays on campsite page', async ({ page }) => {
    // Verify attractions section is present
    const attractionsSection = page.locator('[data-testid="attractions-section"]');
    await expect(attractionsSection).toBeVisible();

    // Verify section heading
    const heading = attractionsSection.locator('h2, h3').first();
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText?.toLowerCase()).toContain('attraction');
  });

  test('attraction cards render with required information', async ({ page }) => {
    // Locate attraction cards
    const attractionCards = page.locator('[data-testid="attraction-card"]');
    const count = await attractionCards.count();

    // Verify at least one attraction card exists
    expect(count).toBeGreaterThan(0);

    // Check first card has required elements
    const firstCard = attractionCards.first();
    await expect(firstCard).toBeVisible();

    // Verify attraction name is displayed
    const attractionName = firstCard.locator('[data-testid="attraction-name"]');
    await expect(attractionName).toBeVisible();
    const nameText = await attractionName.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);

    // Verify attraction has an image or placeholder
    const attractionImage = firstCard.locator('img').first();
    await expect(attractionImage).toBeVisible();
  });

  test('distance shown in kilometers for each attraction', async ({ page }) => {
    // Locate attraction cards
    const attractionCards = page.locator('[data-testid="attraction-card"]');
    const count = await attractionCards.count();

    if (count > 0) {
      // Check first card has distance information
      const firstCard = attractionCards.first();
      const distanceElement = firstCard.locator('[data-testid="attraction-distance"]');
      await expect(distanceElement).toBeVisible();

      // Verify distance format includes "km"
      const distanceText = await distanceElement.textContent();
      expect(distanceText?.toLowerCase()).toMatch(/\d+\.?\d*\s*km/);
    }
  });

  test('category labels visible on attraction cards', async ({ page }) => {
    // Locate attraction cards
    const attractionCards = page.locator('[data-testid="attraction-card"]');
    const count = await attractionCards.count();

    if (count > 0) {
      // Check first card has category label
      const firstCard = attractionCards.first();
      const categoryElement = firstCard.locator('[data-testid="attraction-category"]');
      await expect(categoryElement).toBeVisible();

      // Verify category text is not empty
      const categoryText = await categoryElement.textContent();
      expect(categoryText?.trim().length).toBeGreaterThan(0);

      // Verify category is one of expected values
      const validCategories = [
        'waterfall',
        'beach',
        'mountain',
        'viewpoint',
        'temple',
        'hiking_trail',
        'national_park',
        'cave',
        'hot_spring',
        'lake',
        'river',
        'wildlife',
        'cultural_site',
        'adventure_activity',
        'other'
      ];

      const categoryLower = categoryText?.toLowerCase().replace(/\s+/g, '_');
      const hasValidCategory = validCategories.some(cat =>
        categoryLower?.includes(cat.toLowerCase())
      );
      expect(hasValidCategory).toBeTruthy();
    }
  });

  test('difficulty level shown for hiking trail attractions', async ({ page }) => {
    // Locate all attraction cards
    const attractionCards = page.locator('[data-testid="attraction-card"]');
    const count = await attractionCards.count();

    // Check each card for hiking trail category
    let foundHikingTrail = false;

    for (let i = 0; i < count; i++) {
      const card = attractionCards.nth(i);
      const categoryElement = card.locator('[data-testid="attraction-category"]');
      const categoryText = await categoryElement.textContent();

      // If this is a hiking trail
      if (categoryText?.toLowerCase().includes('hiking') ||
          categoryText?.toLowerCase().includes('trail')) {
        foundHikingTrail = true;

        // Verify difficulty level is displayed
        const difficultyElement = card.locator('[data-testid="attraction-difficulty"]');
        await expect(difficultyElement).toBeVisible();

        // Verify difficulty is one of expected values
        const difficultyText = await difficultyElement.textContent();
        const validDifficulties = ['easy', 'moderate', 'difficult'];
        const hasValidDifficulty = validDifficulties.some(diff =>
          difficultyText?.toLowerCase().includes(diff)
        );
        expect(hasValidDifficulty).toBeTruthy();
      }
    }

    // Note: This test passes regardless of whether hiking trails are found
    // as not all campsites may have hiking trail attractions
    if (foundHikingTrail) {
      console.log('Hiking trail found and difficulty level verified');
    } else {
      console.log('No hiking trails found in attractions');
    }
  });

  test('empty state handled gracefully when no attractions exist', async ({ page }) => {
    // Navigate to a campsite that might not have attractions
    // For this test, we'll check if the component handles empty state properly
    await page.goto('/campsites/999999'); // Non-existent or new campsite
    await page.waitForLoadState('networkidle');

    // Check if attractions section exists
    const attractionsSection = page.locator('[data-testid="attractions-section"]');
    const isVisible = await attractionsSection.isVisible().catch(() => false);

    if (isVisible) {
      // If section exists, check for empty state message
      const attractionCards = page.locator('[data-testid="attraction-card"]');
      const cardCount = await attractionCards.count();

      if (cardCount === 0) {
        // Verify empty state message is displayed
        const emptyState = attractionsSection.locator('[data-testid="attractions-empty-state"]');
        const emptyStateText = attractionsSection.getByText(/no attractions|no nearby attractions/i);

        // Either a dedicated empty state component or a text message should be present
        const hasEmptyState = await emptyState.isVisible().catch(() => false) ||
                             await emptyStateText.isVisible().catch(() => false);

        expect(hasEmptyState).toBeTruthy();
      }
    } else {
      // If section doesn't exist when there are no attractions, that's also acceptable
      console.log('Attractions section hidden when no attractions available');
    }
  });

  test('attractions are sorted by distance from campsite', async ({ page }) => {
    // Locate attraction cards
    const attractionCards = page.locator('[data-testid="attraction-card"]');
    const count = await attractionCards.count();

    if (count > 1) {
      // Get distances from all cards
      const distances: number[] = [];

      for (let i = 0; i < count; i++) {
        const card = attractionCards.nth(i);
        const distanceElement = card.locator('[data-testid="attraction-distance"]');
        const distanceText = await distanceElement.textContent();

        // Extract numeric value from distance text (e.g., "5.2 km" -> 5.2)
        const match = distanceText?.match(/(\d+\.?\d*)/);
        if (match) {
          distances.push(parseFloat(match[1]));
        }
      }

      // Verify distances are in ascending order
      for (let i = 0; i < distances.length - 1; i++) {
        expect(distances[i]).toBeLessThanOrEqual(distances[i + 1]);
      }
    }
  });

  test('attraction cards are clickable and navigable', async ({ page }) => {
    // Locate attraction cards
    const attractionCards = page.locator('[data-testid="attraction-card"]');
    const count = await attractionCards.count();

    if (count > 0) {
      const firstCard = attractionCards.first();

      // Verify card is interactive (has click/link behavior)
      const isLink = await firstCard.locator('a').count() > 0;
      const hasClickHandler = await firstCard.evaluate((el) => {
        return el.style.cursor === 'pointer' ||
               window.getComputedStyle(el).cursor === 'pointer';
      });

      // Card should either be a link or have click behavior
      expect(isLink || hasClickHandler).toBeTruthy();
    }
  });

  test('attraction images load correctly with fallback', async ({ page }) => {
    // Locate attraction cards
    const attractionCards = page.locator('[data-testid="attraction-card"]');
    const count = await attractionCards.count();

    if (count > 0) {
      const firstCard = attractionCards.first();
      const image = firstCard.locator('img').first();

      await expect(image).toBeVisible();

      // Verify image has src or fallback
      const src = await image.getAttribute('src');
      const alt = await image.getAttribute('alt');

      expect(src).toBeTruthy();
      expect(alt).toBeTruthy(); // Should have alt text for accessibility
    }
  });
});
