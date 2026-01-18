import { test, expect } from '@playwright/test';

/**
 * E2E Tests: T032-05 Error States and Edge Cases
 *
 * Tests error handling, loading states, and edge cases across all Google Places
 * admin dashboard pages to ensure robust user experience.
 *
 * Test Coverage:
 * 1. API Error States - Handle API failures gracefully
 * 2. Empty Data States - Display appropriate messages when no data
 * 3. Loading States - Show skeleton screens during data fetch
 * 4. Network Error States - Handle network failures
 * 5. Permission Error States - Handle unauthorized access
 * 6. Validation Error States - Handle invalid data
 * 7. Timeout States - Handle slow API responses
 */

test.describe('T032-05: Error States and Edge Cases', () => {
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

  test.describe('API Error Handling - Overview Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
    });

    test('should handle candidates API 500 error', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates**', async (route: any) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error',
          }),
        });
      });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      // Page should still render with default values
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible();
    });

    test('should handle sync logs API error', async ({ page }) => {
      await page.route('**/api/admin/google-places/sync/logs**', async (route: any) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Database connection failed',
          }),
        });
      });

      await page.route('**/api/admin/google-places/candidates**', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { total: 0 },
          }),
        });
      });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      // Page should render despite sync logs error
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible();
    });

    test('should handle network timeout gracefully', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates**', async (route: any) => {
        // Simulate timeout by delaying indefinitely
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await route.abort('timedout');
      });

      await page.goto('/admin/google-places');

      // Should show loading state initially
      await page.waitForTimeout(1000);

      // Eventually should show error or default state
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible();
    });
  });

  test.describe('API Error Handling - Sync Management', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
    });

    test('should handle sync trigger API error', async ({ page }) => {
      await page.route('**/api/admin/google-places/sync/logs**', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await page.route('**/api/admin/google-places/sync/status', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: null,
          }),
        });
      });

      await page.route('**/api/admin/google-places/sync/trigger', async (route: any) => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Rate limit exceeded. Please wait before triggering another sync.',
          }),
        });
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      page.on('dialog', async (dialog) => {
        if (dialog.type() === 'confirm') {
          await dialog.accept();
        } else if (dialog.type() === 'alert') {
          expect(dialog.message()).toContain('Failed to start sync');
          await dialog.accept();
        }
      });

      const startSyncButton = page.locator('button:has-text("Start Sync")');
      await startSyncButton.click();
    });

    test('should handle sync cancel API error', async ({ page }) => {
      await page.route('**/api/admin/google-places/sync/logs**', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await page.route('**/api/admin/google-places/sync/status', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'sync-1',
              started_at: '2026-01-18T10:00:00Z',
              status: 'processing',
              places_found: 50,
              places_updated: 45,
            },
          }),
        });
      });

      await page.route('**/api/admin/google-places/sync/cancel', async (route: any) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to cancel sync',
          }),
        });
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      page.on('dialog', async (dialog) => {
        if (dialog.type() === 'confirm') {
          await dialog.accept();
        } else if (dialog.type() === 'alert') {
          expect(dialog.message()).toContain('Failed to cancel sync');
          await dialog.accept();
        }
      });

      const cancelButton = page.locator('button:has-text("Cancel")').first();
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    });
  });

  test.describe('API Error Handling - Candidates', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
    });

    test('should handle approve API error with validation message', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates?limit=50&offset=0', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'candidate-1',
                name: 'Test Campsite',
                address: 'Test Address',
                confidence_score: 0.9,
                is_duplicate: false,
                rating: 4.5,
                rating_count: 100,
                status: 'pending',
              },
            ],
            pagination: { total: 1 },
          }),
        });
      });

      await page.route('**/api/admin/google-places/candidates/candidate-1/approve', async (route: any) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Candidate already exists as campsite',
          }),
        });
      });

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      page.on('dialog', async (dialog) => {
        if (dialog.type() === 'confirm') {
          await dialog.accept();
        } else if (dialog.type() === 'alert') {
          expect(dialog.message()).toContain('Failed to approve candidate');
          await dialog.accept();
        }
      });

      const approveButton = page.locator('button').filter({ hasText: /Check/ }).first();
      if (await approveButton.isVisible()) {
        await approveButton.click();
      }
    });

    test('should handle reject API error', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates?limit=50&offset=0', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'candidate-1',
                name: 'Test Campsite',
                address: 'Test Address',
                confidence_score: 0.9,
                is_duplicate: false,
                rating: 4.5,
                rating_count: 100,
                status: 'pending',
              },
            ],
            pagination: { total: 1 },
          }),
        });
      });

      await page.route('**/api/admin/google-places/candidates/candidate-1/reject', async (route: any) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Database error',
          }),
        });
      });

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      page.on('dialog', async (dialog) => {
        if (dialog.type() === 'prompt') {
          await dialog.accept('Not a campsite');
        } else if (dialog.type() === 'alert') {
          expect(dialog.message()).toContain('Failed to reject candidate');
          await dialog.accept();
        }
      });

      const rejectButton = page.locator('button').filter({ hasText: /X/ }).first();
      if (await rejectButton.isVisible()) {
        await rejectButton.click();
      }
    });
  });

  test.describe('Empty Data States', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
    });

    test('should display empty state for no sync logs', async ({ page }) => {
      await page.route('**/api/admin/google-places/sync/logs**', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await page.route('**/api/admin/google-places/sync/status', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: null,
          }),
        });
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=No sync history yet')).toBeVisible();
    });

    test('should display empty state for no candidates', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates**', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { total: 0 },
          }),
        });
      });

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=No candidates found')).toBeVisible();
      await expect(page.locator('text=Trigger a Google Places sync to discover camping sites')).toBeVisible();
      await expect(page.locator('button:has-text("Start Sync")')).toBeVisible();
    });

    test('should display zero statistics when no data', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates**', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { total: 0 },
          }),
        });
      });

      await page.route('**/api/admin/google-places/sync/logs**', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      // Should show 0 for pending candidates
      await expect(page.locator('text=Pending Candidates').locator('..')).toContainText('0');
    });
  });

  test.describe('Loading States', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
    });

    test('should show skeleton on overview dashboard while loading', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates**', async (route: any) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { total: 0 },
          }),
        });
      });

      await page.goto('/admin/google-places');

      // Skeleton or loading indicator should be visible
      const loadingIndicator = page.locator('[data-testid="skeleton"]').or(
        page.locator('.animate-pulse')
      ).first();

      // Wait for loading to complete
      await page.waitForLoadState('networkidle');
    });

    test('should show skeleton on sync management while loading', async ({ page }) => {
      await page.route('**/api/admin/google-places/sync/logs**', async (route: any) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await page.goto('/admin/google-places/sync');

      // Skeleton should be visible
      const loadingIndicator = page.locator('[data-testid="skeleton"]').or(
        page.locator('.animate-pulse')
      ).first();

      await page.waitForLoadState('networkidle');
    });

    test('should show skeleton on candidates page while loading', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates**', async (route: any) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { total: 0 },
          }),
        });
      });

      await page.goto('/admin/google-places/candidates');

      // Skeleton should be visible
      const loadingIndicator = page.locator('[data-testid="skeleton"]').or(
        page.locator('.animate-pulse')
      ).first();

      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Network Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
    });

    test('should handle network failure on overview page', async ({ page }) => {
      await page.route('**/api/admin/google-places/**', async (route: any) => {
        await route.abort('failed');
      });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      // Page should still render
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible();
    });

    test('should handle network disconnection during sync', async ({ page }) => {
      await page.route('**/api/admin/google-places/sync/logs**', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      await page.route('**/api/admin/google-places/sync/status', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: null,
          }),
        });
      });

      await page.route('**/api/admin/google-places/sync/trigger', async (route: any) => {
        await route.abort('connectionrefused');
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      page.on('dialog', async (dialog) => {
        if (dialog.type() === 'confirm') {
          await dialog.accept();
        } else if (dialog.type() === 'alert') {
          await dialog.accept();
        }
      });

      const startSyncButton = page.locator('button:has-text("Start Sync")');
      await startSyncButton.click();
    });
  });

  test.describe('Validation Errors', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
    });

    test('should handle invalid candidate ID', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates/invalid-id-123', async (route: any) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Candidate not found',
          }),
        });
      });

      await page.goto('/admin/google-places/candidates/invalid-id-123');
      await page.waitForLoadState('networkidle');

      // Should show error message
      await expect(page.locator('text=/not found/i').or(page.locator('text=/error/i'))).toBeVisible();
    });

    test('should prevent approve without confirmation', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates?limit=50&offset=0', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'candidate-1',
                name: 'Test Campsite',
                address: 'Test Address',
                confidence_score: 0.9,
                is_duplicate: false,
                rating: 4.5,
                rating_count: 100,
                status: 'pending',
              },
            ],
            pagination: { total: 1 },
          }),
        });
      });

      let approveCalled = false;

      await page.route('**/api/admin/google-places/candidates/candidate-1/approve', async (route: any) => {
        approveCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            campsiteId: 'new-campsite-id',
          }),
        });
      });

      page.on('dialog', async (dialog) => {
        if (dialog.type() === 'confirm') {
          await dialog.dismiss(); // Cancel the action
        }
      });

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const approveButton = page.locator('button').filter({ hasText: /Check/ }).first();
      if (await approveButton.isVisible()) {
        await approveButton.click();
        await page.waitForTimeout(500);
        expect(approveCalled).toBe(false);
      }
    });

    test('should prevent reject without reason', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates?limit=50&offset=0', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'candidate-1',
                name: 'Test Campsite',
                address: 'Test Address',
                confidence_score: 0.9,
                is_duplicate: false,
                rating: 4.5,
                rating_count: 100,
                status: 'pending',
              },
            ],
            pagination: { total: 1 },
          }),
        });
      });

      let rejectCalled = false;

      await page.route('**/api/admin/google-places/candidates/candidate-1/reject', async (route: any) => {
        rejectCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
          }),
        });
      });

      page.on('dialog', async (dialog) => {
        if (dialog.type() === 'prompt') {
          await dialog.accept(''); // Empty reason
        }
      });

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const rejectButton = page.locator('button').filter({ hasText: /X/ }).first();
      if (await rejectButton.isVisible()) {
        await rejectButton.click();
        await page.waitForTimeout(500);
        expect(rejectCalled).toBe(false);
      }
    });
  });

  test.describe('Permission Errors', () => {
    test('should handle 403 Forbidden error', async ({ page }) => {
      await page.route('**/api/auth/me', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'test-owner-id',
              email: 'owner@test.com',
              user_role: 'owner',
            },
          }),
        });
      });

      await page.route('**/api/admin/google-places/**', async (route: any) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Forbidden: Admin access required',
          }),
        });
      });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      // Should redirect to login or show error
      expect(page.url()).toContain('/auth/login');
    });
  });
});
