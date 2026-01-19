import { test, expect } from '@playwright/test';
import { loginAsUser, createSupabaseAdmin } from '../utils/auth';
import { waitForApi, PUBLIC_API, assertNoErrors } from '../utils/api-helpers';

/**
 * E2E Tests: Inquiry Form Submission Flow
 * Tests the complete user journey for submitting an inquiry with real API
 *
 * Test Coverage:
 * - Successful submission with all required fields
 * - Form validation for required fields
 * - Optional fields (phone, dates) tested
 * - API called with correct data
 * - Success response and confirmation
 *
 * Prerequisites:
 * - User account: user@campsite.local / User123!
 * - Test campsite: e2e-test-campsite-approved-1
 * - Frontend running at localhost:3090
 * - Backend running at localhost:3091
 */

test.describe('Inquiry Form Submission Flow', () => {
  test.setTimeout(60000);

  const TEST_CAMPSITE_ID = 'e2e-test-campsite-approved-1';

  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await loginAsUser(page);

    // Navigate to campsite detail page
    await page.goto(`/campsites/${TEST_CAMPSITE_ID}`);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // Clean up test inquiries
    const supabase = createSupabaseAdmin();
    await supabase
      .from('inquiries')
      .delete()
      .eq('campsite_id', TEST_CAMPSITE_ID)
      .ilike('guest_email', '%test%');
  });

  test('T070.1: Successful submission with required fields only', async ({ page }) => {
    // Click on inquiry/contact button to open form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form to be visible
    await expect(page.locator('#guest_name, [name="guest_name"]')).toBeVisible();

    // Fill in required fields
    const nameInput = page.locator('#guest_name').or(page.getByLabel(/your name/i));
    await nameInput.fill('John Doe');

    const emailInput = page.locator('#guest_email').or(page.getByLabel(/email/i));
    await emailInput.fill('john.doe.test@example.com');

    // Select inquiry type (if available)
    const inquiryTypeButtons = page.locator('button').filter({ hasText: /general question/i });
    if (await inquiryTypeButtons.count() > 0) {
      await inquiryTypeButtons.first().click();
    }

    const messageTextarea = page.locator('#message').or(page.getByLabel(/message/i));
    await messageTextarea.fill('I would like to know more about availability and pricing for next month.');

    // Intercept the API call
    const apiPromise = page.waitForResponse(
      res => res.url().includes(PUBLIC_API.inquiry) &&
             res.request().method() === 'POST' &&
             res.status() === 200
    );

    // Submit the form
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for and verify API response
    const response = await apiPromise;
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify success message is displayed
    const successMessage = page.locator('[data-testid="inquiry-success"]').or(
      page.getByText(/inquiry sent|message sent|successfully/i)
    );
    await expect(successMessage).toBeVisible();

    // Verify no error states
    await assertNoErrors(page);
  });

  test('T070.2: Successful submission with all fields including optional', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form
    await expect(page.locator('#guest_name, [name="guest_name"]')).toBeVisible();

    // Fill in all required fields
    const nameInput = page.locator('#guest_name').or(page.getByLabel(/your name/i));
    await nameInput.fill('Jane Smith');

    const emailInput = page.locator('#guest_email').or(page.getByLabel(/email/i));
    await emailInput.fill('jane.smith.test@example.com');

    // Fill optional phone field
    const phoneInput = page.locator('#guest_phone').or(page.getByLabel(/phone/i));
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('0812345678');
    }

    // Select booking inquiry type
    const bookingTypeButton = page.locator('button').filter({ hasText: /booking inquiry/i });
    if (await bookingTypeButton.count() > 0) {
      await bookingTypeButton.first().click();
    }

    const messageTextarea = page.locator('#message').or(page.getByLabel(/message/i));
    await messageTextarea.fill('I am interested in booking for my family. Do you have availability for 4 people?');

    // Add check-in and check-out dates if available
    const showDatesButton = page.getByText(/add.*date|show.*date/i);
    if (await showDatesButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await showDatesButton.click();

      const checkInInput = page.locator('#check_in_date').or(page.getByLabel(/check.*in/i));
      if (await checkInInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const checkInDate = tomorrow.toISOString().split('T')[0];
        await checkInInput.fill(checkInDate);

        const checkOutInput = page.locator('#check_out_date').or(page.getByLabel(/check.*out/i));
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 3);
        const checkOutDate = dayAfterTomorrow.toISOString().split('T')[0];
        await checkOutInput.fill(checkOutDate);
      }
    }

    // Intercept the API call
    const apiPromise = page.waitForResponse(
      res => res.url().includes(PUBLIC_API.inquiry) &&
             res.request().method() === 'POST' &&
             res.status() === 200
    );

    // Submit the form
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for and verify API response
    const response = await apiPromise;
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify success message
    const successMessage = page.locator('[data-testid="inquiry-success"]').or(
      page.getByText(/inquiry sent|message sent|successfully/i)
    );
    await expect(successMessage).toBeVisible();

    // Verify no error states
    await assertNoErrors(page);
  });

  test('T070.3: Form validation - required fields', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form
    await expect(page.locator('#guest_name, [name="guest_name"]')).toBeVisible();

    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });

    // Submit button should be disabled initially
    await expect(submitButton).toBeDisabled();

    // Fill only name
    const nameInput = page.locator('#guest_name').or(page.getByLabel(/your name/i));
    await nameInput.fill('John');

    // Still disabled (missing email and message)
    await expect(submitButton).toBeDisabled();

    // Fill email
    const emailInput = page.locator('#guest_email').or(page.getByLabel(/email/i));
    await emailInput.fill('john@example.com');

    // Still disabled (missing message with minimum length)
    await expect(submitButton).toBeDisabled();

    // Fill message with insufficient length
    const messageTextarea = page.locator('#message').or(page.getByLabel(/message/i));
    await messageTextarea.fill('Too short');

    // Should still be disabled due to message length requirement
    await expect(submitButton).toBeDisabled();

    // Fill message with sufficient length (minimum 20 characters)
    await messageTextarea.fill('I would like to know more about this campsite.');

    // Now should be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('T070.4: Email validation', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form
    await expect(page.locator('#guest_name, [name="guest_name"]')).toBeVisible();

    const emailInput = page.locator('#guest_email').or(page.getByLabel(/email/i));

    // Enter invalid email
    await emailInput.fill('invalid-email');
    await emailInput.blur();

    // Check for validation error
    const emailError = page.locator('[data-testid="email-error"]').or(
      page.getByText(/valid email|invalid email/i)
    );

    // Error should be visible or submit should be disabled
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    const isErrorVisible = await emailError.isVisible({ timeout: 1000 }).catch(() => false);

    if (isErrorVisible) {
      await expect(emailError).toBeVisible();
    } else {
      // Fill other required fields to test email validation effect
      const nameInput = page.locator('#guest_name').or(page.getByLabel(/your name/i));
      await nameInput.fill('John Doe');

      const messageTextarea = page.locator('#message').or(page.getByLabel(/message/i));
      await messageTextarea.fill('I would like to know more about this campsite and its amenities.');

      // Submit should be disabled with invalid email
      await expect(submitButton).toBeDisabled();
    }

    // Enter valid email
    await emailInput.fill('valid.email@example.com');

    // Error should disappear
    if (isErrorVisible) {
      await expect(emailError).not.toBeVisible();
    }
  });

  test('T070.5: Message length validation', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form
    await expect(page.locator('#guest_name, [name="guest_name"]')).toBeVisible();

    const messageTextarea = page.locator('#message').or(page.getByLabel(/message/i));

    // Enter message below minimum length (20 characters)
    const shortMessage = 'Too short';
    await messageTextarea.fill(shortMessage);

    // Submit should be disabled
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });

    // Fill other required fields
    const nameInput = page.locator('#guest_name').or(page.getByLabel(/your name/i));
    await nameInput.fill('John Doe');

    const emailInput = page.locator('#guest_email').or(page.getByLabel(/email/i));
    await emailInput.fill('john@example.com');

    // Should be disabled due to message length
    await expect(submitButton).toBeDisabled();

    // Enter valid length message (minimum 20 characters)
    await messageTextarea.fill('This is a valid message with sufficient length for submission.');

    // Should now be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('T070.6: Form resets after successful submission', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form
    await expect(page.locator('#guest_name, [name="guest_name"]')).toBeVisible();

    const nameInput = page.locator('#guest_name').or(page.getByLabel(/your name/i));
    await nameInput.fill('Test User');

    const emailInput = page.locator('#guest_email').or(page.getByLabel(/email/i));
    await emailInput.fill('test.reset@example.com');

    const messageTextarea = page.locator('#message').or(page.getByLabel(/message/i));
    await messageTextarea.fill('This is a test inquiry message with sufficient length.');

    // Intercept the API call
    const apiPromise = page.waitForResponse(
      res => res.url().includes(PUBLIC_API.inquiry) &&
             res.request().method() === 'POST' &&
             res.status() === 200
    );

    // Submit
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await submitButton.click();

    // Wait for and verify API response
    const response = await apiPromise;
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify success message appears
    const successMessage = page.locator('[data-testid="inquiry-success"]').or(
      page.getByText(/inquiry sent|message sent|successfully/i)
    );
    await expect(successMessage).toBeVisible();

    // Form should be reset or closed
    const isFormVisible = await page.locator('[data-testid="inquiry-form"]').isVisible({ timeout: 2000 }).catch(() => false);

    if (isFormVisible) {
      // If form is still visible, fields should be empty
      await expect(nameInput).toHaveValue('');
      await expect(emailInput).toHaveValue('');
      await expect(messageTextarea).toHaveValue('');
    }

    // Verify no error states
    await assertNoErrors(page);
  });
});
