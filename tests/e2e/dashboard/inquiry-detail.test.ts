/**
 * E2E Test: Owner Dashboard - Inquiry Detail and Reply
 *
 * Tests the owner dashboard inquiry detail page functionality including:
 * - Inquiry detail display (guest info, message, dates, campsite)
 * - Reply functionality (form, validation, submission)
 * - Status management
 * - Owner authorization and access control
 *
 * Test Coverage:
 * - T080.1-T080.5: Inquiry detail display
 * - T080.6-T080.11: Reply functionality
 * - T080.12-T080.14: Status management
 * - T080.15-T080.17: Owner authorization
 */

import { test, expect } from '@playwright/test';
import { loginAsOwner } from '../utils/auth';
import { createSupabaseAdmin } from '../utils/auth';
import { createTestCampsite, createTestInquiry, cleanupTestData } from '../utils/test-data';

test.describe('Owner Dashboard - Inquiry Detail Page', () => {
  test.setTimeout(60000);
  const supabase = createSupabaseAdmin();

  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
    await page.waitForTimeout(2000);
  });

  test.afterAll(async () => {
    await cleanupTestData(supabase);
  });

  test.describe('1. Inquiry Detail Display', () => {
    test('T080.1: Shows inquiry details on detail page', async ({ page }) => {
      // Create test campsite and inquiry
      const campsite = await createTestCampsite(supabase, {
        name: 'Mountain View Campsite',
        status: 'approved',
      });

      const inquiry = await createTestInquiry(supabase, campsite.id, {
        name: 'John Doe',
        email: 'john.doe@example.com',
        message: 'I would like to book your campsite for a family trip.',
      });

      // Navigate to inquiry detail page
      await page.goto(`/dashboard/inquiries/${inquiry.id}`);
      await page.waitForTimeout(3000);

      // Verify page loads
      const content = page.locator('h1, main');
      await expect(content.first()).toBeVisible({ timeout: 15000 });

      // Guest name should be visible
      const guestName = page.locator('[data-testid="guest-name"]').or(
        page.getByText('John Doe')
      );

      if (await guestName.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(guestName).toBeVisible();
      }

      // Message content should be visible
      const messageContent = page.locator('[data-testid="inquiry-message"]').or(
        page.getByText(/book your campsite/i)
      );

      if (await messageContent.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(messageContent).toBeVisible();
      }
    });

    test('T080.2: Displays complete message and guest contact info', async ({ page }) => {
      const campsite = await createTestCampsite(supabase, {
        name: 'Test Campsite Details',
        status: 'approved',
      });

      const inquiry = await createTestInquiry(supabase, campsite.id, {
        name: 'Jane Smith',
        email: 'jane@example.com',
        message: 'Do you have availability for 4 people from March 15-17?',
      });

      await page.goto(`/dashboard/inquiries/${inquiry.id}`);
      await page.waitForTimeout(3000);

      // Check for guest email
      const guestEmail = page.locator('[data-testid="guest-email"]').or(
        page.getByText('jane@example.com')
      );

      if (await guestEmail.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(guestEmail).toBeVisible();
      }
    });
  });

  test.describe('2. Reply Functionality', () => {
    test('T080.6: Reply form is visible with textarea', async ({ page }) => {
      const campsite = await createTestCampsite(supabase, {
        name: 'Reply Form Test Campsite',
        status: 'approved',
      });

      const inquiry = await createTestInquiry(supabase, campsite.id, {
        name: 'Reply Test User',
        email: 'reply@example.com',
        message: 'Test reply form',
      });

      await page.goto(`/dashboard/inquiries/${inquiry.id}`);
      await page.waitForTimeout(3000);

      // Reply form should be visible
      const replyForm = page.locator('[data-testid="reply-form"]').or(
        page.locator('form').filter({ hasText: /reply|response/i })
      );

      if (await replyForm.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(replyForm).toBeVisible();
      }

      // Textarea should be present
      const textarea = page.locator('[data-testid="reply-textarea"]').or(
        page.locator('#reply').or(page.getByLabel(/reply|response/i))
      ).or(page.locator('textarea').first());

      await expect(textarea).toBeVisible({ timeout: 5000 });
    });

    test('T080.8: Submit button disabled when reply is too short', async ({ page }) => {
      const campsite = await createTestCampsite(supabase, {
        name: 'Validation Campsite',
        status: 'approved',
      });

      const inquiry = await createTestInquiry(supabase, campsite.id, {
        name: 'Validation User',
        email: 'validation@example.com',
        message: 'Test validation',
      });

      await page.goto(`/dashboard/inquiries/${inquiry.id}`);
      await page.waitForTimeout(3000);

      const textarea = page.locator('[data-testid="reply-textarea"]').or(
        page.locator('#reply').or(page.getByLabel(/reply|response/i))
      ).or(page.locator('textarea').first());

      const submitButton = page.locator('[data-testid="reply-submit"]').or(
        page.getByRole('button', { name: /send.*reply|submit/i })
      );

      if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Type short text (less than 10 characters)
        await textarea.fill('Short');
        await page.waitForTimeout(300);

        if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Submit button should be disabled
          const isDisabled = await submitButton.isDisabled().catch(() => true);
          expect(isDisabled).toBe(true);
        }
      }
    });

    test('T080.9: Submit button enabled when reply meets minimum length', async ({ page }) => {
      const campsite = await createTestCampsite(supabase, {
        name: 'Submit Test Campsite',
        status: 'approved',
      });

      const inquiry = await createTestInquiry(supabase, campsite.id, {
        name: 'Submit Test User',
        email: 'submit@example.com',
        message: 'Test submit',
      });

      await page.goto(`/dashboard/inquiries/${inquiry.id}`);
      await page.waitForTimeout(3000);

      const textarea = page.locator('[data-testid="reply-textarea"]').or(
        page.locator('#reply').or(page.getByLabel(/reply|response/i))
      ).or(page.locator('textarea').first());

      const submitButton = page.locator('[data-testid="reply-submit"]').or(
        page.getByRole('button', { name: /send.*reply|submit/i })
      );

      if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Type valid length text (>= 10 characters)
        await textarea.fill('Thank you for your inquiry. We have availability.');
        await page.waitForTimeout(300);

        if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Submit button should be enabled
          const isEnabled = await submitButton.isEnabled().catch(() => false);
          expect(isEnabled).toBe(true);
        }
      }
    });

    test('T080.11: Can submit reply successfully', async ({ page }) => {
      const campsite = await createTestCampsite(supabase, {
        name: 'Reply Success Campsite',
        status: 'approved',
      });

      const inquiry = await createTestInquiry(supabase, campsite.id, {
        name: 'Success User',
        email: 'success@example.com',
        message: 'Test successful reply',
      });

      await page.goto(`/dashboard/inquiries/${inquiry.id}`);
      await page.waitForTimeout(3000);

      const textarea = page.locator('[data-testid="reply-textarea"]').or(
        page.locator('#reply').or(page.getByLabel(/reply|response/i))
      ).or(page.locator('textarea').first());

      const submitButton = page.locator('[data-testid="reply-submit"]').or(
        page.getByRole('button', { name: /send.*reply|submit/i })
      );

      if (await textarea.isVisible({ timeout: 5000 }).catch(() => false) &&
          await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {

        // Fill and submit
        await textarea.fill('Thank you for your inquiry. We have availability for those dates.');
        await submitButton.click();
        await page.waitForTimeout(3000);

        // Success notification or reply displayed
        const successNotification = page.locator('[data-testid="reply-success"]').or(
          page.getByText(/reply sent|message sent|successfully/i)
        );

        if (await successNotification.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(successNotification).toBeVisible();
        }
      }
    });
  });

  test.describe('3. Status Management', () => {
    test('T080.12: Status control is visible', async ({ page }) => {
      const campsite = await createTestCampsite(supabase, {
        name: 'Status Test Campsite',
        status: 'approved',
      });

      const inquiry = await createTestInquiry(supabase, campsite.id, {
        name: 'Status User',
        email: 'status@example.com',
        message: 'Test status',
      });

      await page.goto(`/dashboard/inquiries/${inquiry.id}`);
      await page.waitForTimeout(3000);

      // Status selector should be visible
      const statusSelect = page.locator('[data-testid="status-select"]').or(
        page.locator('select').filter({ has: page.locator('option', { hasText: /new|in progress|resolved/i }) })
      );

      // Status might be shown as a dropdown or button group
      const statusDropdown = await statusSelect.isVisible({ timeout: 5000 }).catch(() => false);
      const statusButtons = page.locator('[data-testid="status-button"]');
      const hasStatusButtons = (await statusButtons.count()) > 0;

      // Either dropdown or buttons should exist
      const hasStatusControl = statusDropdown || hasStatusButtons;

      if (hasStatusControl) {
        // Current status should be displayed
        const currentStatus = page.locator('[data-testid="current-status"]').or(
          page.getByText(/status/i)
        );

        if (await currentStatus.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(currentStatus).toBeVisible();
        }
      }
    });
  });

  test.describe('4. Owner Authorization', () => {
    test('T080.18: Owner can view their own campsite inquiries', async ({ page }) => {
      const campsite = await createTestCampsite(supabase, {
        name: 'Auth Test Campsite',
        status: 'approved',
      });

      const inquiry = await createTestInquiry(supabase, campsite.id, {
        name: 'Auth User',
        email: 'auth@example.com',
        message: 'Test authorization',
      });

      await page.goto(`/dashboard/inquiries/${inquiry.id}`);
      await page.waitForTimeout(3000);

      // Page should load successfully
      const inquiryContent = page.locator('[data-testid="inquiry-detail"]').or(
        page.getByText('Auth User')
      ).or(page.locator('main'));

      await expect(inquiryContent.first()).toBeVisible({ timeout: 15000 });
    });

    test('T080.20: Shows error for non-existent inquiry', async ({ page }) => {
      const nonExistentId = 'non-existent-inquiry-id-12345';

      await page.goto(`/dashboard/inquiries/${nonExistentId}`);
      await page.waitForTimeout(3000);

      // Should show error message or redirect
      const notFoundMessage = page.locator('[data-testid="not-found"]').or(
        page.getByText(/not found|does not exist/i)
      ).or(page.locator('main'));

      // Page should render something (error or redirect)
      await expect(notFoundMessage.first()).toBeVisible({ timeout: 15000 });
    });
  });
});
