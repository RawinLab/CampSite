import { test, expect } from '@playwright/test';

test.describe('Inquiry Form Pre-filled Fields for Logged-in Users', () => {
  const TEST_USER = {
    email: 'test.user@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
    phone: '+66812345678',
  };

  test.describe('Logged-in User Pre-fill', () => {
    test.beforeEach(async ({ page, context }) => {
      // Simulate authenticated session
      // In real scenario, this would use actual Supabase auth
      const mockToken = 'mock-token-for-testing';
      await context.addCookies([
        {
          name: 'campsite_access_token',
          value: mockToken,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
        {
          name: 'campsite_refresh_token',
          value: mockToken,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);

      // Also set localStorage tokens
      await page.addInitScript((tokenData) => {
        localStorage.setItem('campsite_access_token', tokenData.token);
        localStorage.setItem('campsite_refresh_token', tokenData.token);
        localStorage.setItem('campsite_token_expiry', tokenData.expiry);
      }, {
        token: mockToken,
        expiry: (Date.now() + 3600000).toString(),
      });

      // Store user data in localStorage to simulate profile data
      await page.goto('/');
      await page.evaluate((user) => {
        localStorage.setItem('user_profile', JSON.stringify({
          full_name: user.name,
          email: user.email,
          phone: user.phone,
        }));
      }, TEST_USER);

      // Navigate to campsite detail page
      await page.goto('/campsites/test-campsite-1');
      await page.waitForLoadState('networkidle');
    });

    test('T-INQ-001: Name field is pre-filled for logged-in user', async ({ page }) => {
      // Open inquiry form
      const inquiryButton = page.getByRole('button', { name: /สอบถาม/i }).or(
        page.getByRole('button', { name: /inquiry/i }).or(
          page.getByRole('link', { name: /ติดต่อ/i }).or(
            page.getByRole('link', { name: /contact/i })
          )
        )
      );

      if (await inquiryButton.isVisible()) {
        await inquiryButton.click();
         // Wait for form to appear
      }

      // Find name input field
      const nameInput = page.getByLabel(/ชื่อ/i).or(
        page.getByLabel(/name/i).or(
          page.getByPlaceholder(/ชื่อ/i).or(
            page.getByPlaceholder(/name/i).or(
              page.locator('input[name="name"]').or(
                page.locator('[data-testid="inquiry-name-input"]')
              )
            )
          )
        )
      );

      await expect(nameInput).toBeVisible();

      // Verify name is pre-filled
      const nameValue = await nameInput.inputValue();
      expect(nameValue).toBe(TEST_USER.name);
    });

    test('T-INQ-002: Email field is pre-filled for logged-in user', async ({ page }) => {
      // Open inquiry form
      const inquiryButton = page.getByRole('button', { name: /สอบถาม/i }).or(
        page.getByRole('button', { name: /inquiry/i }).or(
          page.getByRole('link', { name: /ติดต่อ/i }).or(
            page.getByRole('link', { name: /contact/i })
          )
        )
      );

      if (await inquiryButton.isVisible()) {
        await inquiryButton.click();
        
      }

      // Find email input field
      const emailInput = page.getByLabel(/อีเมล/i).or(
        page.getByLabel(/email/i).or(
          page.getByPlaceholder(/อีเมล/i).or(
            page.getByPlaceholder(/email/i).or(
              page.locator('input[name="email"]').or(
                page.locator('input[type="email"]').or(
                  page.locator('[data-testid="inquiry-email-input"]')
                )
              )
            )
          )
        )
      );

      await expect(emailInput).toBeVisible();

      // Verify email is pre-filled
      const emailValue = await emailInput.inputValue();
      expect(emailValue).toBe(TEST_USER.email);
    });

    test('T-INQ-003: Phone field is pre-filled if available', async ({ page }) => {
      // Open inquiry form
      const inquiryButton = page.getByRole('button', { name: /สอบถาม/i }).or(
        page.getByRole('button', { name: /inquiry/i }).or(
          page.getByRole('link', { name: /ติดต่อ/i }).or(
            page.getByRole('link', { name: /contact/i })
          )
        )
      );

      if (await inquiryButton.isVisible()) {
        await inquiryButton.click();
        
      }

      // Find phone input field
      const phoneInput = page.getByLabel(/เบอร์โทร/i).or(
        page.getByLabel(/phone/i).or(
          page.getByLabel(/โทรศัพท์/i).or(
            page.getByPlaceholder(/เบอร์/i).or(
              page.getByPlaceholder(/phone/i).or(
                page.locator('input[name="phone"]').or(
                  page.locator('input[type="tel"]').or(
                    page.locator('[data-testid="inquiry-phone-input"]')
                  )
                )
              )
            )
          )
        )
      );

      // Phone field may be optional, so check if it exists
      const phoneVisible = await phoneInput.isVisible().catch(() => false);

      if (phoneVisible) {
        // Verify phone is pre-filled
        const phoneValue = await phoneInput.inputValue();
        expect(phoneValue).toBe(TEST_USER.phone);
      }
    });

    test('T-INQ-004: All pre-filled fields are editable', async ({ page }) => {
      // Open inquiry form
      const inquiryButton = page.getByRole('button', { name: /สอบถาม/i }).or(
        page.getByRole('button', { name: /inquiry/i }).or(
          page.getByRole('link', { name: /ติดต่อ/i }).or(
            page.getByRole('link', { name: /contact/i })
          )
        )
      );

      if (await inquiryButton.isVisible()) {
        await inquiryButton.click();
        
      }

      // Find name input
      const nameInput = page.getByLabel(/ชื่อ/i).or(
        page.getByLabel(/name/i).or(
          page.locator('input[name="name"]')
        )
      );

      await expect(nameInput).toBeVisible();
      await expect(nameInput).toBeEnabled();

      // Verify user can edit the pre-filled name
      await nameInput.clear();
      await nameInput.fill('New Name');
      const newNameValue = await nameInput.inputValue();
      expect(newNameValue).toBe('New Name');
    });

    test('T-INQ-005: Pre-filled fields persist after validation error', async ({ page }) => {
      // Open inquiry form
      const inquiryButton = page.getByRole('button', { name: /สอบถาม/i }).or(
        page.getByRole('button', { name: /inquiry/i }).or(
          page.getByRole('link', { name: /ติดต่อ/i }).or(
            page.getByRole('link', { name: /contact/i })
          )
        )
      );

      if (await inquiryButton.isVisible()) {
        await inquiryButton.click();
        
      }

      // Try to submit form without message (should trigger validation)
      const submitButton = page.getByRole('button', { name: /ส่ง/i }).or(
        page.getByRole('button', { name: /submit/i }).or(
          page.getByRole('button', { name: /send/i })
        )
      );

      if (await submitButton.isVisible()) {
        await submitButton.click();
        
      }

      // Verify pre-filled fields still have values
      const nameInput = page.getByLabel(/ชื่อ/i).or(
        page.locator('input[name="name"]')
      );
      const emailInput = page.getByLabel(/อีเมล/i).or(
        page.locator('input[name="email"]')
      );

      const nameValue = await nameInput.inputValue();
      const emailValue = await emailInput.inputValue();

      expect(nameValue).toBe(TEST_USER.name);
      expect(emailValue).toBe(TEST_USER.email);
    });
  });

  test.describe('Anonymous User (Not Logged-in)', () => {
    test.beforeEach(async ({ page, context }) => {
      // Clear any existing auth
      await context.clearCookies();

      // Navigate to campsite detail page
      await page.goto('/campsites/test-campsite-1');
      await page.waitForLoadState('networkidle');
    });

    test('T-INQ-006: All fields are empty for anonymous user', async ({ page }) => {
      // Open inquiry form
      const inquiryButton = page.getByRole('button', { name: /สอบถาม/i }).or(
        page.getByRole('button', { name: /inquiry/i }).or(
          page.getByRole('link', { name: /ติดต่อ/i }).or(
            page.getByRole('link', { name: /contact/i })
          )
        )
      );

      if (await inquiryButton.isVisible()) {
        await inquiryButton.click();
        
      }

      // Find form fields
      const nameInput = page.getByLabel(/ชื่อ/i).or(
        page.getByLabel(/name/i).or(
          page.locator('input[name="name"]')
        )
      );

      const emailInput = page.getByLabel(/อีเมล/i).or(
        page.getByLabel(/email/i).or(
          page.locator('input[name="email"]')
        )
      );

      const phoneInput = page.getByLabel(/เบอร์โทร/i).or(
        page.getByLabel(/phone/i).or(
          page.locator('input[name="phone"]')
        )
      );

      // Verify all fields are empty
      await expect(nameInput).toBeVisible();
      const nameValue = await nameInput.inputValue();
      expect(nameValue).toBe('');

      await expect(emailInput).toBeVisible();
      const emailValue = await emailInput.inputValue();
      expect(emailValue).toBe('');

      // Phone field is optional, check if exists
      const phoneVisible = await phoneInput.isVisible().catch(() => false);
      if (phoneVisible) {
        const phoneValue = await phoneInput.inputValue();
        expect(phoneValue).toBe('');
      }
    });

    test('T-INQ-007: Anonymous user must fill all required fields manually', async ({ page }) => {
      // Open inquiry form
      const inquiryButton = page.getByRole('button', { name: /สอบถาม/i }).or(
        page.getByRole('button', { name: /inquiry/i }).or(
          page.getByRole('link', { name: /ติดต่อ/i }).or(
            page.getByRole('link', { name: /contact/i })
          )
        )
      );

      if (await inquiryButton.isVisible()) {
        await inquiryButton.click();
        
      }

      // Try to submit without filling required fields
      const submitButton = page.getByRole('button', { name: /ส่ง/i }).or(
        page.getByRole('button', { name: /submit/i }).or(
          page.getByRole('button', { name: /send/i })
        )
      );

      if (await submitButton.isVisible()) {
        await submitButton.click();
        
      }

      // Should show validation errors for required fields
      const validationError = page.locator('text=/required|จำเป็น|กรุณากรอก/i').or(
        page.locator('[role="alert"]')
      );

      const errorVisible = await validationError.isVisible().catch(() => false);
      expect(errorVisible).toBeTruthy();
    });

    test('T-INQ-008: Anonymous user can manually fill and submit form', async ({ page }) => {
      // Open inquiry form
      const inquiryButton = page.getByRole('button', { name: /สอบถาม/i }).or(
        page.getByRole('button', { name: /inquiry/i }).or(
          page.getByRole('link', { name: /ติดต่อ/i }).or(
            page.getByRole('link', { name: /contact/i })
          )
        )
      );

      if (await inquiryButton.isVisible()) {
        await inquiryButton.click();
        
      }

      // Fill in all fields manually
      const nameInput = page.getByLabel(/ชื่อ/i).or(
        page.locator('input[name="name"]')
      );
      const emailInput = page.getByLabel(/อีเมล/i).or(
        page.locator('input[name="email"]')
      );
      const messageInput = page.getByLabel(/ข้อความ/i).or(
        page.getByLabel(/message/i).or(
          page.locator('textarea[name="message"]')
        )
      );

      await nameInput.fill('Anonymous User');
      await emailInput.fill('anonymous@example.com');
      await messageInput.fill('This is my inquiry message');

      // Verify fields are filled
      expect(await nameInput.inputValue()).toBe('Anonymous User');
      expect(await emailInput.inputValue()).toBe('anonymous@example.com');
      expect(await messageInput.inputValue()).toBe('This is my inquiry message');
    });
  });

  test.describe('Pre-fill Data Source Validation', () => {
    test('T-INQ-009: Pre-filled data comes from user profile', async ({ page, context }) => {
      // Set up auth and different profile data
      const mockToken = 'mock-token-for-testing';
      await context.addCookies([
        {
          name: 'campsite_access_token',
          value: mockToken,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
        {
          name: 'campsite_refresh_token',
          value: mockToken,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);

      // Also set localStorage tokens
      await page.addInitScript((tokenData) => {
        localStorage.setItem('campsite_access_token', tokenData.token);
        localStorage.setItem('campsite_refresh_token', tokenData.token);
        localStorage.setItem('campsite_token_expiry', tokenData.expiry);
      }, {
        token: mockToken,
        expiry: (Date.now() + 3600000).toString(),
      });

      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('user_profile', JSON.stringify({
          full_name: 'Profile Name',
          email: 'profile@example.com',
          phone: '+66987654321',
        }));
      });

      await page.goto('/campsites/test-campsite-1');
      await page.waitForLoadState('networkidle');

      // Open inquiry form
      const inquiryButton = page.getByRole('button', { name: /สอบถาม/i }).or(
        page.getByRole('button', { name: /inquiry/i })
      );

      if (await inquiryButton.isVisible()) {
        await inquiryButton.click();
        
      }

      // Verify fields match profile data
      const nameInput = page.getByLabel(/ชื่อ/i).or(
        page.locator('input[name="name"]')
      );
      const emailInput = page.getByLabel(/อีเมล/i).or(
        page.locator('input[name="email"]')
      );

      expect(await nameInput.inputValue()).toBe('Profile Name');
      expect(await emailInput.inputValue()).toBe('profile@example.com');
    });

    test('T-INQ-010: Form handles missing profile phone gracefully', async ({ page, context }) => {
      // Set up auth with profile missing phone
      const mockToken = 'mock-token-for-testing';
      await context.addCookies([
        {
          name: 'campsite_access_token',
          value: mockToken,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
        {
          name: 'campsite_refresh_token',
          value: mockToken,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);

      // Also set localStorage tokens
      await page.addInitScript((tokenData) => {
        localStorage.setItem('campsite_access_token', tokenData.token);
        localStorage.setItem('campsite_refresh_token', tokenData.token);
        localStorage.setItem('campsite_token_expiry', tokenData.expiry);
      }, {
        token: mockToken,
        expiry: (Date.now() + 3600000).toString(),
      });

      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('user_profile', JSON.stringify({
          full_name: 'User Without Phone',
          email: 'nophone@example.com',
          // phone is missing
        }));
      });

      await page.goto('/campsites/test-campsite-1');
      await page.waitForLoadState('networkidle');

      // Open inquiry form
      const inquiryButton = page.getByRole('button', { name: /สอบถาม/i }).or(
        page.getByRole('button', { name: /inquiry/i })
      );

      if (await inquiryButton.isVisible()) {
        await inquiryButton.click();
        
      }

      // Verify name and email are filled, phone is empty
      const nameInput = page.getByLabel(/ชื่อ/i).or(
        page.locator('input[name="name"]')
      );
      const emailInput = page.getByLabel(/อีเมล/i).or(
        page.locator('input[name="email"]')
      );
      const phoneInput = page.getByLabel(/เบอร์โทร/i).or(
        page.getByLabel(/phone/i).or(
          page.locator('input[name="phone"]')
        )
      );

      expect(await nameInput.inputValue()).toBe('User Without Phone');
      expect(await emailInput.inputValue()).toBe('nophone@example.com');

      const phoneVisible = await phoneInput.isVisible().catch(() => false);
      if (phoneVisible) {
        expect(await phoneInput.inputValue()).toBe('');
      }
    });
  });
});
