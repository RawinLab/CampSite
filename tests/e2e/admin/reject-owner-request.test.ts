import { test, expect } from '@playwright/test';

test.describe('Admin Reject Owner Request E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    // Simulate authenticated admin session
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-admin-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock pending owner requests API with sample data
    await page.route('**/api/admin/owner-requests*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'request-1',
              user_id: 'user-1',
              full_name: 'John Doe',
              email: 'john@example.com',
              business_name: 'Mountain Adventures Co.',
              business_type: 'Camping Site Operator',
              tax_id: '1234567890123',
              phone: '081-234-5678',
              address: '123 Mountain Road, Chiang Mai 50000',
              status: 'pending',
              submitted_at: new Date().toISOString(),
            },
            {
              id: 'request-2',
              user_id: 'user-2',
              full_name: 'Jane Smith',
              email: 'jane@example.com',
              business_name: 'Beachside Glamping Resort',
              business_type: 'Glamping Operator',
              tax_id: '9876543210987',
              phone: '082-345-6789',
              address: '456 Beach Road, Phuket 83000',
              status: 'pending',
              submitted_at: new Date().toISOString(),
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        }),
      });
    });

    // Navigate to owner requests page
    await page.goto('/admin/owner-requests');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. Reject Dialog Tests', () => {
    test('T037.1: Reject button opens dialog', async ({ page }) => {
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await expect(rejectButton).toBeVisible();
      await expect(rejectButton).toBeEnabled();

      await rejectButton.click();

      // Dialog should be visible
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
    });

    test('T037.2: Dialog shows user/business name', async ({ page }) => {
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Should show user name
      await expect(dialog.getByText(/John Doe/i)).toBeVisible();
      // Should show business name
      await expect(dialog.getByText(/Mountain Adventures Co\./i)).toBeVisible();
    });

    test('T037.3: Dialog has reason textarea', async ({ page }) => {
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonTextarea = page.getByTestId('reason-input');
      await expect(reasonTextarea).toBeVisible();
      await expect(reasonTextarea).toBeEditable();
    });

    test('T037.4: Dialog shows min character requirement', async ({ page }) => {
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const dialog = page.getByRole('dialog');
      // Should show minimum character requirement message
      await expect(dialog.getByText(/minimum.*10.*characters?/i)).toBeVisible();
    });

    test('T037.5: Dialog has Cancel and Confirm buttons', async ({ page }) => {
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const dialog = page.getByRole('dialog');
      const cancelButton = dialog.getByRole('button', { name: /Cancel/i });
      const confirmButton = dialog.getByRole('button', { name: /Confirm|Reject/i });

      await expect(cancelButton).toBeVisible();
      await expect(confirmButton).toBeVisible();
    });
  });

  test.describe('2. Reason Validation Tests', () => {
    test('T037.6: Cannot submit without reason', async ({ page }) => {
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const submitBtn = page.getByTestId('confirm-reject');
      await expect(submitBtn).toBeDisabled();
    });

    test('T037.7: Cannot submit with reason < 10 chars', async ({ page }) => {
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      // Enter short reason (9 characters)
      await reasonInput.fill('Too short');
      await expect(submitBtn).toBeDisabled();
    });

    test('T037.8: Shows error for short reason', async ({ page }) => {
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');

      // Enter short reason
      await reasonInput.fill('Short');
      await reasonInput.blur();

      // Should show error message
      await expect(page.getByText(/reason.*at least 10 characters/i)).toBeVisible();
    });

    test('T037.9: Confirm button disabled when invalid', async ({ page }) => {
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const submitBtn = page.getByTestId('confirm-reject');

      // Initially disabled
      await expect(submitBtn).toBeDisabled();
    });

    test('T037.10: Can submit with valid reason', async ({ page }) => {
      // Mock rejection API
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      // Enter valid reason (20+ characters)
      await reasonInput.fill('This is a valid rejection reason with sufficient length');

      // Submit button should be enabled
      await expect(submitBtn).toBeEnabled();
    });
  });

  test.describe('3. Reject Flow Tests', () => {
    test('T037.11: Can submit with valid reason', async ({ page }) => {
      // Mock successful rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Owner request rejected successfully',
          }),
        });
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      // Wait for success
      await page.waitForTimeout(500);

      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('T037.12: Shows loading state during rejection', async ({ page }) => {
      // Mock slow rejection API
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      // Should show loading text
      await expect(page.getByText(/Rejecting.../i)).toBeVisible();
    });

    test('T037.13: Success message appears', async ({ page }) => {
      // Mock successful rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Owner request rejected successfully',
          }),
        });
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      await page.waitForTimeout(500);

      // Should show success toast
      await expect(page.getByText(/rejected successfully/i)).toBeVisible();
    });

    test('T037.14: Request shows rejected status', async ({ page }) => {
      // Mock successful rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock updated list with rejected status
      let rejectionDone = false;
      await page.route('**/api/admin/owner-requests*', async (route) => {
        if (rejectionDone) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [
                {
                  id: 'request-1',
                  user_id: 'user-1',
                  full_name: 'John Doe',
                  business_name: 'Mountain Adventures Co.',
                  status: 'rejected',
                  submitted_at: new Date().toISOString(),
                },
              ],
              pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
            }),
          });
        } else {
          await route.continue();
        }
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();
      rejectionDone = true;

      await page.waitForTimeout(500);

      // Should show rejected badge
      await expect(page.getByText(/rejected/i)).toBeVisible();
    });

    test('T037.15: Pending count badge updates', async ({ page }) => {
      // Mock rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Initial count should be 2
      await expect(page.getByText(/2 requests? awaiting review/i)).toBeVisible();

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      await page.waitForTimeout(500);

      // Count should update to 1
      await expect(page.getByText(/1 request awaiting review/i)).toBeVisible();
    });
  });

  test.describe('4. Dialog Behavior Tests', () => {
    test('T037.16: Cancel closes dialog', async ({ page }) => {
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const cancelButton = dialog.getByRole('button', { name: /Cancel/i });
      await cancelButton.click();

      // Dialog should close
      await expect(dialog).not.toBeVisible();
    });

    test('T037.17: Cannot close during loading', async ({ page }) => {
      // Mock slow rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      // Try to cancel during loading
      const cancelButton = page.getByRole('button', { name: /Cancel/i });
      await expect(cancelButton).toBeDisabled();
    });

    test('T037.18: Form clears on close', async ({ page }) => {
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      await reasonInput.fill('This is a test reason');

      const cancelButton = page.getByRole('button', { name: /Cancel/i });
      await cancelButton.click();

      // Reopen dialog
      await rejectButton.click();

      // Reason should be cleared
      await expect(reasonInput).toHaveValue('');
    });

    test('T037.19: Escape key closes dialog', async ({ page }) => {
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      await page.keyboard.press('Escape');

      // Dialog should close
      await expect(dialog).not.toBeVisible();
    });

    test('T037.20: Click outside closes dialog', async ({ page }) => {
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Click outside dialog (on overlay)
      await page.click('body', { position: { x: 10, y: 10 } });

      // Dialog should close
      await expect(dialog).not.toBeVisible();
    });
  });

  test.describe('5. Post-Rejection Verification Tests', () => {
    test('T037.21: User role remains user (not upgraded)', async ({ page }) => {
      // Mock rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock user profile API
      await page.route('**/api/users/user-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'user-1',
              full_name: 'John Doe',
              email: 'john@example.com',
              role: 'user', // Still user, not upgraded to owner
            },
          }),
        });
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      await page.waitForTimeout(500);

      // Navigate to user details to verify role
      await page.goto('/admin/users/user-1');
      await page.waitForLoadState('networkidle');

      // Should show role as 'user'
      await expect(page.getByText(/Role:.*User/i)).toBeVisible();
    });

    test('T037.22: User cannot access owner features', async ({ page }) => {
      // Mock rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock owner dashboard API with permission denied
      await page.route('**/api/dashboard/campsites', async (route) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Forbidden: Owner role required',
          }),
        });
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      await page.waitForTimeout(500);

      // Switch to user context
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-user-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      // Try to access owner dashboard
      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Should show permission denied message
      await expect(page.getByText(/Forbidden|Owner role required/i)).toBeVisible();
    });

    test('T037.23: Rejection reason visible in request details', async ({ page }) => {
      // Mock rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock request details API with rejection reason
      await page.route('**/api/admin/owner-requests/request-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'request-1',
              user_id: 'user-1',
              full_name: 'John Doe',
              business_name: 'Mountain Adventures Co.',
              status: 'rejected',
              rejection_reason: 'Business documentation is incomplete and unverified',
              rejected_at: new Date().toISOString(),
            },
          }),
        });
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      await page.waitForTimeout(500);

      // Navigate to request details
      await page.goto('/admin/owner-requests/request-1');
      await page.waitForLoadState('networkidle');

      // Should show rejection reason
      await expect(page.getByText(/Business documentation is incomplete and unverified/i)).toBeVisible();
    });

    test('T037.24: Rejected request shows rejection timestamp', async ({ page }) => {
      // Mock rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              rejected_at: new Date().toISOString(),
            },
          }),
        });
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      await page.waitForTimeout(500);

      // Should show rejection timestamp
      await expect(page.getByText(/Rejected.*ago|Rejected on/i)).toBeVisible();
    });

    test('T037.25: User can view rejection reason in their profile', async ({ page }) => {
      // Mock rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock user profile API showing rejection
      await page.route('**/api/profile/owner-request', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              status: 'rejected',
              rejection_reason: 'Business documentation is incomplete and unverified',
              rejected_at: new Date().toISOString(),
            },
          }),
        });
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      await page.waitForTimeout(500);

      // Switch to user context
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-user-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      // Navigate to user profile
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');

      // User should see rejection reason
      await expect(page.getByText(/Business documentation is incomplete and unverified/i)).toBeVisible();
    });
  });

  test.describe('6. Error Handling Tests', () => {
    test('T037.26: Shows error message on rejection failure', async ({ page }) => {
      // Mock failed rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to reject owner request',
          }),
        });
      });

      let alertMessage = '';
      page.on('dialog', async (dialog) => {
        alertMessage = dialog.message();
        await dialog.accept();
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      await page.waitForTimeout(500);

      // Should show error message
      expect(alertMessage).toContain('Failed to reject owner request');
    });

    test('T037.27: Request remains pending on error', async ({ page }) => {
      // Mock failed rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Server error',
          }),
        });
      });

      page.on('dialog', async (dialog) => await dialog.accept());

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      await page.waitForTimeout(500);

      // Request should still show pending status
      await expect(page.getByText(/pending/i)).toBeVisible();
    });

    test('T037.28: Can retry after error', async ({ page }) => {
      let attemptCount = 0;

      // Mock first failure, then success
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        attemptCount++;
        if (attemptCount === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, error: 'Server error' }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        }
      });

      page.on('dialog', async (dialog) => await dialog.accept());

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');

      // First attempt - should fail
      await submitBtn.click();
      await page.waitForTimeout(500);

      // Dialog should still be open
      await expect(page.getByRole('dialog')).toBeVisible();

      // Second attempt - should succeed
      await submitBtn.click();
      await page.waitForTimeout(500);

      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('T037.29: Network error shows appropriate message', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.abort('failed');
      });

      let alertMessage = '';
      page.on('dialog', async (dialog) => {
        alertMessage = dialog.message();
        await dialog.accept();
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      await page.waitForTimeout(500);

      // Should show error message
      expect(alertMessage).toBeTruthy();
    });

    test('T037.30: Validation error preserved after failed submission', async ({ page }) => {
      // Mock failed rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid rejection reason',
          }),
        });
      });

      page.on('dialog', async (dialog) => await dialog.accept());

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      const reasonInput = page.getByTestId('reason-input');
      const submitBtn = page.getByTestId('confirm-reject');

      await reasonInput.fill('Business documentation is incomplete and unverified');
      await submitBtn.click();

      await page.waitForTimeout(500);

      // Reason text should be preserved in the input
      await expect(reasonInput).toHaveValue('Business documentation is incomplete and unverified');
    });
  });
});
