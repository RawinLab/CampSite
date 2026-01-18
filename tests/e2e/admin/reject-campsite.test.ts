import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Admin Reject Campsite Functionality
 *
 * User Flow:
 * 1. Admin logs in
 * 2. Navigates to /admin/campsites/pending
 * 3. Sees pending campsite
 * 4. Clicks Reject button
 * 5. Reject dialog opens
 * 6. Admin enters rejection reason
 * 7. Admin confirms rejection
 * 8. Campsite disappears from list
 * 9. Success toast notification appears
 *
 * Test Coverage:
 * - Reject Dialog Tests (5 tests)
 * - Reason Validation Tests (5 tests)
 * - Reject Flow Tests (5 tests)
 * - Dialog Behavior Tests (4 tests)
 * - Error Handling Tests (3 tests)
 * - Post-Rejection Tests (3 tests)
 *
 * Total: 25 comprehensive tests
 */

test.describe('Admin Reject Campsite - E2E Tests', () => {
  // Helper function to mock admin authentication
  async function mockAdminLogin(page: any) {
    await page.route('**/api/auth/session', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-admin-id',
            email: 'admin@test.com',
            role: 'admin',
          },
        }),
      });
    });

    await page.route('**/api/auth/me', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'test-admin-id',
            email: 'admin@test.com',
            full_name: 'Test Admin',
            user_role: 'admin',
          },
        }),
      });
    });
  }

  // Helper function to mock pending campsites
  async function mockPendingCampsites(page: any, campsites = [
    {
      id: 'campsite-pending-1',
      name: 'Mountain View Glamping',
      owner_name: 'John Owner',
      owner_email: 'owner@example.com',
      province: 'Chiang Mai',
      type: 'glamping',
      status: 'pending',
      created_at: new Date().toISOString(),
      price_min: 1500,
      price_max: 4500,
    },
    {
      id: 'campsite-pending-2',
      name: 'Beach Paradise Camp',
      owner_name: 'Jane Owner',
      owner_email: 'jane@example.com',
      province: 'Phuket',
      type: 'camping',
      status: 'pending',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      price_min: 800,
      price_max: 2000,
    },
  ]) {
    await page.route('**/api/admin/campsites/pending*', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: campsites,
          pagination: {
            total: campsites.length,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        }),
      });
    });
  }

  test.describe('1. Reject Dialog Tests', () => {
    test('should open reject dialog when clicking Reject button', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Click Reject button for first campsite
      const rejectButton = page.locator('[data-testid="reject-button"]').first();
      await rejectButton.click();

      // Verify dialog opens
      const dialog = page.locator('[data-testid="reject-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Verify dialog title
      const dialogTitle = page.locator('[data-testid="reject-dialog-title"]');
      await expect(dialogTitle).toContainText(/reject campsite/i);
    });

    test('should display campsite name in reject dialog', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Click Reject button
      await page.locator('[data-testid="reject-button"]').first().click();

      // Verify campsite name is shown
      const dialog = page.locator('[data-testid="reject-dialog"]');
      await expect(dialog).toContainText('Mountain View Glamping');
    });

    test('should show reason textarea in reject dialog', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      // Verify textarea exists
      const textarea = page.locator('[data-testid="rejection-reason"]');
      await expect(textarea).toBeVisible();
      await expect(textarea).toHaveAttribute('placeholder', /reason/i);
    });

    test('should show Cancel and Confirm buttons in reject dialog', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      // Verify buttons exist
      const cancelButton = page.locator('[data-testid="cancel-reject"]');
      const confirmButton = page.locator('[data-testid="confirm-reject"]');

      await expect(cancelButton).toBeVisible();
      await expect(confirmButton).toBeVisible();
      await expect(cancelButton).toContainText(/cancel/i);
      await expect(confirmButton).toContainText(/confirm|reject/i);
    });

    test('should show minimum character requirement hint', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      // Verify hint text
      const hint = page.locator('[data-testid="reason-hint"]');
      await expect(hint).toBeVisible();
      await expect(hint).toContainText(/minimum.*10.*character/i);
    });
  });

  test.describe('2. Reason Validation Tests', () => {
    test('should not allow submission without rejection reason', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      // Try to confirm without entering reason
      const confirmButton = page.locator('[data-testid="confirm-reject"]');
      await expect(confirmButton).toBeDisabled();
    });

    test('should not allow submission with reason less than 10 characters', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      // Enter short reason
      const textarea = page.locator('[data-testid="rejection-reason"]');
      await textarea.fill('Too short');

      // Confirm button should be disabled
      const confirmButton = page.locator('[data-testid="confirm-reject"]');
      await expect(confirmButton).toBeDisabled();
    });

    test('should show error message for short reason', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      // Enter short reason and blur
      const textarea = page.locator('[data-testid="rejection-reason"]');
      await textarea.fill('Short');
      await textarea.blur();

      // Verify error message
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/at least 10 character/i);
    });

    test('should clear error when reason becomes valid', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      const textarea = page.locator('[data-testid="rejection-reason"]');

      // Enter short reason
      await textarea.fill('Short');
      await textarea.blur();

      // Verify error shows
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();

      // Enter valid reason
      await textarea.fill('This is a valid rejection reason with enough characters');

      // Error should disappear
      await expect(errorMessage).not.toBeVisible();
    });

    test('should enable confirm button when reason is valid', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      // Confirm button initially disabled
      const confirmButton = page.locator('[data-testid="confirm-reject"]');
      await expect(confirmButton).toBeDisabled();

      // Enter valid reason
      const textarea = page.locator('[data-testid="rejection-reason"]');
      await textarea.fill('The submitted photos do not meet quality standards');

      // Confirm button should be enabled
      await expect(confirmButton).toBeEnabled();
    });
  });

  test.describe('3. Reject Flow Tests', () => {
    test('should submit rejection with valid reason', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      // Mock rejection API
      let rejectionPayload: any = null;
      await page.route('**/api/admin/campsites/campsite-pending-1/reject', async (route: any) => {
        const request = route.request();
        rejectionPayload = await request.postDataJSON();

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Campsite rejected successfully',
          }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      // Enter valid reason
      const textarea = page.locator('[data-testid="rejection-reason"]');
      const rejectionReason = 'Photos do not meet quality standards and location is incorrect';
      await textarea.fill(rejectionReason);

      // Confirm rejection
      const confirmButton = page.locator('[data-testid="confirm-reject"]');
      await confirmButton.click();

      // Verify API was called with correct payload
      await page.waitForTimeout(500);
      expect(rejectionPayload).toBeTruthy();
      expect(rejectionPayload.reason).toBe(rejectionReason);
    });

    test('should show loading state during rejection', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      // Mock rejection API with delay
      await page.route('**/api/admin/campsites/campsite-pending-1/reject', async (route: any) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Campsite rejected successfully',
          }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      const textarea = page.locator('[data-testid="rejection-reason"]');
      await textarea.fill('Valid rejection reason here');

      const confirmButton = page.locator('[data-testid="confirm-reject"]');
      await confirmButton.click();

      // Verify loading state
      await expect(confirmButton).toBeDisabled();
      const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
      await expect(loadingIndicator).toBeVisible();
    });

    test('should show success toast after rejection', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.route('**/api/admin/campsites/campsite-pending-1/reject', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Campsite rejected successfully',
          }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      const textarea = page.locator('[data-testid="rejection-reason"]');
      await textarea.fill('Valid rejection reason here');

      const confirmButton = page.locator('[data-testid="confirm-reject"]');
      await confirmButton.click();

      // Verify success toast
      const toast = page.locator('[data-testid="toast-success"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
      await expect(toast).toContainText(/rejected successfully/i);
    });

    test('should remove campsite from pending list after rejection', async ({ page }) => {
      await mockAdminLogin(page);

      // Initial mock with 2 campsites
      await mockPendingCampsites(page);

      // Mock updated list after rejection (1 campsite removed)
      await page.route('**/api/admin/campsites/campsite-pending-1/reject', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Campsite rejected successfully',
          }),
        });

        // After rejection, mock the list with only the second campsite
        await page.route('**/api/admin/campsites/pending*', async (route: any) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [
                {
                  id: 'campsite-pending-2',
                  name: 'Beach Paradise Camp',
                  owner_name: 'Jane Owner',
                  status: 'pending',
                },
              ],
              pagination: {
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1,
              },
            }),
          });
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Verify initial campsite exists
      const campsiteName = page.locator('text=Mountain View Glamping');
      await expect(campsiteName).toBeVisible();

      await page.locator('[data-testid="reject-button"]').first().click();

      const textarea = page.locator('[data-testid="rejection-reason"]');
      await textarea.fill('Valid rejection reason here');

      const confirmButton = page.locator('[data-testid="confirm-reject"]');
      await confirmButton.click();

      // Wait for success
      await page.waitForTimeout(1000);

      // Verify campsite is removed
      await expect(campsiteName).not.toBeVisible();
    });

    test('should update pending count badge after rejection', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.route('**/api/admin/campsites/campsite-pending-1/reject', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Campsite rejected successfully',
          }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Check initial count badge
      const countBadge = page.locator('[data-testid="pending-count"]');
      await expect(countBadge).toHaveText('2');

      await page.locator('[data-testid="reject-button"]').first().click();

      const textarea = page.locator('[data-testid="rejection-reason"]');
      await textarea.fill('Valid rejection reason here');

      const confirmButton = page.locator('[data-testid="confirm-reject"]');
      await confirmButton.click();

      // Wait for update
      await page.waitForTimeout(1000);

      // Verify count decreased
      await expect(countBadge).toHaveText('1');
    });
  });

  test.describe('4. Dialog Behavior Tests', () => {
    test('should close dialog when clicking Cancel button', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      // Verify dialog is open
      const dialog = page.locator('[data-testid="reject-dialog"]');
      await expect(dialog).toBeVisible();

      // Click Cancel
      const cancelButton = page.locator('[data-testid="cancel-reject"]');
      await cancelButton.click();

      // Verify dialog closes
      await expect(dialog).not.toBeVisible();
    });

    test('should close dialog when clicking outside (if not loading)', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      const dialog = page.locator('[data-testid="reject-dialog"]');
      await expect(dialog).toBeVisible();

      // Click overlay/backdrop
      const overlay = page.locator('[data-testid="dialog-overlay"]');
      await overlay.click({ position: { x: 10, y: 10 } });

      // Dialog should close
      await expect(dialog).not.toBeVisible();
    });

    test('should not close dialog during loading state', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      // Mock with long delay
      await page.route('**/api/admin/campsites/campsite-pending-1/reject', async (route: any) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
          }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      const textarea = page.locator('[data-testid="rejection-reason"]');
      await textarea.fill('Valid rejection reason here');

      const confirmButton = page.locator('[data-testid="confirm-reject"]');
      await confirmButton.click();

      // Try to close dialog during loading
      const cancelButton = page.locator('[data-testid="cancel-reject"]');
      await expect(cancelButton).toBeDisabled();

      // Dialog should remain open
      const dialog = page.locator('[data-testid="reject-dialog"]');
      await expect(dialog).toBeVisible();
    });

    test('should clear form when dialog is closed and reopened', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Open dialog and enter text
      await page.locator('[data-testid="reject-button"]').first().click();

      const textarea = page.locator('[data-testid="rejection-reason"]');
      await textarea.fill('Some rejection reason');

      // Close dialog
      const cancelButton = page.locator('[data-testid="cancel-reject"]');
      await cancelButton.click();

      // Reopen dialog
      await page.locator('[data-testid="reject-button"]').first().click();

      // Verify textarea is cleared
      await expect(textarea).toHaveValue('');
    });
  });

  test.describe('5. Error Handling Tests', () => {
    test('should show error toast when rejection fails', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      // Mock API error
      await page.route('**/api/admin/campsites/campsite-pending-1/reject', async (route: any) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      const textarea = page.locator('[data-testid="rejection-reason"]');
      await textarea.fill('Valid rejection reason here');

      const confirmButton = page.locator('[data-testid="confirm-reject"]');
      await confirmButton.click();

      // Verify error toast
      const errorToast = page.locator('[data-testid="toast-error"]');
      await expect(errorToast).toBeVisible({ timeout: 5000 });
      await expect(errorToast).toContainText(/failed|error/i);
    });

    test('should keep dialog open after error', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.route('**/api/admin/campsites/campsite-pending-1/reject', async (route: any) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      const textarea = page.locator('[data-testid="rejection-reason"]');
      await textarea.fill('Valid rejection reason here');

      const confirmButton = page.locator('[data-testid="confirm-reject"]');
      await confirmButton.click();

      // Wait for error
      await page.waitForTimeout(1000);

      // Dialog should remain open
      const dialog = page.locator('[data-testid="reject-dialog"]');
      await expect(dialog).toBeVisible();

      // Reason should still be there
      await expect(textarea).toHaveValue('Valid rejection reason here');
    });

    test('should allow retry after error', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      let attemptCount = 0;
      await page.route('**/api/admin/campsites/campsite-pending-1/reject', async (route: any) => {
        attemptCount++;

        if (attemptCount === 1) {
          // First attempt fails
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Internal server error',
            }),
          });
        } else {
          // Second attempt succeeds
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Campsite rejected successfully',
            }),
          });
        }
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      const textarea = page.locator('[data-testid="rejection-reason"]');
      await textarea.fill('Valid rejection reason here');

      const confirmButton = page.locator('[data-testid="confirm-reject"]');

      // First attempt
      await confirmButton.click();
      await page.waitForTimeout(1000);

      // Verify confirm button is re-enabled after error
      await expect(confirmButton).toBeEnabled();

      // Retry
      await confirmButton.click();

      // Verify success toast on second attempt
      const successToast = page.locator('[data-testid="toast-success"]');
      await expect(successToast).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('6. Post-Rejection Tests', () => {
    test('should not show rejected campsite in public listings', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      // Mock public search endpoint
      await page.route('**/api/campsites/search*', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              // Only approved campsites, not rejected ones
              {
                id: 'campsite-approved-1',
                name: 'Approved Camp',
                status: 'approved',
              },
            ],
            pagination: {
              total: 1,
              page: 1,
              limit: 20,
              totalPages: 1,
            },
          }),
        });
      });

      await page.route('**/api/admin/campsites/campsite-pending-1/reject', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
          }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      await page.locator('[data-testid="reject-button"]').first().click();

      const textarea = page.locator('[data-testid="rejection-reason"]');
      await textarea.fill('Valid rejection reason here');

      const confirmButton = page.locator('[data-testid="confirm-reject"]');
      await confirmButton.click();

      await page.waitForTimeout(1000);

      // Navigate to public search page
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      // Verify rejected campsite is not shown
      const rejectedCampsite = page.locator('text=Mountain View Glamping');
      await expect(rejectedCampsite).not.toBeVisible();

      // Verify only approved campsites are shown
      const approvedCampsite = page.locator('text=Approved Camp');
      await expect(approvedCampsite).toBeVisible();
    });

    test('should allow owner to see rejection reason', async ({ page }) => {
      // Mock owner login
      await page.route('**/api/auth/session', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'owner-id',
              email: 'owner@example.com',
              role: 'owner',
            },
          }),
        });
      });

      await page.route('**/api/auth/me', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'owner-id',
              email: 'owner@example.com',
              full_name: 'John Owner',
              user_role: 'owner',
            },
          }),
        });
      });

      // Mock owner's rejected campsite
      await page.route('**/api/dashboard/campsites*', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 'campsite-pending-1',
                name: 'Mountain View Glamping',
                status: 'rejected',
                rejection_reason: 'Photos do not meet quality standards and location is incorrect',
                rejected_at: new Date().toISOString(),
              },
            ],
            pagination: {
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          }),
        });
      });

      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Verify rejection reason is displayed
      const rejectionReason = page.locator('text=/Photos do not meet quality standards/i');
      await expect(rejectionReason).toBeVisible();

      // Verify status badge shows "Rejected"
      const statusBadge = page.locator('[data-testid="status-badge-rejected"]');
      await expect(statusBadge).toBeVisible();
      await expect(statusBadge).toContainText(/rejected/i);
    });

    test('should allow owner to resubmit after rejection', async ({ page }) => {
      // Mock owner login
      await page.route('**/api/auth/session', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'owner-id',
              email: 'owner@example.com',
              role: 'owner',
            },
          }),
        });
      });

      await page.route('**/api/auth/me', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'owner-id',
              email: 'owner@example.com',
              full_name: 'John Owner',
              user_role: 'owner',
            },
          }),
        });
      });

      // Mock rejected campsite
      await page.route('**/api/dashboard/campsites/campsite-pending-1', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'campsite-pending-1',
              name: 'Mountain View Glamping',
              status: 'rejected',
              rejection_reason: 'Photos do not meet quality standards',
              can_resubmit: true,
            },
          }),
        });
      });

      await page.goto('/dashboard/campsites/campsite-pending-1');
      await page.waitForLoadState('networkidle');

      // Verify resubmit button exists
      const resubmitButton = page.locator('[data-testid="resubmit-button"]');
      await expect(resubmitButton).toBeVisible();
      await expect(resubmitButton).toContainText(/resubmit|submit again/i);
    });
  });
});
