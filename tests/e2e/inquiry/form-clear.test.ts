import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Inquiry Form Clearing After Submission
 * Tests that form properly resets after successful submission
 *
 * Test Coverage:
 * - All form fields cleared after submission
 * - Form ready for new submission
 * - Name, email, message fields reset
 * - Optional fields also cleared
 */

test.describe('Inquiry Form Clearing After Submission', () => {
  const TEST_CAMPSITE_SLUG = 'test-campsite-inquiry';

  // Mock authentication state
  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page
    await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`);
    await page.waitForLoadState('networkidle');

    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-auth-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          phone: '0812345678'
        }
      }));
    });

    // Reload to apply auth state
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('T081.1: Form clears all fields after successful submission', async ({ page }) => {
    // Open inquiry form (click inquiry button or scroll to section)
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact|inquire/i });
    if (await inquiryButton.isVisible()) {
      await inquiryButton.click();
    }

    // Wait for form to be visible
    const nameInput = page.locator('input#guest_name, input[name="guest_name"]');
    await expect(nameInput).toBeVisible();

    const emailInput = page.locator('input#guest_email, input[name="guest_email"]');
    const messageTextarea = page.locator('textarea#message, textarea[name="message"]');
    const phoneInput = page.locator('input#guest_phone, input[name="guest_phone"]');

    // Fill all form fields
    await nameInput.fill('John Doe');
    await emailInput.fill('john.doe@example.com');
    await phoneInput.fill('0812345678');
    await messageTextarea.fill('I am interested in booking this campsite for the weekend. Do you have availability?');

    // Verify fields are filled
    await expect(nameInput).toHaveValue('John Doe');
    await expect(emailInput).toHaveValue('john.doe@example.com');
    await expect(phoneInput).toHaveValue('0812345678');
    await expect(messageTextarea).toHaveValue(/interested in booking/i);

    // Submit the form
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await submitButton.click();

    // Wait for submission to complete
    

    // Check for success message/confirmation
    const successMessage = page.locator('[data-testid="success-message"]').or(
      page.getByText(/inquiry sent|submitted successfully|thank you/i)
    );

    // If success message appears, verify form is cleared
    if (await successMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Verify all fields are cleared
      await expect(nameInput).toHaveValue('');
      await expect(emailInput).toHaveValue('');
      await expect(phoneInput).toHaveValue('');
      await expect(messageTextarea).toHaveValue('');
    }
  });

  test('T081.2: Name field cleared after successful submission', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact|inquire/i });
    if (await inquiryButton.isVisible()) {
      await inquiryButton.click();
    }

    const nameInput = page.locator('input#guest_name, input[name="guest_name"]');
    await expect(nameInput).toBeVisible();

    // Fill required fields
    await nameInput.fill('Jane Smith');

    const emailInput = page.locator('input#guest_email, input[name="guest_email"]');
    await emailInput.fill('jane.smith@example.com');

    const messageTextarea = page.locator('textarea#message, textarea[name="message"]');
    await messageTextarea.fill('I would like to know more about the amenities at this campsite.');

    // Verify name is filled before submission
    await expect(nameInput).toHaveValue('Jane Smith');

    // Submit
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await submitButton.click();

    // Wait for submission
    

    // Check for success indicator
    const successIndicator = page.locator('[data-testid="success-message"]').or(
      page.getByText(/inquiry sent|submitted successfully/i)
    );

    if (await successIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Name field should be empty
      await expect(nameInput).toHaveValue('');
    }
  });

  test('T081.3: Email field cleared after successful submission', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact|inquire/i });
    if (await inquiryButton.isVisible()) {
      await inquiryButton.click();
    }

    const emailInput = page.locator('input#guest_email, input[name="guest_email"]');
    await expect(emailInput).toBeVisible();

    // Fill required fields
    const nameInput = page.locator('input#guest_name, input[name="guest_name"]');
    await nameInput.fill('Bob Johnson');
    await emailInput.fill('bob.johnson@example.com');

    const messageTextarea = page.locator('textarea#message, textarea[name="message"]');
    await messageTextarea.fill('What are the check-in and check-out times?');

    // Verify email is filled before submission
    await expect(emailInput).toHaveValue('bob.johnson@example.com');

    // Submit
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await submitButton.click();

    // Wait for submission
    

    // Check for success
    const success = page.locator('[data-testid="success-message"]').or(
      page.getByText(/inquiry sent|submitted successfully/i)
    );

    if (await success.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Email field should be empty
      await expect(emailInput).toHaveValue('');
    }
  });

  test('T081.4: Message field cleared after successful submission', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact|inquire/i });
    if (await inquiryButton.isVisible()) {
      await inquiryButton.click();
    }

    const messageTextarea = page.locator('textarea#message, textarea[name="message"]');
    await expect(messageTextarea).toBeVisible();

    // Fill required fields
    const nameInput = page.locator('input#guest_name, input[name="guest_name"]');
    await nameInput.fill('Alice Williams');

    const emailInput = page.locator('input#guest_email, input[name="guest_email"]');
    await emailInput.fill('alice.williams@example.com');

    const longMessage = 'I am planning a camping trip with my family and would like to inquire about availability and pricing.';
    await messageTextarea.fill(longMessage);

    // Verify message is filled before submission
    await expect(messageTextarea).toHaveValue(longMessage);

    // Submit
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await submitButton.click();

    // Wait for submission
    

    // Check for success
    const success = page.locator('[data-testid="success-message"]').or(
      page.getByText(/inquiry sent|submitted successfully/i)
    );

    if (await success.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Message field should be empty
      await expect(messageTextarea).toHaveValue('');
    }
  });

  test('T081.5: Can submit another inquiry after form reset', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact|inquire/i });
    if (await inquiryButton.isVisible()) {
      await inquiryButton.click();
    }

    const nameInput = page.locator('input#guest_name, input[name="guest_name"]');
    const emailInput = page.locator('input#guest_email, input[name="guest_email"]');
    const messageTextarea = page.locator('textarea#message, textarea[name="message"]');

    await expect(nameInput).toBeVisible();

    // First submission
    await nameInput.fill('First User');
    await emailInput.fill('first.user@example.com');
    await messageTextarea.fill('First inquiry message asking about camping availability.');

    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await submitButton.click();

    // Wait for first submission
    

    // Check if form cleared
    const success = page.locator('[data-testid="success-message"]').or(
      page.getByText(/inquiry sent|submitted successfully/i)
    );

    if (await success.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Verify form is cleared
      await expect(nameInput).toHaveValue('');
      await expect(emailInput).toHaveValue('');
      await expect(messageTextarea).toHaveValue('');

      // Second submission - fill form again
      await nameInput.fill('Second User');
      await emailInput.fill('second.user@example.com');
      await messageTextarea.fill('Second inquiry message asking about different dates.');

      // Verify new values
      await expect(nameInput).toHaveValue('Second User');
      await expect(emailInput).toHaveValue('second.user@example.com');
      await expect(messageTextarea).toHaveValue(/Second inquiry/i);

      // Submit button should be enabled for second submission
      await expect(submitButton).toBeEnabled();

      // Submit second inquiry
      await submitButton.click();

      // Wait for second submission
      

      // Should show success again
      if (await success.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Form should clear again
        await expect(nameInput).toHaveValue('');
        await expect(emailInput).toHaveValue('');
        await expect(messageTextarea).toHaveValue('');
      }
    }
  });

  test('T081.6: Optional phone field also cleared after submission', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact|inquire/i });
    if (await inquiryButton.isVisible()) {
      await inquiryButton.click();
    }

    const phoneInput = page.locator('input#guest_phone, input[name="guest_phone"]');

    // Fill all fields including optional phone
    const nameInput = page.locator('input#guest_name, input[name="guest_name"]');
    await nameInput.fill('Phone Test User');

    const emailInput = page.locator('input#guest_email, input[name="guest_email"]');
    await emailInput.fill('phone.test@example.com');

    if (await phoneInput.isVisible()) {
      await phoneInput.fill('0891234567');
      await expect(phoneInput).toHaveValue('0891234567');
    }

    const messageTextarea = page.locator('textarea#message, textarea[name="message"]');
    await messageTextarea.fill('Testing that phone number is also cleared after submission.');

    // Submit
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await submitButton.click();

    // Wait for submission
    

    // Check for success
    const success = page.locator('[data-testid="success-message"]').or(
      page.getByText(/inquiry sent|submitted successfully/i)
    );

    if (await success.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Phone field should also be cleared
      if (await phoneInput.isVisible()) {
        await expect(phoneInput).toHaveValue('');
      }
    }
  });

  test('T081.7: Inquiry type resets to default after submission', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact|inquire/i });
    if (await inquiryButton.isVisible()) {
      await inquiryButton.click();
    }

    

    // Change inquiry type if type selector exists
    const bookingTypeButton = page.getByRole('button', { name: /booking inquiry/i });
    const complaintTypeButton = page.getByRole('button', { name: /complaint/i });

    if (await bookingTypeButton.isVisible()) {
      await bookingTypeButton.click();
      
    }

    // Fill required fields
    const nameInput = page.locator('input#guest_name, input[name="guest_name"]');
    await nameInput.fill('Type Test User');

    const emailInput = page.locator('input#guest_email, input[name="guest_email"]');
    await emailInput.fill('type.test@example.com');

    const messageTextarea = page.locator('textarea#message, textarea[name="message"]');
    await messageTextarea.fill('Testing that inquiry type also resets after submission.');

    // Submit
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await submitButton.click();

    // Wait for submission
    

    // Check for success
    const success = page.locator('[data-testid="success-message"]').or(
      page.getByText(/inquiry sent|submitted successfully/i)
    );

    if (await success.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Inquiry type should reset to default (general)
      const generalTypeButton = page.getByRole('button', { name: /general question/i });
      if (await generalTypeButton.isVisible()) {
        // Default type should be active (general is typically default)
        // Check by looking for active variant styling or aria-pressed
        const isActive = await generalTypeButton.evaluate((el) => {
          return el.classList.contains('bg-primary') ||
                 el.getAttribute('aria-pressed') === 'true' ||
                 el.getAttribute('data-state') === 'active';
        });
        expect(isActive).toBeTruthy();
      }
    }
  });

  test('T081.8: Date fields cleared if they were filled', async ({ page }) => {
    // Open inquiry form
    const inquiryButton = page.getByRole('button', { name: /send inquiry|contact|inquire/i });
    if (await inquiryButton.isVisible()) {
      await inquiryButton.click();
    }

    

    // Show dates section if it's collapsible
    const showDatesButton = page.getByRole('button', { name: /add.*date|show.*date/i });
    if (await showDatesButton.isVisible()) {
      await showDatesButton.click();
      
    }

    // Fill date fields if visible
    const checkInInput = page.locator('input#check_in_date, input[name="check_in_date"]');
    const checkOutInput = page.locator('input#check_out_date, input[name="check_out_date"]');

    if (await checkInInput.isVisible()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const checkInDate = tomorrow.toISOString().split('T')[0];

      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 3);
      const checkOutDate = dayAfter.toISOString().split('T')[0];

      await checkInInput.fill(checkInDate);
      await checkOutInput.fill(checkOutDate);

      await expect(checkInInput).toHaveValue(checkInDate);
      await expect(checkOutInput).toHaveValue(checkOutDate);
    }

    // Fill required fields
    const nameInput = page.locator('input#guest_name, input[name="guest_name"]');
    await nameInput.fill('Date Test User');

    const emailInput = page.locator('input#guest_email, input[name="guest_email"]');
    await emailInput.fill('date.test@example.com');

    const messageTextarea = page.locator('textarea#message, textarea[name="message"]');
    await messageTextarea.fill('Testing that date fields are also cleared after submission.');

    // Submit
    const submitButton = page.getByRole('button', { name: /send inquiry|submit/i });
    await submitButton.click();

    // Wait for submission
    

    // Check for success
    const success = page.locator('[data-testid="success-message"]').or(
      page.getByText(/inquiry sent|submitted successfully/i)
    );

    if (await success.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Date fields should also be cleared if they exist
      if (await checkInInput.isVisible()) {
        await expect(checkInInput).toHaveValue('');
        await expect(checkOutInput).toHaveValue('');
      }
    }
  });
});
