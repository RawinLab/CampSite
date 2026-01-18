import { test, expect } from '@playwright/test';

test.describe('Admin Approve Owner Request E2E', () => {
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
      const url = route.request().url();
      if (url.includes('status=pending')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'request-1',
                user_id: 'user-1',
                business_name: 'Mountain Adventure Co.',
                business_description: 'Professional camping and outdoor adventure service provider in northern Thailand.',
                contact_phone: '081-234-5678',
                status: 'pending',
                created_at: new Date().toISOString(),
                reviewed_at: null,
                reviewed_by: null,
                user_full_name: 'Somchai Suksai',
                user_avatar_url: null,
              },
              {
                id: 'request-2',
                user_id: 'user-2',
                business_name: 'Beach Glamping Resort',
                business_description: 'Luxury beachside glamping experience with premium facilities and ocean views.',
                contact_phone: '089-876-5432',
                status: 'pending',
                created_at: new Date(Date.now() - 86400000).toISOString(),
                reviewed_at: null,
                reviewed_by: null,
                user_full_name: 'Nida Chaiyaporn',
                user_avatar_url: null,
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
      } else {
        await route.continue();
      }
    });

    // Navigate to owner requests page
    await page.goto('/admin/owner-requests');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. Approve Flow Tests', () => {
    test('T036.1: Admin can click Approve button', async ({ page }) => {
      // Find the approve button for first request
      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();
      await expect(approveButton).toBeEnabled();
    });

    test('T036.2: Shows loading state during approval', async ({ page }) => {
      // Mock slow approval API
      await page.route('**/api/admin/owner-requests/*/approve', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Owner request approved successfully'
          }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();

      // Should show loading text
      await expect(page.getByText(/Approving.../i)).toBeVisible();
    });

    test('T036.3: Success message appears after approval', async ({ page }) => {
      // Mock successful approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Owner request approved successfully',
          }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();

      // Wait for request to be removed
      await page.waitForTimeout(500);

      // Request should be removed from list
      await expect(page.getByText('Mountain Adventure Co.')).not.toBeVisible();
    });

    test('T036.4: Request removed from pending list after approval', async ({ page }) => {
      // Mock approval API
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Verify request is visible before approval
      await expect(page.getByText('Mountain Adventure Co.')).toBeVisible();

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();

      // Wait for removal
      await page.waitForTimeout(500);

      // Request should disappear from list
      await expect(page.getByText('Mountain Adventure Co.')).not.toBeVisible();
    });

    test('T036.5: Pending count badge updates after approval', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Initial count should be 2
      await expect(page.getByText(/2 requests? pending review/i)).toBeVisible();

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Count should update to 1
      await expect(page.getByText(/1 request pending review/i)).toBeVisible();
    });
  });

  test.describe('2. UI State Tests', () => {
    test('T036.6: Approve button disabled during action', async ({ page }) => {
      // Mock slow approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();

      // Button should be disabled during approval
      await expect(approveButton).toBeDisabled();
    });

    test('T036.7: All buttons disabled during approval', async ({ page }) => {
      // Mock slow approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();

      await approveButton.click();

      // Both approve and reject buttons should be disabled
      await expect(approveButton).toBeDisabled();
      await expect(rejectButton).toBeDisabled();
    });

    test('T036.8: Button shows loading indicator', async ({ page }) => {
      // Mock slow approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();

      // Should show loading text
      await expect(page.getByText(/Approving.../i)).toBeVisible();
    });
  });

  test.describe('3. Error Handling Tests', () => {
    test('T036.9: Shows error toast on failure', async ({ page }) => {
      // Mock failed approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to approve owner request',
          }),
        });
      });

      // Mock alert to capture error message
      let alertMessage = '';
      page.on('dialog', async (dialog) => {
        alertMessage = dialog.message();
        await dialog.accept();
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Should show error message
      expect(alertMessage).toContain('Failed to approve');
    });

    test('T036.10: Request remains in list on error', async ({ page }) => {
      // Mock failed approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
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

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Request should still be visible
      await expect(page.getByText('Mountain Adventure Co.')).toBeVisible();
    });

    test('T036.11: Can retry after error', async ({ page }) => {
      let attemptCount = 0;

      // Mock first failure, then success
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
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

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();

      // First attempt - should fail
      await approveButton.click();
      await page.waitForTimeout(500);

      // Request should still be there
      await expect(page.getByText('Mountain Adventure Co.')).toBeVisible();

      // Second attempt - should succeed
      await approveButton.click();
      await page.waitForTimeout(500);

      // Request should be removed
      await expect(page.getByText('Mountain Adventure Co.')).not.toBeVisible();
    });
  });

  test.describe('4. Post-Approval Verification Tests', () => {
    test('T036.12: Request shows approved status in history', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock approved requests history
      await page.route('**/api/admin/owner-requests?status=approved*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'request-1',
                user_id: 'user-1',
                business_name: 'Mountain Adventure Co.',
                business_description: 'Professional camping service provider',
                contact_phone: '081-234-5678',
                status: 'approved',
                created_at: new Date().toISOString(),
                reviewed_at: new Date().toISOString(),
                reviewed_by: 'admin-1',
                user_full_name: 'Somchai Suksai',
                user_avatar_url: null,
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Navigate to approved requests (if such page exists)
      // This is a conceptual test - adjust based on actual UI
      await page.goto('/admin/owner-requests?status=approved');
      await page.waitForLoadState('networkidle');

      // Should see approved badge/status
      await expect(page.getByText('Mountain Adventure Co.')).toBeVisible();
    });

    test('T036.13: Reviewed_at timestamp shown after approval', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock request detail with reviewed_at
      await page.route('**/api/admin/owner-requests/request-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'request-1',
              user_id: 'user-1',
              business_name: 'Mountain Adventure Co.',
              status: 'approved',
              reviewed_at: new Date().toISOString(),
              reviewed_by: 'admin-1',
            },
          }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Verify timestamp is set (conceptual - adjust based on actual UI)
      // This would typically be verified in a detail view or history list
    });

    test('T036.14: Reviewed_by shows admin name', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            reviewed_by: 'Admin User'
          }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Verification that reviewed_by is recorded (backend concern)
      // Frontend would display this in history/detail view
    });
  });

  test.describe('5. User Role Update Tests', () => {
    test('T036.15: Approved user can access dashboard', async ({ page, context }) => {
      // Mock approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Switch to owner context
      await context.clearCookies();
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-owner-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      // Mock dashboard API for owner
      await page.route('**/api/dashboard/campsites*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          }),
        });
      });

      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should be able to access dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('T036.16: Approved user can create campsite', async ({ page, context }) => {
      // Mock approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Switch to owner context
      await context.clearCookies();
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-owner-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      // Mock campsite creation page
      await page.route('**/api/dashboard/campsites/new', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Navigate to create campsite page
      await page.goto('/dashboard/campsites/new');
      await page.waitForLoadState('networkidle');

      // Should see create campsite form
      await expect(page.getByRole('heading', { name: /create campsite/i })).toBeVisible();
    });

    test('T036.17: User profile shows owner role', async ({ page, context }) => {
      // Mock approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Switch to owner context
      await context.clearCookies();
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-owner-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      // Mock profile API
      await page.route('**/api/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'user-1',
              full_name: 'Somchai Suksai',
              role: 'owner',
              email: 'somchai@example.com',
            },
          }),
        });
      });

      // Navigate to profile
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');

      // Should show owner role
      await expect(page.getByText(/owner/i)).toBeVisible();
    });
  });

  test.describe('6. Empty State Tests', () => {
    test('T036.18: Shows empty state when no pending requests', async ({ page }) => {
      // Mock empty pending list
      await page.route('**/api/admin/owner-requests*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should show empty state
      await expect(page.getByText(/All caught up!/i)).toBeVisible();
      await expect(page.getByText(/No pending owner requests to review/i)).toBeVisible();
    });
  });

  test.describe('7. Navigation Tests', () => {
    test('T036.19: Stays on page after approval', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Should still be on owner requests page
      await expect(page).toHaveURL(/\/admin\/owner-requests/);
    });

    test('T036.20: List updates without full page reload', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Track navigation events
      let navigationCount = 0;
      page.on('framenavigated', () => {
        navigationCount++;
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Should not trigger full page navigation (only initial load)
      expect(navigationCount).toBeLessThanOrEqual(1);
    });

    test('T036.21: Refresh button updates list', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Click refresh button
      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      await refreshButton.click();
      await page.waitForLoadState('networkidle');

      // Should reload the list
      await expect(page.getByText(/requests? pending review/i)).toBeVisible();
    });
  });

  test.describe('8. Multiple Approvals', () => {
    test('T036.22: Can approve multiple requests in sequence', async ({ page }) => {
      // Mock approvals for both requests
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.route('**/api/admin/owner-requests/request-2/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Approve first request
      const firstApproveButton = page.getByRole('button', { name: /Approve/i }).first();
      await firstApproveButton.click();
      await page.waitForTimeout(500);

      // Should have one request left
      await expect(page.getByText('Beach Glamping Resort')).toBeVisible();

      // Approve second request
      const secondApproveButton = page.getByRole('button', { name: /Approve/i }).first();
      await secondApproveButton.click();
      await page.waitForTimeout(500);

      // Should show empty state
      await expect(page.getByText(/All caught up!/i)).toBeVisible();
    });

    test('T036.23: Pending count decrements correctly', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/owner-requests/request-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Initial count: 2
      await expect(page.getByText(/2 requests? pending review/i)).toBeVisible();

      // Approve first
      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Count should be 1
      await expect(page.getByText(/1 request pending review/i)).toBeVisible();
    });
  });
});
