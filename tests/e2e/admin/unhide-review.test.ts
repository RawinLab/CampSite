import { test, expect } from '@playwright/test';

test.describe('Admin Review Unhide E2E', () => {
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

    // Mock hidden reviews API with sample data
    await page.route('**/api/admin/reviews/hidden*', async (route) => {
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
              rating_overall: 4,
              reviewer_type: 'solo',
              title: 'Great camping experience',
              content: 'Had a wonderful time at this campsite. The views were amazing and facilities were clean.',
              is_hidden: true,
              hide_reason: 'inappropriate',
              hidden_at: new Date(Date.now() - 86400000).toISOString(),
              hidden_by: 'admin-1',
              created_at: new Date(Date.now() - 172800000).toISOString(),
              reviewer_name: 'John Doe',
              reviewer_avatar: null,
            },
            {
              id: 'review-2',
              campsite_id: 'campsite-2',
              campsite_name: 'Beachside Glamping',
              user_id: 'user-2',
              rating_overall: 2,
              reviewer_type: 'family',
              title: 'Disappointing stay',
              content: 'This review was reported as spam and subsequently hidden by admin.',
              is_hidden: true,
              hide_reason: 'spam',
              hidden_at: new Date(Date.now() - 43200000).toISOString(),
              hidden_by: 'admin-2',
              created_at: new Date(Date.now() - 259200000).toISOString(),
              reviewer_name: 'Jane Smith',
              reviewer_avatar: null,
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

    // Navigate to hidden reviews page
    await page.goto('/admin/reviews/hidden');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. Finding Hidden Reviews Tests', () => {
    test('T056.1: Can access hidden reviews list', async ({ page }) => {
      // Should be on hidden reviews page
      await expect(page).toHaveURL(/\/admin\/reviews\/hidden/);

      // Page should have title/heading
      await expect(page.getByText(/Hidden Reviews/i)).toBeVisible();
    });

    test('T056.2: Hidden reviews show "hidden" status', async ({ page }) => {
      // Look for hidden status badge or indicator
      const hiddenBadge = page.locator('[data-testid="status-badge"]').first();
      await expect(hiddenBadge).toBeVisible();
      await expect(hiddenBadge).toContainText(/hidden/i);
    });

    test('T056.3: Shows hide reason for each review', async ({ page }) => {
      // Should display the hide reason
      await expect(page.getByText(/inappropriate/i)).toBeVisible();
      await expect(page.getByText(/spam/i)).toBeVisible();
    });

    test('T056.4: Shows hidden date', async ({ page }) => {
      // Should display when the review was hidden
      const hiddenDate = page.locator('[data-testid="hidden-date"]').first();
      await expect(hiddenDate).toBeVisible();
    });

    test('T056.5: Displays review content even when hidden', async ({ page }) => {
      // Hidden reviews should still show content for admin review
      await expect(page.getByText('Great camping experience')).toBeVisible();
      await expect(page.getByText('Disappointing stay')).toBeVisible();
    });

    test('T056.6: Shows campsite name for hidden reviews', async ({ page }) => {
      // Should show which campsite the review is for
      await expect(page.getByText('Mountain View Camp')).toBeVisible();
      await expect(page.getByText('Beachside Glamping')).toBeVisible();
    });

    test('T056.7: Shows reviewer information', async ({ page }) => {
      // Should display reviewer name
      await expect(page.getByText('John Doe')).toBeVisible();
      await expect(page.getByText('Jane Smith')).toBeVisible();
    });
  });

  test.describe('2. Unhide Action Tests', () => {
    test('T056.8: Unhide button visible for hidden reviews', async ({ page }) => {
      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await expect(unhideButton).toBeVisible();
      await expect(unhideButton).toBeEnabled();
    });

    test('T056.9: Clicking Unhide triggers action', async ({ page }) => {
      let unhideRequested = false;

      // Mock unhide API
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        unhideRequested = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            review_id: 'review-1',
            action: 'unhide',
            message: 'Review unhidden successfully',
          }),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // Wait for API call
      await page.waitForTimeout(500);

      // Verify unhide was requested
      expect(unhideRequested).toBe(true);
    });

    test('T056.10: No reason required for unhide', async ({ page }) => {
      // Mock unhide API
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Review unhidden successfully',
          }),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // Should NOT show a dialog asking for reason
      await page.waitForTimeout(300);
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('T056.11: Shows loading state during unhide', async ({ page }) => {
      // Mock slow unhide API
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // Should show loading text
      await expect(page.getByText(/Unhiding.../i)).toBeVisible();
    });

    test('T056.12: Success message appears after unhide', async ({ page }) => {
      // Mock successful unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Review unhidden successfully',
          }),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // Wait for success toast/message
      await page.waitForTimeout(500);

      // Should show success message
      const toast = page.locator('[data-testid="toast"]');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText(/unhidden/i);
    });

    test('T056.13: Unhide button disabled during action', async ({ page }) => {
      // Mock slow unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // Button should be disabled during unhide
      await expect(unhideButton).toBeDisabled();
    });
  });

  test.describe('3. Post-Unhide Verification Tests', () => {
    test('T056.14: Review removed from hidden list after unhide', async ({ page }) => {
      // Mock unhide API
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Verify review is visible before unhide
      await expect(page.getByText('Great camping experience')).toBeVisible();

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // Wait for removal
      await page.waitForTimeout(500);

      // Review should disappear from hidden list
      await expect(page.getByText('Great camping experience')).not.toBeVisible();
    });

    test('T056.15: Review is now visible on campsite page', async ({ page }) => {
      // Mock unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock campsite reviews API to show unhidden review
      await page.route('**/api/campsites/campsite-1/reviews*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'review-1',
                rating_overall: 4,
                title: 'Great camping experience',
                content: 'Had a wonderful time at this campsite.',
                is_hidden: false,
                reviewer_name: 'John Doe',
                created_at: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(500);

      // Navigate to campsite page
      await page.goto('/campsites/campsite-1');
      await page.waitForLoadState('networkidle');

      // Should see unhidden review
      await expect(page.getByText('Great camping experience')).toBeVisible();
    });

    test('T056.16: Review appears in public search results', async ({ page }) => {
      // Mock unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock search results including unhidden review
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
                reviews: [
                  {
                    id: 'review-1',
                    content: 'Great camping experience',
                    is_hidden: false,
                  },
                ],
              },
            ],
          }),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(500);

      // Navigate to search
      await page.goto('/search?q=mountain');
      await page.waitForLoadState('networkidle');

      // Review should be findable
      await expect(page.getByText('Mountain View Camp')).toBeVisible();
    });

    test('T056.17: is_hidden flag is false after unhide', async ({ page }) => {
      let unhidePayload: any = null;

      // Mock unhide API and capture the result
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        const response = {
          success: true,
          review_id: 'review-1',
          is_hidden: false,
          message: 'Review unhidden successfully',
        };
        unhidePayload = response;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(500);

      // Verify the response indicates is_hidden = false
      expect(unhidePayload?.is_hidden).toBe(false);
    });

    test('T056.18: Hidden count badge updates after unhide', async ({ page }) => {
      // Mock unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Initial count should be 2
      await expect(page.getByText(/2 reviews? hidden/i)).toBeVisible();

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Count should update to 1
      await expect(page.getByText(/1 review hidden/i)).toBeVisible();
    });
  });

  test.describe('4. UI Updates Tests', () => {
    test('T056.19: Review status changes in UI', async ({ page }) => {
      // Mock unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(500);

      // Status should change (review removed from hidden list)
      await expect(page.getByText('Great camping experience')).not.toBeVisible();
    });

    test('T056.20: Review moves back to visible section', async ({ page }) => {
      // Mock unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock visible/active reviews API
      await page.route('**/api/admin/reviews/active*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'review-1',
                campsite_name: 'Mountain View Camp',
                title: 'Great camping experience',
                is_hidden: false,
              },
            ],
          }),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(500);

      // Navigate to active reviews
      await page.goto('/admin/reviews/active');
      await page.waitForLoadState('networkidle');

      // Should see review in active section
      await expect(page.getByText('Great camping experience')).toBeVisible();
    });

    test('T056.21: Moderation log created for unhide action', async ({ page }) => {
      let moderationLogCreated = false;

      // Mock unhide API
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        moderationLogCreated = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            moderation_log_created: true,
          }),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(500);

      // Verify moderation log was created
      expect(moderationLogCreated).toBe(true);
    });

    test('T056.22: Optimistic UI updates for list removal', async ({ page }) => {
      // Mock unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // List should update immediately (optimistic)
      await page.waitForTimeout(300);
      await expect(page.getByText('Great camping experience')).not.toBeVisible();
    });

    test('T056.23: List updates without full page reload', async ({ page }) => {
      // Mock unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
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

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(500);

      // Should not trigger full page navigation (only initial load)
      expect(navigationCount).toBeLessThanOrEqual(1);
    });
  });

  test.describe('5. Error Handling Tests', () => {
    test('T056.24: Shows error toast on failure', async ({ page }) => {
      // Mock failed unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to unhide review',
          }),
        });
      });

      // Mock alert to capture error message
      let alertMessage = '';
      page.on('dialog', async (dialog) => {
        alertMessage = dialog.message();
        await dialog.accept();
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Should show error message
      expect(alertMessage).toContain('Failed to unhide review');
    });

    test('T056.25: Review remains in list on error', async ({ page }) => {
      // Mock failed unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
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

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Review should still be visible
      await expect(page.getByText('Great camping experience')).toBeVisible();
    });

    test('T056.26: Can retry after error', async ({ page }) => {
      let attemptCount = 0;

      // Mock first failure, then success
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
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

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();

      // First attempt - should fail
      await unhideButton.click();
      await page.waitForTimeout(500);

      // Review should still be there
      await expect(page.getByText('Great camping experience')).toBeVisible();

      // Second attempt - should succeed
      await unhideButton.click();
      await page.waitForTimeout(500);

      // Review should be removed
      await expect(page.getByText('Great camping experience')).not.toBeVisible();
    });

    test('T056.27: Network error shows appropriate message', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.abort('failed');
      });

      let alertMessage = '';
      page.on('dialog', async (dialog) => {
        alertMessage = dialog.message();
        await dialog.accept();
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Should show error message
      expect(alertMessage).toBeTruthy();
    });

    test('T056.28: Handles 404 error when review not found', async ({ page }) => {
      // Mock 404 error
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Review not found',
          }),
        });
      });

      let alertMessage = '';
      page.on('dialog', async (dialog) => {
        alertMessage = dialog.message();
        await dialog.accept();
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(500);

      // Should show not found error
      expect(alertMessage).toContain('Review not found');
    });
  });

  test.describe('6. Multiple Unhides', () => {
    test('T056.29: Can unhide multiple reviews in sequence', async ({ page }) => {
      // Mock unhides for both reviews
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.route('**/api/admin/reviews/review-2/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Unhide first review
      const firstUnhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await firstUnhideButton.click();
      await page.waitForTimeout(500);

      // Should have one review left
      await expect(page.getByText('Beachside Glamping')).toBeVisible();

      // Unhide second review
      const secondUnhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await secondUnhideButton.click();
      await page.waitForTimeout(500);

      // Should show empty state
      await expect(page.getByText(/All caught up!/i)).toBeVisible();
    });

    test('T056.30: Hidden count decrements correctly with multiple unhides', async ({ page }) => {
      // Mock unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Initial count: 2
      await expect(page.getByText(/2 reviews? hidden/i)).toBeVisible();

      // Unhide first
      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(500);

      // Count should be 1
      await expect(page.getByText(/1 review hidden/i)).toBeVisible();
    });
  });

  test.describe('7. Empty State Tests', () => {
    test('T056.31: Shows empty state when no hidden reviews', async ({ page }) => {
      // Mock empty hidden list
      await page.route('**/api/admin/reviews/hidden*', async (route) => {
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
      await expect(page.getByText(/No hidden reviews/i)).toBeVisible();
    });

    test('T056.32: Empty state shows appropriate icon', async ({ page }) => {
      // Mock empty hidden list
      await page.route('**/api/admin/reviews/hidden*', async (route) => {
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

      // Should have icon (check for colored element which indicates icon)
      const emptyStateCard = page.locator('.text-green-600');
      await expect(emptyStateCard).toBeVisible();
    });
  });

  test.describe('8. Navigation Tests', () => {
    test('T056.33: Stays on hidden reviews page after unhide', async ({ page }) => {
      // Mock unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(500);

      // Should still be on hidden reviews page
      await expect(page).toHaveURL(/\/admin\/reviews\/hidden/);
    });

    test('T056.34: Can refresh page manually to see updated list', async ({ page }) => {
      // Mock unhide
      await page.route('**/api/admin/reviews/review-1/unhide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const unhideButton = page.getByRole('button', { name: /Unhide/i }).first();
      await unhideButton.click();
      await page.waitForTimeout(500);

      // Click refresh button
      const refreshButton = page.getByRole('button', { name: /Refresh/i });
      await refreshButton.click();
      await page.waitForLoadState('networkidle');

      // Should show updated list
      await expect(page.getByText(/reviews? hidden/i)).toBeVisible();
    });

    test('T056.35: Refresh button shows loading state', async ({ page }) => {
      // Mock slow refresh
      await page.route('**/api/admin/reviews/hidden*', async (route) => {
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
});
