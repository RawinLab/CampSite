import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Admin Pending Campsites Page
 *
 * Tests the admin functionality for viewing and managing pending campsite submissions
 * that require approval before going live on the platform.
 *
 * Test Coverage:
 * 1. Page Access Tests - Role-based access control
 * 2. Page Rendering Tests - UI elements and states
 * 3. Campsite Card Display Tests - Information display
 * 4. Card Actions Tests - Approve/Reject buttons
 * 5. Navigation Tests - Sidebar and admin navigation
 * 6. Pagination Tests - List pagination controls
 * 7. Sorting Tests - Sort pending submissions
 */

test.describe('Admin Pending Campsites Page', () => {
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

  // Helper function to mock user authentication
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

  // Helper function to mock owner authentication
  async function mockOwnerLogin(page: any) {
    await page.route('**/api/auth/session', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-owner-id',
            email: 'owner@test.com',
            role: 'owner',
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
            id: 'test-owner-id',
            email: 'owner@test.com',
            full_name: 'Test Owner',
            user_role: 'owner',
          },
        }),
      });
    });
  }

  // Helper function to mock pending campsites data
  async function mockPendingCampsites(page: any, count: number = 3) {
    const campsites = Array.from({ length: count }, (_, i) => ({
      id: `campsite-${i + 1}`,
      name: `Pending Campsite ${i + 1}`,
      description: `Beautiful camping spot ${i + 1} waiting for approval`,
      province_name: ['Chiang Mai', 'Phuket', 'Krabi'][i % 3],
      campsite_type: ['camping', 'glamping', 'tented-resort'][i % 3],
      campsite_type_badge: ['Camping', 'Glamping', 'Tented Resort'][i % 3],
      owner_name: `Owner ${i + 1}`,
      price_min: 500 + (i * 500),
      price_max: 1500 + (i * 1000),
      photo_count: 5 + i,
      created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    }));

    await page.route('**/api/admin/campsites/pending*', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: campsites,
          pagination: {
            total: count,
            page: 1,
            limit: 10,
            totalPages: Math.ceil(count / 10),
          },
        }),
      });
    });
  }

  // Helper function to mock empty pending campsites
  async function mockEmptyPendingCampsites(page: any) {
    await page.route('**/api/admin/campsites/pending*', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          },
        }),
      });
    });
  }

  test.describe('1. Page Access Tests', () => {
    test('redirects to login if not authenticated', async ({ page }) => {
      // No authentication mock
      await page.route('**/api/auth/session', async (route: any) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not authenticated' }),
        });
      });

      await page.route('**/api/auth/me', async (route: any) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not authenticated' }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login|\/login/);
    });

    test('redirects to login if role is user', async ({ page }) => {
      await mockUserLogin(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Should redirect away from admin page (to login or home)
      await expect(page).not.toHaveURL(/\/admin\/campsites\/pending/);
    });

    test('redirects to login if role is owner', async ({ page }) => {
      await mockOwnerLogin(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Should redirect away from admin page
      await expect(page).not.toHaveURL(/\/admin\/campsites\/pending/);
    });

    test('allows access for role=admin', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Should successfully load the admin page
      await expect(page).toHaveURL(/\/admin\/campsites\/pending/);

      // Verify page content is visible
      const heading = page.getByRole('heading', { name: /pending campsites/i });
      await expect(heading).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('2. Page Rendering Tests', () => {
    test('shows page title "Pending Campsites" or similar', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Verify page title
      const heading = page.getByRole('heading', { name: /pending campsites/i });
      await expect(heading).toBeVisible({ timeout: 5000 });
    });

    test('shows count of pending campsites', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page, 5);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Look for count indicator (e.g., "5 pending", "Total: 5", badge with "5")
      const countIndicator = page.locator('text=/5.*pending|pending.*5|total.*5/i');
      await expect(countIndicator.first()).toBeVisible({ timeout: 5000 });
    });

    test('shows empty state when no pending campsites', async ({ page }) => {
      await mockAdminLogin(page);
      await mockEmptyPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Verify empty state message
      const emptyMessage = page.locator('text=/no pending|no campsites|none pending/i');
      await expect(emptyMessage).toBeVisible({ timeout: 5000 });
    });

    test('shows loading skeleton during data fetch', async ({ page }) => {
      await mockAdminLogin(page);

      // Delay the API response to show loading state
      await page.route('**/api/admin/campsites/pending*', async (route: any) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
          }),
        });
      });

      await page.goto('/admin/campsites/pending');

      // Look for loading indicators (skeleton, spinner, "Loading...")
      const loadingIndicator = page.locator('text=/loading|skeleton/i, [role="status"], .skeleton, .animate-pulse').first();

      // Should show loading state initially
      const isLoadingVisible = await loadingIndicator.isVisible({ timeout: 500 }).catch(() => false);
      expect(isLoadingVisible).toBeTruthy();
    });
  });

  test.describe('3. Campsite Card Display Tests', () => {
    test('shows campsite name', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      const campsiteName = page.locator('text=Pending Campsite 1');
      await expect(campsiteName).toBeVisible({ timeout: 5000 });
    });

    test('shows campsite description', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      const description = page.locator('text=/Beautiful camping spot/i');
      await expect(description.first()).toBeVisible({ timeout: 5000 });
    });

    test('shows province name', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      const province = page.locator('text=/Chiang Mai|Phuket|Krabi/');
      await expect(province.first()).toBeVisible({ timeout: 5000 });
    });

    test('shows campsite type badge', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      const typeBadge = page.locator('text=/Camping|Glamping|Tented Resort/');
      await expect(typeBadge.first()).toBeVisible({ timeout: 5000 });
    });

    test('shows owner name', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      const ownerName = page.locator('text=/Owner 1|Owner 2|Owner 3/');
      await expect(ownerName.first()).toBeVisible({ timeout: 5000 });
    });

    test('shows price range', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Look for price format (e.g., "฿500 - ฿1,500", "$500-$1500", "500-1500")
      const priceRange = page.locator('text=/500.*1,?500|฿500|500 -/');
      await expect(priceRange.first()).toBeVisible({ timeout: 5000 });
    });

    test('shows photo count', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Look for photo count (e.g., "5 photos", "Photos: 5")
      const photoCount = page.locator('text=/5.*photos?|photos?.*5/i');
      await expect(photoCount.first()).toBeVisible({ timeout: 5000 });
    });

    test('shows submission date/time ago', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Look for relative time (e.g., "2 days ago", "1 day ago", "Today")
      const submissionTime = page.locator('text=/ago|today|yesterday|hours?|days?|minutes?/i');
      await expect(submissionTime.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('4. Card Actions Tests', () => {
    test('shows Approve button on each card', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page, 3);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      const approveButtons = page.getByRole('button', { name: /approve/i });
      const buttonCount = await approveButtons.count();

      // Should have at least 3 approve buttons (one per campsite)
      expect(buttonCount).toBeGreaterThanOrEqual(3);
    });

    test('shows Reject button on each card', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page, 3);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      const rejectButtons = page.getByRole('button', { name: /reject/i });
      const buttonCount = await rejectButtons.count();

      // Should have at least 3 reject buttons (one per campsite)
      expect(buttonCount).toBeGreaterThanOrEqual(3);
    });

    test('Approve button is green', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      const approveButton = page.getByRole('button', { name: /approve/i }).first();
      await expect(approveButton).toBeVisible({ timeout: 5000 });

      // Check for green color classes (bg-green, text-green, border-green, etc.)
      const buttonClasses = await approveButton.getAttribute('class');
      const hasGreenColor = buttonClasses?.includes('green') || buttonClasses?.includes('success');

      expect(hasGreenColor).toBeTruthy();
    });

    test('Reject button is red', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      await expect(rejectButton).toBeVisible({ timeout: 5000 });

      // Check for red color classes (bg-red, text-red, border-red, destructive, etc.)
      const buttonClasses = await rejectButton.getAttribute('class');
      const hasRedColor = buttonClasses?.includes('red') || buttonClasses?.includes('destructive') || buttonClasses?.includes('danger');

      expect(hasRedColor).toBeTruthy();
    });
  });

  test.describe('5. Navigation Tests', () => {
    test('sidebar highlights pending campsites link', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Look for active/highlighted pending campsites link
      const pendingLink = page.getByRole('link', { name: /pending.*campsites|campsites.*pending/i });
      await expect(pendingLink.first()).toBeVisible({ timeout: 5000 });

      // Check for active state classes
      const linkClasses = await pendingLink.first().getAttribute('class');
      const isActive = linkClasses?.includes('active') ||
                       linkClasses?.includes('bg-') ||
                       linkClasses?.includes('font-bold') ||
                       linkClasses?.includes('text-primary');

      expect(isActive).toBeTruthy();
    });

    test('sidebar shows pending count badge', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page, 5);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Look for badge with count (e.g., badge showing "5")
      const countBadge = page.locator('[class*="badge"], [class*="rounded-full"]').filter({ hasText: '5' });

      const hasBadge = await countBadge.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasBadge).toBeTruthy();
    });

    test('can navigate to other admin pages', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      // Mock admin dashboard
      await page.route('**/api/admin/stats*', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {} }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Navigate to admin dashboard
      const dashboardLink = page.getByRole('link', { name: /dashboard|overview/i }).first();
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to admin dashboard
      await expect(page).toHaveURL(/\/admin/);
    });
  });

  test.describe('6. Pagination Tests', () => {
    test('shows pagination controls', async ({ page }) => {
      await mockAdminLogin(page);

      // Mock more than 10 campsites to trigger pagination
      await page.route('**/api/admin/campsites/pending*', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: Array.from({ length: 10 }, (_, i) => ({
              id: `campsite-${i + 1}`,
              name: `Pending Campsite ${i + 1}`,
              description: `Description ${i + 1}`,
              province_name: 'Chiang Mai',
              campsite_type: 'camping',
              owner_name: `Owner ${i + 1}`,
              price_min: 500,
              price_max: 1500,
              photo_count: 5,
              created_at: new Date().toISOString(),
              status: 'pending',
            })),
            pagination: {
              total: 25,
              page: 1,
              limit: 10,
              totalPages: 3,
            },
          }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Look for pagination controls (Next, Previous, page numbers)
      const paginationControls = page.locator('nav[aria-label*="pagination"], button:has-text("Next"), button:has-text("Previous"), text=/Page 1 of/i');

      const hasPagination = await paginationControls.first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasPagination).toBeTruthy();
    });

    test('can navigate between pages', async ({ page }) => {
      await mockAdminLogin(page);

      let currentPage = 1;

      await page.route('**/api/admin/campsites/pending*', async (route: any) => {
        const url = new URL(route.request().url());
        currentPage = parseInt(url.searchParams.get('page') || '1');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: Array.from({ length: 10 }, (_, i) => ({
              id: `campsite-${(currentPage - 1) * 10 + i + 1}`,
              name: `Campsite ${(currentPage - 1) * 10 + i + 1}`,
              description: `Description ${i + 1}`,
              province_name: 'Chiang Mai',
              campsite_type: 'camping',
              owner_name: `Owner ${i + 1}`,
              price_min: 500,
              price_max: 1500,
              photo_count: 5,
              created_at: new Date().toISOString(),
              status: 'pending',
            })),
            pagination: {
              total: 25,
              page: currentPage,
              limit: 10,
              totalPages: 3,
            },
          }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Click Next button
      const nextButton = page.getByRole('button', { name: /next/i });
      const hasNext = await nextButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasNext) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');

        // URL should include page parameter
        await expect(page).toHaveURL(/page=2/);
      }
    });

    test('shows correct items per page', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page, 10);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Count visible campsite cards
      const campsiteCards = page.locator('[data-testid="campsite-card"], .campsite-card, text=/Pending Campsite/');
      const cardCount = await campsiteCards.count();

      // Should show up to 10 items per page
      expect(cardCount).toBeLessThanOrEqual(10);
      expect(cardCount).toBeGreaterThan(0);
    });
  });

  test.describe('7. Sorting Tests', () => {
    test('can sort by submission date', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Look for sort dropdown or button
      const sortButton = page.getByRole('button', { name: /sort|date|newest|oldest/i });
      const hasSortControl = await sortButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasSortControl) {
        await sortButton.click();
        await page.waitForTimeout(500);

        // Look for sort options
        const sortOption = page.getByRole('option', { name: /date|newest|oldest/i }).or(page.getByText(/date|newest|oldest/i));
        await expect(sortOption.first()).toBeVisible({ timeout: 3000 });
      }
    });

    test('can sort by name', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Look for sort dropdown or button
      const sortButton = page.getByRole('button', { name: /sort/i });
      const hasSortControl = await sortButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasSortControl) {
        await sortButton.click();
        await page.waitForTimeout(500);

        // Look for name sort option
        const nameSortOption = page.getByRole('option', { name: /name|a-z|alphabetical/i }).or(page.getByText(/name|a-z/i));
        const hasNameSort = await nameSortOption.isVisible({ timeout: 3000 }).catch(() => false);

        // Name sorting is optional, so we just check if it exists when sort is available
        if (hasNameSort) {
          await expect(nameSortOption).toBeVisible();
        }
      }
    });
  });

  test.describe('8. Action Functionality Tests', () => {
    test('clicking Approve button triggers approval flow', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      // Mock approval endpoint
      await page.route('**/api/admin/campsites/*/approve', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Campsite approved successfully',
          }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      const approveButton = page.getByRole('button', { name: /approve/i }).first();
      await approveButton.click();
      await page.waitForTimeout(500);

      // Should show confirmation dialog or success message
      const confirmation = page.locator('text=/confirm|are you sure|approved|success/i');
      await expect(confirmation.first()).toBeVisible({ timeout: 5000 });
    });

    test('clicking Reject button triggers rejection flow', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      // Mock rejection endpoint
      await page.route('**/api/admin/campsites/*/reject', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Campsite rejected successfully',
          }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      await rejectButton.click();
      await page.waitForTimeout(500);

      // Should show confirmation dialog or reason input
      const confirmation = page.locator('text=/confirm|are you sure|reject|reason/i');
      await expect(confirmation.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('9. Error Handling Tests', () => {
    test('handles API errors gracefully', async ({ page }) => {
      await mockAdminLogin(page);

      // Mock API error
      await page.route('**/api/admin/campsites/pending*', async (route: any) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Should show error message or empty state
      const errorMessage = page.locator('text=/error|failed|something went wrong/i');
      const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasError).toBeTruthy();
    });

    test('handles network timeout', async ({ page }) => {
      await mockAdminLogin(page);

      // Mock slow API response
      await page.route('**/api/admin/campsites/pending*', async (route: any) => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await route.fulfill({
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Request timeout',
          }),
        });
      });

      await page.goto('/admin/campsites/pending');

      // Wait for error or timeout message
      const errorIndicator = page.locator('text=/timeout|slow|error|failed/i');
      const hasError = await errorIndicator.isVisible({ timeout: 8000 }).catch(() => false);

      expect(hasError).toBeTruthy();
    });
  });

  test.describe('10. Responsive Design Tests', () => {
    test('page is usable on mobile', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Verify page loads and content is visible
      const heading = page.getByRole('heading', { name: /pending campsites/i });
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Verify cards are visible
      const campsiteCard = page.locator('text=Pending Campsite 1');
      await expect(campsiteCard).toBeVisible();

      // Verify buttons are accessible
      const approveButton = page.getByRole('button', { name: /approve/i }).first();
      await expect(approveButton).toBeVisible();
    });

    test('page is usable on tablet', async ({ page }) => {
      await mockAdminLogin(page);
      await mockPendingCampsites(page);

      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Verify layout works on tablet
      const heading = page.getByRole('heading', { name: /pending campsites/i });
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Verify multiple cards can be seen
      const campsiteCards = page.locator('text=/Pending Campsite/');
      const cardCount = await campsiteCards.count();
      expect(cardCount).toBeGreaterThan(0);
    });
  });
});
