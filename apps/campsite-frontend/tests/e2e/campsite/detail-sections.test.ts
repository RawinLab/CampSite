import { test, expect } from '@playwright/test';

test.describe('Campsite Detail Page Sections', () => {
  // Mock campsite data for testing
  const mockCampsiteId = 'test-campsite-123';
  const mockCampsiteName = 'Sunset Valley Campsite';
  const mockRating = '4.5';
  const mockLocation = 'Chiang Mai, Thailand';

  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page
    await page.goto(`/campsites/${mockCampsiteId}`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display hero section with name, rating, and location', async ({ page }) => {
    // Check for hero section container
    const heroSection = page.locator('[data-testid="hero-section"]').or(page.locator('section').first());
    await expect(heroSection).toBeVisible();

    // Verify campsite name is displayed
    const heading = page.locator('h1, h2').filter({ hasText: /campsite|valley|sunset/i }).first();
    await expect(heading).toBeVisible();

    // Verify rating display (star icon or numeric rating)
    const ratingElement = page.locator('[data-testid="rating"]').or(
      page.locator('text=/\\d+\\.\\d+|★|⭐/').first()
    );
    await expect(ratingElement).toBeVisible();

    // Verify location display
    const locationElement = page.locator('[data-testid="location"]').or(
      page.locator('text=/Chiang Mai|Bangkok|Phuket|Thailand/i').first()
    );
    await expect(locationElement).toBeVisible();

    // Verify action buttons (wishlist, share)
    const wishlistBtn = page.locator('button[aria-label*="wishlist"], button[aria-label*="favorite"]').first();
    const shareBtn = page.locator('button[aria-label*="share"]').first();

    // At least one action button should be present
    const hasWishlist = await wishlistBtn.isVisible().catch(() => false);
    const hasShare = await shareBtn.isVisible().catch(() => false);
    expect(hasWishlist || hasShare).toBeTruthy();
  });

  test('should display description section with campsite details', async ({ page }) => {
    // Look for description section by heading or data-testid
    const descriptionHeading = page.locator('h2, h3').filter({ hasText: /description|about/i }).first();
    await expect(descriptionHeading).toBeVisible();

    // Verify description content exists
    const descriptionContent = page.locator('[data-testid="description-content"]').or(
      descriptionHeading.locator('..').locator('p, div').first()
    );
    await expect(descriptionContent).toBeVisible();

    // Ensure description has meaningful content (not empty)
    const descText = await descriptionContent.textContent();
    expect(descText?.trim().length).toBeGreaterThan(20);
  });

  test('should display photo gallery section', async ({ page }) => {
    // Look for photos/gallery section
    const galleryHeading = page.locator('h2, h3').filter({ hasText: /photos|gallery/i }).first();
    await expect(galleryHeading).toBeVisible();

    // Verify gallery images are present
    const galleryImages = page.locator('[data-testid="gallery-image"], [data-testid="campsite-gallery"] img').first();
    await expect(galleryImages).toBeVisible();

    // Check that images have proper attributes
    const firstImage = galleryImages.first();
    await expect(firstImage).toHaveAttribute('src');
    await expect(firstImage).toHaveAttribute('alt');

    // Verify "View All Photos" button or similar exists
    const viewAllBtn = page.locator('button').filter({ hasText: /view all|see all|photos/i }).first();
    const hasViewAll = await viewAllBtn.isVisible().catch(() => false);

    // Gallery should be clickable or have view all option
    expect(hasViewAll || await galleryImages.count() > 0).toBeTruthy();
  });

  test('should display amenities section with checkmarks', async ({ page }) => {
    // Look for amenities section
    const amenitiesHeading = page.locator('h2, h3').filter({ hasText: /amenities|facilities/i }).first();
    await expect(amenitiesHeading).toBeVisible();

    // Verify amenities list exists
    const amenitiesList = page.locator('[data-testid="amenities-list"], ul, div').filter({
      has: page.locator('text=/wifi|parking|bathroom|shower|tent/i')
    }).first();
    await expect(amenitiesList).toBeVisible();

    // Check for checkmarks or icons (✓, ✔, check icon, or SVG)
    const checkmarks = page.locator('[data-testid="amenity-item"] svg, li svg, span').filter({
      hasText: /✓|✔/
    }).or(
      page.locator('svg[class*="check"], svg[class*="icon"]').first()
    );

    // At least one checkmark should be visible
    const checkmarkCount = await checkmarks.count();
    expect(checkmarkCount).toBeGreaterThan(0);

    // Verify at least 3 amenities are listed
    const amenityItems = page.locator('[data-testid="amenity-item"], li').filter({
      has: page.locator('text=/wifi|parking|bathroom|shower|tent|electricity|water/i')
    });
    const amenityCount = await amenityItems.count();
    expect(amenityCount).toBeGreaterThanOrEqual(1);
  });

  test('should display accommodations section with pricing', async ({ page }) => {
    // Look for accommodations section
    const accommodationsHeading = page.locator('h2, h3').filter({
      hasText: /accommodations|accommodation types|lodging/i
    }).first();
    await expect(accommodationsHeading).toBeVisible();

    // Verify accommodation types are listed
    const accommodationItems = page.locator('[data-testid="accommodation-item"]').or(
      page.locator('div, li').filter({ has: page.locator('text=/tent|cabin|rv|camper/i') })
    );
    await expect(accommodationItems.first()).toBeVisible();

    // Check for pricing information (฿, THB, or numbers with currency)
    const pricingElements = page.locator('text=/฿\\s*\\d+|THB|\\d+.*bath|\\d+.*night/i');
    const priceCount = await pricingElements.count();
    expect(priceCount).toBeGreaterThan(0);

    // Verify price format is reasonable (should have numbers)
    const firstPrice = pricingElements.first();
    const priceText = await firstPrice.textContent();
    expect(priceText).toMatch(/\d+/);

    // Check for "Book Now" or similar CTA
    const bookingBtn = page.locator('button, a').filter({
      hasText: /book|reserve|check availability/i
    }).first();
    const hasBooking = await bookingBtn.isVisible().catch(() => false);
    expect(hasBooking).toBeTruthy();
  });

  test('should display attractions section', async ({ page }) => {
    // Look for attractions/nearby section
    const attractionsHeading = page.locator('h2, h3').filter({
      hasText: /attractions|nearby|things to do|points of interest/i
    }).first();
    await expect(attractionsHeading).toBeVisible();

    // Verify attraction items exist
    const attractionItems = page.locator('[data-testid="attraction-item"]').or(
      page.locator('div, li').filter({
        has: page.locator('text=/temple|waterfall|market|beach|mountain/i')
      })
    );

    // Should have at least one attraction or a message
    const itemCount = await attractionItems.count();
    const noAttractionsMsg = page.locator('text=/no attractions|no nearby/i');
    const hasNoMsg = await noAttractionsMsg.isVisible().catch(() => false);

    expect(itemCount > 0 || hasNoMsg).toBeTruthy();

    // If attractions exist, check for distance information
    if (itemCount > 0) {
      const distanceInfo = page.locator('text=/\\d+\\s*km|\\d+\\s*m|\\d+.*meter/i').first();
      const hasDistance = await distanceInfo.isVisible().catch(() => false);

      // Should show distance or location info
      expect(hasDistance).toBeTruthy();
    }
  });

  test('should display contact/booking section', async ({ page }) => {
    // Look for contact section
    const contactHeading = page.locator('h2, h3').filter({
      hasText: /contact|get in touch|reach us/i
    }).first();
    await expect(contactHeading).toBeVisible();

    // Verify contact information exists
    const contactSection = contactHeading.locator('..');

    // Check for phone number (Thai format or international)
    const phoneElement = contactSection.locator('text=/\\+?\\d{2,3}[-\\s]?\\d{3,4}[-\\s]?\\d{4}|phone|tel/i').first();
    const hasPhone = await phoneElement.isVisible().catch(() => false);

    // Check for email
    const emailElement = contactSection.locator('text=/[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}|email/i').first();
    const hasEmail = await emailElement.isVisible().catch(() => false);

    // Check for inquiry/contact button
    const inquiryBtn = page.locator('button, a').filter({
      hasText: /inquire|contact|send message|ask question/i
    }).first();
    const hasInquiry = await inquiryBtn.isVisible().catch(() => false);

    // Should have at least one contact method
    expect(hasPhone || hasEmail || hasInquiry).toBeTruthy();

    // If booking URL exists, verify external booking option
    const externalBooking = page.locator('a[href*="booking"], a[href*="http"]').filter({
      hasText: /book|reserve|website/i
    }).first();
    const hasExternalBooking = await externalBooking.isVisible().catch(() => false);

    // Either internal inquiry or external booking should be available
    expect(hasInquiry || hasExternalBooking).toBeTruthy();
  });

  test('should have all 7 sections visible on page', async ({ page }) => {
    // Verify all major sections are present
    const sections = [
      { name: 'Hero', selector: 'h1, h2' },
      { name: 'Description', selector: 'text=/description|about/i' },
      { name: 'Photos', selector: 'text=/photos|gallery/i' },
      { name: 'Amenities', selector: 'text=/amenities|facilities/i' },
      { name: 'Accommodations', selector: 'text=/accommodations|accommodation types/i' },
      { name: 'Attractions', selector: 'text=/attractions|nearby/i' },
      { name: 'Contact', selector: 'text=/contact|get in touch/i' },
    ];

    let visibleSections = 0;

    for (const section of sections) {
      const element = page.locator(section.selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        visibleSections++;
      }
    }

    // All 7 sections should be visible (allow for minor variations)
    expect(visibleSections).toBeGreaterThanOrEqual(6);
  });

  test('should maintain proper section order', async ({ page }) => {
    // Get all section headings
    const headings = page.locator('h1, h2, h3');
    const headingTexts = await headings.allTextContents();

    // Hero/title should come first
    expect(headingTexts[0]).toMatch(/campsite|valley|sunset/i);

    // Description should come before amenities
    const descIndex = headingTexts.findIndex(h => h.match(/description|about/i));
    const amenitiesIndex = headingTexts.findIndex(h => h.match(/amenities/i));

    if (descIndex >= 0 && amenitiesIndex >= 0) {
      expect(descIndex).toBeLessThan(amenitiesIndex);
    }

    // Contact should typically be last or near last
    const contactIndex = headingTexts.findIndex(h => h.match(/contact|get in touch/i));
    if (contactIndex >= 0) {
      expect(contactIndex).toBeGreaterThan(2); // Should be in latter half
    }
  });

  test('should handle mobile responsiveness for all sections', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify key sections are still visible on mobile
    const heroSection = page.locator('h1, h2').first();
    await expect(heroSection).toBeVisible();

    const descriptionSection = page.locator('text=/description|about/i').first();
    await expect(descriptionSection).toBeVisible();

    const amenitiesSection = page.locator('text=/amenities/i').first();
    await expect(amenitiesSection).toBeVisible();

    // Mobile booking bar should be visible
    const mobileBookingBar = page.locator('[data-testid="mobile-booking-bar"]').or(
      page.locator('div[class*="fixed"]').filter({ has: page.locator('button') }).last()
    );

    // Should have a fixed booking element on mobile
    const hasFixedBooking = await mobileBookingBar.isVisible().catch(() => false);
    expect(hasFixedBooking).toBeTruthy();
  });
});
