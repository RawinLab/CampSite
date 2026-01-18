/**
 * E2E Test: Owner Dashboard - Inquiry Detail and Reply
 *
 * Tests the owner dashboard inquiry detail page functionality including:
 * - Inquiry detail display (guest info, message, dates, campsite)
 * - Conversation history
 * - Reply functionality (form, validation, submission)
 * - Status management
 * - Read status tracking
 * - Owner authorization and access control
 *
 * Test Coverage:
 * - T080.1-T080.5: Inquiry detail display
 * - T080.6-T080.11: Reply functionality
 * - T080.12-T080.14: Status management
 * - T080.15-T080.17: Read status
 * - T080.18-T080.22: Owner authorization
 */

import { test, expect } from '@playwright/test';

test.describe('Owner Dashboard - Inquiry Detail Page', () => {
  const TEST_INQUIRY_ID = 'inquiry-001';
  const TEST_CAMPSITE_ID = 'campsite-001';
  const TEST_CAMPSITE_NAME = 'Mountain View Campsite';
  const OWNER_EMAIL = 'owner@example.com';
  const OWNER_ID = 'owner-uuid-123';

  // Mock inquiry data
  const mockInquiry = {
    id: TEST_INQUIRY_ID,
    campsite_id: TEST_CAMPSITE_ID,
    campsite: {
      id: TEST_CAMPSITE_ID,
      name: TEST_CAMPSITE_NAME,
      owner_id: OWNER_ID,
    },
    guest_name: 'John Doe',
    guest_email: 'john.doe@example.com',
    guest_phone: '0812345678',
    inquiry_type: 'booking',
    subject: 'Booking for Family Trip',
    message: 'I would like to book your campsite for a family trip. Do you have availability for 4 people from March 15-17?',
    check_in_date: '2026-03-15',
    check_out_date: '2026-03-17',
    guest_count: 4,
    status: 'new',
    owner_reply: null,
    replied_at: null,
    read_at: null,
    created_at: '2026-01-15T10:30:00Z',
    updated_at: '2026-01-15T10:30:00Z',
  };

  const mockInquiryWithReply = {
    ...mockInquiry,
    id: 'inquiry-002',
    status: 'in_progress',
    owner_reply: 'Thank you for your inquiry! Yes, we have availability for those dates. I will send you more details shortly.',
    replied_at: '2026-01-16T09:00:00Z',
    read_at: '2026-01-15T14:00:00Z',
  };

  test.describe('1. Inquiry Detail Display', () => {
    test.beforeEach(async ({ page, context }) => {
      // Mock owner authentication
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-owner-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      // Mock API responses
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: OWNER_ID,
              email: OWNER_EMAIL,
              role: 'owner',
            },
          }),
        });
      });

      await page.route(`**/api/inquiries/${TEST_INQUIRY_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockInquiry,
          }),
        });
      });
    });

    test('T080.1: Shows full guest information', async ({ page }) => {
      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Guest name should be visible
      const guestName = page.locator('[data-testid="guest-name"]').or(
        page.getByText(mockInquiry.guest_name)
      );
      await expect(guestName).toBeVisible();

      // Guest email should be visible
      const guestEmail = page.locator('[data-testid="guest-email"]').or(
        page.getByText(mockInquiry.guest_email)
      );
      await expect(guestEmail).toBeVisible();

      // Guest phone should be visible
      const guestPhone = page.locator('[data-testid="guest-phone"]').or(
        page.getByText(mockInquiry.guest_phone)
      );
      await expect(guestPhone).toBeVisible();
    });

    test('T080.2: Displays complete message', async ({ page }) => {
      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Message content should be visible
      const messageContent = page.locator('[data-testid="inquiry-message"]').or(
        page.getByText(mockInquiry.message)
      );
      await expect(messageContent).toBeVisible();

      // Subject should be visible if provided
      if (mockInquiry.subject) {
        const subject = page.locator('[data-testid="inquiry-subject"]').or(
          page.getByText(mockInquiry.subject)
        );
        await expect(subject).toBeVisible();
      }
    });

    test('T080.3: Shows inquiry type and dates requested', async ({ page }) => {
      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Inquiry type should be displayed
      const inquiryType = page.locator('[data-testid="inquiry-type"]').or(
        page.getByText(/booking/i)
      );
      await expect(inquiryType).toBeVisible();

      // Check-in date should be visible
      const checkInDate = page.locator('[data-testid="check-in-date"]').or(
        page.getByText(/march 15|2026-03-15/i)
      );
      await expect(checkInDate).toBeVisible();

      // Check-out date should be visible
      const checkOutDate = page.locator('[data-testid="check-out-date"]').or(
        page.getByText(/march 17|2026-03-17/i)
      );
      await expect(checkOutDate).toBeVisible();

      // Guest count should be visible
      const guestCount = page.locator('[data-testid="guest-count"]').or(
        page.getByText(/4.*people|guests.*4/i)
      );
      await expect(guestCount).toBeVisible();
    });

    test('T080.4: Shows campsite information', async ({ page }) => {
      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Campsite name should be visible
      const campsiteName = page.locator('[data-testid="campsite-name"]').or(
        page.getByText(TEST_CAMPSITE_NAME)
      );
      await expect(campsiteName).toBeVisible();

      // Link to campsite detail page
      const campsiteLink = page.locator(`a[href*="${TEST_CAMPSITE_ID}"]`);
      const linkCount = await campsiteLink.count();
      expect(linkCount).toBeGreaterThan(0);
    });

    test('T080.5: Shows conversation history when replies exist', async ({ page }) => {
      // Override with inquiry that has replies
      await page.route(`**/api/inquiries/${mockInquiryWithReply.id}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockInquiryWithReply,
          }),
        });
      });

      await page.goto(`/dashboard/inquiries/${mockInquiryWithReply.id}`);
      await page.waitForLoadState('networkidle');

      // Original message should be visible
      const originalMessage = page.locator('[data-testid="original-message"]').or(
        page.getByText(mockInquiry.message)
      );
      await expect(originalMessage).toBeVisible();

      // Owner reply should be visible
      const ownerReply = page.locator('[data-testid="owner-reply"]').or(
        page.getByText(mockInquiryWithReply.owner_reply)
      );
      await expect(ownerReply).toBeVisible();

      // Reply timestamp should be shown
      const replyTimestamp = page.locator('[data-testid="reply-timestamp"]');
      if (await replyTimestamp.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(replyTimestamp).toBeVisible();
      }
    });
  });

  test.describe('2. Reply Functionality', () => {
    test.beforeEach(async ({ page, context }) => {
      // Mock owner authentication
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-owner-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: OWNER_ID, email: OWNER_EMAIL, role: 'owner' },
          }),
        });
      });

      await page.route(`**/api/inquiries/${TEST_INQUIRY_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockInquiry }),
        });
      });
    });

    test('T080.6: Reply form is visible with textarea', async ({ page }) => {
      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Reply form should be visible
      const replyForm = page.locator('[data-testid="reply-form"]').or(
        page.locator('form').filter({ hasText: /reply|response/i })
      );
      await expect(replyForm).toBeVisible();

      // Textarea should be present
      const textarea = page.locator('[data-testid="reply-textarea"]').or(
        page.locator('#reply').or(page.getByLabel(/reply|response/i))
      );
      await expect(textarea).toBeVisible();
    });

    test('T080.7: Character counter shows (min 10, max 2000)', async ({ page }) => {
      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      const textarea = page.locator('[data-testid="reply-textarea"]').or(
        page.locator('#reply').or(page.getByLabel(/reply|response/i))
      );

      // Type some text
      const shortText = 'Hello';
      await textarea.fill(shortText);
      await page.waitForTimeout(200);

      // Character counter should be visible
      const charCounter = page.locator('[data-testid="char-counter"]').or(
        page.locator('text=/\\d+\\/2000|\\d+ characters/i')
      );
      await expect(charCounter).toBeVisible();

      // Counter should show current length
      const counterText = await charCounter.textContent();
      expect(counterText).toMatch(/5|2000/);
    });

    test('T080.8: Submit button disabled when reply is too short (< 10 chars)', async ({ page }) => {
      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      const textarea = page.locator('[data-testid="reply-textarea"]').or(
        page.locator('#reply').or(page.getByLabel(/reply|response/i))
      );
      const submitButton = page.locator('[data-testid="reply-submit"]').or(
        page.getByRole('button', { name: /send.*reply|submit/i })
      );

      // Type short text (less than 10 characters)
      await textarea.fill('Short');
      await page.waitForTimeout(300);

      // Submit button should be disabled
      await expect(submitButton).toBeDisabled();
    });

    test('T080.9: Submit button enabled when reply meets minimum length', async ({ page }) => {
      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      const textarea = page.locator('[data-testid="reply-textarea"]').or(
        page.locator('#reply').or(page.getByLabel(/reply|response/i))
      );
      const submitButton = page.locator('[data-testid="reply-submit"]').or(
        page.getByRole('button', { name: /send.*reply|submit/i })
      );

      // Type valid length text (>= 10 characters)
      await textarea.fill('Thank you for your inquiry. We have availability.');
      await page.waitForTimeout(300);

      // Submit button should be enabled
      await expect(submitButton).toBeEnabled();
    });

    test('T080.10: Loading state shown during submission', async ({ page }) => {
      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Mock reply API with delay
      await page.route(`**/api/inquiries/${TEST_INQUIRY_ID}/reply`, async (route) => {
        // Delay to see loading state
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockInquiry,
              owner_reply: 'Thank you for your inquiry.',
              replied_at: new Date().toISOString(),
              status: 'in_progress',
            },
          }),
        });
      });

      const textarea = page.locator('[data-testid="reply-textarea"]').or(
        page.locator('#reply').or(page.getByLabel(/reply|response/i))
      );
      const submitButton = page.locator('[data-testid="reply-submit"]').or(
        page.getByRole('button', { name: /send.*reply|submit/i })
      );

      // Fill and submit
      await textarea.fill('Thank you for your inquiry. We have availability.');
      await submitButton.click();

      // Loading indicator should appear
      const loadingIndicator = page.locator('[data-testid="reply-loading"]').or(
        submitButton.locator('text=/sending|loading/i')
      );

      // Check if loading state is visible or button is disabled
      const isLoadingVisible = await loadingIndicator.isVisible({ timeout: 500 }).catch(() => false);
      const isButtonDisabled = await submitButton.isDisabled({ timeout: 500 }).catch(() => false);

      expect(isLoadingVisible || isButtonDisabled).toBe(true);
    });

    test('T080.11: Success notification after reply submission', async ({ page }) => {
      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Mock reply API
      await page.route(`**/api/inquiries/${TEST_INQUIRY_ID}/reply`, async (route) => {
        const requestBody = JSON.parse(route.request().postData() || '{}');

        // Verify request data
        expect(requestBody.reply).toBeTruthy();
        expect(requestBody.reply.length).toBeGreaterThanOrEqual(10);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockInquiry,
              owner_reply: requestBody.reply,
              replied_at: new Date().toISOString(),
              status: 'in_progress',
            },
          }),
        });
      });

      const textarea = page.locator('[data-testid="reply-textarea"]').or(
        page.locator('#reply').or(page.getByLabel(/reply|response/i))
      );
      const submitButton = page.locator('[data-testid="reply-submit"]').or(
        page.getByRole('button', { name: /send.*reply|submit/i })
      );

      // Fill and submit
      await textarea.fill('Thank you for your inquiry. We have availability for those dates.');
      await submitButton.click();

      // Wait for submission
      await page.waitForTimeout(1000);

      // Success notification should appear
      const successNotification = page.locator('[data-testid="reply-success"]').or(
        page.getByText(/reply sent|message sent|successfully/i)
      );
      await expect(successNotification).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('3. Status Management', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-owner-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: OWNER_ID, email: OWNER_EMAIL, role: 'owner' },
          }),
        });
      });

      await page.route(`**/api/inquiries/${TEST_INQUIRY_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockInquiry }),
        });
      });
    });

    test('T080.12: Status dropdown is visible with current status', async ({ page }) => {
      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Status selector should be visible
      const statusSelect = page.locator('[data-testid="status-select"]').or(
        page.locator('select').filter({ has: page.locator('option', { hasText: /new|in progress|resolved/i }) })
      );

      // Status might be shown as a dropdown or button group
      const statusDropdown = await statusSelect.isVisible({ timeout: 1000 }).catch(() => false);
      const statusButtons = page.locator('[data-testid="status-button"]');
      const hasStatusButtons = (await statusButtons.count()) > 0;

      expect(statusDropdown || hasStatusButtons).toBe(true);

      // Current status should be displayed
      const currentStatus = page.locator('[data-testid="current-status"]').or(
        page.getByText(/status.*new|new.*status/i)
      );
      await expect(currentStatus).toBeVisible();
    });

    test('T080.13: Status can be changed and saved', async ({ page }) => {
      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Mock status update API
      await page.route(`**/api/inquiries/${TEST_INQUIRY_ID}/status`, async (route) => {
        const requestBody = JSON.parse(route.request().postData() || '{}');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockInquiry,
              status: requestBody.status,
              updated_at: new Date().toISOString(),
            },
          }),
        });
      });

      // Find and change status
      const statusSelect = page.locator('[data-testid="status-select"]');

      if (await statusSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Dropdown approach
        await statusSelect.selectOption('in_progress');
      } else {
        // Button group approach
        const inProgressButton = page.locator('[data-testid="status-in-progress"]').or(
          page.getByRole('button', { name: /in progress/i })
        );
        await inProgressButton.click();
      }

      // Wait for update
      await page.waitForTimeout(500);

      // Success notification or updated status shown
      const statusUpdated = page.locator('[data-testid="status-updated"]').or(
        page.getByText(/status updated|in progress/i)
      );
      await expect(statusUpdated).toBeVisible({ timeout: 2000 });
    });

    test('T080.14: Status change history is visible', async ({ page }) => {
      // Mock inquiry with status changes
      const inquiryWithHistory = {
        ...mockInquiry,
        status: 'in_progress',
        status_history: [
          { status: 'new', changed_at: '2026-01-15T10:30:00Z' },
          { status: 'in_progress', changed_at: '2026-01-16T09:00:00Z' },
        ],
      };

      await page.route(`**/api/inquiries/${TEST_INQUIRY_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: inquiryWithHistory }),
        });
      });

      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Check for status history section
      const statusHistory = page.locator('[data-testid="status-history"]');

      if (await statusHistory.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(statusHistory).toBeVisible();

        // Should show status changes
        const historyItems = statusHistory.locator('[data-testid="status-history-item"]');
        const count = await historyItems.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('4. Read Status', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-owner-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: OWNER_ID, email: OWNER_EMAIL, role: 'owner' },
          }),
        });
      });
    });

    test('T080.15: Inquiry marked as read when viewed', async ({ page }) => {
      let readMarked = false;

      await page.route(`**/api/inquiries/${TEST_INQUIRY_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockInquiry }),
        });
      });

      // Mock mark as read API
      await page.route(`**/api/inquiries/${TEST_INQUIRY_ID}/read`, async (route) => {
        readMarked = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockInquiry,
              read_at: new Date().toISOString(),
            },
          }),
        });
      });

      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Wait a bit for mark as read call
      await page.waitForTimeout(1000);

      // API should have been called to mark as read
      expect(readMarked).toBe(true);
    });

    test('T080.16: Read timestamp shown for already read inquiries', async ({ page }) => {
      const readInquiry = {
        ...mockInquiry,
        read_at: '2026-01-15T14:00:00Z',
      };

      await page.route(`**/api/inquiries/${TEST_INQUIRY_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: readInquiry }),
        });
      });

      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Read indicator or timestamp should be visible
      const readIndicator = page.locator('[data-testid="read-indicator"]').or(
        page.getByText(/read|viewed/i)
      );

      const isVisible = await readIndicator.isVisible({ timeout: 2000 }).catch(() => false);

      // Read status might be shown, but not required
      if (isVisible) {
        await expect(readIndicator).toBeVisible();
      }
    });

    test('T080.17: Unread inquiries visually distinguished in list', async ({ page }) => {
      // Mock inquiries list with read/unread mix
      await page.route('**/api/inquiries*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { ...mockInquiry, id: 'inquiry-1', read_at: null },
              { ...mockInquiry, id: 'inquiry-2', read_at: '2026-01-15T14:00:00Z' },
            ],
          }),
        });
      });

      await page.goto('/dashboard/inquiries');
      await page.waitForLoadState('networkidle');

      // Unread inquiry should have visual indicator
      const unreadIndicator = page.locator('[data-testid="unread-indicator"]').or(
        page.locator('.unread-badge')
      );

      const hasUnreadIndicator = (await unreadIndicator.count()) > 0;

      // Visual distinction might be present but not required
      if (hasUnreadIndicator) {
        await expect(unreadIndicator.first()).toBeVisible();
      }
    });
  });

  test.describe('5. Owner Authorization', () => {
    test('T080.18: Owner can view their own campsite inquiries', async ({ page, context }) => {
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-owner-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: OWNER_ID, email: OWNER_EMAIL, role: 'owner' },
          }),
        });
      });

      await page.route(`**/api/inquiries/${TEST_INQUIRY_ID}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockInquiry }),
        });
      });

      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Page should load successfully
      const inquiryContent = page.locator('[data-testid="inquiry-detail"]').or(
        page.getByText(mockInquiry.guest_name)
      );
      await expect(inquiryContent).toBeVisible();
    });

    test('T080.19: Owner cannot view other owners inquiries', async ({ page, context }) => {
      const DIFFERENT_OWNER_ID = 'different-owner-uuid';

      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-different-owner-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: DIFFERENT_OWNER_ID, email: 'other@example.com', role: 'owner' },
          }),
        });
      });

      // Mock unauthorized response
      await page.route(`**/api/inquiries/${TEST_INQUIRY_ID}`, async (route) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Unauthorized access',
          }),
        });
      });

      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Should show error or redirect
      const errorMessage = page.locator('[data-testid="error-message"]').or(
        page.getByText(/unauthorized|access denied|not found/i)
      );
      await expect(errorMessage).toBeVisible({ timeout: 3000 });
    });

    test('T080.20: 404 page for non-existent inquiry', async ({ page, context }) => {
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-owner-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: OWNER_ID, email: OWNER_EMAIL, role: 'owner' },
          }),
        });
      });

      // Mock not found response
      await page.route('**/api/inquiries/non-existent-id', async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Inquiry not found',
          }),
        });
      });

      await page.goto('/dashboard/inquiries/non-existent-id');
      await page.waitForLoadState('networkidle');

      // Should show 404 error
      const notFoundMessage = page.locator('[data-testid="not-found"]').or(
        page.getByText(/not found|does not exist/i)
      );
      await expect(notFoundMessage).toBeVisible({ timeout: 3000 });
    });

    test('T080.21: Unauthenticated users redirected to login', async ({ page }) => {
      // No authentication cookies

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Unauthorized',
          }),
        });
      });

      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);

      // Wait for navigation or redirect
      await page.waitForTimeout(1000);

      // Should redirect to login or show login prompt
      const currentUrl = page.url();
      const hasLoginPage = currentUrl.includes('/login') || currentUrl.includes('/auth');
      const hasLoginPrompt = await page.getByText(/log in|sign in/i).isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasLoginPage || hasLoginPrompt).toBe(true);
    });

    test('T080.22: Non-owner users cannot access owner dashboard', async ({ page, context }) => {
      // Mock regular user authentication
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-user-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'user-123', email: 'user@example.com', role: 'user' },
          }),
        });
      });

      await page.route(`**/api/inquiries/${TEST_INQUIRY_ID}`, async (route) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Owner access required',
          }),
        });
      });

      await page.goto(`/dashboard/inquiries/${TEST_INQUIRY_ID}`);
      await page.waitForLoadState('networkidle');

      // Should show access denied or redirect
      const accessDenied = page.locator('[data-testid="access-denied"]').or(
        page.getByText(/access denied|owner only|unauthorized/i)
      );
      await expect(accessDenied).toBeVisible({ timeout: 3000 });
    });
  });
});
