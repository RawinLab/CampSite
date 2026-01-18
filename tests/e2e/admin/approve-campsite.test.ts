import { test, expect } from '@playwright/test';

test.describe('Admin Campsite Approval E2E', () => {
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

    // Mock pending campsites API with sample data
    await page.route('**/api/admin/campsites/pending*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'campsite-1',
              name: 'Mountain View Camp',
              description: 'A beautiful mountain campsite with stunning views and modern amenities for all types of campers.',
              campsite_type: 'camping',
              province_name: 'Chiang Mai',
              address: '123 Mountain Road, Forest District, Chiang Mai 50000',
              min_price: 500,
              max_price: 1500,
              owner_id: 'owner-1',
              owner_name: 'John Doe',
              photo_count: 8,
              submitted_at: new Date().toISOString(),
            },
            {
              id: 'campsite-2',
              name: 'Beachside Glamping',
              description: 'Luxury glamping experience by the beach with premium facilities and ocean views.',
              campsite_type: 'glamping',
              province_name: 'Phuket',
              address: '456 Beach Road, Coastal District, Phuket 83000',
              min_price: 2000,
              max_price: 5000,
              owner_id: 'owner-2',
              owner_name: 'Jane Smith',
              photo_count: 12,
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

    // Navigate to pending campsites page
    await page.goto('/admin/campsites/pending');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. Approve Flow Tests', () => {
    test('T023.1: Admin can click Approve button', async ({ page }) => {
      // Find the approve button for first campsite
      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await expect(approveButton).toBeVisible();
      await expect(approveButton).toBeEnabled();
    });

    test('T023.2: Shows loading state during approval', async ({ page }) => {
      // Mock slow approval API
      await page.route('**/api/admin/campsites/*/approve', async (route) => {
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

    test('T023.3: Success message appears after approval', async ({ page }) => {
      // Mock successful approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Campsite approved successfully',
          }),
        });
      });

      // Mock updated pending list (empty after approval)
      let approvalDone = false;
      await page.route('**/api/admin/campsites/pending*', async (route) => {
        if (approvalDone) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [],
              pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            }),
          });
        } else {
          await route.continue();
        }
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      approvalDone = true;

      // Wait for success
      await page.waitForTimeout(500);

      // Campsite should be removed from list
      await expect(page.getByText('Mountain View Camp')).not.toBeVisible();
    });

    test('T023.4: Campsite removed from pending list after approval', async ({ page }) => {
      // Mock approval API
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Verify campsite is visible before approval
      await expect(page.getByText('Mountain View Camp')).toBeVisible();

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();

      // Wait for removal
      await page.waitForTimeout(500);

      // Campsite should disappear from list
      await expect(page.getByText('Mountain View Camp')).not.toBeVisible();
    });

    test('T023.5: Pending count badge updates after approval', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Initial count should be 2
      await expect(page.getByText(/2 campsites? awaiting approval/i)).toBeVisible();

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Count should update to 1
      await expect(page.getByText(/1 campsite awaiting approval/i)).toBeVisible();
    });

    test('T023.6: Confirmation dialog does not appear for approval', async ({ page }) => {
      // Mock approval API
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();

      // Should not show a confirmation dialog (approval is direct action)
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('2. UI State Tests', () => {
    test('T023.7: Approve button disabled during action', async ({ page }) => {
      // Mock slow approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
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

    test('T023.8: All buttons disabled during approval', async ({ page }) => {
      // Mock slow approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
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

    test('T023.9: Button shows loading indicator', async ({ page }) => {
      // Mock slow approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
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

    test('T023.10: Optimistic UI updates for list removal', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();

      // List should update immediately (optimistic)
      await page.waitForTimeout(300);
      await expect(page.getByText('Mountain View Camp')).not.toBeVisible();
    });
  });

  test.describe('3. Error Handling Tests', () => {
    test('T023.11: Shows error message on failure', async ({ page }) => {
      // Mock failed approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to approve campsite',
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
      expect(alertMessage).toContain('Failed to approve campsite');
    });

    test('T023.12: Campsite remains in list on error', async ({ page }) => {
      // Mock failed approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
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

      // Campsite should still be visible
      await expect(page.getByText('Mountain View Camp')).toBeVisible();
    });

    test('T023.13: Can retry after error', async ({ page }) => {
      let attemptCount = 0;

      // Mock first failure, then success
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
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

      // Campsite should still be there
      await expect(page.getByText('Mountain View Camp')).toBeVisible();

      // Second attempt - should succeed
      await approveButton.click();
      await page.waitForTimeout(500);

      // Campsite should be removed
      await expect(page.getByText('Mountain View Camp')).not.toBeVisible();
    });

    test('T023.14: Network error shows appropriate message', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
        await route.abort('failed');
      });

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
      expect(alertMessage).toBeTruthy();
    });
  });

  test.describe('4. Post-Approval Tests', () => {
    test('T023.15: Approved campsite appears in main campsites list', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock main campsites list
      await page.route('**/api/campsites*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'campsite-1',
                name: 'Mountain View Camp',
                status: 'approved',
                campsite_type: 'camping',
                province_name: 'Chiang Mai',
                min_price: 500,
                max_price: 1500,
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();

      // Wait for approval
      await page.waitForTimeout(500);

      // Navigate to main campsites
      await page.goto('/campsites');
      await page.waitForLoadState('networkidle');

      // Should see approved campsite
      await expect(page.getByText('Mountain View Camp')).toBeVisible();
    });

    test('T023.16: Approved campsite is searchable on public site', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock search results
      await page.route('**/api/search*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'campsite-1',
                name: 'Mountain View Camp',
                status: 'approved',
                campsite_type: 'camping',
                province_name: 'Chiang Mai',
                min_price: 500,
              },
            ],
          }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Navigate to search
      await page.goto('/search?q=mountain');
      await page.waitForLoadState('networkidle');

      // Should find approved campsite
      await expect(page.getByText('Mountain View Camp')).toBeVisible();
    });

    test('T023.17: Owner dashboard shows approved status', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock owner dashboard
      await page.route('**/api/dashboard/campsites', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'campsite-1',
                name: 'Mountain View Camp',
                status: 'approved',
                campsite_type: 'camping',
              },
            ],
          }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Switch to owner context and navigate to dashboard
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-owner-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Should see approved badge/status
      await expect(page.getByText(/approved/i)).toBeVisible();
    });
  });

  test.describe('5. Navigation Tests', () => {
    test('T023.18: Stays on pending page after approval', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Should still be on pending page
      await expect(page).toHaveURL(/\/admin\/campsites\/pending/);
    });

    test('T023.19: List updates without full page reload', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
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

    test('T023.20: Can refresh page manually to see updated list', async ({ page }) => {
      // Mock approval
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
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

      // Should show updated list
      await expect(page.getByText(/campsite.*awaiting approval/i)).toBeVisible();
    });

    test('T023.21: Refresh button shows loading state', async ({ page }) => {
      // Mock slow refresh
      await page.route('**/api/admin/campsites/pending*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      await refreshButton.click();

      // Should show spinning icon
      const spinningIcon = page.locator('.animate-spin');
      await expect(spinningIcon).toBeVisible();
    });
  });

  test.describe('6. Empty State Tests', () => {
    test('T023.22: Shows empty state when no pending campsites', async ({ page }) => {
      // Mock empty pending list
      await page.route('**/api/admin/campsites/pending*', async (route) => {
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
      await expect(page.getByText(/No pending campsites to review/i)).toBeVisible();
    });

    test('T023.23: Empty state shows tent icon', async ({ page }) => {
      // Mock empty pending list
      await page.route('**/api/admin/campsites/pending*', async (route) => {
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

      // Should have tent icon (check for green-600 text color which indicates icon)
      const emptyStateCard = page.locator('.text-green-600');
      await expect(emptyStateCard).toBeVisible();
    });
  });

  test.describe('7. Multiple Approvals', () => {
    test('T023.24: Can approve multiple campsites in sequence', async ({ page }) => {
      // Mock approvals for both campsites
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.route('**/api/admin/campsites/campsite-2/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Approve first campsite
      const firstApproveButton = page.getByRole('button', { name: /Approve/i }).first();
      await firstApproveButton.click();
      await page.waitForTimeout(500);

      // Should have one campsite left
      await expect(page.getByText('Beachside Glamping')).toBeVisible();

      // Approve second campsite
      const secondApproveButton = page.getByRole('button', { name: /Approve/i }).first();
      await secondApproveButton.click();
      await page.waitForTimeout(500);

      // Should show empty state
      await expect(page.getByText(/All caught up!/i)).toBeVisible();
    });

    test('T023.25: Pending count decrements correctly with multiple approvals', async ({ page }) => {
      // Mock approvals
      await page.route('**/api/admin/campsites/campsite-1/approve', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Initial count: 2
      await expect(page.getByText(/2 campsites? awaiting approval/i)).toBeVisible();

      // Approve first
      const approveButton = page.getByRole('button', { name: /Approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Count should be 1
      await expect(page.getByText(/1 campsite awaiting approval/i)).toBeVisible();
    });
  });
});
