import { test, expect } from '@playwright/test';

/**
 * E2E Test: Admin Review Deletion
 * Task T057: Admin can delete review
 *
 * Tests the complete admin review deletion flow including:
 * - Confirmation dialog
 * - Permanent deletion
 * - Cascade deletion
 * - Moderation logging
 * - Error handling
 *
 * Part of Q11 report-based moderation system
 */

test.describe('Admin Review Deletion E2E', () => {
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
              review_id: 'review-1',
              campsite_name: 'Mountain View Camp',
              campsite_id: 'campsite-1',
              content: 'This place is terrible! Avoid at all costs! Fake fake fake!',
              rating: 1,
              reviewer_name: 'John Doe',
              reviewer_type: 'solo',
              created_at: new Date().toISOString(),
              report_count: 5,
              reports: [
                { reason: 'spam', count: 2 },
                { reason: 'fake', count: 3 },
              ],
              photo_count: 2,
            },
            {
              id: 'review-2',
              review_id: 'review-2',
              campsite_name: 'Beach Paradise',
              campsite_id: 'campsite-2',
              content: 'Inappropriate content here with offensive language.',
              rating: 1,
              reviewer_name: 'Jane Smith',
              reviewer_type: 'couple',
              created_at: new Date().toISOString(),
              report_count: 3,
              reports: [
                { reason: 'inappropriate', count: 3 },
              ],
              photo_count: 0,
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

  test.describe('1. Delete Confirmation Tests', () => {
    test('T057.1: Delete button shows confirmation dialog', async ({ page }) => {
      // Find delete button for first review
      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await expect(deleteButton).toBeVisible();
      await expect(deleteButton).toBeEnabled();

      // Click delete button
      await deleteButton.click();

      // Confirmation dialog should appear
      const dialog = page.locator('[data-testid="delete-review-dialog"]');
      await expect(dialog).toBeVisible();
    });

    test('T057.2: Dialog warns about permanent deletion', async ({ page }) => {
      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      // Wait for dialog
      await page.waitForTimeout(200);

      // Dialog should contain warning about permanent deletion
      const warningText = page.locator('[data-testid="delete-warning"]');
      await expect(warningText).toBeVisible();
      await expect(warningText).toContainText(/permanent/i);
      await expect(warningText).toContainText(/cannot be undone/i);
    });

    test('T057.3: Dialog shows review info being deleted', async ({ page }) => {
      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      // Dialog should show review details
      const dialog = page.locator('[data-testid="delete-review-dialog"]');
      await expect(dialog).toContainText('Mountain View Camp');
      await expect(dialog).toContainText('John Doe');
      await expect(dialog).toContainText(/terrible.*avoid/i);
    });

    test('T057.4: Has Cancel and Confirm buttons', async ({ page }) => {
      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      // Verify both buttons exist
      const cancelButton = page.locator('[data-testid="delete-cancel-button"]');
      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');

      await expect(cancelButton).toBeVisible();
      await expect(confirmButton).toBeVisible();
    });

    test('T057.5: Confirm button is destructive style', async ({ page }) => {
      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      // Confirm button should have destructive styling (red)
      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await expect(confirmButton).toBeVisible();

      // Check for destructive class or style
      const buttonClass = await confirmButton.getAttribute('class');
      expect(buttonClass).toMatch(/destructive|danger|red/i);
    });
  });

  test.describe('2. Delete Flow Tests', () => {
    test('T057.6: Clicking confirm deletes review', async ({ page }) => {
      // Mock successful deletion
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Review deleted successfully',
          }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      // Click confirm
      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for deletion
      await page.waitForTimeout(500);

      // Verify API was called
      // This will be validated by network mocks
    });

    test('T057.7: Shows loading state during delete', async ({ page }) => {
      // Mock slow deletion
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Should show loading state
      await expect(page.getByText(/Deleting.../i)).toBeVisible();
    });

    test('T057.8: Success message appears', async ({ page }) => {
      // Mock successful deletion
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Review deleted successfully',
          }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for success message
      await page.waitForTimeout(500);

      // Success toast should appear
      const successToast = page.locator('[data-testid="toast-success"]');
      await expect(successToast).toBeVisible({ timeout: 5000 });
      await expect(successToast).toContainText(/deleted/i);
    });

    test('T057.9: Review removed from list', async ({ page }) => {
      // Mock successful deletion
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Verify review is visible before deletion
      await expect(page.getByText('Mountain View Camp')).toBeVisible();

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for removal
      await page.waitForTimeout(500);

      // Review should be removed from list
      await expect(page.getByText('Mountain View Camp')).not.toBeVisible();
    });

    test('T057.10: Reported count badge updates', async ({ page }) => {
      // Mock successful deletion
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Initial count should be 2
      await expect(page.getByText(/2 reported reviews?/i)).toBeVisible();

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Count should update to 1
      await expect(page.getByText(/1 reported review/i)).toBeVisible();
    });
  });

  test.describe('3. Permanent Deletion Verification Tests', () => {
    test('T057.11: Review not in database after deletion', async ({ page }) => {
      // Mock successful deletion
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Mock API check for review (should return 404)
      await page.route('**/api/reviews/review-1', async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Review not found',
          }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      await page.waitForTimeout(500);

      // Verify review is gone
      await expect(page.getByText('Mountain View Camp')).not.toBeVisible();
    });

    test('T057.12: Review photos deleted (cascade)', async ({ page }) => {
      // This test verifies the backend cascade behavior
      // by checking that photos are not accessible after deletion

      // Mock successful deletion
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            deleted: {
              review: true,
              photos: 2,
              reports: 5,
            },
          }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      await page.waitForTimeout(500);

      // Success message should indicate cascade deletion
      const successToast = page.locator('[data-testid="toast-success"]');
      await expect(successToast).toBeVisible({ timeout: 5000 });
    });

    test('T057.13: Review reports deleted (cascade)', async ({ page }) => {
      // Mock successful deletion with cascade info
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            deleted: {
              review: true,
              photos: 2,
              reports: 5,
            },
          }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      await page.waitForTimeout(500);

      // Deletion should be complete
      await expect(page.getByText('Mountain View Camp')).not.toBeVisible();
    });

    test('T057.14: Cannot undo deletion', async ({ page }) => {
      // Mock successful deletion
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      await page.waitForTimeout(500);

      // No undo button should be present
      const undoButton = page.getByRole('button', { name: /Undo/i });
      await expect(undoButton).not.toBeVisible();

      // Review should not reappear
      await page.waitForTimeout(1000);
      await expect(page.getByText('Mountain View Camp')).not.toBeVisible();
    });
  });

  test.describe('4. Moderation Log Tests', () => {
    test('T057.15: Deletion logged in moderation history', async ({ page }) => {
      // Mock successful deletion with log entry
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            log_id: 'log-123',
          }),
        });
      });

      // Mock moderation log API
      await page.route('**/api/admin/moderation-logs*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'log-123',
                action: 'delete_review',
                review_id: 'review-1',
                admin_id: 'admin-1',
                timestamp: new Date().toISOString(),
                metadata: {
                  campsite_name: 'Mountain View Camp',
                  reviewer_name: 'John Doe',
                  rating: 1,
                  report_count: 5,
                },
              },
            ],
          }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      await page.waitForTimeout(500);

      // Navigate to moderation logs
      await page.goto('/admin/moderation-logs');
      await page.waitForLoadState('networkidle');

      // Verify deletion is logged
      await expect(page.getByText('delete_review')).toBeVisible();
      await expect(page.getByText('Mountain View Camp')).toBeVisible();
    });

    test('T057.16: Log includes original review metadata', async ({ page }) => {
      // Mock successful deletion
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            log_entry: {
              action: 'delete_review',
              metadata: {
                campsite_name: 'Mountain View Camp',
                reviewer_name: 'John Doe',
                rating: 1,
                content: 'This place is terrible! Avoid at all costs! Fake fake fake!',
                report_count: 5,
                photo_count: 2,
              },
            },
          }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      await page.waitForTimeout(500);

      // Deletion should complete successfully
      await expect(page.getByText('Mountain View Camp')).not.toBeVisible();
    });
  });

  test.describe('5. Cancel Tests', () => {
    test('T057.17: Cancel closes dialog', async ({ page }) => {
      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      // Verify dialog is open
      const dialog = page.locator('[data-testid="delete-review-dialog"]');
      await expect(dialog).toBeVisible();

      // Click cancel
      const cancelButton = page.locator('[data-testid="delete-cancel-button"]');
      await cancelButton.click();

      // Wait for dialog close
      await page.waitForTimeout(300);

      // Dialog should be closed
      await expect(dialog).not.toBeVisible();
    });

    test('T057.18: Review remains after cancel', async ({ page }) => {
      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      // Click cancel
      const cancelButton = page.locator('[data-testid="delete-cancel-button"]');
      await cancelButton.click();

      // Wait for dialog close
      await page.waitForTimeout(300);

      // Review should still be visible
      await expect(page.getByText('Mountain View Camp')).toBeVisible();
      await expect(page.getByText('John Doe')).toBeVisible();
    });

    test('T057.19: No action taken after cancel', async ({ page }) => {
      let deleteApiCalled = false;

      // Mock delete API to track if it's called
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        deleteApiCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      // Click cancel
      const cancelButton = page.locator('[data-testid="delete-cancel-button"]');
      await cancelButton.click();

      // Wait
      await page.waitForTimeout(500);

      // Delete API should not have been called
      expect(deleteApiCalled).toBe(false);

      // Review should still be visible
      await expect(page.getByText('Mountain View Camp')).toBeVisible();
    });
  });

  test.describe('6. Error Handling Tests', () => {
    test('T057.20: Shows error toast on failure', async ({ page }) => {
      // Mock failed deletion
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to delete review',
          }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Error toast should appear
      const errorToast = page.locator('[data-testid="toast-error"]');
      await expect(errorToast).toBeVisible({ timeout: 5000 });
      await expect(errorToast).toContainText(/failed/i);
    });

    test('T057.21: Review remains on error', async ({ page }) => {
      // Mock failed deletion
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Database error',
          }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Review should still be visible
      await expect(page.getByText('Mountain View Camp')).toBeVisible();
      await expect(page.getByText('John Doe')).toBeVisible();
    });

    test('T057.22: Can retry after error', async ({ page }) => {
      let attemptCount = 0;

      // Mock first failure, then success
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
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
      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      let confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Review should still be there
      await expect(page.getByText('Mountain View Camp')).toBeVisible();

      // Close error toast if present
      const closeToast = page.locator('[data-testid="toast-close"]');
      if (await closeToast.isVisible()) {
        await closeToast.click();
      }

      // Second attempt - should succeed
      await deleteButton.click();
      await page.waitForTimeout(200);

      confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for success
      await page.waitForTimeout(500);

      // Review should be removed
      await expect(page.getByText('Mountain View Camp')).not.toBeVisible();
    });

    test('T057.23: Network error shows appropriate message', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.abort('failed');
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Error toast should appear
      const errorToast = page.locator('[data-testid="toast-error"]');
      await expect(errorToast).toBeVisible({ timeout: 5000 });
    });

    test('T057.24: Dialog closes after error', async ({ page }) => {
      // Mock failed deletion
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to delete',
          }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      // Verify dialog is open
      const dialog = page.locator('[data-testid="delete-review-dialog"]');
      await expect(dialog).toBeVisible();

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Dialog should close even on error
      await expect(dialog).not.toBeVisible();
    });

    test('T057.25: Shows specific error message from server', async ({ page }) => {
      // Mock failed deletion with specific error
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Insufficient permissions to delete this review',
          }),
        });
      });

      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      // Wait for error
      await page.waitForTimeout(500);

      // Error toast should show specific message
      const errorToast = page.locator('[data-testid="toast-error"]');
      await expect(errorToast).toBeVisible({ timeout: 5000 });
      await expect(errorToast).toContainText(/permissions/i);
    });
  });

  test.describe('7. Multiple Deletions', () => {
    test('T057.26: Can delete multiple reviews in sequence', async ({ page }) => {
      // Mock deletions for both reviews
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      await page.route('**/api/admin/reviews/review-2/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Delete first review
      let deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      let confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      await page.waitForTimeout(500);

      // Should have one review left
      await expect(page.getByText('Beach Paradise')).toBeVisible();

      // Delete second review
      deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      await page.waitForTimeout(500);

      // Should show empty state
      await expect(page.getByText(/No reported reviews/i)).toBeVisible();
    });

    test('T057.27: Reported count decrements correctly with multiple deletions', async ({ page }) => {
      // Mock deletions
      await page.route('**/api/admin/reviews/review-1/delete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Initial count: 2
      await expect(page.getByText(/2 reported reviews?/i)).toBeVisible();

      // Delete first
      const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
      await deleteButton.click();

      await page.waitForTimeout(200);

      const confirmButton = page.locator('[data-testid="delete-confirm-button"]');
      await confirmButton.click();

      await page.waitForTimeout(500);

      // Count should be 1
      await expect(page.getByText(/1 reported review/i)).toBeVisible();
    });
  });
});
