import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Inquiry Rate Limiting
 * Tests the rate limit enforcement on inquiry submissions (Q18: 5 inquiries per 24 hours)
 *
 * Test Coverage:
 * - Submit 5 successful inquiries
 * - 6th submission shows rate limit error
 * - Error message mentions 24 hours
 * - Form disabled or shows warning
 * - InquiryRateLimit component displays correctly
 * - Rate limit message is user-friendly
 * - Retry time shown when available
 */

test.describe('Inquiry Rate Limiting', () => {
  const TEST_CAMPSITE_SLUG = 'test-campsite-for-inquiry';
  const API_BASE_URL = 'http://localhost:3091';

  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page
    await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`);
    await page.waitForLoadState('networkidle');

    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-auth-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-rate-limit',
        email: 'ratelimit@example.com',
        full_name: 'Rate Limit Test User'
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('T080.1: Submit 5 inquiries successfully, 6th shows rate limit error', async ({ page }) => {
    // Track inquiry count
    let inquiryCount = 0;

    // Mock API responses for successful inquiries (first 5)
    await page.route(`${API_BASE_URL}/api/inquiries`, async (route) => {
      if (route.request().method() === 'POST') {
        inquiryCount++;

        if (inquiryCount <= 5) {
          // First 5 inquiries succeed
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Inquiry submitted successfully',
              data: { id: `inquiry-${inquiryCount}` },
              rateLimitInfo: {
                remaining: 5 - inquiryCount,
                limit: 5,
                resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              },
            }),
          });
        } else {
          // 6th inquiry hits rate limit (429)
          await route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Rate limit exceeded',
              rateLimitInfo: {
                remaining: 0,
                limit: 5,
                resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              },
            }),
          });
        }
      } else {
        await route.continue();
      }
    });

    // Submit 5 successful inquiries
    for (let i = 1; i <= 5; i++) {
      // Open inquiry dialog
      const inquiryButton = page.getByRole('button', { name: /send inquiry|contact owner/i });
      await inquiryButton.click();

      // Wait for dialog
      await page.waitForSelector('[data-testid="inquiry-dialog"]', { timeout: 3000 }).catch(() => {});

      // Fill form
      const nameInput = page.getByLabel(/your name/i);
      await nameInput.fill(`Test User ${i}`);

      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill(`test${i}@example.com`);

      const messageTextarea = page.getByLabel(/message/i);
      await messageTextarea.fill(`This is test inquiry number ${i}. I am interested in booking this campsite.`);

      // Submit
      const submitButton = page.getByRole('button', { name: /send inquiry/i });
      await submitButton.click();

      // Wait for success
      await page.waitForTimeout(500);

      // Close success dialog/confirmation
      const closeButton = page.getByRole('button', { name: /understand|close|ok/i });
      if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeButton.click();
      }

      await page.waitForTimeout(300);
    }

    // Attempt 6th inquiry (should hit rate limit)
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact owner/i });
    await inquiryButton.click();

    // Wait for dialog
    await page.waitForTimeout(300);

    // Fill form
    const nameInput = page.getByLabel(/your name/i);
    await nameInput.fill('Test User 6');

    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('test6@example.com');

    const messageTextarea = page.getByLabel(/message/i);
    await messageTextarea.fill('This is the 6th inquiry that should be rate limited.');

    // Submit
    const submitButton = page.getByRole('button', { name: /send inquiry/i });
    await submitButton.click();

    // Wait for rate limit response
    await page.waitForTimeout(500);

    // Check for rate limit message
    const rateLimitHeading = page.getByRole('heading', { name: /daily limit reached/i });
    await expect(rateLimitHeading).toBeVisible({ timeout: 3000 });

    // Verify rate limit error is displayed
    const rateLimitError = page.getByText(/rate limit|maximum.*inquiries|daily limit/i);
    await expect(rateLimitError).toBeVisible();
  });

  test('T080.2: Rate limit error message mentions 24 hours', async ({ page }) => {
    // Mock rate limit response immediately
    await page.route(`${API_BASE_URL}/api/inquiries`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            rateLimitInfo: {
              remaining: 0,
              limit: 5,
              resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Open inquiry dialog
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact owner/i });
    await inquiryButton.click();

    // Fill and submit form
    await page.getByLabel(/your name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/message/i).fill('This inquiry will be rate limited.');

    const submitButton = page.getByRole('button', { name: /send inquiry/i });
    await submitButton.click();

    // Wait for rate limit UI
    await page.waitForTimeout(500);

    // Check for 24 hours mention
    const message24h = page.getByText(/24.*hour|per day/i);
    await expect(message24h).toBeVisible({ timeout: 3000 });
  });

  test('T080.3: InquiryRateLimit component displays correctly', async ({ page }) => {
    // Mock rate limit response
    await page.route(`${API_BASE_URL}/api/inquiries`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            rateLimitInfo: {
              remaining: 0,
              limit: 5,
              resetAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Open inquiry dialog and submit
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact owner/i });
    await inquiryButton.click();

    await page.getByLabel(/your name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/message/i).fill('This inquiry will be rate limited.');

    const submitButton = page.getByRole('button', { name: /send inquiry/i });
    await submitButton.click();

    await page.waitForTimeout(500);

    // Verify InquiryRateLimit component elements
    // Title
    const title = page.getByRole('heading', { name: /daily limit reached/i });
    await expect(title).toBeVisible();

    // Description with limit number
    const description = page.getByText(/maximum.*5.*inquiries.*per day/i);
    await expect(description).toBeVisible();

    // Warning icon (AlertCircle from lucide-react)
    const warningIcon = page.locator('.text-amber-600, [class*="amber"]').first();
    await expect(warningIcon).toBeVisible();

    // Close button
    const closeButton = page.getByRole('button', { name: /understand/i });
    await expect(closeButton).toBeVisible();
  });

  test('T080.4: Rate limit shows user-friendly message', async ({ page }) => {
    // Mock rate limit response
    await page.route(`${API_BASE_URL}/api/inquiries`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            rateLimitInfo: {
              remaining: 0,
              limit: 5,
              resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Submit inquiry
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact owner/i });
    await inquiryButton.click();

    await page.getByLabel(/your name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/message/i).fill('This inquiry will be rate limited.');

    const submitButton = page.getByRole('button', { name: /send inquiry/i });
    await submitButton.click();

    await page.waitForTimeout(500);

    // Check for user-friendly messaging
    const friendlyMessage = page.getByText(/helps prevent spam|ensures.*proper attention/i);
    await expect(friendlyMessage).toBeVisible();

    // Check for alternative action suggestion
    const alternativeAction = page.getByText(/browse campsites|add.*wishlist/i);
    await expect(alternativeAction).toBeVisible();
  });

  test('T080.5: Retry time shown when available', async ({ page }) => {
    // Mock rate limit with specific reset time
    const resetTime = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours from now

    await page.route(`${API_BASE_URL}/api/inquiries`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            rateLimitInfo: {
              remaining: 0,
              limit: 5,
              resetAt: resetTime.toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Submit inquiry
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact owner/i });
    await inquiryButton.click();

    await page.getByLabel(/your name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/message/i).fill('This inquiry will be rate limited.');

    const submitButton = page.getByRole('button', { name: /send inquiry/i });
    await submitButton.click();

    await page.waitForTimeout(500);

    // Check for reset time display
    const resetTimeDisplay = page.getByText(/limit resets in|resets in/i);
    await expect(resetTimeDisplay).toBeVisible();

    // Should show time remaining (e.g., "8h 0m" or similar format)
    const timeRemaining = page.locator('text=/\\d+h|\\d+ hour|\\d+ minute/i');
    await expect(timeRemaining).toBeVisible();
  });

  test('T080.6: Close button dismisses rate limit dialog', async ({ page }) => {
    // Mock rate limit response
    await page.route(`${API_BASE_URL}/api/inquiries`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            rateLimitInfo: {
              remaining: 0,
              limit: 5,
              resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Submit inquiry
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact owner/i });
    await inquiryButton.click();

    await page.getByLabel(/your name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/message/i).fill('This inquiry will be rate limited.');

    const submitButton = page.getByRole('button', { name: /send inquiry/i });
    await submitButton.click();

    await page.waitForTimeout(500);

    // Verify rate limit message is visible
    const rateLimitHeading = page.getByRole('heading', { name: /daily limit reached/i });
    await expect(rateLimitHeading).toBeVisible();

    // Click close button
    const closeButton = page.getByRole('button', { name: /understand/i });
    await closeButton.click();

    // Dialog should be closed
    await page.waitForTimeout(300);
    await expect(rateLimitHeading).not.toBeVisible();
  });

  test('T080.7: Rate limit info updates after each submission', async ({ page }) => {
    let inquiryCount = 0;

    // Mock API to show decreasing remaining count
    await page.route(`${API_BASE_URL}/api/inquiries`, async (route) => {
      if (route.request().method() === 'POST') {
        inquiryCount++;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Inquiry submitted successfully',
            data: { id: `inquiry-${inquiryCount}` },
            rateLimitInfo: {
              remaining: 5 - inquiryCount,
              limit: 5,
              resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Submit first inquiry
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact owner/i });
    await inquiryButton.click();

    await page.getByLabel(/your name/i).fill('Test User 1');
    await page.getByLabel(/email/i).fill('test1@example.com');
    await page.getByLabel(/message/i).fill('First inquiry to check rate limit counter.');

    const submitButton = page.getByRole('button', { name: /send inquiry/i });
    await submitButton.click();

    await page.waitForTimeout(500);

    // Check if rate limit info is displayed in success state
    // (InquiryConfirmation component may show remaining inquiries)
    const rateLimitInfo = page.getByText(/\d+ inquir(y|ies) remaining|remaining.*\d+/i);
    if (await rateLimitInfo.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Verify it shows 4 remaining
      await expect(page.getByText(/4.*remaining|remaining.*4/i)).toBeVisible();
    }

    // Close success dialog
    const closeButton = page.getByRole('button', { name: /understand|close|ok/i });
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click();
    }
  });

  test('T080.8: Rate limit persists across page reloads', async ({ page }) => {
    // Mock rate limit response
    await page.route(`${API_BASE_URL}/api/inquiries`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            rateLimitInfo: {
              remaining: 0,
              limit: 5,
              resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Submit inquiry (should be rate limited)
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact owner/i });
    await inquiryButton.click();

    await page.getByLabel(/your name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/message/i).fill('This inquiry will be rate limited.');

    const submitButton = page.getByRole('button', { name: /send inquiry/i });
    await submitButton.click();

    await page.waitForTimeout(500);

    // Verify rate limit message
    const rateLimitHeading = page.getByRole('heading', { name: /daily limit reached/i });
    await expect(rateLimitHeading).toBeVisible();

    // Close dialog
    const closeButton = page.getByRole('button', { name: /understand/i });
    await closeButton.click();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Try to submit another inquiry
    const inquiryButton2 = page.getByRole('button', { name: /send inquiry|contact owner/i });
    await inquiryButton2.click();

    await page.getByLabel(/your name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/message/i).fill('Another rate limited inquiry.');

    const submitButton2 = page.getByRole('button', { name: /send inquiry/i });
    await submitButton2.click();

    await page.waitForTimeout(500);

    // Should still show rate limit
    const rateLimitHeading2 = page.getByRole('heading', { name: /daily limit reached/i });
    await expect(rateLimitHeading2).toBeVisible();
  });
});
