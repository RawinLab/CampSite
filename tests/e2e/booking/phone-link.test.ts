import { test, expect, devices } from '@playwright/test';

test.describe('Phone Link on Mobile', () => {
  test.use({
    ...devices['iPhone 12'],
  });

  test('should display phone link with correct tel: protocol for campsite without booking URL', async ({ page }) => {
    // Mock API response for campsite detail without booking URL but with phone
    await page.route('**/api/campsites/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-campsite-1',
          name: 'Test Campsite',
          slug: 'test-campsite',
          description: 'A test campsite',
          location: 'Bangkok',
          latitude: 13.7563,
          longitude: 100.5018,
          min_price: 500,
          max_price: 1500,
          check_in_time: '14:00',
          check_out_time: '12:00',
          phone: '0812345678',
          booking_url: null,
          status: 'approved',
          average_rating: 4.5,
          review_count: 10,
          images: [],
          amenities: [],
          accommodation_types: [],
          owner: {
            id: 'owner-1',
            business_name: 'Test Owner',
          },
        }),
      });
    });

    // Mock analytics endpoint
    await page.route('**/api/analytics/track', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    // Navigate to campsite detail page
    await page.goto('/campsites/test-campsite');

    // Find the phone link button
    const phoneButton = page.getByRole('link', { name: /call to book/i });
    await expect(phoneButton).toBeVisible();

    // Verify the tel: protocol is present
    const href = await phoneButton.getAttribute('href');
    expect(href).toBe('tel:0812345678');

    // Verify phone icon is present
    await expect(phoneButton.locator('svg')).toBeVisible();
  });

  test('should format phone number correctly in tel: link', async ({ page }) => {
    // Mock API with different phone number format
    await page.route('**/api/campsites/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-campsite-2',
          name: 'Test Campsite 2',
          slug: 'test-campsite-2',
          description: 'A test campsite',
          location: 'Chiang Mai',
          latitude: 18.7883,
          longitude: 98.9853,
          min_price: 300,
          max_price: 800,
          check_in_time: '14:00',
          check_out_time: '11:00',
          phone: '+66 81 234 5678',
          booking_url: null,
          status: 'approved',
          average_rating: 4.0,
          review_count: 5,
          images: [],
          amenities: [],
          accommodation_types: [],
          owner: {
            id: 'owner-2',
            business_name: 'Test Owner 2',
          },
        }),
      });
    });

    await page.route('**/api/analytics/track', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.goto('/campsites/test-campsite-2');

    const phoneButton = page.getByRole('link', { name: /call to book/i });
    await expect(phoneButton).toBeVisible();

    const href = await phoneButton.getAttribute('href');
    expect(href).toBe('tel:+66 81 234 5678');
  });

  test('should be tappable on mobile viewport', async ({ page }) => {
    await page.route('**/api/campsites/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-campsite-3',
          name: 'Test Campsite 3',
          slug: 'test-campsite-3',
          description: 'A test campsite',
          location: 'Phuket',
          latitude: 7.8804,
          longitude: 98.3923,
          min_price: 1000,
          max_price: 2000,
          check_in_time: '15:00',
          check_out_time: '12:00',
          phone: '0898765432',
          booking_url: null,
          status: 'approved',
          average_rating: 4.8,
          review_count: 20,
          images: [],
          amenities: [],
          accommodation_types: [],
          owner: {
            id: 'owner-3',
            business_name: 'Test Owner 3',
          },
        }),
      });
    });

    await page.route('**/api/analytics/track', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.goto('/campsites/test-campsite-3');

    const phoneButton = page.getByRole('link', { name: /call to book/i });

    // Verify button is visible and enabled
    await expect(phoneButton).toBeVisible();
    await expect(phoneButton).toBeEnabled();

    // Verify button has adequate tap target size (minimum 44x44px for mobile)
    const boundingBox = await phoneButton.boundingBox();
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(40); // Button with size="lg"
      expect(boundingBox.width).toBeGreaterThan(100); // Full width button
    }

    // Verify button is clickable (tap event)
    await expect(phoneButton).toHaveAttribute('href', 'tel:0898765432');
  });

  test('should track analytics when phone link is clicked', async ({ page }) => {
    let analyticsTracked = false;

    await page.route('**/api/campsites/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-campsite-4',
          name: 'Test Campsite 4',
          slug: 'test-campsite-4',
          description: 'A test campsite',
          location: 'Krabi',
          latitude: 8.0863,
          longitude: 98.9063,
          min_price: 600,
          max_price: 1200,
          check_in_time: '14:00',
          check_out_time: '11:00',
          phone: '0876543210',
          booking_url: null,
          status: 'approved',
          average_rating: 4.3,
          review_count: 15,
          images: [],
          amenities: [],
          accommodation_types: [],
          owner: {
            id: 'owner-4',
            business_name: 'Test Owner 4',
          },
        }),
      });
    });

    await page.route('**/api/analytics/track', async (route) => {
      const requestBody = route.request().postDataJSON();
      if (requestBody.campsite_id === 'test-campsite-4' && requestBody.event_type === 'booking_click') {
        analyticsTracked = true;
      }
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.goto('/campsites/test-campsite-4');

    const phoneButton = page.getByRole('link', { name: /call to book/i });
    await phoneButton.click();

    // Verify analytics was tracked
    expect(analyticsTracked).toBe(true);
  });

  test('should not display phone link when campsite has booking URL', async ({ page }) => {
    await page.route('**/api/campsites/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-campsite-5',
          name: 'Test Campsite 5',
          slug: 'test-campsite-5',
          description: 'A test campsite',
          location: 'Pattaya',
          latitude: 12.9236,
          longitude: 100.8825,
          min_price: 800,
          max_price: 1800,
          check_in_time: '14:00',
          check_out_time: '12:00',
          phone: '0823456789',
          booking_url: 'https://booking.example.com',
          status: 'approved',
          average_rating: 4.6,
          review_count: 25,
          images: [],
          amenities: [],
          accommodation_types: [],
          owner: {
            id: 'owner-5',
            business_name: 'Test Owner 5',
          },
        }),
      });
    });

    await page.route('**/api/analytics/track', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.goto('/campsites/test-campsite-5');

    // Should show "Book Now" button instead of phone link
    const bookNowButton = page.getByRole('button', { name: /book now/i });
    await expect(bookNowButton).toBeVisible();

    // Should not show phone link
    const phoneButton = page.getByRole('link', { name: /call to book/i });
    await expect(phoneButton).not.toBeVisible();
  });

  test('should display appropriate styling for mobile touch targets', async ({ page }) => {
    await page.route('**/api/campsites/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-campsite-6',
          name: 'Test Campsite 6',
          slug: 'test-campsite-6',
          description: 'A test campsite',
          location: 'Hua Hin',
          latitude: 12.5657,
          longitude: 99.9577,
          min_price: 700,
          max_price: 1400,
          check_in_time: '15:00',
          check_out_time: '11:00',
          phone: '0891234567',
          booking_url: null,
          status: 'approved',
          average_rating: 4.4,
          review_count: 12,
          images: [],
          amenities: [],
          accommodation_types: [],
          owner: {
            id: 'owner-6',
            business_name: 'Test Owner 6',
          },
        }),
      });
    });

    await page.route('**/api/analytics/track', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.goto('/campsites/test-campsite-6');

    const phoneButton = page.getByRole('link', { name: /call to book/i });

    // Verify button has full width class
    const classes = await phoneButton.getAttribute('class');
    expect(classes).toContain('w-full');

    // Verify phone icon is visible and positioned correctly
    const phoneIcon = phoneButton.locator('svg').first();
    await expect(phoneIcon).toBeVisible();
  });
});
