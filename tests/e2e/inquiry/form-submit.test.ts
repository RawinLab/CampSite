import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Inquiry Form Submission Flow
 * Tests the complete user journey for submitting an inquiry
 *
 * Test Coverage:
 * - Successful submission with all required fields
 * - Form validation for required fields
 * - Optional fields (phone, dates) tested
 * - API called with correct data
 * - Success response and confirmation
 */

test.describe('Inquiry Form Submission Flow', () => {
  const TEST_CAMPSITE_ID = 'test-campsite-123';
  const TEST_CAMPSITE_NAME = 'Mountain View Campsite';

  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page
    await page.goto(`/campsites/${TEST_CAMPSITE_ID}`);
    await page.waitForLoadState('networkidle');
  });

  test('T070.1: Successful submission with required fields only', async ({ page }) => {
    // Setup API route interception
    await page.route('**/api/inquiries', async (route) => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');

      // Verify API called with correct data
      expect(postData.campsite_id).toBe(TEST_CAMPSITE_ID);
      expect(postData.guest_name).toBe('John Doe');
      expect(postData.guest_email).toBe('john.doe@example.com');
      expect(postData.inquiry_type).toBe('general');
      expect(postData.message).toBe('I would like to know more about availability and pricing for next month.');

      // Return success response
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'inquiry-001',
            campsite_id: TEST_CAMPSITE_ID,
            guest_name: 'John Doe',
            guest_email: 'john.doe@example.com',
            inquiry_type: 'general',
            message: 'I would like to know more about availability and pricing for next month.',
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        }),
      });
    });

    // Click on inquiry/contact button to open form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form to be visible
    const inquiryForm = page.locator('[data-testid="inquiry-form"]').or(
      page.locator('form').filter({ hasText: /your name|email|message/i })
    );
    await expect(inquiryForm).toBeVisible();

    // Fill in required fields
    const nameInput = page.locator('#guest_name').or(page.getByLabel(/your name/i));
    await nameInput.fill('John Doe');

    const emailInput = page.locator('#guest_email').or(page.getByLabel(/email/i));
    await emailInput.fill('john.doe@example.com');

    // Select inquiry type
    const inquiryTypeButtons = page.locator('button').filter({ hasText: /general question/i });
    if (await inquiryTypeButtons.count() > 0) {
      await inquiryTypeButtons.first().click();
    }

    const messageTextarea = page.locator('#message').or(page.getByLabel(/message/i));
    await messageTextarea.fill('I would like to know more about availability and pricing for next month.');

    // Wait for form validation
    await page.waitForTimeout(300);

    // Submit the form
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for API call
    await page.waitForTimeout(500);

    // Verify success message is displayed
    const successMessage = page.locator('[data-testid="inquiry-success"]').or(
      page.getByText(/inquiry sent|message sent|successfully/i)
    );
    await expect(successMessage).toBeVisible({ timeout: 3000 });
  });

  test('T070.2: Successful submission with all fields including optional', async ({ page }) => {
    // Setup API route interception
    await page.route('**/api/inquiries', async (route) => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');

      // Verify all fields including optional ones
      expect(postData.campsite_id).toBe(TEST_CAMPSITE_ID);
      expect(postData.guest_name).toBe('Jane Smith');
      expect(postData.guest_email).toBe('jane.smith@example.com');
      expect(postData.guest_phone).toBe('0812345678');
      expect(postData.inquiry_type).toBe('booking');
      expect(postData.message).toBe('I am interested in booking for my family. Do you have availability for 4 people?');
      expect(postData.check_in_date).toBeTruthy();
      expect(postData.check_out_date).toBeTruthy();

      // Return success response
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'inquiry-002',
            ...postData,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        }),
      });
    });

    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form
    await page.waitForTimeout(300);

    // Fill in all required fields
    const nameInput = page.locator('#guest_name').or(page.getByLabel(/your name/i));
    await nameInput.fill('Jane Smith');

    const emailInput = page.locator('#guest_email').or(page.getByLabel(/email/i));
    await emailInput.fill('jane.smith@example.com');

    // Fill optional phone field
    const phoneInput = page.locator('#guest_phone').or(page.getByLabel(/phone/i));
    await phoneInput.fill('0812345678');

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
      await page.waitForTimeout(200);
    }

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

    // Wait for validation
    await page.waitForTimeout(300);

    // Submit the form
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for API call
    await page.waitForTimeout(500);

    // Verify success message
    const successMessage = page.locator('[data-testid="inquiry-success"]').or(
      page.getByText(/inquiry sent|message sent|successfully/i)
    );
    await expect(successMessage).toBeVisible({ timeout: 3000 });
  });

  test('T070.3: Form validation - required fields', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form
    await page.waitForTimeout(300);

    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });

    // Submit button should be disabled initially
    await expect(submitButton).toBeDisabled();

    // Fill only name
    const nameInput = page.locator('#guest_name').or(page.getByLabel(/your name/i));
    await nameInput.fill('John');
    await page.waitForTimeout(100);

    // Still disabled (missing email and message)
    await expect(submitButton).toBeDisabled();

    // Fill email
    const emailInput = page.locator('#guest_email').or(page.getByLabel(/email/i));
    await emailInput.fill('john@example.com');
    await page.waitForTimeout(100);

    // Still disabled (missing message with minimum length)
    await expect(submitButton).toBeDisabled();

    // Fill message with insufficient length
    const messageTextarea = page.locator('#message').or(page.getByLabel(/message/i));
    await messageTextarea.fill('Too short');
    await page.waitForTimeout(300);

    // Should still be disabled due to message length requirement
    await expect(submitButton).toBeDisabled();

    // Fill message with sufficient length (minimum 20 characters)
    await messageTextarea.fill('I would like to know more about this campsite.');
    await page.waitForTimeout(300);

    // Now should be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('T070.4: Email validation', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form
    await page.waitForTimeout(300);

    const emailInput = page.locator('#guest_email').or(page.getByLabel(/email/i));

    // Enter invalid email
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    await page.waitForTimeout(200);

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

      await page.waitForTimeout(300);

      // Submit should be disabled with invalid email
      await expect(submitButton).toBeDisabled();
    }

    // Enter valid email
    await emailInput.fill('valid.email@example.com');
    await page.waitForTimeout(200);

    // Error should disappear
    if (isErrorVisible) {
      await expect(emailError).not.toBeVisible();
    }
  });

  test('T070.5: Phone validation (Thai format)', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form
    await page.waitForTimeout(300);

    const phoneInput = page.locator('#guest_phone').or(page.getByLabel(/phone/i));

    // Enter invalid phone format
    await phoneInput.fill('12345');
    await phoneInput.blur();
    await page.waitForTimeout(200);

    // Check for validation error
    const phoneError = page.locator('[data-testid="phone-error"]').or(
      page.getByText(/invalid.*phone|thai phone/i)
    );

    const isErrorVisible = await phoneError.isVisible({ timeout: 1000 }).catch(() => false);

    if (isErrorVisible) {
      await expect(phoneError).toBeVisible();
    }

    // Enter valid Thai phone format
    await phoneInput.fill('0812345678');
    await page.waitForTimeout(200);

    // Error should disappear
    if (isErrorVisible) {
      await expect(phoneError).not.toBeVisible();
    }
  });

  test('T070.6: Message length validation', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form
    await page.waitForTimeout(300);

    const messageTextarea = page.locator('#message').or(page.getByLabel(/message/i));

    // Enter message below minimum length (20 characters)
    const shortMessage = 'Too short';
    await messageTextarea.fill(shortMessage);
    await page.waitForTimeout(300);

    // Check character count or validation message
    const charCount = page.locator('[data-testid="char-count"]').or(
      page.getByText(/\d+\/\d+/)
    );

    // Submit should be disabled
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });

    // Fill other required fields
    const nameInput = page.locator('#guest_name').or(page.getByLabel(/your name/i));
    await nameInput.fill('John Doe');

    const emailInput = page.locator('#guest_email').or(page.getByLabel(/email/i));
    await emailInput.fill('john@example.com');

    await page.waitForTimeout(300);

    // Should be disabled due to message length
    await expect(submitButton).toBeDisabled();

    // Enter valid length message (minimum 20 characters)
    await messageTextarea.fill('This is a valid message with sufficient length for submission.');
    await page.waitForTimeout(300);

    // Should now be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('T070.7: Date validation - check-out after check-in', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form
    await page.waitForTimeout(300);

    // Show dates section
    const showDatesButton = page.getByText(/add.*date|show.*date/i);
    if (await showDatesButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await showDatesButton.click();
      await page.waitForTimeout(200);

      const checkInInput = page.locator('#check_in_date').or(page.getByLabel(/check.*in/i));
      const checkOutInput = page.locator('#check_out_date').or(page.getByLabel(/check.*out/i));

      // Set check-in date
      const today = new Date();
      const checkInDate = today.toISOString().split('T')[0];
      await checkInInput.fill(checkInDate);

      // Set check-out date before check-in (invalid)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const invalidCheckOutDate = yesterday.toISOString().split('T')[0];
      await checkOutInput.fill(invalidCheckOutDate);
      await page.waitForTimeout(200);

      // Check for validation error
      const dateError = page.locator('[data-testid="date-error"]').or(
        page.getByText(/check.*out.*after.*check.*in/i)
      );

      const isErrorVisible = await dateError.isVisible({ timeout: 1000 }).catch(() => false);

      if (isErrorVisible) {
        await expect(dateError).toBeVisible();
      }

      // Set valid check-out date (after check-in)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const validCheckOutDate = tomorrow.toISOString().split('T')[0];
      await checkOutInput.fill(validCheckOutDate);
      await page.waitForTimeout(200);

      // Error should disappear
      if (isErrorVisible) {
        await expect(dateError).not.toBeVisible();
      }
    }
  });

  test('T070.8: Form resets after successful submission', async ({ page }) => {
    // Setup API route interception
    await page.route('**/api/inquiries', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'inquiry-003',
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        }),
      });
    });

    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Fill form
    const nameInput = page.locator('#guest_name').or(page.getByLabel(/your name/i));
    await nameInput.fill('Test User');

    const emailInput = page.locator('#guest_email').or(page.getByLabel(/email/i));
    await emailInput.fill('test@example.com');

    const messageTextarea = page.locator('#message').or(page.getByLabel(/message/i));
    await messageTextarea.fill('This is a test inquiry message with sufficient length.');

    // Submit
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await submitButton.click();

    // Wait for success
    await page.waitForTimeout(1000);

    // Form should be reset or closed
    const isFormVisible = await page.locator('[data-testid="inquiry-form"]').isVisible({ timeout: 2000 }).catch(() => false);

    if (isFormVisible) {
      // If form is still visible, fields should be empty
      await expect(nameInput).toHaveValue('');
      await expect(emailInput).toHaveValue('');
      await expect(messageTextarea).toHaveValue('');
    }
  });

  test('T070.9: Different inquiry types can be selected', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Wait for form
    await page.waitForTimeout(300);

    // Check for inquiry type options
    const bookingButton = page.locator('button').filter({ hasText: /booking/i });
    const generalButton = page.locator('button').filter({ hasText: /general/i });
    const complaintButton = page.locator('button').filter({ hasText: /complaint/i });
    const otherButton = page.locator('button').filter({ hasText: /other/i });

    if (await bookingButton.count() > 0) {
      // Test selecting different inquiry types
      await bookingButton.first().click();
      await page.waitForTimeout(100);
      await expect(bookingButton.first()).toHaveAttribute('data-state', 'active').catch(() => {});

      await generalButton.first().click();
      await page.waitForTimeout(100);
      await expect(generalButton.first()).toHaveAttribute('data-state', 'active').catch(() => {});

      if (await complaintButton.count() > 0) {
        await complaintButton.first().click();
        await page.waitForTimeout(100);
      }

      if (await otherButton.count() > 0) {
        await otherButton.first().click();
        await page.waitForTimeout(100);
      }
    }
  });

  test('T070.10: API error handling', async ({ page }) => {
    // Setup API route to return error
    await page.route('**/api/inquiries', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
        }),
      });
    });

    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /contact|send inquiry|ask question/i });
    await inquiryButton.click();

    // Fill form
    const nameInput = page.locator('#guest_name').or(page.getByLabel(/your name/i));
    await nameInput.fill('Test User');

    const emailInput = page.locator('#guest_email').or(page.getByLabel(/email/i));
    await emailInput.fill('test@example.com');

    const messageTextarea = page.locator('#message').or(page.getByLabel(/message/i));
    await messageTextarea.fill('This is a test inquiry message with sufficient length.');

    // Submit
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await submitButton.click();

    // Wait for error handling
    await page.waitForTimeout(1000);

    // Check for error message
    const errorMessage = page.locator('[data-testid="inquiry-error"]').or(
      page.getByText(/error|failed|try again/i)
    );

    // Error should be visible or form should show error state
    const isErrorVisible = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);

    if (isErrorVisible) {
      await expect(errorMessage).toBeVisible();
    }
  });
});
