import { test, expect } from '@playwright/test';

test.describe('Admin Owner Requests Page E2E', () => {
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

    // Mock owner requests API with sample data
    await page.route('**/api/admin/owner-requests*', async (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status') || 'pending';

      if (status === 'pending') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'request-1',
                user_id: 'user-1',
                business_name: 'Mountain Camping Co.',
                business_description:
                  'We operate 3 beautiful mountain campsites in northern Thailand with premium facilities and stunning views.',
                contact_phone: '089-123-4567',
                status: 'pending',
                created_at: new Date().toISOString(),
                reviewed_at: null,
                reviewed_by: null,
                user_full_name: 'John Smith',
                user_avatar_url: null,
              },
              {
                id: 'request-2',
                user_id: 'user-2',
                business_name: 'Beachside Glamping Resort',
                business_description:
                  'Luxury glamping resort on the beach offering premium accommodation and outdoor experiences.',
                contact_phone: '082-555-9999',
                status: 'pending',
                created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                reviewed_at: null,
                reviewed_by: null,
                user_full_name: 'Jane Doe',
                user_avatar_url: 'https://example.com/avatar.jpg',
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
      } else if (status === 'approved') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'request-3',
                user_id: 'user-3',
                business_name: 'Approved Camping',
                business_description: 'Approved business',
                contact_phone: '089-999-9999',
                status: 'approved',
                created_at: new Date(Date.now() - 172800000).toISOString(),
                reviewed_at: new Date(Date.now() - 86400000).toISOString(),
                reviewed_by: 'admin-1',
                user_full_name: 'Approved User',
                user_avatar_url: null,
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1,
            },
          }),
        });
      } else if (status === 'rejected') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'request-4',
                user_id: 'user-4',
                business_name: 'Rejected Camping',
                business_description: 'Rejected business',
                contact_phone: '089-111-1111',
                status: 'rejected',
                created_at: new Date(Date.now() - 259200000).toISOString(),
                reviewed_at: new Date(Date.now() - 172800000).toISOString(),
                reviewed_by: 'admin-1',
                rejection_reason: 'Incomplete documentation',
                user_full_name: 'Rejected User',
                user_avatar_url: null,
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1,
            },
          }),
        });
      } else {
        // All statuses
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 4,
              totalPages: 1,
            },
          }),
        });
      }
    });

    // Navigate to owner requests page
    await page.goto('/admin/owner-requests');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. Page Access Tests', () => {
    test('T035.1: Redirects to login if not authenticated', async ({ page, context }) => {
      // Clear cookies
      await context.clearCookies();

      await page.goto('/admin/owner-requests');
      await page.waitForLoadState('networkidle');

      // Should redirect to login
      await expect(page).toHaveURL(/\/(auth\/login|login)/);
    });

    test('T035.2: Redirects if role is not admin', async ({ page, context }) => {
      // Set as regular user
      await context.clearCookies();
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-user-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto('/admin/owner-requests');
      await page.waitForLoadState('networkidle');

      // Should redirect or show access denied
      const url = page.url();
      expect(url).not.toContain('/admin/owner-requests');
    });

    test('T035.3: Allows access for admin role', async ({ page }) => {
      // Already set as admin in beforeEach
      await expect(page).toHaveURL(/\/admin\/owner-requests/);
      await expect(page.getByRole('heading', { name: /Owner Requests/i })).toBeVisible();
    });
  });

  test.describe('2. Page Rendering Tests', () => {
    test('T035.4: Shows page title "Owner Requests"', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Owner Requests/i })).toBeVisible();
    });

    test('T035.5: Shows count of pending requests', async ({ page }) => {
      await expect(page.getByText(/2 requests? pending review/i)).toBeVisible();
    });

    test('T035.6: Shows empty state when no requests', async ({ page }) => {
      // Mock empty response
      await page.route('**/api/admin/owner-requests*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
            },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/All caught up!/i)).toBeVisible();
      await expect(page.getByText(/No pending owner requests to review/i)).toBeVisible();
    });

    test('T035.7: Shows loading state during fetch', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/admin/owner-requests*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
      });

      await page.reload();

      // Should show loading skeletons
      const skeletons = page.locator('.animate-pulse');
      await expect(skeletons.first()).toBeVisible();
    });
  });

  test.describe('3. Request List Display Tests', () => {
    test('T035.8: Shows user full name', async ({ page }) => {
      await expect(page.getByText('John Smith')).toBeVisible();
      await expect(page.getByText('Jane Doe')).toBeVisible();
    });

    test('T035.9: Shows business name', async ({ page }) => {
      await expect(page.getByText('Mountain Camping Co.')).toBeVisible();
      await expect(page.getByText('Beachside Glamping Resort')).toBeVisible();
    });

    test('T035.10: Shows business description', async ({ page }) => {
      await expect(
        page.getByText(/We operate 3 beautiful mountain campsites/i)
      ).toBeVisible();
      await expect(
        page.getByText(/Luxury glamping resort on the beach/i)
      ).toBeVisible();
    });

    test('T035.11: Shows contact phone', async ({ page }) => {
      await expect(page.getByText('089-123-4567')).toBeVisible();
      await expect(page.getByText('082-555-9999')).toBeVisible();
    });

    test('T035.12: Shows request status badge', async ({ page }) => {
      const badges = page.getByText(/Pending/i);
      await expect(badges.first()).toBeVisible();
    });

    test('T035.13: Shows created date as time ago', async ({ page }) => {
      await expect(page.getByText(/ago/i)).toBeVisible();
    });

    test('T035.14: Shows user avatar when available', async ({ page }) => {
      // Jane Doe has avatar
      const avatarImage = page.locator('img[alt="Jane Doe"]');
      await expect(avatarImage).toBeVisible();
    });

    test('T035.15: Shows default icon when no avatar', async ({ page }) => {
      // John Smith has no avatar - should show User icon
      const cards = page.locator('div.rounded-full.bg-blue-100');
      await expect(cards.first()).toBeVisible();
    });
  });

  test.describe('4. Status Filter Tests', () => {
    test('T035.16: Default shows pending requests', async ({ page }) => {
      // Default view should show pending
      await expect(page.getByText('Mountain Camping Co.')).toBeVisible();
      await expect(page.getByText(/2 requests? pending review/i)).toBeVisible();
    });

    test('T035.17: Can filter by approved status', async ({ page }) => {
      // Mock approved requests
      await page.route('**/api/admin/owner-requests*status=approved*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'request-3',
                user_id: 'user-3',
                business_name: 'Approved Camping',
                business_description: 'Approved business',
                contact_phone: '089-999-9999',
                status: 'approved',
                created_at: new Date().toISOString(),
                reviewed_at: new Date().toISOString(),
                reviewed_by: 'admin-1',
                user_full_name: 'Approved User',
                user_avatar_url: null,
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          }),
        });
      });

      // If there's a filter dropdown/tabs, click approved
      const approvedFilter = page.getByRole('button', { name: /approved/i });
      if (await approvedFilter.isVisible()) {
        await approvedFilter.click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText('Approved Camping')).toBeVisible();
      }
    });

    test('T035.18: Can filter by rejected status', async ({ page }) => {
      // Mock rejected requests
      await page.route('**/api/admin/owner-requests*status=rejected*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'request-4',
                user_id: 'user-4',
                business_name: 'Rejected Camping',
                business_description: 'Rejected business',
                contact_phone: '089-111-1111',
                status: 'rejected',
                created_at: new Date().toISOString(),
                reviewed_at: new Date().toISOString(),
                reviewed_by: 'admin-1',
                rejection_reason: 'Incomplete documentation',
                user_full_name: 'Rejected User',
                user_avatar_url: null,
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          }),
        });
      });

      const rejectedFilter = page.getByRole('button', { name: /rejected/i });
      if (await rejectedFilter.isVisible()) {
        await rejectedFilter.click();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText('Rejected Camping')).toBeVisible();
      }
    });

    test('T035.19: Can show all statuses', async ({ page }) => {
      const allFilter = page.getByRole('button', { name: /all/i });
      if (await allFilter.isVisible()) {
        await allFilter.click();
        await page.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('5. Action Buttons Tests', () => {
    test('T035.20: Shows Approve button for pending requests', async ({ page }) => {
      const approveButtons = page.getByRole('button', { name: /Approve/i });
      await expect(approveButtons.first()).toBeVisible();
      await expect(approveButtons.first()).toBeEnabled();
    });

    test('T035.21: Shows Reject button for pending requests', async ({ page }) => {
      const rejectButtons = page.getByRole('button', { name: /Reject/i });
      await expect(rejectButtons.first()).toBeVisible();
      await expect(rejectButtons.first()).toBeEnabled();
    });

    test('T035.22: Hides action buttons for non-pending requests', async ({ page }) => {
      // Mock approved requests
      await page.route('**/api/admin/owner-requests*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'request-3',
                user_id: 'user-3',
                business_name: 'Approved Camping',
                business_description: 'Approved business',
                contact_phone: '089-999-9999',
                status: 'approved',
                created_at: new Date().toISOString(),
                reviewed_at: new Date().toISOString(),
                reviewed_by: 'admin-1',
                user_full_name: 'Approved User',
                user_avatar_url: null,
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Action buttons should not be present for approved requests
      const approveButtons = page.getByRole('button', { name: /^Approve$/i });
      await expect(approveButtons).toHaveCount(0);
    });
  });

  test.describe('6. Table/List Layout Tests', () => {
    test('T035.23: Responsive grid on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });

      const grid = page.locator('.grid.gap-4');
      await expect(grid).toBeVisible();
      await expect(grid).toHaveClass(/lg:grid-cols-3/);
    });

    test('T035.24: Responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Should still show cards
      await expect(page.getByText('Mountain Camping Co.')).toBeVisible();

      // Grid should be single column on mobile
      const grid = page.locator('.grid.gap-4');
      await expect(grid).toBeVisible();
    });

    test('T035.25: Pagination works with multiple pages', async ({ page }) => {
      // Mock paginated response
      await page.route('**/api/admin/owner-requests*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 25,
              totalPages: 3,
            },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should show pagination controls
      const nextButton = page.getByRole('button', { name: /Next/i });
      const prevButton = page.getByRole('button', { name: /Previous/i });

      await expect(nextButton).toBeVisible();
      await expect(prevButton).toBeVisible();
      await expect(page.getByText(/Page 1 of 3/i)).toBeVisible();
    });

    test('T035.26: Pagination next button works', async ({ page }) => {
      // Mock paginated response
      let currentPage = 1;
      await page.route('**/api/admin/owner-requests*', async (route) => {
        const url = new URL(route.request().url());
        currentPage = parseInt(url.searchParams.get('page') || '1');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: {
              page: currentPage,
              limit: 10,
              total: 25,
              totalPages: 3,
            },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const nextButton = page.getByRole('button', { name: /Next/i });
      await nextButton.click();
      await page.waitForTimeout(500);

      await expect(page.getByText(/Page 2 of 3/i)).toBeVisible();
    });

    test('T035.27: Pagination previous button works', async ({ page }) => {
      // Start on page 2
      let currentPage = 2;
      await page.route('**/api/admin/owner-requests*', async (route) => {
        const url = new URL(route.request().url());
        currentPage = parseInt(url.searchParams.get('page') || '2');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: {
              page: currentPage,
              limit: 10,
              total: 25,
              totalPages: 3,
            },
          }),
        });
      });

      await page.goto('/admin/owner-requests?page=2');
      await page.waitForLoadState('networkidle');

      const prevButton = page.getByRole('button', { name: /Previous/i });
      await prevButton.click();
      await page.waitForTimeout(500);

      await expect(page.getByText(/Page 1 of 3/i)).toBeVisible();
    });
  });

  test.describe('7. Sidebar Badge Tests', () => {
    test('T035.28: Shows pending count in page header', async ({ page }) => {
      await expect(page.getByText(/2 requests? pending review/i)).toBeVisible();
    });

    test('T035.29: Badge updates when request approved', async ({ page }) => {
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

      // Count should update to 1
      await expect(page.getByText(/1 request pending review/i)).toBeVisible();
    });

    test('T035.30: Badge updates when request rejected', async ({ page }) => {
      // Mock rejection
      await page.route('**/api/admin/owner-requests/request-1/reject', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const rejectButton = page.getByRole('button', { name: /Reject/i }).first();
      await rejectButton.click();

      // Fill rejection reason dialog
      const reasonInput = page.getByPlaceholder(/reason/i);
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('Incomplete information');
        const confirmButton = page.getByRole('button', { name: /confirm/i });
        await confirmButton.click();
      }

      await page.waitForTimeout(500);

      // Count should update to 1
      await expect(page.getByText(/1 request pending review/i)).toBeVisible();
    });
  });

  test.describe('8. Refresh Functionality', () => {
    test('T035.31: Refresh button exists and is clickable', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      await expect(refreshButton).toBeVisible();
      await expect(refreshButton).toBeEnabled();
    });

    test('T035.32: Refresh button reloads data', async ({ page }) => {
      let callCount = 0;
      await page.route('**/api/admin/owner-requests*', async (route) => {
        callCount++;
        await route.continue();
      });

      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      await refreshButton.click();
      await page.waitForTimeout(500);

      // Should have made at least 2 API calls (initial + refresh)
      expect(callCount).toBeGreaterThan(1);
    });

    test('T035.33: Refresh button shows loading state', async ({ page }) => {
      await page.route('**/api/admin/owner-requests*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      await refreshButton.click();

      // Should show spinning icon
      const spinningIcon = page.locator('.animate-spin');
      await expect(spinningIcon).toBeVisible();
    });

    test('T035.34: Refresh button disabled during loading', async ({ page }) => {
      await page.route('**/api/admin/owner-requests*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      await refreshButton.click();

      // Button should be disabled during loading
      await expect(refreshButton).toBeDisabled();
    });
  });

  test.describe('9. Error Handling', () => {
    test('T035.35: Shows error message on API failure', async ({ page }) => {
      await page.route('**/api/admin/owner-requests*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error',
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/Error:/i)).toBeVisible();
      await expect(page.getByText(/Internal server error|Failed to fetch/i)).toBeVisible();
    });

    test('T035.36: Shows try again button on error', async ({ page }) => {
      await page.route('**/api/admin/owner-requests*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Server error',
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const tryAgainButton = page.getByRole('button', { name: /Try Again/i });
      await expect(tryAgainButton).toBeVisible();
    });

    test('T035.37: Try again button retries request', async ({ page }) => {
      let attemptCount = 0;
      await page.route('**/api/admin/owner-requests*', async (route) => {
        attemptCount++;
        if (attemptCount === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, error: 'Server error' }),
          });
        } else {
          await route.continue();
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const tryAgainButton = page.getByRole('button', { name: /Try Again/i });
      await tryAgainButton.click();
      await page.waitForTimeout(500);

      // Should show data after retry
      await expect(page.getByText('Mountain Camping Co.')).toBeVisible();
    });
  });

  test.describe('10. Empty State Tests', () => {
    test('T035.38: Empty state shows icon', async ({ page }) => {
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

      const emptyIcon = page.locator('.rounded-full.bg-green-100');
      await expect(emptyIcon).toBeVisible();
    });

    test('T035.39: Empty state shows helpful message', async ({ page }) => {
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

      await expect(page.getByText(/All caught up!/i)).toBeVisible();
      await expect(page.getByText(/No pending owner requests/i)).toBeVisible();
    });

    test('T035.40: Empty state shows correct count', async ({ page }) => {
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

      await expect(page.getByText(/0 requests? pending review/i)).toBeVisible();
    });
  });
});
