import { test, expect } from '@playwright/test';

test.describe('Inquiry Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to campsite detail page with inquiry form
    // Assuming campsite ID 1 exists for testing
    await page.goto('/campsites/1');
    await page.waitForLoadState('networkidle');

    // Scroll to inquiry section and click "Send Inquiry" button
    await page.locator('[data-testid="send-inquiry-button"]').click();
    await expect(page.locator('form')).toBeVisible({ timeout: 5000 });
  });

  test('Submit empty form shows all required field errors', async ({ page }) => {
    // Click submit button without filling any fields
    const submitButton = page.locator('button[type="submit"]:has-text("Send Inquiry")');
    await submitButton.click();

    // Check that all required field errors are visible
    const nameError = page.locator('p.text-red-500:has-text("Name is required")');
    const emailError = page.locator('p.text-red-500:has-text("Email is required")');
    const messageError = page.locator('p.text-red-500:has-text("Message is required")');

    await expect(nameError).toBeVisible();
    await expect(emailError).toBeVisible();
    await expect(messageError).toBeVisible();
  });

  test('Name required error shown when name is empty', async ({ page }) => {
    // Fill other required fields but leave name empty
    await page.locator('#guest_email').fill('test@example.com');
    await page.locator('#message').fill('This is a valid inquiry message with sufficient length.');

    // Click submit
    const submitButton = page.locator('button[type="submit"]:has-text("Send Inquiry")');
    await submitButton.click();

    // Check name error is visible
    const nameError = page.locator('p.text-red-500:has-text("Name is required")');
    await expect(nameError).toBeVisible();
  });

  test('Email required error shown when email is empty', async ({ page }) => {
    // Fill other required fields but leave email empty
    await page.locator('#guest_name').fill('John Doe');
    await page.locator('#message').fill('This is a valid inquiry message with sufficient length.');

    // Click submit
    const submitButton = page.locator('button[type="submit"]:has-text("Send Inquiry")');
    await submitButton.click();

    // Check email error is visible
    const emailError = page.locator('p.text-red-500:has-text("Email is required")');
    await expect(emailError).toBeVisible();
  });

  test('Message required error shown when message is empty', async ({ page }) => {
    // Fill other required fields but leave message empty
    await page.locator('#guest_name').fill('John Doe');
    await page.locator('#guest_email').fill('test@example.com');

    // Click submit
    const submitButton = page.locator('button[type="submit"]:has-text("Send Inquiry")');
    await submitButton.click();

    // Check message error is visible
    const messageError = page.locator('p.text-red-500:has-text("Message is required")');
    await expect(messageError).toBeVisible();
  });

  test('Inquiry type can be selected (no required error for type)', async ({ page }) => {
    // Verify default inquiry type is selected
    const generalButton = page.locator('button:has-text("General Question")');
    await expect(generalButton).toHaveAttribute('variant', 'default');

    // Click different inquiry types
    const bookingButton = page.locator('button:has-text("Booking Inquiry")');
    await bookingButton.click();

    // Verify booking is now selected
    await expect(bookingButton).toHaveClass(/bg-primary|variant-default/);
  });

  test('Invalid email format shows error', async ({ page }) => {
    // Fill email with invalid format
    await page.locator('#guest_email').fill('invalid-email');
    await page.locator('#guest_email').blur();

    // Check for email format error
    const emailError = page.locator('p.text-red-500:has-text("valid email")');
    await expect(emailError).toBeVisible();
  });

  test('Multiple invalid email formats show error', async ({ page }) => {
    const invalidEmails = [
      'invalid',
      '@example.com',
      'test@',
      'test @example.com',
      'test@example',
    ];

    for (const email of invalidEmails) {
      await page.locator('#guest_email').clear();
      await page.locator('#guest_email').fill(email);
      await page.locator('#guest_email').blur();

      // Check error appears
      const emailError = page.locator('p.text-red-500:has-text("valid email")');
      await expect(emailError).toBeVisible();
    }
  });

  test('Message too short shows error', async ({ page }) => {
    // Fill message with less than 20 characters
    await page.locator('#message').fill('Too short');
    await page.locator('#message').blur();

    // Check for message length error
    const messageError = page.locator('p.text-red-500:has-text("at least 20 characters")');
    await expect(messageError).toBeVisible();

    // Submit button should be disabled
    const submitButton = page.locator('button[type="submit"]:has-text("Send Inquiry")');
    await expect(submitButton).toBeDisabled();
  });

  test('Message with exactly 19 characters shows error', async ({ page }) => {
    // Fill message with exactly 19 characters
    const shortMessage = 'a'.repeat(19);
    await page.locator('#message').fill(shortMessage);
    await page.locator('#message').blur();

    // Check for message length error
    const messageError = page.locator('p.text-red-500:has-text("at least 20 characters")');
    await expect(messageError).toBeVisible();
  });

  test('Message with exactly 20 characters passes validation', async ({ page }) => {
    // Fill message with exactly 20 characters
    const validMessage = 'a'.repeat(20);
    await page.locator('#message').fill(validMessage);
    await page.locator('#message').blur();

    // Check no message error
    const messageError = page.locator('p.text-red-500:has-text("at least 20 characters")');
    await expect(messageError).not.toBeVisible();

    // Character count should show green
    const charCountStatus = page.locator('text=Message length OK');
    await expect(charCountStatus).toBeVisible();
  });

  test('Invalid phone format shows error', async ({ page }) => {
    // Fill phone with invalid Thai format
    await page.locator('#guest_phone').fill('123456');
    await page.locator('#guest_phone').blur();

    // Check for phone format error
    const phoneError = page.locator('p.text-red-500:has-text("Invalid Thai phone number")');
    await expect(phoneError).toBeVisible();
  });

  test('Multiple invalid phone formats show error', async ({ page }) => {
    const invalidPhones = [
      '12345678',
      '1812345678',
      '081234567',
      'abcdefghij',
      '0812-34-567',
    ];

    for (const phone of invalidPhones) {
      await page.locator('#guest_phone').clear();
      await page.locator('#guest_phone').fill(phone);
      await page.locator('#guest_phone').blur();

      // Check error appears
      const phoneError = page.locator('p.text-red-500:has-text("Invalid Thai phone number")');
      await expect(phoneError).toBeVisible();
    }
  });

  test('Valid Thai phone formats pass validation', async ({ page }) => {
    const validPhones = [
      '0812345678',
      '081-234-5678',
      '081 234 5678',
    ];

    for (const phone of validPhones) {
      await page.locator('#guest_phone').clear();
      await page.locator('#guest_phone').fill(phone);
      await page.locator('#guest_phone').blur();

      // Check no error appears
      const phoneError = page.locator('p.text-red-500:has-text("Invalid Thai phone number")');
      await expect(phoneError).not.toBeVisible();
    }
  });

  test('Empty phone field passes validation (optional field)', async ({ page }) => {
    // Leave phone empty
    await page.locator('#guest_phone').clear();
    await page.locator('#guest_phone').blur();

    // Check no phone error
    const phoneError = page.locator('p.text-red-500:has-text("Invalid Thai phone number")');
    await expect(phoneError).not.toBeVisible();
  });

  test('Name error clears when valid input entered', async ({ page }) => {
    // Submit empty form to trigger errors
    const submitButton = page.locator('button[type="submit"]:has-text("Send Inquiry")');
    await submitButton.click();

    // Verify name error is visible
    const nameError = page.locator('p.text-red-500:has-text("Name is required")');
    await expect(nameError).toBeVisible();

    // Enter valid name
    await page.locator('#guest_name').fill('John Doe');

    // Error should be gone
    await expect(nameError).not.toBeVisible();
  });

  test('Email error clears when valid input entered', async ({ page }) => {
    // Fill invalid email
    await page.locator('#guest_email').fill('invalid-email');
    await page.locator('#guest_email').blur();

    // Verify error is visible
    const emailError = page.locator('p.text-red-500:has-text("valid email")');
    await expect(emailError).toBeVisible();

    // Enter valid email
    await page.locator('#guest_email').clear();
    await page.locator('#guest_email').fill('test@example.com');

    // Error should be gone
    await expect(emailError).not.toBeVisible();
  });

  test('Message error clears when valid input entered', async ({ page }) => {
    // Fill short message
    await page.locator('#message').fill('Short');
    await page.locator('#message').blur();

    // Verify error is visible
    const messageError = page.locator('p.text-red-500:has-text("at least 20 characters")');
    await expect(messageError).toBeVisible();

    // Enter valid message
    await page.locator('#message').clear();
    await page.locator('#message').fill('This is a valid inquiry message with sufficient length.');

    // Error should be gone
    await expect(messageError).not.toBeVisible();
  });

  test('Phone error clears when valid input entered', async ({ page }) => {
    // Fill invalid phone
    await page.locator('#guest_phone').fill('123456');
    await page.locator('#guest_phone').blur();

    // Verify error is visible
    const phoneError = page.locator('p.text-red-500:has-text("Invalid Thai phone number")');
    await expect(phoneError).toBeVisible();

    // Enter valid phone
    await page.locator('#guest_phone').clear();
    await page.locator('#guest_phone').fill('0812345678');

    // Error should be gone
    await expect(phoneError).not.toBeVisible();
  });

  test('All errors clear when all fields filled with valid data', async ({ page }) => {
    // Submit empty form to trigger all errors
    const submitButton = page.locator('button[type="submit"]:has-text("Send Inquiry")');
    await submitButton.click();

    // Fill all required fields with valid data
    await page.locator('#guest_name').fill('John Doe');
    await page.locator('#guest_email').fill('test@example.com');
    await page.locator('#message').fill('This is a valid inquiry message with sufficient length for submission.');

    // Verify all errors are gone
    const nameError = page.locator('p.text-red-500:has-text("Name is required")');
    const emailError = page.locator('p.text-red-500:has-text("Email is required")');
    const messageError = page.locator('p.text-red-500:has-text("Message is required")');

    await expect(nameError).not.toBeVisible();
    await expect(emailError).not.toBeVisible();
    await expect(messageError).not.toBeVisible();

    // Submit button should be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('Character counter updates in real-time', async ({ page }) => {
    const messageInput = page.locator('#message');

    // Type message and check counter
    const testMessage = 'This is a test inquiry message.';
    await messageInput.fill(testMessage);

    // Check counter shows correct count
    const counterText = page.locator(`text=${testMessage.length}/2000`);
    await expect(counterText).toBeVisible();

    // Type longer message
    const longerMessage = 'This is a much longer test inquiry message with significantly more content to validate the character counter updates correctly.';
    await messageInput.clear();
    await messageInput.fill(longerMessage);

    // Check counter updated
    const updatedCounterText = page.locator(`text=${longerMessage.length}/2000`);
    await expect(updatedCounterText).toBeVisible();
  });

  test('Name minimum length validation (2 characters)', async ({ page }) => {
    // Fill name with 1 character
    await page.locator('#guest_name').fill('A');
    await page.locator('#guest_name').blur();

    // Check for name length error
    const nameError = page.locator('p.text-red-500:has-text("at least 2 characters")');
    await expect(nameError).toBeVisible();

    // Fill name with 2 characters
    await page.locator('#guest_name').clear();
    await page.locator('#guest_name').fill('AB');
    await page.locator('#guest_name').blur();

    // Error should clear
    await expect(nameError).not.toBeVisible();
  });

  test('Submit button disabled with invalid data', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]:has-text("Send Inquiry")');

    // Fill form with short message (invalid)
    await page.locator('#guest_name').fill('John Doe');
    await page.locator('#guest_email').fill('test@example.com');
    await page.locator('#message').fill('Short');

    // Submit button should be disabled due to short message
    await expect(submitButton).toBeDisabled();
  });

  test('Submit button enabled with all valid data', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]:has-text("Send Inquiry")');

    // Fill all required fields with valid data
    await page.locator('#guest_name').fill('John Doe');
    await page.locator('#guest_email').fill('test@example.com');
    await page.locator('#message').fill('This is a valid inquiry message with sufficient length for successful submission.');

    // Submit button should be enabled
    await expect(submitButton).toBeEnabled();
  });
});
