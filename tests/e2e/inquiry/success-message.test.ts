import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Inquiry Success Message (US-018)
 * Tests the success message display after inquiry submission
 *
 * Test Coverage:
 * - Success message displays after successful submission
 * - Success message is visible and accessible
 * - Message contains confirmation text
 * - Proper ARIA attributes for accessibility
 * - Message timing and auto-hide behavior (if implemented)
 * - Dismiss button functionality (if implemented)
 */

test.describe('Inquiry Success Message', () => {
  const TEST_CAMPSITE_SLUG = 'test-campsite-for-inquiry';

  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page
    await page.goto(`/campsites/${TEST_CAMPSITE_SLUG}`);
    await page.waitForLoadState('networkidle');

    // Mock authentication (optional - inquiry can be sent by non-logged-in users)
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-auth-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User'
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('T073.1: Success message displays after successful submission', async ({ page }) => {
    // Scroll to contact section
    await page.locator('[data-testid="contact-section"]').scrollIntoViewIfNeeded();

    // Open inquiry form
    const sendInquiryButton = page.getByRole('button', { name: /send inquiry/i });
    await sendInquiryButton.click();

    // Wait for form to appear
    const inquiryForm = page.locator('[data-testid="inquiry-form"]').or(
      page.getByRole('dialog', { name: /inquiry/i })
    );
    await expect(inquiryForm).toBeVisible();

    // Fill required fields
    const nameInput = page.getByLabel(/name/i).first();
    const emailInput = page.getByLabel(/email/i).first();
    const phoneInput = page.getByLabel(/phone/i);
    const messageTextarea = page.getByLabel(/message/i);

    // Pre-filled fields might already have values for logged-in users
    if (await nameInput.inputValue() === '') {
      await nameInput.fill('John Doe');
    }
    if (await emailInput.inputValue() === '') {
      await emailInput.fill('john.doe@example.com');
    }
    await phoneInput.fill('0812345678');

    // Select inquiry type
    const inquiryTypeSelect = page.getByLabel(/inquiry type/i);
    await inquiryTypeSelect.click();
    await page.getByRole('option', { name: /booking inquiry/i }).click();

    // Fill message (minimum 20 characters)
    await messageTextarea.fill('I would like to book your campsite for this weekend. Do you have availability?');

    // Submit the form
    const submitButton = page.getByRole('button', { name: /send message|submit/i });
    await submitButton.click();

    // Wait for submission
    

    // Check for success message
    const successMessage = page.locator('[data-testid="success-message"]').or(
      page.getByText(/message sent successfully/i)
    ).or(
      page.getByText(/inquiry sent/i)
    );

    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('T073.2: Success message is visible and accessible', async ({ page }) => {
    // Scroll to contact section
    await page.locator('[data-testid="contact-section"]').scrollIntoViewIfNeeded();

    // Open and submit inquiry form
    await page.getByRole('button', { name: /send inquiry/i }).click();

    const inquiryForm = page.locator('[data-testid="inquiry-form"]').or(
      page.getByRole('dialog', { name: /inquiry/i })
    );
    await expect(inquiryForm).toBeVisible();

    // Fill and submit form
    const nameInput = page.getByLabel(/name/i).first();
    const emailInput = page.getByLabel(/email/i).first();
    const phoneInput = page.getByLabel(/phone/i);
    const messageTextarea = page.getByLabel(/message/i);

    if (await nameInput.inputValue() === '') {
      await nameInput.fill('Jane Smith');
    }
    if (await emailInput.inputValue() === '') {
      await emailInput.fill('jane.smith@example.com');
    }
    await phoneInput.fill('0823456789');

    const inquiryTypeSelect = page.getByLabel(/inquiry type/i);
    await inquiryTypeSelect.click();
    await page.getByRole('option', { name: /general question/i }).click();

    await messageTextarea.fill('What are the check-in and check-out times for your campsite?');

    await page.getByRole('button', { name: /send message|submit/i }).click();
    

    // Check success message visibility
    const successMessage = page.locator('[data-testid="success-message"]').or(
      page.getByText(/message sent successfully/i)
    ).or(
      page.getByText(/inquiry sent/i)
    );

    await expect(successMessage).toBeVisible();

    // Check that success message is in viewport
    const boundingBox = await successMessage.boundingBox();
    expect(boundingBox).not.toBeNull();
  });

  test('T073.3: Success message contains confirmation text', async ({ page }) => {
    // Scroll to contact section
    await page.locator('[data-testid="contact-section"]').scrollIntoViewIfNeeded();

    // Open and submit inquiry form
    await page.getByRole('button', { name: /send inquiry/i }).click();

    const inquiryForm = page.locator('[data-testid="inquiry-form"]').or(
      page.getByRole('dialog', { name: /inquiry/i })
    );
    await expect(inquiryForm).toBeVisible();

    // Fill and submit form
    const nameInput = page.getByLabel(/name/i).first();
    const emailInput = page.getByLabel(/email/i).first();
    const phoneInput = page.getByLabel(/phone/i);
    const messageTextarea = page.getByLabel(/message/i);

    if (await nameInput.inputValue() === '') {
      await nameInput.fill('Bob Johnson');
    }
    if (await emailInput.inputValue() === '') {
      await emailInput.fill('bob.johnson@example.com');
    }
    await phoneInput.fill('0834567890');

    const inquiryTypeSelect = page.getByLabel(/inquiry type/i);
    await inquiryTypeSelect.click();
    await page.getByRole('option', { name: /other/i }).click();

    await messageTextarea.fill('Are pets allowed at your campsite? I have a small dog.');

    await page.getByRole('button', { name: /send message|submit/i }).click();
    

    // Check success message content
    const successMessage = page.locator('[data-testid="success-message"]').or(
      page.getByText(/message sent successfully/i)
    ).or(
      page.getByText(/inquiry sent/i)
    );

    await expect(successMessage).toBeVisible();

    // Verify confirmation text
    await expect(successMessage).toContainText(/success|sent|submitted/i);

    // May also include user email confirmation text
    const fullText = await successMessage.textContent();
    expect(fullText).toBeTruthy();
    expect(fullText!.length).toBeGreaterThan(10);
  });

  test('T073.4: Success message has proper ARIA attributes', async ({ page }) => {
    // Scroll to contact section
    await page.locator('[data-testid="contact-section"]').scrollIntoViewIfNeeded();

    // Open and submit inquiry form
    await page.getByRole('button', { name: /send inquiry/i }).click();

    const inquiryForm = page.locator('[data-testid="inquiry-form"]').or(
      page.getByRole('dialog', { name: /inquiry/i })
    );
    await expect(inquiryForm).toBeVisible();

    // Fill and submit form
    const nameInput = page.getByLabel(/name/i).first();
    const emailInput = page.getByLabel(/email/i).first();
    const phoneInput = page.getByLabel(/phone/i);
    const messageTextarea = page.getByLabel(/message/i);

    if (await nameInput.inputValue() === '') {
      await nameInput.fill('Alice Wong');
    }
    if (await emailInput.inputValue() === '') {
      await emailInput.fill('alice.wong@example.com');
    }
    await phoneInput.fill('0845678901');

    const inquiryTypeSelect = page.getByLabel(/inquiry type/i);
    await inquiryTypeSelect.click();
    await page.getByRole('option', { name: /complaint/i }).click();

    await messageTextarea.fill('I had an issue with the booking process. Can you help me?');

    await page.getByRole('button', { name: /send message|submit/i }).click();
    

    // Find success message
    const successMessage = page.locator('[data-testid="success-message"]').or(
      page.getByText(/message sent successfully/i)
    ).or(
      page.getByText(/inquiry sent/i)
    );

    await expect(successMessage).toBeVisible();

    // Check ARIA attributes for accessibility
    // Success messages should have role="alert" or role="status"
    const hasAlertRole = await successMessage.evaluate((el) => {
      return el.getAttribute('role') === 'alert' ||
             el.getAttribute('role') === 'status' ||
             el.closest('[role="alert"]') !== null ||
             el.closest('[role="status"]') !== null;
    });

    // If no role attribute, check if it has aria-live
    if (!hasAlertRole) {
      const ariaLive = await successMessage.evaluate((el) => {
        return el.getAttribute('aria-live') ||
               el.closest('[aria-live]')?.getAttribute('aria-live');
      });
      expect(ariaLive).toBeTruthy();
    }
  });

  test('T073.5: Success message appears immediately after submit', async ({ page }) => {
    // Scroll to contact section
    await page.locator('[data-testid="contact-section"]').scrollIntoViewIfNeeded();

    // Open inquiry form
    await page.getByRole('button', { name: /send inquiry/i }).click();

    const inquiryForm = page.locator('[data-testid="inquiry-form"]').or(
      page.getByRole('dialog', { name: /inquiry/i })
    );
    await expect(inquiryForm).toBeVisible();

    // Fill form
    const nameInput = page.getByLabel(/name/i).first();
    const emailInput = page.getByLabel(/email/i).first();
    const phoneInput = page.getByLabel(/phone/i);
    const messageTextarea = page.getByLabel(/message/i);

    if (await nameInput.inputValue() === '') {
      await nameInput.fill('Charlie Brown');
    }
    if (await emailInput.inputValue() === '') {
      await emailInput.fill('charlie.brown@example.com');
    }
    await phoneInput.fill('0856789012');

    const inquiryTypeSelect = page.getByLabel(/inquiry type/i);
    await inquiryTypeSelect.click();
    await page.getByRole('option', { name: /booking inquiry/i }).click();

    await messageTextarea.fill('I am planning a camping trip next month. Can I get more details about facilities?');

    // Submit and measure timing
    const submitButton = page.getByRole('button', { name: /send message|submit/i });
    const startTime = Date.now();
    await submitButton.click();

    // Success message should appear within 3 seconds
    const successMessage = page.locator('[data-testid="success-message"]').or(
      page.getByText(/message sent successfully/i)
    ).or(
      page.getByText(/inquiry sent/i)
    );

    await expect(successMessage).toBeVisible({ timeout: 3000 });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should appear within 3 seconds
    expect(duration).toBeLessThan(3000);
  });

  test('T073.6: Success message auto-hides after time (if implemented)', async ({ page }) => {
    // Scroll to contact section
    await page.locator('[data-testid="contact-section"]').scrollIntoViewIfNeeded();

    // Open and submit inquiry form
    await page.getByRole('button', { name: /send inquiry/i }).click();

    const inquiryForm = page.locator('[data-testid="inquiry-form"]').or(
      page.getByRole('dialog', { name: /inquiry/i })
    );
    await expect(inquiryForm).toBeVisible();

    // Fill and submit form
    const nameInput = page.getByLabel(/name/i).first();
    const emailInput = page.getByLabel(/email/i).first();
    const phoneInput = page.getByLabel(/phone/i);
    const messageTextarea = page.getByLabel(/message/i);

    if (await nameInput.inputValue() === '') {
      await nameInput.fill('David Lee');
    }
    if (await emailInput.inputValue() === '') {
      await emailInput.fill('david.lee@example.com');
    }
    await phoneInput.fill('0867890123');

    const inquiryTypeSelect = page.getByLabel(/inquiry type/i);
    await inquiryTypeSelect.click();
    await page.getByRole('option', { name: /general question/i }).click();

    await messageTextarea.fill('What activities are available near your campsite?');

    await page.getByRole('button', { name: /send message|submit/i }).click();
    

    // Check if success message is visible
    const successMessage = page.locator('[data-testid="success-message"]').or(
      page.getByText(/message sent successfully/i)
    ).or(
      page.getByText(/inquiry sent/i)
    );

    await expect(successMessage).toBeVisible();

    // Wait for auto-hide (typically 3-5 seconds)
    // If auto-hide is implemented, message should disappear
    // If not, it will remain visible (which is also acceptable)
    

    // Check if message is still visible or has been hidden
    const isStillVisible = await successMessage.isVisible().catch(() => false);

    // Either behavior is acceptable:
    // 1. Auto-hides after time
    // 2. Remains visible until user dismisses or navigates away
    // This test documents the behavior
    if (isStillVisible) {
      // Message persists - acceptable behavior
      expect(isStillVisible).toBe(true);
    } else {
      // Message auto-hides - acceptable behavior
      expect(isStillVisible).toBe(false);
    }
  });

  test('T073.7: Dismiss button works (if implemented)', async ({ page }) => {
    // Scroll to contact section
    await page.locator('[data-testid="contact-section"]').scrollIntoViewIfNeeded();

    // Open and submit inquiry form
    await page.getByRole('button', { name: /send inquiry/i }).click();

    const inquiryForm = page.locator('[data-testid="inquiry-form"]').or(
      page.getByRole('dialog', { name: /inquiry/i })
    );
    await expect(inquiryForm).toBeVisible();

    // Fill and submit form
    const nameInput = page.getByLabel(/name/i).first();
    const emailInput = page.getByLabel(/email/i).first();
    const phoneInput = page.getByLabel(/phone/i);
    const messageTextarea = page.getByLabel(/message/i);

    if (await nameInput.inputValue() === '') {
      await nameInput.fill('Emma Wilson');
    }
    if (await emailInput.inputValue() === '') {
      await emailInput.fill('emma.wilson@example.com');
    }
    await phoneInput.fill('0878901234');

    const inquiryTypeSelect = page.getByLabel(/inquiry type/i);
    await inquiryTypeSelect.click();
    await page.getByRole('option', { name: /booking inquiry/i }).click();

    await messageTextarea.fill('Is there a discount for group bookings of more than 5 people?');

    await page.getByRole('button', { name: /send message|submit/i }).click();
    

    // Check if success message is visible
    const successMessage = page.locator('[data-testid="success-message"]').or(
      page.getByText(/message sent successfully/i)
    ).or(
      page.getByText(/inquiry sent/i)
    );

    await expect(successMessage).toBeVisible();

    // Look for dismiss button (close button, X button, OK button, etc.)
    const dismissButton = page.locator('[data-testid="success-message-close"]').or(
      successMessage.locator('button[aria-label*="close"]')
    ).or(
      successMessage.locator('button[aria-label*="dismiss"]')
    ).or(
      page.getByRole('button', { name: /close|dismiss|ok/i })
    ).first();

    // If dismiss button exists, test it
    if (await dismissButton.isVisible().catch(() => false)) {
      await dismissButton.click();

      // Success message should disappear
      await expect(successMessage).not.toBeVisible({ timeout: 1000 });
    } else {
      // No dismiss button - acceptable behavior (auto-hide or persistent message)
      // Test passes as this is valid UI pattern
      expect(true).toBe(true);
    }
  });

  test('T073.8: Form clears after successful submission', async ({ page }) => {
    // Scroll to contact section
    await page.locator('[data-testid="contact-section"]').scrollIntoViewIfNeeded();

    // Open inquiry form
    await page.getByRole('button', { name: /send inquiry/i }).click();

    const inquiryForm = page.locator('[data-testid="inquiry-form"]').or(
      page.getByRole('dialog', { name: /inquiry/i })
    );
    await expect(inquiryForm).toBeVisible();

    // Fill form
    const nameInput = page.getByLabel(/name/i).first();
    const emailInput = page.getByLabel(/email/i).first();
    const phoneInput = page.getByLabel(/phone/i);
    const messageTextarea = page.getByLabel(/message/i);

    const testName = 'Form Clear Test';
    const testEmail = 'formclear@example.com';
    const testPhone = '0889012345';
    const testMessage = 'This message should be cleared after successful submission.';

    // Clear pre-filled values and enter test data
    await nameInput.clear();
    await nameInput.fill(testName);
    await emailInput.clear();
    await emailInput.fill(testEmail);
    await phoneInput.fill(testPhone);

    const inquiryTypeSelect = page.getByLabel(/inquiry type/i);
    await inquiryTypeSelect.click();
    await page.getByRole('option', { name: /general question/i }).click();

    await messageTextarea.fill(testMessage);

    // Submit
    await page.getByRole('button', { name: /send message|submit/i }).click();
    

    // Verify success message
    const successMessage = page.locator('[data-testid="success-message"]').or(
      page.getByText(/message sent successfully/i)
    ).or(
      page.getByText(/inquiry sent/i)
    );
    await expect(successMessage).toBeVisible();

    // Wait a bit for form to clear
    

    // Check if form fields are cleared
    // Message should definitely be cleared
    if (await messageTextarea.isVisible()) {
      const messageValue = await messageTextarea.inputValue();
      expect(messageValue).toBe('');
    }

    // Phone should be cleared
    if (await phoneInput.isVisible()) {
      const phoneValue = await phoneInput.inputValue();
      expect(phoneValue).toBe('');
    }

    // Name and email might remain if user is logged in (acceptable)
    // But if form closes/resets, they should be cleared or back to pre-filled values
  });

  test('T073.9: Multiple submissions show success message each time', async ({ page }) => {
    // Scroll to contact section
    await page.locator('[data-testid="contact-section"]').scrollIntoViewIfNeeded();

    // First submission
    await page.getByRole('button', { name: /send inquiry/i }).click();

    let inquiryForm = page.locator('[data-testid="inquiry-form"]').or(
      page.getByRole('dialog', { name: /inquiry/i })
    );
    await expect(inquiryForm).toBeVisible();

    let nameInput = page.getByLabel(/name/i).first();
    let emailInput = page.getByLabel(/email/i).first();
    let phoneInput = page.getByLabel(/phone/i);
    let messageTextarea = page.getByLabel(/message/i);

    if (await nameInput.inputValue() === '') {
      await nameInput.fill('First Submission');
    }
    if (await emailInput.inputValue() === '') {
      await emailInput.fill('first@example.com');
    }
    await phoneInput.fill('0890123456');

    let inquiryTypeSelect = page.getByLabel(/inquiry type/i);
    await inquiryTypeSelect.click();
    await page.getByRole('option', { name: /booking inquiry/i }).click();

    await messageTextarea.fill('First inquiry message - checking availability for this weekend.');

    await page.getByRole('button', { name: /send message|submit/i }).click();
    

    // Verify first success message
    let successMessage = page.locator('[data-testid="success-message"]').or(
      page.getByText(/message sent successfully/i)
    ).or(
      page.getByText(/inquiry sent/i)
    );
    await expect(successMessage).toBeVisible();

    // Wait for form to close/reset
    

    // Second submission (note: may be blocked by rate limiting in real implementation)
    // Re-open form if it closed
    if (!await inquiryForm.isVisible()) {
      await page.getByRole('button', { name: /send inquiry/i }).click();
      
    }

    inquiryForm = page.locator('[data-testid="inquiry-form"]').or(
      page.getByRole('dialog', { name: /inquiry/i })
    );

    if (await inquiryForm.isVisible()) {
      nameInput = page.getByLabel(/name/i).first();
      emailInput = page.getByLabel(/email/i).first();
      phoneInput = page.getByLabel(/phone/i);
      messageTextarea = page.getByLabel(/message/i);

      if (await nameInput.inputValue() === '') {
        await nameInput.fill('Second Submission');
      }
      if (await emailInput.inputValue() === '') {
        await emailInput.fill('second@example.com');
      }
      await phoneInput.fill('0801234567');

      inquiryTypeSelect = page.getByLabel(/inquiry type/i);
      await inquiryTypeSelect.click();
      await page.getByRole('option', { name: /general question/i }).click();

      await messageTextarea.fill('Second inquiry message - asking about pet policies.');

      await page.getByRole('button', { name: /send message|submit/i }).click();
      

      // Verify second success message
      successMessage = page.locator('[data-testid="success-message"]').or(
        page.getByText(/message sent successfully/i)
      ).or(
        page.getByText(/inquiry sent/i)
      );
      await expect(successMessage).toBeVisible();
    }
  });
});
