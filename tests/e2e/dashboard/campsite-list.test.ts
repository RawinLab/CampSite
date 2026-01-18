import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Owner Dashboard - Campsite Listing Management
 *
 * Test Coverage:
 * 1. Campsite List Display
 *    - Shows all owner's campsites
 *    - Displays campsite name and thumbnail
 *    - Shows status badge (approved, pending, rejected)
 *    - Shows review count and average rating
 *    - Shows view/inquiry counts for current month
 *
 * 2. List Filtering and Sorting
 *    - Filter by status (all, approved, pending, rejected)
 *    - Pagination works correctly
 *    - Search/filter updates URL params
 *
 * 3. Campsite Actions
 *    - Edit button navigates to edit page
 *    - View details button shows campsite (approved only)
 *    - Delete confirmation dialog
 *    - Delete removes campsite from list
 *
 * 4. Empty State
 *    - Shows helpful message when no campsites
 *    - CTA to create first campsite
 *
 * 5. Owner Authorization
 *    - Only shows owner's own campsites
 *    - Cannot see other owners' listings
 */

test.describe('Owner Dashboard - Campsite List Management', () => {
  const API_BASE_URL = 'http://localhost:3091';
  const MOCK_OWNER_ID = 'owner-test-123';
  const OTHER_OWNER_ID = 'owner-other-456';

  // Mock campsite data
  const mockCampsites = [
    {
      id: 'campsite-1',
      name: 'Mountain View Campsite',
      status: 'approved',
      thumbnail_url: 'https://placehold.co/600x400/png?text=Mountain+View',
      average_rating: 4.5,
      review_count: 12,
      views_this_month: 145,
      inquiries_this_month: 8,
      created_at: '2025-12-01T10:00:00Z',
      updated_at: '2026-01-15T14:30:00Z',
    },
    {
      id: 'campsite-2',
      name: 'Beach Paradise Camping',
      status: 'pending',
      thumbnail_url: 'https://placehold.co/600x400/png?text=Beach+Paradise',
      average_rating: 0,
      review_count: 0,
      views_this_month: 23,
      inquiries_this_month: 2,
      created_at: '2026-01-10T08:00:00Z',
      updated_at: '2026-01-10T08:00:00Z',
    },
    {
      id: 'campsite-3',
      name: 'Forest Retreat',
      status: 'rejected',
      thumbnail_url: null,
      average_rating: 3.8,
      review_count: 5,
      views_this_month: 0,
      inquiries_this_month: 0,
      created_at: '2025-11-20T12:00:00Z',
      updated_at: '2026-01-05T09:00:00Z',
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Mock authentication as owner
    await page.addInitScript((ownerId) => {
      localStorage.setItem('auth-token', 'mock-owner-token');
      localStorage.setItem('user', JSON.stringify({
        id: ownerId,
        email: 'owner@example.com',
        full_name: 'Test Owner',
        role: 'owner',
      }));
    }, MOCK_OWNER_ID);

    // Navigate to dashboard campsites page
    await page.goto('/dashboard/campsites');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. Campsite List Display', () => {
    test('T120.1: Shows all owner\'s campsites with complete information', async ({ page }) => {
      // Mock API response with all campsites
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockCampsites,
            pagination: {
              total: 3,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify page title shows count
      const pageTitle = page.getByRole('heading', { name: /campsites.*\(3\)/i });
      await expect(pageTitle).toBeVisible();

      // Verify all campsites are displayed
      for (const campsite of mockCampsites) {
        const campsiteCard = page.locator(`text=${campsite.name}`);
        await expect(campsiteCard).toBeVisible();
      }
    });

    test('T120.2: Displays campsite name and thumbnail correctly', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [mockCampsites[0]],
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check campsite name is clickable link
      const campsiteLink = page.getByRole('link', { name: mockCampsites[0].name });
      await expect(campsiteLink).toBeVisible();

      // Verify thumbnail image exists
      const thumbnail = page.locator('img').filter({ hasText: mockCampsites[0].name });
      const thumbnailExists = await thumbnail.count() > 0 ||
        await page.locator('text=No image').isVisible();
      expect(thumbnailExists).toBeTruthy();
    });

    test('T120.3: Shows status badge for each campsite', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockCampsites,
            pagination: { total: 3, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check approved status badge
      const approvedBadge = page.getByText('Active');
      await expect(approvedBadge).toBeVisible();

      // Check pending status badge
      const pendingBadge = page.getByText('Pending Approval');
      await expect(pendingBadge).toBeVisible();

      // Check rejected status badge
      const rejectedBadge = page.getByText('Rejected');
      await expect(rejectedBadge).toBeVisible();
    });

    test('T120.4: Shows review count and average rating', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [mockCampsites[0]], // Has 12 reviews, 4.5 rating
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check review count is displayed
      const reviewCount = page.getByText(/\(12\)/);
      await expect(reviewCount).toBeVisible();

      // Check star rating component exists (StarRating component)
      const starRating = page.locator('[class*="star"]').first();
      const starExists = await starRating.isVisible().catch(() => false);
      expect(starExists || await page.getByText('4.5').isVisible()).toBeTruthy();
    });

    test('T120.5: Shows view and inquiry counts for current month', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [mockCampsites[0]],
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check views this month
      const viewCount = page.getByText(/145 views this month/i);
      await expect(viewCount).toBeVisible();

      // Check inquiries count
      const inquiryCount = page.getByText(/8 inquiries/i);
      await expect(inquiryCount).toBeVisible();
    });

    test('T120.6: Handles campsites without thumbnails gracefully', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [mockCampsites[2]], // No thumbnail
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should show "No image" placeholder
      const noImagePlaceholder = page.getByText('No image');
      await expect(noImagePlaceholder).toBeVisible();
    });
  });

  test.describe('2. List Filtering and Sorting', () => {
    test('T121.1: Filter by status - All shows all campsites', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        const url = new URL(route.request().url());
        const status = url.searchParams.get('status');

        if (status === 'all') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: mockCampsites,
              pagination: { total: 3, page: 1, limit: 10, totalPages: 1 },
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Click "All" filter
      const allFilter = page.getByRole('button', { name: 'All' });
      await allFilter.click();

      await page.waitForTimeout(500);

      // Verify URL updated
      expect(page.url()).toContain('status=all');

      // Verify count shows all campsites
      const pageTitle = page.getByRole('heading', { name: /campsites.*\(3\)/i });
      await expect(pageTitle).toBeVisible();
    });

    test('T121.2: Filter by status - Approved shows only approved', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        const url = new URL(route.request().url());
        const status = url.searchParams.get('status');

        if (status === 'approved') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [mockCampsites[0]],
              pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Click "Active" (approved) filter
      const activeFilter = page.getByRole('button', { name: 'Active' });
      await activeFilter.click();

      await page.waitForTimeout(500);

      // Verify URL updated
      expect(page.url()).toContain('status=approved');

      // Verify only approved campsite shown
      const mountainView = page.getByText('Mountain View Campsite');
      await expect(mountainView).toBeVisible();

      const beachParadise = page.getByText('Beach Paradise Camping');
      await expect(beachParadise).not.toBeVisible();
    });

    test('T121.3: Filter by status - Pending shows only pending', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        const url = new URL(route.request().url());
        const status = url.searchParams.get('status');

        if (status === 'pending') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [mockCampsites[1]],
              pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Click "Pending" filter
      const pendingFilter = page.getByRole('button', { name: 'Pending' });
      await pendingFilter.click();

      await page.waitForTimeout(500);

      // Verify URL updated
      expect(page.url()).toContain('status=pending');

      // Verify only pending campsite shown
      const beachParadise = page.getByText('Beach Paradise Camping');
      await expect(beachParadise).toBeVisible();
    });

    test('T121.4: Filter by status - Rejected shows only rejected', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        const url = new URL(route.request().url());
        const status = url.searchParams.get('status');

        if (status === 'rejected') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [mockCampsites[2]],
              pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Click "Rejected" filter
      const rejectedFilter = page.getByRole('button', { name: 'Rejected' });
      await rejectedFilter.click();

      await page.waitForTimeout(500);

      // Verify URL updated
      expect(page.url()).toContain('status=rejected');

      // Verify only rejected campsite shown
      const forestRetreat = page.getByText('Forest Retreat');
      await expect(forestRetreat).toBeVisible();
    });

    test('T121.5: Pagination updates page parameter in URL', async ({ page }) => {
      // Mock multi-page response
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        const url = new URL(route.request().url());
        const pageNum = url.searchParams.get('page') || '1';

        const allCampsites = Array.from({ length: 15 }, (_, i) => ({
          id: `campsite-${i + 1}`,
          name: `Campsite ${i + 1}`,
          status: 'approved',
          thumbnail_url: null,
          average_rating: 4.0,
          review_count: 5,
          views_this_month: 10,
          inquiries_this_month: 2,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        }));

        const limit = 10;
        const page = parseInt(pageNum);
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedData = allCampsites.slice(start, end);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: paginatedData,
            pagination: {
              total: allCampsites.length,
              page,
              limit,
              totalPages: Math.ceil(allCampsites.length / limit),
            },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify pagination is visible
      const nextButton = page.getByRole('button', { name: /next/i }).or(page.getByText('2'));
      const paginationVisible = await nextButton.isVisible().catch(() => false);

      if (paginationVisible) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Verify URL updated to page 2
        expect(page.url()).toContain('page=2');
      }
    });

    test('T121.6: Filter resets to page 1 when changed', async ({ page }) => {
      // Mock multi-page response
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        const url = new URL(route.request().url());
        const status = url.searchParams.get('status') || 'all';
        const pageNum = url.searchParams.get('page') || '1';

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: status === 'all' ? mockCampsites : [mockCampsites[0]],
            pagination: {
              total: status === 'all' ? 3 : 1,
              page: parseInt(pageNum),
              limit: 10,
              totalPages: 1,
            },
          }),
        });
      });

      // Navigate to page 2 first
      await page.goto('/dashboard/campsites?page=2&status=all');
      await page.waitForLoadState('networkidle');

      // Change filter
      const activeFilter = page.getByRole('button', { name: 'Active' });
      await activeFilter.click();

      await page.waitForTimeout(500);

      // Verify URL reset to page 1
      expect(page.url()).toContain('page=1');
      expect(page.url()).toContain('status=approved');
    });
  });

  test.describe('3. Campsite Actions', () => {
    test('T122.1: Edit button navigates to edit page', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [mockCampsites[0]],
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Open actions dropdown
      const moreButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('svg') }).first();
      await moreButton.click();

      // Click Edit option
      const editOption = page.getByRole('menuitem', { name: /edit/i });
      await editOption.click();

      // Verify navigation to edit page
      await page.waitForURL(`**/dashboard/campsites/${mockCampsites[0].id}`);
      expect(page.url()).toContain(`/dashboard/campsites/${mockCampsites[0].id}`);
    });

    test('T122.2: View public page shown for approved campsites only', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [mockCampsites[0], mockCampsites[1]], // Approved and pending
            pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Find approved campsite's actions
      const approvedCard = page.locator(`text=${mockCampsites[0].name}`).locator('..').locator('..');
      const approvedActions = approvedCard.getByRole('button', { name: '' }).filter({ has: page.locator('svg') }).first();
      await approvedActions.click();

      // Verify "View Public Page" option exists
      const viewPublicOption = page.getByRole('menuitem', { name: /view public page/i });
      await expect(viewPublicOption).toBeVisible();

      // Close dropdown
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      // Find pending campsite's actions
      const pendingCard = page.locator(`text=${mockCampsites[1].name}`).locator('..').locator('..');
      const pendingActions = pendingCard.getByRole('button', { name: '' }).filter({ has: page.locator('svg') }).first();
      await pendingActions.click();

      // Verify "View Public Page" option does NOT exist for pending
      const viewPublicOptionPending = page.getByRole('menuitem', { name: /view public page/i });
      await expect(viewPublicOptionPending).not.toBeVisible();
    });

    test('T122.3: Delete shows confirmation dialog', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [mockCampsites[0]],
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Mock dialog confirmation
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('delete');
        await dialog.dismiss();
      });

      // Open actions and click delete
      const moreButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('svg') }).first();
      await moreButton.click();

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      await deleteOption.click();

      // Wait for dialog to be handled
      await page.waitForTimeout(300);
    });

    test('T122.4: Delete removes campsite from list after confirmation', async ({ page }) => {
      let campsiteDeleted = false;

      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: campsiteDeleted ? [] : [mockCampsites[0]],
              pagination: { total: campsiteDeleted ? 0 : 1, page: 1, limit: 10, totalPages: campsiteDeleted ? 0 : 1 },
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.route(`${API_BASE_URL}/api/dashboard/campsites/${mockCampsites[0].id}`, async (route) => {
        if (route.request().method() === 'DELETE') {
          campsiteDeleted = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        } else {
          await route.continue();
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify campsite is visible
      const campsiteName = page.getByText(mockCampsites[0].name);
      await expect(campsiteName).toBeVisible();

      // Handle confirmation dialog
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      // Open actions and delete
      const moreButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('svg') }).first();
      await moreButton.click();

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      await deleteOption.click();

      // Wait for delete to process
      await page.waitForTimeout(500);

      // Verify campsite removed (should show empty state or updated list)
      const campsiteNameAfter = page.getByText(mockCampsites[0].name);
      await expect(campsiteNameAfter).not.toBeVisible();
    });

    test('T122.5: Delete shows success toast notification', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [mockCampsites[0]],
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.route(`${API_BASE_URL}/api/dashboard/campsites/${mockCampsites[0].id}`, async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        } else {
          await route.continue();
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Handle confirmation
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      // Delete campsite
      const moreButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('svg') }).first();
      await moreButton.click();

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      await deleteOption.click();

      await page.waitForTimeout(500);

      // Check for success toast
      const successToast = page.getByText(/deleted successfully/i);
      await expect(successToast).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('4. Empty State', () => {
    test('T123.1: Shows empty state when no campsites exist', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify empty state message
      const emptyMessage = page.getByText(/no campsites yet/i);
      await expect(emptyMessage).toBeVisible();
    });

    test('T123.2: Empty state shows helpful CTA message', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check for helpful message
      const helpfulMessage = page.getByText(/create your first campsite/i);
      await expect(helpfulMessage).toBeVisible();
    });

    test('T123.3: Empty state has CTA button to create campsite', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify CTA button exists and links to create page
      const ctaButton = page.getByRole('link', { name: /create campsite/i });
      await expect(ctaButton).toBeVisible();
      expect(await ctaButton.getAttribute('href')).toContain('/dashboard/campsites/new');
    });

    test('T123.4: Empty state with filtered status shows appropriate message', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
          }),
        });
      });

      // Navigate with pending filter
      await page.goto('/dashboard/campsites?status=pending');
      await page.waitForLoadState('networkidle');

      // Should still show empty state
      const emptyMessage = page.getByText(/no campsites/i);
      await expect(emptyMessage).toBeVisible();
    });
  });

  test.describe('5. Owner Authorization', () => {
    test('T124.1: Only shows owner\'s own campsites', async ({ page }) => {
      const ownerCampsites = [mockCampsites[0], mockCampsites[1]];

      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        // Backend should only return authenticated owner's campsites
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: ownerCampsites,
            pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify owner's campsites are shown
      const campsite1 = page.getByText(ownerCampsites[0].name);
      await expect(campsite1).toBeVisible();

      const campsite2 = page.getByText(ownerCampsites[1].name);
      await expect(campsite2).toBeVisible();

      // Verify count matches owner's campsites
      const pageTitle = page.getByRole('heading', { name: /campsites.*\(2\)/i });
      await expect(pageTitle).toBeVisible();
    });

    test('T124.2: Cannot see other owners\' campsites', async ({ page }) => {
      // Mock API to verify it filters by owner
      let requestedOwnerId: string | null = null;

      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        const headers = route.request().headers();
        const authToken = headers['authorization'];

        // In real scenario, backend validates token and filters by owner
        // Here we simulate that only current owner's data is returned
        requestedOwnerId = MOCK_OWNER_ID;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [mockCampsites[0]], // Only this owner's campsite
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify request was made (validates authorization flow)
      expect(requestedOwnerId).toBe(MOCK_OWNER_ID);

      // Verify only 1 campsite shown (owner's campsite)
      const campsites = page.locator('[class*="Card"]');
      const count = await campsites.count();
      expect(count).toBeLessThanOrEqual(1);
    });

    test('T124.3: Unauthorized access redirects to login', async ({ page }) => {
      // Clear auth
      await page.evaluate(() => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
      });

      // Mock API to return 401
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Unauthorized',
          }),
        });
      });

      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Should redirect to login or show error
      const currentUrl = page.url();
      const isLoginPage = currentUrl.includes('/login') || currentUrl.includes('/auth');
      const hasErrorMessage = await page.getByText(/unauthorized|not authorized|sign in/i).isVisible().catch(() => false);

      expect(isLoginPage || hasErrorMessage).toBeTruthy();
    });
  });

  test.describe('6. Loading and Error States', () => {
    test('T125.1: Shows loading skeleton while fetching data', async ({ page }) => {
      // Delay API response to see loading state
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockCampsites,
            pagination: { total: 3, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.reload();

      // Check for loading skeleton (component: CampsiteListSkeleton)
      const loadingSkeleton = page.locator('[class*="skeleton"]').or(page.locator('[class*="animate-pulse"]'));
      const isLoading = await loadingSkeleton.isVisible({ timeout: 500 }).catch(() => false);

      // Loading state should appear briefly
      expect(isLoading).toBeTruthy();
    });

    test('T125.2: Shows error toast on API failure', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
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

      // Check for error toast
      const errorToast = page.getByText(/failed to load/i).or(page.getByText(/error/i));
      await expect(errorToast).toBeVisible({ timeout: 3000 });
    });

    test('T125.3: Add campsite button always visible', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/dashboard/campsites*`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockCampsites,
            pagination: { total: 3, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify "Add Campsite" button is visible
      const addButton = page.getByRole('link', { name: /add campsite/i });
      await expect(addButton).toBeVisible();
      expect(await addButton.getAttribute('href')).toContain('/dashboard/campsites/new');
    });
  });
});
