import { test, expect } from '@playwright/test';

test.describe('Admin Reported Reviews Page E2E', () => {
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

    // Mock reported reviews API with sample data
    await page.route('**/api/admin/reviews/reported*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'review-1',
              campsite_id: 'campsite-1',
              campsite_name: 'Mountain View Camp',
              user_id: 'user-1',
              rating_overall: 1,
              reviewer_type: 'solo',
              title: 'Terrible Experience',
              content: 'This campsite was awful. The facilities were dirty and the staff was rude. Would not recommend to anyone.',
              report_count: 3,
              created_at: new Date().toISOString(),
              reviewer_name: 'John Doe',
              reviewer_avatar: null,
              reports: [
                {
                  id: 'report-1',
                  user_id: 'reporter-1',
                  reporter_name: 'Alice Smith',
                  reason: 'fake',
                  details: 'This review seems fabricated and malicious',
                  created_at: new Date().toISOString(),
                },
                {
                  id: 'report-2',
                  user_id: 'reporter-2',
                  reporter_name: 'Bob Jones',
                  reason: 'inappropriate',
                  details: 'Contains offensive language',
                  created_at: new Date(Date.now() - 86400000).toISOString(),
                },
                {
                  id: 'report-3',
                  user_id: 'reporter-3',
                  reporter_name: 'Carol White',
                  reason: 'spam',
                  details: null,
                  created_at: new Date(Date.now() - 172800000).toISOString(),
                },
              ],
            },
            {
              id: 'review-2',
              campsite_id: 'campsite-2',
              campsite_name: 'Beachside Glamping',
              user_id: 'user-2',
              rating_overall: 5,
              reviewer_type: 'family',
              title: 'Amazing Place!',
              content: 'Best camping experience ever! Contact me for deals: scam@example.com',
              report_count: 2,
              created_at: new Date(Date.now() - 259200000).toISOString(),
              reviewer_name: 'Jane Spammer',
              reviewer_avatar: null,
              reports: [
                {
                  id: 'report-4',
                  user_id: 'reporter-4',
                  reporter_name: 'David Brown',
                  reason: 'spam',
                  details: 'Contains promotional content and email',
                  created_at: new Date().toISOString(),
                },
                {
                  id: 'report-5',
                  user_id: 'reporter-5',
                  reporter_name: 'Emma Wilson',
                  reason: 'spam',
                  details: 'Suspicious review with contact information',
                  created_at: new Date(Date.now() - 43200000).toISOString(),
                },
              ],
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

    // Navigate to reported reviews page
    await page.goto('/admin/reviews/reported');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. Page Access Tests', () => {
    test('T054.1: Redirects to login if not authenticated', async ({ page, context }) => {
      // Clear cookies to simulate unauthenticated state
      await context.clearCookies();

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Should redirect to login or show access denied
      const url = page.url();
      expect(url).toMatch(/login|unauthorized|403/i);
    });

    test('T054.2: Redirects if role is not admin', async ({ page, context }) => {
      // Replace with non-admin token
      await context.clearCookies();
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-user-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Should redirect or show access denied
      const url = page.url();
      expect(url).toMatch(/unauthorized|403|\/$/i);
    });

    test('T054.3: Allows access for admin role', async ({ page }) => {
      await page.goto('/admin/reviews/reported');
      await page.waitForLoadState('networkidle');

      // Should show reported reviews page
      await expect(page.getByText('Reported Reviews')).toBeVisible();
    });
  });

  test.describe('2. Page Rendering Tests', () => {
    test('T054.4: Shows page title "Reported Reviews"', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Reported Reviews' })).toBeVisible();
    });

    test('T054.5: Shows count of reported reviews', async ({ page }) => {
      await expect(page.getByText(/2 reviews? need moderation/i)).toBeVisible();
    });

    test('T054.6: Shows empty state when no reported reviews', async ({ page }) => {
      // Mock empty reported reviews
      await page.route('**/api/admin/reviews/reported*', async (route) => {
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

      await expect(page.getByText('All caught up!')).toBeVisible();
      await expect(page.getByText(/No reported reviews to moderate/i)).toBeVisible();
    });

    test('T054.7: Shows loading state during fetch', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/admin/reviews/reported*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
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

      await page.goto('/admin/reviews/reported');

      // Should show loading skeletons
      const skeletons = page.locator('.animate-pulse');
      await expect(skeletons.first()).toBeVisible();
    });
  });

  test.describe('3. Review Card Display Tests', () => {
    test('T054.8: Shows review content and title', async ({ page }) => {
      await expect(page.getByText('Terrible Experience')).toBeVisible();
      await expect(page.getByText(/This campsite was awful/i)).toBeVisible();
    });

    test('T054.9: Shows star rating', async ({ page }) => {
      // Check for star rating component (1 star for first review)
      const firstCard = page.locator('[data-testid="review-card"]').first();
      const stars = firstCard.locator('[data-rating]');
      await expect(stars).toHaveAttribute('data-rating', '1');
    });

    test('T054.10: Shows reviewer name', async ({ page }) => {
      await expect(page.getByText('John Doe')).toBeVisible();
      await expect(page.getByText('Jane Spammer')).toBeVisible();
    });

    test('T054.11: Shows campsite name', async ({ page }) => {
      await expect(page.getByText(/Review for:.*Mountain View Camp/i)).toBeVisible();
      await expect(page.getByText(/Review for:.*Beachside Glamping/i)).toBeVisible();
    });

    test('T054.12: Shows report count badge', async ({ page }) => {
      await expect(page.getByText(/3 reports?/i).first()).toBeVisible();
      await expect(page.getByText(/2 reports?/i).first()).toBeVisible();
    });

    test('T054.13: Shows creation date', async ({ page }) => {
      // Should show relative time like "2 days ago"
      await expect(page.getByText(/ago/i).first()).toBeVisible();
    });
  });

  test.describe('4. Report Details Tests', () => {
    test('T054.14: Shows list of reports when expanded', async ({ page }) => {
      // Click to show reports
      const showButton = page.getByText(/Show details/i).first();
      await showButton.click();

      // Should show individual reports
      await expect(page.getByText('Alice Smith')).toBeVisible();
      await expect(page.getByText('Bob Jones')).toBeVisible();
      await expect(page.getByText('Carol White')).toBeVisible();
    });

    test('T054.15: Shows report reasons', async ({ page }) => {
      const showButton = page.getByText(/Show details/i).first();
      await showButton.click();

      // Should show reason badges
      await expect(page.getByText('Fake Review')).toBeVisible();
      await expect(page.getByText('Inappropriate')).toBeVisible();
      await expect(page.getByText('Spam')).toBeVisible();
    });

    test('T054.16: Shows reporter names', async ({ page }) => {
      const showButton = page.getByText(/Show details/i).first();
      await showButton.click();

      // All reporter names should be visible
      await expect(page.getByText('Alice Smith')).toBeVisible();
      await expect(page.getByText('Bob Jones')).toBeVisible();
      await expect(page.getByText('Carol White')).toBeVisible();
    });

    test('T054.17: Shows report dates', async ({ page }) => {
      const showButton = page.getByText(/Show details/i).first();
      await showButton.click();

      // Should show relative dates for each report
      const reportDates = page.locator('text=/ago/i');
      await expect(reportDates.first()).toBeVisible();
    });

    test('T054.18: Shows report details/comments', async ({ page }) => {
      const showButton = page.getByText(/Show details/i).first();
      await showButton.click();

      // Should show report details
      await expect(page.getByText('This review seems fabricated and malicious')).toBeVisible();
      await expect(page.getByText('Contains offensive language')).toBeVisible();
    });

    test('T054.19: Can toggle report details visibility', async ({ page }) => {
      const showButton = page.getByText(/Show details/i).first();
      await showButton.click();

      // Reports should be visible
      await expect(page.getByText('Alice Smith')).toBeVisible();

      // Click to hide
      const hideButton = page.getByText(/Hide details/i).first();
      await hideButton.click();

      // Reports should be hidden
      await expect(page.getByText('Alice Smith')).not.toBeVisible();
    });
  });

  test.describe('5. Action Buttons Tests', () => {
    test('T054.20: Shows Dismiss button', async ({ page }) => {
      const dismissButton = page.getByRole('button', { name: /Dismiss/i }).first();
      await expect(dismissButton).toBeVisible();
    });

    test('T054.21: Shows Hide button', async ({ page }) => {
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await expect(hideButton).toBeVisible();
    });

    test('T054.22: Shows Delete button', async ({ page }) => {
      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await expect(deleteButton).toBeVisible();
    });

    test('T054.23: Hide button has warning styling', async ({ page }) => {
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      // Check for yellow/warning colors
      await expect(hideButton).toHaveClass(/yellow/);
    });

    test('T054.24: Delete button has destructive styling', async ({ page }) => {
      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      // Check for red/destructive colors
      await expect(deleteButton).toHaveClass(/red/);
    });

    test('T054.25: Dismiss button shows confirmation', async ({ page }) => {
      // Mock dismiss API
      await page.route('**/api/admin/reviews/review-1/dismiss', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('dismiss all reports');
        await dialog.accept();
      });

      const dismissButton = page.getByRole('button', { name: /Dismiss/i }).first();
      await dismissButton.click();
    });

    test('T054.26: Hide button opens dialog', async ({ page }) => {
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();

      // Should show hide dialog
      await expect(page.getByText('Hide Review')).toBeVisible();
      await expect(page.getByText(/provide a reason/i)).toBeVisible();
    });

    test('T054.27: Delete button shows confirmation', async ({ page }) => {
      // Mock delete API
      await page.route('**/api/admin/reviews/review-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('permanently delete');
        await dialog.accept();
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();
    });
  });

  test.describe('6. Moderation Actions Tests', () => {
    test('T054.28: Can dismiss reports successfully', async ({ page }) => {
      // Mock dismiss API
      await page.route('**/api/admin/reviews/review-1/dismiss', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      page.on('dialog', async (dialog) => await dialog.accept());

      const dismissButton = page.getByRole('button', { name: /Dismiss/i }).first();
      await dismissButton.click();

      // Review should be removed from list
      await page.waitForTimeout(500);
      await expect(page.getByText('Terrible Experience')).not.toBeVisible();
    });

    test('T054.29: Can hide review with reason', async ({ page }) => {
      // Mock hide API
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();

      // Fill in reason
      const reasonInput = page.getByPlaceholder(/reason/i);
      await reasonInput.fill('Contains inappropriate content');

      // Confirm hide
      const confirmButton = page.getByRole('button', { name: /Confirm/i });
      await confirmButton.click();

      // Review should be removed
      await page.waitForTimeout(500);
      await expect(page.getByText('Terrible Experience')).not.toBeVisible();
    });

    test('T054.30: Can delete review permanently', async ({ page }) => {
      // Mock delete API
      await page.route('**/api/admin/reviews/review-1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      page.on('dialog', async (dialog) => await dialog.accept());

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      // Review should be removed
      await page.waitForTimeout(500);
      await expect(page.getByText('Terrible Experience')).not.toBeVisible();
    });

    test('T054.31: Shows loading state during action', async ({ page }) => {
      // Mock slow dismiss API
      await page.route('**/api/admin/reviews/review-1/dismiss', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      page.on('dialog', async (dialog) => await dialog.accept());

      const dismissButton = page.getByRole('button', { name: /Dismiss/i }).first();
      await dismissButton.click();

      // Should show loading text
      await expect(page.getByText('Dismissing...')).toBeVisible();
    });

    test('T054.32: Buttons disabled during action', async ({ page }) => {
      // Mock slow dismiss API
      await page.route('**/api/admin/reviews/review-1/dismiss', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      page.on('dialog', async (dialog) => await dialog.accept());

      const dismissButton = page.getByRole('button', { name: /Dismiss/i }).first();
      await dismissButton.click();

      // All action buttons should be disabled
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();

      await expect(dismissButton).toBeDisabled();
      await expect(hideButton).toBeDisabled();
      await expect(deleteButton).toBeDisabled();
    });

    test('T054.33: Count updates after moderation', async ({ page }) => {
      // Mock dismiss API
      await page.route('**/api/admin/reviews/review-1/dismiss', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      page.on('dialog', async (dialog) => await dialog.accept());

      // Initial count: 2
      await expect(page.getByText(/2 reviews? need moderation/i)).toBeVisible();

      const dismissButton = page.getByRole('button', { name: /Dismiss/i }).first();
      await dismissButton.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Count should update to 1
      await expect(page.getByText(/1 review needs? moderation/i)).toBeVisible();
    });

    test('T054.34: Shows error message on failure', async ({ page }) => {
      // Mock failed dismiss
      await page.route('**/api/admin/reviews/review-1/dismiss', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to dismiss reports',
          }),
        });
      });

      let alertMessage = '';
      page.on('dialog', async (dialog) => {
        if (dialog.message().includes('dismiss all reports')) {
          await dialog.accept();
        } else {
          alertMessage = dialog.message();
          await dialog.accept();
        }
      });

      const dismissButton = page.getByRole('button', { name: /Dismiss/i }).first();
      await dismissButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Should show error message
      expect(alertMessage).toContain('Failed to dismiss');
    });

    test('T054.35: Review remains in list on error', async ({ page }) => {
      // Mock failed dismiss
      await page.route('**/api/admin/reviews/review-1/dismiss', async (route) => {
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

      const dismissButton = page.getByRole('button', { name: /Dismiss/i }).first();
      await dismissButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Review should still be visible
      await expect(page.getByText('Terrible Experience')).toBeVisible();
    });
  });

  test.describe('7. Refresh Functionality Tests', () => {
    test('T054.36: Shows refresh button', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      await expect(refreshButton).toBeVisible();
    });

    test('T054.37: Refresh button reloads data', async ({ page }) => {
      let fetchCount = 0;

      await page.route('**/api/admin/reviews/reported*', async (route) => {
        fetchCount++;
        await route.continue();
      });

      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      await refreshButton.click();

      await page.waitForTimeout(500);

      // Should have made at least 2 fetches (initial + refresh)
      expect(fetchCount).toBeGreaterThanOrEqual(2);
    });

    test('T054.38: Shows loading state during refresh', async ({ page }) => {
      // Mock slow refresh
      await page.route('**/api/admin/reviews/reported*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      await refreshButton.click();

      // Should show spinning icon
      const spinningIcon = page.locator('.animate-spin');
      await expect(spinningIcon).toBeVisible();
    });

    test('T054.39: Refresh button disabled during loading', async ({ page }) => {
      // Mock slow refresh
      await page.route('**/api/admin/reviews/reported*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      await refreshButton.click();

      // Button should be disabled
      await expect(refreshButton).toBeDisabled();
    });
  });

  test.describe('8. Pagination Tests', () => {
    test('T054.40: Shows pagination controls when multiple pages', async ({ page }) => {
      // Mock multi-page response
      await page.route('**/api/admin/reviews/reported*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should show pagination
      await expect(page.getByText(/Page 1 of 3/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Previous/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();
    });

    test('T054.41: Hides pagination on single page', async ({ page }) => {
      // Default mock has only 1 page
      const previousButton = page.getByRole('button', { name: /Previous/i });
      await expect(previousButton).not.toBeVisible();
    });

    test('T054.42: Can navigate to next page', async ({ page }) => {
      // Mock multi-page response
      await page.route('**/api/admin/reviews/reported*page=1*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
          }),
        });
      });

      await page.route('**/api/admin/reviews/reported*page=2*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 2, limit: 10, total: 25, totalPages: 3 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const nextButton = page.getByRole('button', { name: /Next/i });
      await nextButton.click();

      await page.waitForTimeout(500);

      // Should show page 2
      await expect(page.getByText(/Page 2 of 3/i)).toBeVisible();
    });

    test('T054.43: Previous button disabled on first page', async ({ page }) => {
      // Mock multi-page response
      await page.route('**/api/admin/reviews/reported*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const previousButton = page.getByRole('button', { name: /Previous/i });
      await expect(previousButton).toBeDisabled();
    });

    test('T054.44: Next button disabled on last page', async ({ page }) => {
      // Mock last page response
      await page.route('**/api/admin/reviews/reported*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 3, limit: 10, total: 25, totalPages: 3 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const nextButton = page.getByRole('button', { name: /Next/i });
      await expect(nextButton).toBeDisabled();
    });
  });

  test.describe('9. Empty State Tests', () => {
    test('T054.45: Shows empty state icon', async ({ page }) => {
      // Mock empty response
      await page.route('**/api/admin/reviews/reported*', async (route) => {
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

      // Should show icon (MessageSquareWarning component)
      const emptyIcon = page.locator('.text-green-600');
      await expect(emptyIcon).toBeVisible();
    });

    test('T054.46: Empty state shows zero count', async ({ page }) => {
      // Mock empty response
      await page.route('**/api/admin/reviews/reported*', async (route) => {
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

      // Should show 0 reviews
      await expect(page.getByText(/0 reviews? need/i)).toBeVisible();
    });
  });

  test.describe('10. Error Handling Tests', () => {
    test('T054.47: Shows error message on API failure', async ({ page }) => {
      // Mock API error
      await page.route('**/api/admin/reviews/reported*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Database connection failed',
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should show error
      await expect(page.getByText(/Error:/i)).toBeVisible();
      await expect(page.getByText(/Database connection failed/i)).toBeVisible();
    });

    test('T054.48: Shows retry button on error', async ({ page }) => {
      // Mock API error
      await page.route('**/api/admin/reviews/reported*', async (route) => {
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

      // Should show try again button
      const retryButton = page.getByRole('button', { name: /Try Again/i });
      await expect(retryButton).toBeVisible();
    });

    test('T054.49: Can retry after error', async ({ page }) => {
      let attemptCount = 0;

      // Mock first failure, then success
      await page.route('**/api/admin/reviews/reported*', async (route) => {
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
            body: JSON.stringify({
              success: true,
              data: [],
              pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            }),
          });
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should show error
      await expect(page.getByText(/Error:/i)).toBeVisible();

      // Click retry
      const retryButton = page.getByRole('button', { name: /Try Again/i });
      await retryButton.click();

      await page.waitForTimeout(500);

      // Should show empty state (success)
      await expect(page.getByText('All caught up!')).toBeVisible();
    });
  });
});
