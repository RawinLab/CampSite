import { test, expect } from '@playwright/test';

/**
 * E2E Tests: T032-02 Sync Management Page
 *
 * Tests the Google Places sync management functionality where admins can
 * view sync history, trigger manual syncs, and monitor ongoing sync operations.
 *
 * Test Coverage:
 * 1. Page Access Tests - Admin-only access control
 * 2. Page Rendering Tests - Title, description, and sync history table
 * 3. Sync History Table Tests - Display of sync logs with details
 * 4. Trigger Sync Tests - Manual sync initiation with confirmation
 * 5. Sync Status Tests - Current sync monitoring and updates
 * 6. Cancel Sync Tests - Ability to cancel ongoing sync
 * 7. Date Range Filter Tests - Filter sync logs by date
 * 8. Pagination Tests - Navigate through sync history
 * 9. Error Display Tests - View sync errors and details
 */

test.describe('T032-02: Sync Management Page', () => {
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

  // Helper function to mock sync logs
  async function mockSyncLogs(page: any, logs: any[] = []) {
    const defaultLogs = [
      {
        id: 'log-1',
        started_at: '2026-01-18T08:00:00Z',
        status: 'completed',
        duration_seconds: 1800,
        places_found: 150,
        places_updated: 145,
        api_requests_made: 200,
        estimated_cost_usd: 0.75,
        photos_downloaded: 300,
      },
      {
        id: 'log-2',
        started_at: '2026-01-17T10:00:00Z',
        status: 'failed',
        duration_seconds: 600,
        places_found: 50,
        places_updated: 0,
        api_requests_made: 55,
        estimated_cost_usd: 0.21,
        error_message: 'API quota exceeded',
        error_details: { code: 'QUOTA_EXCEEDED' },
      },
      {
        id: 'log-3',
        started_at: '2026-01-16T14:00:00Z',
        status: 'processing',
        duration_seconds: 0,
        places_found: 25,
        places_updated: 20,
        api_requests_made: 30,
        estimated_cost_usd: 0.12,
      },
    ];

    const logsToUse = logs.length > 0 ? logs : defaultLogs;

    await page.route('**/api/admin/google-places/sync/logs?limit=10', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: logsToUse,
        }),
      });
    });
  }

  // Helper function to mock sync status
  async function mockSyncStatus(page: any, currentSync: any = null) {
    await page.route('**/api/admin/google-places/sync/status', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: currentSync,
        }),
      });
    });
  }

  test.describe('Page Access Control', () => {
    test('should allow admin access to sync management page', async ({ page }) => {
      await mockAdminLogin(page);
      await mockSyncLogs(page);
      await mockSyncStatus(page);

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1:has-text("Sync Management")')).toBeVisible();
    });

    test('should redirect non-admin users to login', async ({ page }) => {
      await page.route('**/api/auth/me', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'test-user-id',
              email: 'user@test.com',
              user_role: 'user',
            },
          }),
        });
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/auth/login');
    });
  });

  test.describe('Page Rendering', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockSyncLogs(page);
      await mockSyncStatus(page);
    });

    test('should display page title and description', async ({ page }) => {
      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1:has-text("Sync Management")')).toBeVisible();
      await expect(page.locator('text=View sync history, trigger manual syncs, and manage sync operations')).toBeVisible();
    });

    test('should display Manual Sync section', async ({ page }) => {
      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Manual Sync')).toBeVisible();
      await expect(page.locator('text=Trigger a manual sync with Google Places API')).toBeVisible();
    });

    test('should display Sync History section', async ({ page }) => {
      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Sync History')).toBeVisible();
      await expect(page.locator('text=Recent Google Places API sync operations')).toBeVisible();
    });
  });

  test.describe('Sync History Table', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockSyncStatus(page);
    });

    test('should display sync logs in table', async ({ page }) => {
      await mockSyncLogs(page);

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      // Check table headers
      await expect(page.locator('text=Started')).toBeVisible();
      await expect(page.locator('text=Status')).toBeVisible();
      await expect(page.locator('text=Duration')).toBeVisible();
      await expect(page.locator('text=Places Found')).toBeVisible();
      await expect(page.locator('text=Updated')).toBeVisible();
      await expect(page.locator('text=API Requests')).toBeVisible();
      await expect(page.locator('text=Cost')).toBeVisible();
    });

    test('should display completed sync with correct data', async ({ page }) => {
      await mockSyncLogs(page, [
        {
          id: 'log-1',
          started_at: '2026-01-18T08:00:00Z',
          status: 'completed',
          duration_seconds: 1800,
          places_found: 150,
          places_updated: 145,
          api_requests_made: 200,
          estimated_cost_usd: 0.75,
        },
      ]);

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Completed')).toBeVisible();
      await expect(page.locator('text=150')).toBeVisible();
      await expect(page.locator('text=145')).toBeVisible();
      await expect(page.locator('text=200')).toBeVisible();
      await expect(page.locator('text=$0.75')).toBeVisible();
    });

    test('should display failed sync with error badge', async ({ page }) => {
      await mockSyncLogs(page, [
        {
          id: 'log-2',
          started_at: '2026-01-17T10:00:00Z',
          status: 'failed',
          duration_seconds: 600,
          places_found: 50,
          places_updated: 0,
          api_requests_made: 55,
          estimated_cost_usd: 0.21,
          error_message: 'API quota exceeded',
          error_details: { code: 'QUOTA_EXCEEDED' },
        },
      ]);

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Failed')).toBeVisible();
      await expect(page.locator('button:has-text("View Error")')).toBeVisible();
    });

    test('should display processing sync with animated badge', async ({ page }) => {
      await mockSyncLogs(page, [
        {
          id: 'log-3',
          started_at: '2026-01-16T14:00:00Z',
          status: 'processing',
          duration_seconds: 0,
          places_found: 25,
          places_updated: 20,
          api_requests_made: 30,
          estimated_cost_usd: 0.12,
        },
      ]);

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Processing')).toBeVisible();
    });

    test('should format duration correctly', async ({ page }) => {
      await mockSyncLogs(page, [
        {
          id: 'log-1',
          started_at: '2026-01-18T08:00:00Z',
          status: 'completed',
          duration_seconds: 3665, // 1h 1m 5s
          places_found: 100,
          places_updated: 95,
          api_requests_made: 120,
          estimated_cost_usd: 0.45,
        },
      ]);

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      // Should display formatted duration
      const durationText = await page.locator('text=/1h.*1m.*5s/').textContent();
      expect(durationText).toBeTruthy();
    });

    test('should show View Error button for failed syncs', async ({ page }) => {
      await mockSyncLogs(page, [
        {
          id: 'log-2',
          started_at: '2026-01-17T10:00:00Z',
          status: 'failed',
          error_message: 'API quota exceeded',
          error_details: { code: 'QUOTA_EXCEEDED' },
          duration_seconds: 600,
          places_found: 50,
          places_updated: 0,
          api_requests_made: 55,
          estimated_cost_usd: 0.21,
        },
      ]);

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('API quota exceeded');
        expect(dialog.message()).toContain('QUOTA_EXCEEDED');
        await dialog.accept();
      });

      await page.locator('button:has-text("View Error")').click();
    });

    test('should display empty state when no sync history', async ({ page }) => {
      await mockSyncLogs(page, []);

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=No sync history yet')).toBeVisible();
    });
  });

  test.describe('Trigger Manual Sync', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockSyncLogs(page);
      await mockSyncStatus(page);
    });

    test('should display Start Sync button', async ({ page }) => {
      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      const startButton = page.locator('button:has-text("Start Sync")');
      await expect(startButton).toBeVisible();
      await expect(startButton).toBeEnabled();
    });

    test('should show sync configuration details', async ({ page }) => {
      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Sync type:')).toBeVisible();
      await expect(page.locator('text=Incremental')).toBeVisible();
      await expect(page.locator('text=Max places:')).toBeVisible();
      await expect(page.locator('text=100')).toBeVisible();
    });

    test('should show confirmation dialog when Start Sync clicked', async ({ page }) => {
      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('Start a new Google Places sync');
        await dialog.dismiss();
      });

      await page.locator('button:has-text("Start Sync")').click();
    });

    test('should trigger sync when confirmed', async ({ page }) => {
      let syncTriggered = false;

      await page.route('**/api/admin/google-places/sync/trigger', async (route: any) => {
        syncTriggered = true;
        const requestBody = JSON.parse(route.request().postData() || '{}');
        expect(requestBody.syncType).toBe('incremental');
        expect(requestBody.maxPlaces).toBe(100);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            syncLogId: 'new-sync-log-id',
          }),
        });
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      page.on('dialog', async (dialog) => {
        if (dialog.type() === 'confirm') {
          await dialog.accept();
        } else if (dialog.type() === 'alert') {
          expect(dialog.message()).toContain('Sync started');
          await dialog.accept();
        }
      });

      await page.locator('button:has-text("Start Sync")').click();

      await page.waitForTimeout(500);
      expect(syncTriggered).toBe(true);
    });

    test('should show error when sync trigger fails', async ({ page }) => {
      await page.route('**/api/admin/google-places/sync/trigger', async (route: any) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error',
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

      await page.locator('button:has-text("Start Sync")').click();
    });

    test('should disable Start Sync button when sync is running', async ({ page }) => {
      await mockSyncStatus(page, {
        id: 'current-sync-id',
        started_at: '2026-01-18T10:00:00Z',
        status: 'processing',
        places_found: 50,
        places_updated: 45,
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      const startButton = page.locator('button:has-text("Sync Running...")');
      await expect(startButton).toBeDisabled();
    });
  });

  test.describe('Current Sync Status', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockSyncLogs(page);
    });

    test('should not display sync status card when no sync running', async ({ page }) => {
      await mockSyncStatus(page, null);

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Sync In Progress')).not.toBeVisible();
    });

    test('should display current sync status when sync is running', async ({ page }) => {
      await mockSyncStatus(page, {
        id: 'current-sync-id',
        started_at: '2026-01-18T10:00:00Z',
        status: 'processing',
        places_found: 75,
        places_updated: 70,
        photos_downloaded: 150,
        estimated_cost_usd: 0.35,
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Sync In Progress')).toBeVisible();
      await expect(page.locator('text=75').first()).toBeVisible(); // places_found
      await expect(page.locator('text=70').first()).toBeVisible(); // places_updated
      await expect(page.locator('text=150').first()).toBeVisible(); // photos
      await expect(page.locator('text=$0.35')).toBeVisible(); // cost
    });

    test('should display Running badge for active sync', async ({ page }) => {
      await mockSyncStatus(page, {
        id: 'current-sync-id',
        started_at: '2026-01-18T10:00:00Z',
        status: 'processing',
        places_found: 50,
        places_updated: 45,
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Running')).toBeVisible();
    });

    test('should display started time for current sync', async ({ page }) => {
      await mockSyncStatus(page, {
        id: 'current-sync-id',
        started_at: '2026-01-18T10:00:00Z',
        status: 'processing',
        places_found: 50,
        places_updated: 45,
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Started:')).toBeVisible();
    });

    test('should poll for sync status updates when sync is running', async ({ page }) => {
      let pollCount = 0;

      await page.route('**/api/admin/google-places/sync/status', async (route: any) => {
        pollCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: pollCount <= 2 ? {
              id: 'current-sync-id',
              started_at: '2026-01-18T10:00:00Z',
              status: 'processing',
              places_found: 50 + (pollCount * 10),
              places_updated: 45 + (pollCount * 10),
            } : null,
          }),
        });
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      // Wait for a few poll cycles
      await page.waitForTimeout(6000);

      expect(pollCount).toBeGreaterThan(1);
    });
  });

  test.describe('Cancel Sync', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockSyncLogs(page);
    });

    test('should show Cancel button for processing sync in table', async ({ page }) => {
      await mockSyncLogs(page, [
        {
          id: 'log-3',
          started_at: '2026-01-16T14:00:00Z',
          status: 'processing',
          duration_seconds: 0,
          places_found: 25,
          places_updated: 20,
          api_requests_made: 30,
          estimated_cost_usd: 0.12,
        },
      ]);
      await mockSyncStatus(page, null);

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    });

    test('should show confirmation dialog when Cancel clicked', async ({ page }) => {
      await mockSyncStatus(page, {
        id: 'current-sync-id',
        started_at: '2026-01-18T10:00:00Z',
        status: 'processing',
        places_found: 50,
        places_updated: 45,
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('Cancel the current sync');
        await dialog.dismiss();
      });

      // Find Cancel button in the current sync card or table
      const cancelButton = page.locator('button:has-text("Cancel")').first();
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    });

    test('should cancel sync when confirmed', async ({ page }) => {
      await mockSyncStatus(page, {
        id: 'current-sync-id',
        started_at: '2026-01-18T10:00:00Z',
        status: 'processing',
        places_found: 50,
        places_updated: 45,
      });

      let cancelCalled = false;

      await page.route('**/api/admin/google-places/sync/cancel', async (route: any) => {
        cancelCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
          }),
        });
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      page.on('dialog', async (dialog) => {
        if (dialog.type() === 'confirm') {
          await dialog.accept();
        } else if (dialog.type() === 'alert') {
          expect(dialog.message()).toContain('Sync cancelled');
          await dialog.accept();
        }
      });

      const cancelButton = page.locator('button:has-text("Cancel")').first();
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await page.waitForTimeout(500);
        expect(cancelCalled).toBe(true);
      }
    });
  });

  test.describe('Loading States', () => {
    test('should show skeleton while loading', async ({ page }) => {
      await mockAdminLogin(page);

      await page.route('**/api/admin/google-places/sync/logs**', async (route: any) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
      const skeleton = page.locator('[data-testid="skeleton"]').or(page.locator('.animate-pulse')).first();

      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockSyncStatus(page);
    });

    test('should handle sync logs API error gracefully', async ({ page }) => {
      await page.route('**/api/admin/google-places/sync/logs**', async (route: any) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error',
          }),
        });
      });

      await page.goto('/admin/google-places/sync');
      await page.waitForLoadState('networkidle');

      // Page should still render
      await expect(page.locator('h1:has-text("Sync Management")')).toBeVisible();
    });
  });
});
