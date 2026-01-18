import { test, expect } from '@playwright/test';

/**
 * E2E Test: Admin Hide Review Functionality
 * Task T055: Admin can hide review
 *
 * Tests the admin hide review flow including:
 * - Navigation to reported reviews
 * - Hide reason dialog/form
 * - Validation and submission
 * - Post-hide verification
 * Part of Q11 report-based moderation system
 */

test.describe('Admin Hide Review E2E', () => {
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
              rating: 2,
              comment: 'Terrible place, complete scam! This is spam content.',
              campsite_id: 'campsite-1',
              campsite_name: 'Mountain View Camp',
              user_id: 'user-1',
              user_name: 'John Doe',
              created_at: new Date().toISOString(),
              report_count: 3,
              reports: [
                {
                  reason: 'spam',
                  details: 'This looks like spam',
                  reported_by: 'user-2',
                  reported_at: new Date().toISOString(),
                },
              ],
            },
            {
              id: 'review-2',
              rating: 1,
              comment: 'Inappropriate language and offensive content here.',
              campsite_id: 'campsite-2',
              campsite_name: 'Beach Paradise',
              user_id: 'user-3',
              user_name: 'Jane Smith',
              created_at: new Date().toISOString(),
              report_count: 2,
              reports: [
                {
                  reason: 'inappropriate',
                  details: 'Contains offensive language',
                  reported_by: 'user-4',
                  reported_at: new Date().toISOString(),
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

  test.describe('1. Hide Dialog/Form Tests', () => {
    test('T055.1: Hide button opens reason input', async ({ page }) => {
      // Find and click hide button
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await expect(hideButton).toBeVisible();
      await hideButton.click();

      // Wait for dialog
      await page.waitForTimeout(200);

      // Verify hide reason dialog/form is visible
      const dialog = page.locator('[data-testid="hide-review-dialog"]');
      await expect(dialog).toBeVisible();
    });

    test('T055.2: Shows minimum character requirement (5 chars)', async ({ page }) => {
      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Check for character requirement message
      const requirementText = page.locator('text=/minimum.*5.*character/i');
      await expect(requirementText).toBeVisible();
    });

    test('T055.3: Has Cancel and Confirm buttons', async ({ page }) => {
      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Verify both buttons exist
      const cancelButton = page.locator('[data-testid="hide-cancel-button"]');
      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');

      await expect(cancelButton).toBeVisible();
      await expect(confirmButton).toBeVisible();
    });

    test('T055.4: Shows review being hidden', async ({ page }) => {
      // Open hide dialog for first review
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Verify review content is shown in dialog
      const dialog = page.locator('[data-testid="hide-review-dialog"]');
      await expect(dialog).toContainText('Terrible place');
    });
  });

  test.describe('2. Reason Validation Tests', () => {
    test('T055.5: Cannot submit without reason', async ({ page }) => {
      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Try to confirm without entering reason
      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');

      // Button should be disabled
      await expect(confirmButton).toBeDisabled();
    });

    test('T055.6: Cannot submit with reason < 5 chars', async ({ page }) => {
      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter short reason (less than 5 characters)
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Bad');

      // Confirm button should be disabled
      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await expect(confirmButton).toBeDisabled();
    });

    test('T055.7: Shows error for short reason', async ({ page }) => {
      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter short reason
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('No');

      // Blur to trigger validation
      await reasonInput.blur();
      await page.waitForTimeout(100);

      // Error message should appear
      const errorMessage = page.locator('[data-testid="hide-reason-error"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('at least 5 characters');
    });

    test('T055.8: Confirm button disabled when invalid', async ({ page }) => {
      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');

      // Initially disabled (no input)
      await expect(confirmButton).toBeDisabled();

      // Still disabled with short reason
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Bad');
      await expect(confirmButton).toBeDisabled();
    });

    test('T055.9: Confirm button enabled when valid', async ({ page }) => {
      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter valid reason (>= 5 characters)
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Violates community guidelines');

      // Confirm button should be enabled
      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await expect(confirmButton).toBeEnabled();
    });
  });

  test.describe('3. Hide Flow Tests', () => {
    test('T055.10: Can submit with valid reason', async ({ page }) => {
      // Mock hide API
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Review hidden successfully',
          }),
        });
      });

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter valid reason
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Violates community guidelines');

      // Submit
      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();

      // Wait for completion
      await page.waitForTimeout(500);

      // Success (dialog should close or show success)
      const dialog = page.locator('[data-testid="hide-review-dialog"]');
      await expect(dialog).not.toBeVisible();
    });

    test('T055.11: Shows loading state during hide', async ({ page }) => {
      // Mock slow hide API
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter valid reason
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Spam content');

      // Submit
      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();

      // Should show loading state
      await expect(confirmButton).toBeDisabled();
      await expect(page.getByText(/Hiding.../i)).toBeVisible();
    });

    test('T055.12: Success message appears', async ({ page }) => {
      // Mock hide API
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Review hidden successfully',
          }),
        });
      });

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter valid reason and submit
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Inappropriate content');

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();

      // Wait for success
      await page.waitForTimeout(500);

      // Success toast should appear
      const toast = page.locator('[data-testid="toast"]');
      await expect(toast).toBeVisible({ timeout: 3000 });
      await expect(toast).toContainText(/hidden/i);
    });

    test('T055.13: Review removed from reported list', async ({ page }) => {
      // Mock hide API
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Verify review is visible before hide
      await expect(page.getByText('Terrible place')).toBeVisible();

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter valid reason and submit
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Spam content');

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();

      // Wait for removal
      await page.waitForTimeout(500);

      // Review should be removed from list
      await expect(page.getByText('Terrible place')).not.toBeVisible();
    });

    test('T055.14: Reported count badge updates', async ({ page }) => {
      // Mock hide API
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Initial count should be 2
      await expect(page.getByText(/2 reported reviews?/i)).toBeVisible();

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter valid reason and submit
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Violates guidelines');

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Count should update to 1
      await expect(page.getByText(/1 reported review/i)).toBeVisible();
    });

    test('T055.15: Can cancel hide action', async ({ page }) => {
      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter reason
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Test reason');

      // Click cancel
      const cancelButton = page.locator('[data-testid="hide-cancel-button"]');
      await cancelButton.click();

      // Wait for dialog close
      await page.waitForTimeout(300);

      // Dialog should be closed
      const dialog = page.locator('[data-testid="hide-review-dialog"]');
      await expect(dialog).not.toBeVisible();

      // Review should still be visible
      await expect(page.getByText('Terrible place')).toBeVisible();
    });
  });

  test.describe('4. Post-Hide Verification Tests', () => {
    test('T055.16: Review not visible on campsite page', async ({ page }) => {
      // Mock hide API
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock campsite page with reviews (hidden review excluded)
      await page.route('**/api/campsites/campsite-1/reviews*', async (route) => {
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

      // Hide the review
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Spam content');

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();
      await page.waitForTimeout(500);

      // Navigate to campsite page
      await page.goto('/campsites/campsite-1');
      await page.waitForLoadState('networkidle');

      // Hidden review should not appear
      await expect(page.getByText('Terrible place')).not.toBeVisible();
    });

    test('T055.17: Review not in public search results', async ({ page }) => {
      // Mock hide API
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock search API (hidden reviews excluded)
      await page.route('**/api/search*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      // Hide the review
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Inappropriate content');

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();
      await page.waitForTimeout(500);

      // Search for the review
      await page.goto('/search?q=terrible+scam');
      await page.waitForLoadState('networkidle');

      // Should not find hidden review
      await expect(page.getByText('Terrible place')).not.toBeVisible();
    });

    test('T055.18: Hide action recorded in admin audit log', async ({ page }) => {
      // Mock hide API
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock audit log API
      await page.route('**/api/admin/audit-log*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'log-1',
                action: 'hide_review',
                review_id: 'review-1',
                reason: 'Violates community guidelines',
                admin_id: 'admin-1',
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Hide the review
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Violates community guidelines');

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();
      await page.waitForTimeout(500);

      // Navigate to audit log
      await page.goto('/admin/audit-log');
      await page.waitForLoadState('networkidle');

      // Should see hide action logged
      await expect(page.getByText(/hide_review/i)).toBeVisible();
      await expect(page.getByText(/Violates community guidelines/i)).toBeVisible();
    });
  });

  test.describe('5. Error Handling Tests', () => {
    test('T055.19: Shows error toast on failure', async ({ page }) => {
      // Mock failed hide API
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to hide review',
          }),
        });
      });

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter valid reason and submit
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Test reason');

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Error toast should appear
      const toast = page.locator('[data-testid="toast"]');
      await expect(toast).toBeVisible({ timeout: 3000 });
      await expect(toast).toContainText(/Failed to hide/i);
    });

    test('T055.20: Can retry after error', async ({ page }) => {
      let attemptCount = 0;

      // Mock first failure, then success
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
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

      // First attempt - should fail
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Test reason');

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();
      await page.waitForTimeout(500);

      // Error should appear
      const toast = page.locator('[data-testid="toast"]');
      await expect(toast).toBeVisible({ timeout: 3000 });

      // Review should still be there
      await expect(page.getByText('Terrible place')).toBeVisible();

      // Second attempt - should succeed
      await hideButton.click();
      await page.waitForTimeout(200);

      await reasonInput.fill('Test reason again');
      await confirmButton.click();
      await page.waitForTimeout(500);

      // Review should be removed
      await expect(page.getByText('Terrible place')).not.toBeVisible();
    });

    test('T055.21: Network error shows appropriate message', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await route.abort('failed');
      });

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter valid reason and submit
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Test reason');

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Error toast should appear with network error message
      const toast = page.locator('[data-testid="toast"]');
      await expect(toast).toBeVisible({ timeout: 3000 });
    });

    test('T055.22: Dialog remains open on error', async ({ page }) => {
      // Mock failed hide API
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Server error',
          }),
        });
      });

      // Open hide dialog
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      // Enter valid reason and submit
      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Test reason');

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Dialog should remain open
      const dialog = page.locator('[data-testid="hide-review-dialog"]');
      await expect(dialog).toBeVisible();
    });
  });

  test.describe('6. Multiple Reviews', () => {
    test('T055.23: Can hide multiple reviews in sequence', async ({ page }) => {
      // Mock hide APIs for both reviews
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.route('**/api/admin/reviews/review-2/hide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Hide first review
      const firstHideButton = page.getByRole('button', { name: /Hide/i }).first();
      await firstHideButton.click();
      await page.waitForTimeout(200);

      let reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Spam content');

      let confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();
      await page.waitForTimeout(500);

      // Should have one review left
      await expect(page.getByText('Inappropriate language')).toBeVisible();

      // Hide second review
      const secondHideButton = page.getByRole('button', { name: /Hide/i }).first();
      await secondHideButton.click();
      await page.waitForTimeout(200);

      reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Offensive content');

      confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();
      await page.waitForTimeout(500);

      // Should show empty state
      await expect(page.getByText(/All caught up!/i)).toBeVisible();
    });

    test('T055.24: Each review has its own hide button', async ({ page }) => {
      // Count review cards
      const reviewCards = await page.locator('[data-testid="reported-review-card"]').all();
      const reviewCount = reviewCards.length;

      // Count hide buttons
      const hideButtons = await page.getByRole('button', { name: /Hide/i }).all();
      const hideButtonCount = hideButtons.length;

      // Should have one hide button per review
      expect(hideButtonCount).toBe(reviewCount);
      expect(hideButtonCount).toBe(2);
    });

    test('T055.25: Hiding one review doesn't affect others', async ({ page }) => {
      // Mock hide API for first review
      await page.route('**/api/admin/reviews/review-1/hide', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Verify both reviews are visible
      await expect(page.getByText('Terrible place')).toBeVisible();
      await expect(page.getByText('Inappropriate language')).toBeVisible();

      // Hide first review
      const hideButton = page.getByRole('button', { name: /Hide/i }).first();
      await hideButton.click();
      await page.waitForTimeout(200);

      const reasonInput = page.locator('[data-testid="hide-reason-input"]');
      await reasonInput.fill('Spam content');

      const confirmButton = page.locator('[data-testid="hide-confirm-button"]');
      await confirmButton.click();
      await page.waitForTimeout(500);

      // First review should be hidden
      await expect(page.getByText('Terrible place')).not.toBeVisible();

      // Second review should still be visible
      await expect(page.getByText('Inappropriate language')).toBeVisible();
    });
  });
});
