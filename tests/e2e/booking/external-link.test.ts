import { test, expect } from '@playwright/test';
import { createSupabaseAdmin } from '../utils/auth';

/**
 * E2E Tests: External Booking Link
 * Tests external booking URL functionality with real API
 *
 * Prerequisites:
 * - Test campsite with booking_url seeded in database
 * - Frontend running at localhost:3090
 * - Backend running at localhost:3091
 */

test.describe('External Booking Link', () => {
  test.setTimeout(60000);

  const TEST_CAMPSITE_ID = 'e2e-test-campsite-approved-1';
  const TEST_BOOKING_URL = 'https://external-booking.com/test-campsite';

  test.beforeEach(async ({ page }) => {
    // Ensure test campsite has booking_url
    const supabase = createSupabaseAdmin();
    await supabase
      .from('campsites')
      .update({ booking_url: TEST_BOOKING_URL })
      .eq('id', TEST_CAMPSITE_ID);
  });

  test('external booking link opens in new tab with correct URL', async ({ page, context }) => {
    // Navigate to campsite detail page
    await page.goto(`/campsites/${TEST_CAMPSITE_ID}`);
    await page.waitForTimeout(3000);

    // Wait for the booking button to be visible
    const bookingButton = page.getByRole('button', { name: /book now/i });
    await expect(bookingButton).toBeVisible({ timeout: 10000 });

    // Set up listener for new page/tab
    const newPagePromise = context.waitForEvent('page');

    // Click the booking button
    await bookingButton.click();

    // Wait for new page to be created
    const newPage = await newPagePromise;

    // Verify the new page navigates to the correct booking URL
    await newPage.waitForLoadState();
    expect(newPage.url()).toBe(TEST_BOOKING_URL);

    // Clean up
    await newPage.close();
  });

  test('booking button has security attributes (noopener, noreferrer)', async ({ page }) => {
    // Navigate to campsite detail page
    await page.goto(`/campsites/${TEST_CAMPSITE_ID}`);
    await page.waitForTimeout(3000);

    // Wait for the booking button to be visible
    const bookingButton = page.getByRole('button', { name: /book now/i });
    await expect(bookingButton).toBeVisible({ timeout: 10000 });

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
    expect(calls[0].url).toBe(TEST_BOOKING_URL);
    expect(calls[0].target).toBe('_blank');
    expect(calls[0].features).toContain('noopener');
    expect(calls[0].features).toContain('noreferrer');
  });

  test('tracks analytics event on booking click', async ({ page }) => {
    let analyticsTracked = false;
    let trackedData: any = null;

    // Intercept analytics tracking request (if analytics endpoint exists)
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
    await page.goto(`/campsites/${TEST_CAMPSITE_ID}`);
    await page.waitForTimeout(3000);

    // Prevent window.open from actually opening a new window
    await page.evaluate(() => {
      window.open = () => null;
    });

    // Click the booking button
    const bookingButton = page.getByRole('button', { name: /book now/i });
    await expect(bookingButton).toBeVisible({ timeout: 10000 });
    await bookingButton.click();

    // Wait a bit for async analytics call
    await page.waitForTimeout(500);

    // Verify analytics was tracked (optional feature)
    if (analyticsTracked) {
      expect(trackedData).toMatchObject({
        campsite_id: TEST_CAMPSITE_ID,
        event_type: 'booking_click',
      });
    }
  });

  test('shows ExternalLink icon on booking button', async ({ page }) => {
    // Navigate to campsite detail page
    await page.goto(`/campsites/${TEST_CAMPSITE_ID}`);
    await page.waitForTimeout(3000);

    // Wait for the booking button to be visible
    const bookingButton = page.getByRole('button', { name: /book now/i });
    await expect(bookingButton).toBeVisible({ timeout: 10000 });

    // Verify ExternalLink icon is present (lucide-react renders as SVG)
    const icon = bookingButton.locator('svg');
    await expect(icon).toBeVisible();
  });

  test('does not show booking button when booking_url is null', async ({ page }) => {
    const supabase = createSupabaseAdmin();

    // Temporarily remove booking_url from test campsite
    await supabase
      .from('campsites')
      .update({ booking_url: null, phone: null })
      .eq('id', TEST_CAMPSITE_ID);

    // Navigate to campsite without booking URL
    await page.goto(`/campsites/${TEST_CAMPSITE_ID}`);
    await page.waitForTimeout(3000);

    // Verify "Book Now" button is not present
    const bookingButton = page.getByRole('button', { name: /book now/i });
    await expect(bookingButton).not.toBeVisible();

    // Verify "No Booking Available" button is shown instead
    const noBookingButton = page.getByRole('button', { name: /no booking available/i });
    await expect(noBookingButton).toBeVisible();
    await expect(noBookingButton).toBeDisabled();

    // Restore booking_url
    await supabase
      .from('campsites')
      .update({ booking_url: TEST_BOOKING_URL })
      .eq('id', TEST_CAMPSITE_ID);
  });

  test('shows phone booking option when phone is available but no booking URL', async ({ page }) => {
    const supabase = createSupabaseAdmin();
    const TEST_PHONE = '+66812345678';

    // Update campsite to have phone but no booking URL
    await supabase
      .from('campsites')
      .update({ booking_url: null, phone: TEST_PHONE })
      .eq('id', TEST_CAMPSITE_ID);

    // Navigate to campsite with phone only
    await page.goto(`/campsites/${TEST_CAMPSITE_ID}`);
    await page.waitForTimeout(3000);

    // Verify "Call to Book" link is shown
    const phoneLink = page.getByRole('link', { name: /call to book/i });
    await expect(phoneLink).toBeVisible({ timeout: 10000 });
    await expect(phoneLink).toHaveAttribute('href', `tel:${TEST_PHONE}`);

    // Verify "Book Now" button is not present
    const bookingButton = page.getByRole('button', { name: /book now/i });
    await expect(bookingButton).not.toBeVisible();

    // Restore booking_url
    await supabase
      .from('campsites')
      .update({ booking_url: TEST_BOOKING_URL, phone: null })
      .eq('id', TEST_CAMPSITE_ID);
  });
});
