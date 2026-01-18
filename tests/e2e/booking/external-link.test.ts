import { test, expect } from '@playwright/test';

test.describe('External Booking Link', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'user',
          },
        }),
      });
    });

    // Mock campsite detail with booking URL
    await page.route('**/api/campsites/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'campsite-123',
          name: 'Test Campsite',
          description: 'A test campsite',
          booking_url: 'https://external-booking.com/campsite-123',
          phone: null,
          min_price: 500,
          max_price: 1500,
          average_rating: 4.5,
          review_count: 10,
          check_in_time: '14:00',
          check_out_time: '11:00',
          accommodation_types: [
            { id: '1', name: 'Tent Site', capacity: 4 },
          ],
          address: 'Test Address',
          province: 'Bangkok',
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    });

    // Mock analytics tracking
    await page.route('**/api/analytics/track', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test('external booking link opens in new tab with correct URL', async ({ page, context }) => {
    // Navigate to campsite detail page
    await page.goto('/campsites/campsite-123');

    // Wait for the booking button to be visible
    const bookingButton = page.getByRole('button', { name: /book now/i });
    await expect(bookingButton).toBeVisible();

    // Set up listener for new page/tab
    const newPagePromise = context.waitForEvent('page');

    // Click the booking button
    await bookingButton.click();

    // Wait for new page to be created
    const newPage = await newPagePromise;

    // Verify the new page navigates to the correct booking URL
    await newPage.waitForLoadState();
    expect(newPage.url()).toBe('https://external-booking.com/campsite-123');

    // Clean up
    await newPage.close();
  });

  test('booking button has security attributes (noopener, noreferrer)', async ({ page }) => {
    // Navigate to campsite detail page
    await page.goto('/campsites/campsite-123');

    // Wait for the booking button to be visible
    const bookingButton = page.getByRole('button', { name: /book now/i });
    await expect(bookingButton).toBeVisible();

    // Click handler uses window.open with noopener,noreferrer
    // We verify this by checking the window.open call
    const windowOpenSpy = await page.evaluateHandle(() => {
      const original = window.open;
      const calls: Array<{ url: string; target: string; features: string }> = [];

      window.open = function(url?: string | URL, target?: string, features?: string) {
        calls.push({
          url: url?.toString() || '',
          target: target || '',
          features: features || '',
        });
        return null; // Prevent actual navigation
      };

      return calls;
    });

    // Click the booking button
    await bookingButton.click();

    // Check that window.open was called with correct parameters
    const calls = await page.evaluate((callsArray) => callsArray, windowOpenSpy);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://external-booking.com/campsite-123');
    expect(calls[0].target).toBe('_blank');
    expect(calls[0].features).toContain('noopener');
    expect(calls[0].features).toContain('noreferrer');
  });

  test('tracks analytics event on booking click', async ({ page }) => {
    let analyticsTracked = false;
    let trackedData: any = null;

    // Intercept analytics tracking request
    await page.route('**/api/analytics/track', async (route) => {
      analyticsTracked = true;
      const request = route.request();
      trackedData = JSON.parse(request.postData() || '{}');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Navigate to campsite detail page
    await page.goto('/campsites/campsite-123');

    // Prevent window.open from actually opening a new window
    await page.evaluate(() => {
      window.open = () => null;
    });

    // Click the booking button
    const bookingButton = page.getByRole('button', { name: /book now/i });
    await bookingButton.click();

    // Wait a bit for async analytics call
    await page.waitForTimeout(100);

    // Verify analytics was tracked
    expect(analyticsTracked).toBe(true);
    expect(trackedData).toEqual({
      campsite_id: 'campsite-123',
      event_type: 'booking_click',
    });
  });

  test('shows ExternalLink icon on booking button', async ({ page }) => {
    // Navigate to campsite detail page
    await page.goto('/campsites/campsite-123');

    // Wait for the booking button to be visible
    const bookingButton = page.getByRole('button', { name: /book now/i });
    await expect(bookingButton).toBeVisible();

    // Verify ExternalLink icon is present (lucide-react renders as SVG)
    const icon = bookingButton.locator('svg');
    await expect(icon).toBeVisible();
  });

  test('does not show booking button when booking_url is null', async ({ page }) => {
    // Override mock to return campsite without booking URL
    await page.route('**/api/campsites/campsite-no-booking', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'campsite-no-booking',
          name: 'Test Campsite No Booking',
          description: 'A test campsite without booking URL',
          booking_url: null,
          phone: null,
          min_price: 500,
          max_price: 1500,
          average_rating: 4.5,
          review_count: 10,
          check_in_time: '14:00',
          check_out_time: '11:00',
          accommodation_types: [],
          address: 'Test Address',
          province: 'Bangkok',
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    });

    // Navigate to campsite without booking URL
    await page.goto('/campsites/campsite-no-booking');

    // Verify "Book Now" button is not present
    const bookingButton = page.getByRole('button', { name: /book now/i });
    await expect(bookingButton).not.toBeVisible();

    // Verify "No Booking Available" button is shown instead
    const noBookingButton = page.getByRole('button', { name: /no booking available/i });
    await expect(noBookingButton).toBeVisible();
    await expect(noBookingButton).toBeDisabled();
  });

  test('shows phone booking option when phone is available but no booking URL', async ({ page }) => {
    // Override mock to return campsite with phone but no booking URL
    await page.route('**/api/campsites/campsite-phone-only', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'campsite-phone-only',
          name: 'Test Campsite Phone Only',
          description: 'A test campsite with phone only',
          booking_url: null,
          phone: '+66123456789',
          min_price: 500,
          max_price: 1500,
          average_rating: 4.5,
          review_count: 10,
          check_in_time: '14:00',
          check_out_time: '11:00',
          accommodation_types: [],
          address: 'Test Address',
          province: 'Bangkok',
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    });

    // Navigate to campsite with phone only
    await page.goto('/campsites/campsite-phone-only');

    // Verify "Call to Book" link is shown
    const phoneLink = page.getByRole('link', { name: /call to book/i });
    await expect(phoneLink).toBeVisible();
    await expect(phoneLink).toHaveAttribute('href', 'tel:+66123456789');

    // Verify "Book Now" button is not present
    const bookingButton = page.getByRole('button', { name: /book now/i });
    await expect(bookingButton).not.toBeVisible();
  });
});
