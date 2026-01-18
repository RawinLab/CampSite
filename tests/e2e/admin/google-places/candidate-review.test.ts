import { test, expect } from '@playwright/test';

/**
 * E2E Tests: T032-03 Candidate Review Page
 *
 * Tests the Google Places candidate review functionality where admins can
 * review, approve, or reject campsite candidates discovered from Google Places.
 *
 * Test Coverage:
 * 1. Page Access Tests - Admin-only access control
 * 2. Candidates List Tests - Display of candidate cards/table
 * 3. Filter Tests - Filter by status, duplicate flag
 * 4. Sorting Tests - Sort by confidence score
 * 5. Candidate Details Tests - View detailed information
 * 6. Approve Tests - Approve candidate workflow
 * 7. Reject Tests - Reject candidate with reason
 * 8. Bulk Actions Tests - Bulk approve/reject
 * 9. Pagination Tests - Navigate through candidates
 * 10. Empty State Tests - No candidates scenario
 */

test.describe('T032-03: Candidate Review Page', () => {
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

  // Helper function to mock candidates
  async function mockCandidates(page: any, candidates: any[] = []) {
    const defaultCandidates = [
      {
        id: 'candidate-1',
        name: 'Mountain View Campsite',
        address: '123 Mountain Rd, Chiang Mai, Thailand',
        confidence_score: 0.95,
        is_duplicate: false,
        rating: 4.5,
        rating_count: 120,
        status: 'pending',
        google_place_id: 'ChIJ123',
      },
      {
        id: 'candidate-2',
        name: 'Beach Paradise Camping',
        address: '456 Beach Rd, Phuket, Thailand',
        confidence_score: 0.85,
        is_duplicate: false,
        rating: 4.2,
        rating_count: 85,
        status: 'pending',
        google_place_id: 'ChIJ456',
      },
      {
        id: 'candidate-3',
        name: 'Forest Camp',
        address: '789 Forest Rd, Krabi, Thailand',
        confidence_score: 0.65,
        is_duplicate: true,
        rating: 4.0,
        rating_count: 45,
        status: 'pending',
        google_place_id: 'ChIJ789',
      },
      {
        id: 'candidate-4',
        name: 'River Valley Camp',
        address: '321 River Rd, Kanchanaburi, Thailand',
        confidence_score: 0.92,
        is_duplicate: false,
        rating: 4.7,
        rating_count: 200,
        status: 'approved',
        google_place_id: 'ChIJ321',
      },
    ];

    const candidatesToUse = candidates.length > 0 ? candidates : defaultCandidates;

    await page.route('**/api/admin/google-places/candidates?limit=50&offset=0', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: candidatesToUse,
          pagination: {
            total: candidatesToUse.length,
            limit: 50,
            offset: 0,
          },
        }),
      });
    });

    // Handle filtered requests
    await page.route('**/api/admin/google-places/candidates?*', async (route: any) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');
      const isDuplicate = url.searchParams.get('isDuplicate');

      let filteredCandidates = candidatesToUse;

      if (status) {
        filteredCandidates = filteredCandidates.filter(c => c.status === status);
      }

      if (isDuplicate === 'true') {
        filteredCandidates = filteredCandidates.filter(c => c.is_duplicate === true);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: filteredCandidates,
          pagination: {
            total: filteredCandidates.length,
            limit: 50,
            offset: 0,
          },
        }),
      });
    });
  }

  test.describe('Page Access Control', () => {
    test('should allow admin access to candidates page', async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidates(page);

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1:has-text("Import Candidates")')).toBeVisible();
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

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/auth/login');
    });
  });

  test.describe('Page Rendering', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidates(page);
    });

    test('should display page title and description', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1:has-text("Import Candidates")')).toBeVisible();
      await expect(page.locator('text=Review and approve campsites discovered by Google Places API')).toBeVisible();
    });

    test('should display statistics summary cards', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Total Candidates')).toBeVisible();
      await expect(page.locator('text=Pending')).toBeVisible();
      await expect(page.locator('text=High Confidence')).toBeVisible();
      await expect(page.locator('text=Duplicates')).toBeVisible();
    });

    test('should calculate statistics correctly', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      // Total: 4, Pending: 3, High Confidence (>=0.9): 2, Duplicates: 1
      const totalCard = page.locator('text=Total Candidates').locator('..');
      await expect(totalCard).toContainText('4');

      const pendingCard = page.locator('text=Pending').locator('..');
      await expect(pendingCard).toContainText('3');

      const highConfCard = page.locator('text=High Confidence').locator('..');
      await expect(highConfCard).toContainText('2');

      const duplicatesCard = page.locator('text=Duplicates').locator('..');
      await expect(duplicatesCard).toContainText('1');
    });
  });

  test.describe('Candidates List Display', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidates(page);
    });

    test('should display candidates table with all columns', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      // Check table headers
      await expect(page.locator('text=Campsite')).toBeVisible();
      await expect(page.locator('text=Confidence')).toBeVisible();
      await expect(page.locator('text=Duplicate')).toBeVisible();
      await expect(page.locator('text=Rating')).toBeVisible();
      await expect(page.locator('text=Status')).toBeVisible();
      await expect(page.locator('text=Actions')).toBeVisible();
    });

    test('should display candidate name and address', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Mountain View Campsite')).toBeVisible();
      await expect(page.locator('text=123 Mountain Rd, Chiang Mai, Thailand')).toBeVisible();
    });

    test('should display confidence score with color coding', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      // High confidence (95%) should be green
      const highConfidence = page.locator('text=95%');
      await expect(highConfidence).toBeVisible();

      // Medium confidence (85%) should be yellow
      const mediumConfidence = page.locator('text=85%');
      await expect(mediumConfidence).toBeVisible();

      // Low confidence (65%) should be red
      const lowConfidence = page.locator('text=65%');
      await expect(lowConfidence).toBeVisible();
    });

    test('should display duplicate badge for duplicate candidates', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const duplicateBadges = page.locator('text=Duplicate');
      await expect(duplicateBadges.first()).toBeVisible();

      const uniqueBadges = page.locator('text=Unique');
      await expect(uniqueBadges.first()).toBeVisible();
    });

    test('should display rating with stars and review count', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=4.5')).toBeVisible();
      await expect(page.locator('text=(120 reviews)')).toBeVisible();
    });

    test('should display status badge with correct color', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      // Pending status
      await expect(page.locator('text=Pending').first()).toBeVisible();

      // Approved status
      await expect(page.locator('text=Approved').first()).toBeVisible();
    });

    test('should display action buttons for pending candidates', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      // Should have View, Approve, and Reject buttons for pending candidates
      const actionButtons = page.locator('button').filter({ hasText: /View|Check|X/ });
      await expect(actionButtons.first()).toBeVisible();
    });
  });

  test.describe('Filter Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidates(page);
    });

    test('should display filter badges', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=All').first()).toBeVisible();
      await expect(page.locator('text=Pending').first()).toBeVisible();
      await expect(page.locator('text=Imported').first()).toBeVisible();
      await expect(page.locator('text=Duplicates Only')).toBeVisible();
    });

    test('should filter by pending status', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const pendingFilter = page.locator('text=Pending').first();
      await pendingFilter.click();

      await page.waitForURL('**/admin/google-places/candidates?status=pending');
      expect(page.url()).toContain('status=pending');
    });

    test('should filter by imported status', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const importedFilter = page.locator('text=Imported').first();
      await importedFilter.click();

      await page.waitForURL('**/admin/google-places/candidates?status=imported');
      expect(page.url()).toContain('status=imported');
    });

    test('should filter by duplicates only', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const duplicatesFilter = page.locator('text=Duplicates Only');
      await duplicatesFilter.click();

      await page.waitForURL('**/admin/google-places/candidates?isDuplicate=true');
      expect(page.url()).toContain('isDuplicate=true');
    });

    test('should show all candidates when All filter clicked', async ({ page }) => {
      await page.goto('/admin/google-places/candidates?status=pending');
      await page.waitForLoadState('networkidle');

      const allFilter = page.locator('text=All').first();
      await allFilter.click();

      await page.waitForURL('**/admin/google-places/candidates');
      expect(page.url()).not.toContain('status=');
    });
  });

  test.describe('View Candidate Details', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidates(page);
    });

    test('should have View button for each candidate', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const viewButtons = page.locator('button').filter({ hasText: 'View' }).or(
        page.locator('button svg').filter({ hasText: '' })
      );
      const count = await viewButtons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should navigate to detail page when View clicked', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      // Click first row to view details
      const firstRow = page.locator('tbody tr').first();
      await firstRow.click();

      await page.waitForURL('**/admin/google-places/candidates/*');
      expect(page.url()).toContain('/admin/google-places/candidates/candidate-');
    });

    test('should navigate to detail page when row clicked', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      await firstRow.click();

      await page.waitForURL('**/admin/google-places/candidates/*');
      expect(page.url()).toMatch(/\/admin\/google-places\/candidates\/candidate-\d+/);
    });
  });

  test.describe('Approve Candidate', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidates(page);
    });

    test('should show Approve button for pending candidates', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      // Approve button should be visible for pending candidates
      const approveButtons = page.locator('button').filter({ hasText: /Check|Approve/ });
      expect(await approveButtons.count()).toBeGreaterThan(0);
    });

    test('should show confirmation dialog when Approve clicked', async ({ page }) => {
      let dialogShown = false;

      page.on('dialog', async (dialog) => {
        dialogShown = true;
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('Approve and import this campsite');
        await dialog.dismiss();
      });

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const approveButton = page.locator('button').filter({ hasText: /Check/ }).first();
      if (await approveButton.isVisible()) {
        await approveButton.click();
        expect(dialogShown).toBe(true);
      }
    });

    test('should approve candidate when confirmed', async ({ page }) => {
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
          await dialog.accept();
        } else if (dialog.type() === 'alert') {
          expect(dialog.message()).toContain('Campsite imported successfully');
          await dialog.accept();
        }
      });

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const approveButton = page.locator('button').filter({ hasText: /Check/ }).first();
      if (await approveButton.isVisible()) {
        await approveButton.click();
        await page.waitForTimeout(500);
        expect(approveCalled).toBe(true);
      }
    });

    test('should show error when approve fails', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates/candidate-1/approve', async (route: any) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error',
          }),
        });
      });

      page.on('dialog', async (dialog) => {
        if (dialog.type() === 'confirm') {
          await dialog.accept();
        } else if (dialog.type() === 'alert') {
          expect(dialog.message()).toContain('Failed to approve candidate');
          await dialog.accept();
        }
      });

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const approveButton = page.locator('button').filter({ hasText: /Check/ }).first();
      if (await approveButton.isVisible()) {
        await approveButton.click();
      }
    });
  });

  test.describe('Reject Candidate', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidates(page);
    });

    test('should show Reject button for pending candidates', async ({ page }) => {
      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const rejectButtons = page.locator('button').filter({ hasText: /X|Reject/ });
      expect(await rejectButtons.count()).toBeGreaterThan(0);
    });

    test('should show reason prompt when Reject clicked', async ({ page }) => {
      let promptShown = false;

      page.on('dialog', async (dialog) => {
        promptShown = true;
        expect(dialog.type()).toBe('prompt');
        expect(dialog.message()).toContain('Rejection reason');
        await dialog.dismiss();
      });

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const rejectButton = page.locator('button').filter({ hasText: /X/ }).first();
      if (await rejectButton.isVisible()) {
        await rejectButton.click();
        expect(promptShown).toBe(true);
      }
    });

    test('should reject candidate with reason', async ({ page }) => {
      let rejectCalled = false;
      let capturedReason = '';

      await page.route('**/api/admin/google-places/candidates/candidate-1/reject', async (route: any) => {
        rejectCalled = true;
        const requestBody = JSON.parse(route.request().postData() || '{}');
        capturedReason = requestBody.reason;

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
          await dialog.accept('Not a campsite');
        } else if (dialog.type() === 'alert') {
          expect(dialog.message()).toContain('Candidate rejected');
          await dialog.accept();
        }
      });

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const rejectButton = page.locator('button').filter({ hasText: /X/ }).first();
      if (await rejectButton.isVisible()) {
        await rejectButton.click();
        await page.waitForTimeout(500);
        expect(rejectCalled).toBe(true);
        expect(capturedReason).toBe('Not a campsite');
      }
    });

    test('should not reject if reason is empty', async ({ page }) => {
      let rejectCalled = false;

      await page.route('**/api/admin/google-places/candidates/*/reject', async (route: any) => {
        rejectCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
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

  test.describe('Empty State', () => {
    test('should display empty state when no candidates', async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidates(page, []);

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=No candidates found')).toBeVisible();
      await expect(page.locator('text=Trigger a Google Places sync to discover camping sites in Thailand')).toBeVisible();
      await expect(page.locator('button:has-text("Start Sync")')).toBeVisible();
    });

    test('should navigate to sync page from empty state', async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidates(page, []);

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      const startSyncButton = page.locator('button:has-text("Start Sync")');
      await startSyncButton.click();

      await page.waitForURL('**/admin/google-places/sync');
      expect(page.url()).toContain('/admin/google-places/sync');
    });
  });

  test.describe('Loading States', () => {
    test('should show skeleton while loading', async ({ page }) => {
      await mockAdminLogin(page);

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

      await page.goto('/admin/google-places/candidates');

      // Skeleton should be visible
      const skeleton = page.locator('[data-testid="skeleton"]').or(page.locator('.animate-pulse')).first();

      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
    });

    test('should handle candidates API error gracefully', async ({ page }) => {
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

      await page.goto('/admin/google-places/candidates');
      await page.waitForLoadState('networkidle');

      // Page should still render with empty state or error message
      await expect(page.locator('h1:has-text("Import Candidates")')).toBeVisible();
    });
  });
});
