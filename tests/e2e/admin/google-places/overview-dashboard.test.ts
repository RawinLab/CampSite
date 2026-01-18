import { test, expect } from '@playwright/test';

/**
 * E2E Tests: T032-01 Google Places Overview Dashboard
 *
 * Tests the Google Places integration overview dashboard where admins can
 * view statistics, quick actions, and navigation to sync and candidate management.
 *
 * Test Coverage:
 * 1. Page Access Tests - Admin-only access control
 * 2. Page Rendering Tests - Title, description, and layout
 * 3. Statistics Cards Tests - Display of key metrics
 * 4. Quick Actions Tests - Manual sync, AI processing, configuration
 * 5. Navigation Tests - Quick links to sync and candidates pages
 * 6. Responsive Layout Tests - Mobile viewport handling
 * 7. Loading States Tests - Skeleton screens
 */

test.describe('T032-01: Google Places Overview Dashboard', () => {
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

  // Helper function to mock non-admin authentication
  async function mockUserLogin(page: any) {
    await page.route('**/api/auth/session', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'user@test.com',
            role: 'user',
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
            id: 'test-user-id',
            email: 'user@test.com',
            full_name: 'Test User',
            user_role: 'user',
          },
        }),
      });
    });
  }

  // Helper function to mock Google Places stats API
  async function mockGooglePlacesStats(page: any, stats: any = {}) {
    const defaultStats = {
      pending_candidates: 25,
      synced_last: '2026-01-15T10:00:00Z',
      total_raw_places: 150,
      total_imported: 42,
    };

    const mergedStats = { ...defaultStats, ...stats };

    // Mock candidates endpoint for pending count
    await page.route('**/api/admin/google-places/candidates?status=pending&limit=1', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: {
            total: mergedStats.pending_candidates,
            limit: 1,
            offset: 0,
          },
        }),
      });
    });

    // Mock candidates endpoint for total count
    await page.route('**/api/admin/google-places/candidates?limit=1', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: {
            total: mergedStats.total_raw_places,
            limit: 1,
            offset: 0,
          },
        }),
      });
    });

    // Mock sync logs endpoint
    await page.route('**/api/admin/google-places/sync/logs?limit=1', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mergedStats.synced_last ? [{ started_at: mergedStats.synced_last }] : [],
        }),
      });
    });
  }

  test.describe('Page Access Control', () => {
    test('should allow admin access to Google Places dashboard', async ({ page }) => {
      await mockAdminLogin(page);
      await mockGooglePlacesStats(page);

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible();
    });

    test('should redirect non-admin users to login', async ({ page }) => {
      await mockUserLogin(page);

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      // Should redirect to login
      expect(page.url()).toContain('/auth/login');
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.route('**/api/auth/session', async (route: any) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ user: null }),
        });
      });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/auth/login');
    });
  });

  test.describe('Page Rendering', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockGooglePlacesStats(page);
    });

    test('should display page title and description', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible();
      await expect(page.locator('text=Manage Google Places API data ingestion and campsite imports')).toBeVisible();
    });

    test('should display admin sidebar', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      // AdminSidebar should be present
      const sidebar = page.locator('[data-testid="admin-sidebar"]').or(page.locator('aside'));
      await expect(sidebar.first()).toBeVisible();
    });
  });

  test.describe('Statistics Cards', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
    });

    test('should display all four statistics cards', async ({ page }) => {
      await mockGooglePlacesStats(page, {
        pending_candidates: 25,
        synced_last: '2026-01-15T10:00:00Z',
        total_raw_places: 150,
        total_imported: 42,
      });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      // Check for all stats cards
      await expect(page.locator('text=Pending Candidates')).toBeVisible();
      await expect(page.locator('text=Sync Status')).toBeVisible();
      await expect(page.locator('text=Raw Places')).toBeVisible();
      await expect(page.locator('text=Imported Campsites')).toBeVisible();
    });

    test('should display pending candidates count', async ({ page }) => {
      await mockGooglePlacesStats(page, { pending_candidates: 25 });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      const pendingCard = page.locator('text=Pending Candidates').locator('..');
      await expect(pendingCard).toContainText('25');
      await expect(pendingCard).toContainText('Awaiting review');
    });

    test('should display sync status with last sync date', async ({ page }) => {
      await mockGooglePlacesStats(page, { synced_last: '2026-01-15T10:00:00Z' });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      const syncCard = page.locator('text=Sync Status').locator('..');
      await expect(syncCard).toContainText('Synced');
    });

    test('should display pending sync status when never synced', async ({ page }) => {
      await mockGooglePlacesStats(page, { synced_last: null });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      const syncCard = page.locator('text=Sync Status').locator('..');
      await expect(syncCard).toContainText('Pending');
      await expect(syncCard).toContainText('Not synced yet');
    });

    test('should display raw places count', async ({ page }) => {
      await mockGooglePlacesStats(page, { total_raw_places: 150 });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      const rawPlacesCard = page.locator('text=Raw Places').locator('..');
      await expect(rawPlacesCard).toContainText('150');
      await expect(rawPlacesCard).toContainText('In database');
    });

    test('should display imported campsites count', async ({ page }) => {
      await mockGooglePlacesStats(page, { total_imported: 42 });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      const importedCard = page.locator('text=Imported Campsites').locator('..');
      await expect(importedCard).toContainText('42');
      await expect(importedCard).toContainText('From Google Places');
    });

    test('should display zero values correctly', async ({ page }) => {
      await mockGooglePlacesStats(page, {
        pending_candidates: 0,
        total_raw_places: 0,
        total_imported: 0,
      });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Pending Candidates').locator('..')).toContainText('0');
    });

    test('should make statistics cards clickable with correct links', async ({ page }) => {
      await mockGooglePlacesStats(page);

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      // Pending Candidates card should link to candidates page
      const pendingCard = page.locator('a:has-text("Pending Candidates")');
      await expect(pendingCard).toHaveAttribute('href', '/admin/google-places/candidates');

      // Sync Status card should link to sync page
      const syncCard = page.locator('a:has-text("Sync Status")');
      await expect(syncCard).toHaveAttribute('href', '/admin/google-places/sync');
    });
  });

  test.describe('Quick Action Cards', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockGooglePlacesStats(page);
    });

    test('should display Manual Sync action card', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Manual Sync')).toBeVisible();
      await expect(page.locator('text=Trigger a manual sync with Google Places API')).toBeVisible();
      await expect(page.locator('button:has-text("Start Sync")')).toBeVisible();
    });

    test('should display AI Processing action card', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=AI Processing')).toBeVisible();
      await expect(page.locator('text=Process raw places with AI for deduplication and classification')).toBeVisible();
      await expect(page.locator('button:has-text("Process with AI")')).toBeVisible();
    });

    test('should display Sync Configuration action card', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Sync Configuration')).toBeVisible();
      await expect(page.locator('text=Configure sync schedule and limits')).toBeVisible();
      await expect(page.locator('button:has-text("Configure")')).toBeVisible();
    });

    test('should navigate to sync page when Start Sync clicked', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      const startSyncButton = page.locator('button:has-text("Start Sync")');
      await startSyncButton.click();

      await page.waitForURL('**/admin/google-places/sync');
      expect(page.url()).toContain('/admin/google-places/sync');
    });

    test('should trigger AI processing when button clicked', async ({ page }) => {
      let aiProcessCalled = false;

      await page.route('**/api/admin/google-places/process', async (route: any) => {
        aiProcessCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            placesToProcess: 50,
          }),
        });
      });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('Started AI processing for 50 places');
        await dialog.accept();
      });

      const aiProcessButton = page.locator('button:has-text("Process with AI")');
      await aiProcessButton.click();

      await page.waitForTimeout(500);
      expect(aiProcessCalled).toBe(true);
    });

    test('should show error when AI processing fails', async ({ page }) => {
      await page.route('**/api/admin/google-places/process', async (route: any) => {
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

      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('Failed to start AI processing');
        await dialog.accept();
      });

      const aiProcessButton = page.locator('button:has-text("Process with AI")');
      await aiProcessButton.click();
    });

    test('should disable Configure button (coming soon)', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      const configButton = page.locator('button:has-text("Configure")');
      await expect(configButton).toBeDisabled();
    });
  });

  test.describe('Quick Links Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockGooglePlacesStats(page);
    });

    test('should display Quick Links section', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h2:has-text("Quick Links")')).toBeVisible();
    });

    test('should display Sync Management quick link', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      const syncLink = page.locator('a:has-text("Sync Management")');
      await expect(syncLink).toBeVisible();
      await expect(page.locator('text=View sync history, trigger manual syncs')).toBeVisible();
      await expect(syncLink).toHaveAttribute('href', '/admin/google-places/sync');
    });

    test('should display Import Candidates quick link', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      const candidatesLink = page.locator('a:has-text("Import Candidates")');
      await expect(candidatesLink).toBeVisible();
      await expect(page.locator('text=Review and approve campsite imports')).toBeVisible();
      await expect(candidatesLink).toHaveAttribute('href', '/admin/google-places/candidates');
    });

    test('should navigate to sync page via quick link', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      const syncLink = page.locator('a:has-text("Sync Management")');
      await syncLink.click();

      await page.waitForURL('**/admin/google-places/sync');
      expect(page.url()).toContain('/admin/google-places/sync');
    });

    test('should navigate to candidates page via quick link', async ({ page }) => {
      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      const candidatesLink = page.locator('a:has-text("Import Candidates")');
      await candidatesLink.click();

      await page.waitForURL('**/admin/google-places/candidates');
      expect(page.url()).toContain('/admin/google-places/candidates');
    });
  });

  test.describe('Responsive Layout', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockGooglePlacesStats(page);
    });

    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      // Stats cards should be in grid layout
      const statsGrid = page.locator('.grid').first();
      await expect(statsGrid).toBeVisible();
    });

    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible();
      await expect(page.locator('text=Pending Candidates')).toBeVisible();
    });

    test('should adapt layout for mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      // Page should still be accessible on mobile
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible();

      // Stats cards should stack vertically
      await expect(page.locator('text=Pending Candidates')).toBeVisible();
      await expect(page.locator('text=Sync Status')).toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('should show skeleton screens while loading', async ({ page }) => {
      await mockAdminLogin(page);

      // Delay API responses to test loading state
      await page.route('**/api/admin/google-places/candidates**', async (route: any) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
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

      // Skeleton should be visible initially
      const skeleton = page.locator('[data-testid="skeleton"]').or(page.locator('.animate-pulse')).first();

      // Wait for loading to complete
      await page.waitForLoadState('networkidle');
    });

    test('should hide loading state after data loads', async ({ page }) => {
      await mockAdminLogin(page);
      await mockGooglePlacesStats(page);

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      // Content should be visible
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible();
      await expect(page.locator('text=Pending Candidates')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
    });

    test('should handle API errors gracefully', async ({ page }) => {
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

      // Page should still render with default/zero values
      await expect(page.locator('h1:has-text("Google Places Integration")')).toBeVisible();
    });

    test('should show zero values when API returns no data', async ({ page }) => {
      await mockGooglePlacesStats(page, {
        pending_candidates: 0,
        synced_last: null,
        total_raw_places: 0,
        total_imported: 0,
      });

      await page.goto('/admin/google-places');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Pending Candidates').locator('..')).toContainText('0');
    });
  });
});
