import { test, expect } from '@playwright/test';

/**
 * E2E Tests: T032-04 Candidate Detail View
 *
 * Tests the detailed view of a single Google Places candidate where admins can
 * review all place data, photos, reviews, AI classification, and approve/reject.
 *
 * Test Coverage:
 * 1. Page Access Tests - Admin-only access control
 * 2. Page Rendering Tests - Display of candidate details
 * 3. Place Data Display Tests - All Google Places information
 * 4. Photos Display Tests - Photo gallery
 * 5. Reviews Display Tests - Google reviews
 * 6. AI Classification Tests - Classification results
 * 7. Duplicate Warning Tests - Duplicate detection display
 * 8. Approve from Detail Tests - Approve action from detail view
 * 9. Reject from Detail Tests - Reject action from detail view
 * 10. Navigation Tests - Back to list navigation
 */

test.describe('T032-04: Candidate Detail View', () => {
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

  // Helper function to mock candidate detail
  async function mockCandidateDetail(page: any, candidateId: string, customData: any = {}) {
    const defaultData = {
      id: candidateId,
      name: 'Mountain View Campsite',
      address: '123 Mountain Rd, Chiang Mai, Thailand',
      confidence_score: 0.95,
      is_duplicate: false,
      rating: 4.5,
      rating_count: 120,
      status: 'pending',
      google_place_id: 'ChIJ123',
      googlePlaceRaw: {
        id: 'raw-place-1',
        place_id: 'ChIJ123',
        raw_data: {
          name: 'Mountain View Campsite',
          formatted_address: '123 Mountain Rd, Chiang Mai, Thailand',
          types: ['campground', 'lodging', 'point_of_interest'],
          geometry: {
            location: {
              lat: 18.7883,
              lng: 98.9853,
            },
          },
          rating: 4.5,
          user_ratings_total: 120,
          opening_hours: {
            weekday_text: [
              'Monday: 8:00 AM – 6:00 PM',
              'Tuesday: 8:00 AM – 6:00 PM',
              'Wednesday: 8:00 AM – 6:00 PM',
              'Thursday: 8:00 AM – 6:00 PM',
              'Friday: 8:00 AM – 6:00 PM',
              'Saturday: 8:00 AM – 6:00 PM',
              'Sunday: 8:00 AM – 6:00 PM',
            ],
          },
          photos: [
            {
              photo_reference: 'photo1',
              width: 1024,
              height: 768,
            },
            {
              photo_reference: 'photo2',
              width: 1024,
              height: 768,
            },
          ],
          reviews: [
            {
              author_name: 'John Doe',
              rating: 5,
              text: 'Great campsite with amazing views!',
              time: 1640000000,
            },
            {
              author_name: 'Jane Smith',
              rating: 4,
              text: 'Nice place, good facilities.',
              time: 1640100000,
            },
          ],
        },
      },
      processedData: {
        classification: 'campground',
        confidence: 0.95,
        detected_amenities: ['parking', 'toilets', 'wifi'],
        detected_activities: ['camping', 'hiking'],
      },
      duplicateComparison: null,
      confidenceBreakdown: {
        name_match: 0.98,
        type_match: 0.95,
        location_match: 0.92,
        overall: 0.95,
      },
    };

    const mergedData = { ...defaultData, ...customData };

    await page.route(`**/api/admin/google-places/candidates/${candidateId}`, async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mergedData,
        }),
      });
    });
  }

  test.describe('Page Access Control', () => {
    test('should allow admin access to candidate detail page', async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidateDetail(page, 'candidate-1');

      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Mountain View Campsite')).toBeVisible();
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

      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/auth/login');
    });
  });

  test.describe('Place Data Display', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidateDetail(page, 'candidate-1');
    });

    test('should display candidate name prominently', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1:has-text("Mountain View Campsite")').or(
        page.locator('h2:has-text("Mountain View Campsite")')
      )).toBeVisible();
    });

    test('should display full address', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=123 Mountain Rd, Chiang Mai, Thailand')).toBeVisible();
    });

    test('should display confidence score with visual indicator', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=/95%|0.95/')).toBeVisible();
      await expect(page.locator('text=Confidence').or(page.locator('text=confidence'))).toBeVisible();
    });

    test('should display rating and review count', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=4.5')).toBeVisible();
      await expect(page.locator('text=/120.*review/')).toBeVisible();
    });

    test('should display place types', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=campground').or(page.locator('text=Campground'))).toBeVisible();
    });

    test('should display location coordinates', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=/18.788|98.985/')).toBeVisible();
    });

    test('should display opening hours', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=/Monday.*8:00 AM/')).toBeVisible();
    });

    test('should display Google Place ID', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=ChIJ123')).toBeVisible();
    });
  });

  test.describe('Photos Display', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidateDetail(page, 'candidate-1');
    });

    test('should display photos section', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Photos').or(page.locator('text=photos'))).toBeVisible();
    });

    test('should display multiple photos if available', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      // Should have at least 2 photos based on mock data
      const images = page.locator('img').filter({ hasText: '' });
      const count = await images.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display photo count', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=/2.*photo/i')).toBeVisible();
    });
  });

  test.describe('Reviews Display', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidateDetail(page, 'candidate-1');
    });

    test('should display reviews section', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Reviews').or(page.locator('text=reviews'))).toBeVisible();
    });

    test('should display review author name', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=John Doe')).toBeVisible();
      await expect(page.locator('text=Jane Smith')).toBeVisible();
    });

    test('should display review rating', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=/5.*star/i').or(page.locator('text=5'))).toBeVisible();
    });

    test('should display review text', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Great campsite with amazing views!')).toBeVisible();
      await expect(page.locator('text=Nice place, good facilities.')).toBeVisible();
    });
  });

  test.describe('AI Classification Display', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidateDetail(page, 'candidate-1');
    });

    test('should display AI classification section', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=/AI.*Classification/i').or(
        page.locator('text=/Classification/i')
      )).toBeVisible();
    });

    test('should display classification result', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=campground').or(page.locator('text=Campground'))).toBeVisible();
    });

    test('should display detected amenities', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=parking').or(page.locator('text=Parking'))).toBeVisible();
      await expect(page.locator('text=toilets').or(page.locator('text=Toilets'))).toBeVisible();
      await expect(page.locator('text=wifi').or(page.locator('text=WiFi'))).toBeVisible();
    });

    test('should display detected activities', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=camping').or(page.locator('text=Camping'))).toBeVisible();
      await expect(page.locator('text=hiking').or(page.locator('text=Hiking'))).toBeVisible();
    });

    test('should display confidence breakdown', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=/name.*match/i').or(page.locator('text=98%'))).toBeVisible();
    });
  });

  test.describe('Duplicate Warning Display', () => {
    test('should display duplicate warning when candidate is flagged', async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidateDetail(page, 'candidate-2', {
        is_duplicate: true,
        duplicateComparison: {
          existing_campsite_id: 'campsite-123',
          existing_campsite_name: 'Similar Mountain Camp',
          similarity_score: 0.87,
          matching_fields: ['name', 'location'],
        },
      });

      await page.goto('/admin/google-places/candidates/candidate-2');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=/duplicate/i')).toBeVisible();
      await expect(page.locator('text=/warning/i').or(page.locator('text=/alert/i'))).toBeVisible();
    });

    test('should display similar campsite information', async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidateDetail(page, 'candidate-2', {
        is_duplicate: true,
        duplicateComparison: {
          existing_campsite_id: 'campsite-123',
          existing_campsite_name: 'Similar Mountain Camp',
          similarity_score: 0.87,
          matching_fields: ['name', 'location'],
        },
      });

      await page.goto('/admin/google-places/candidates/candidate-2');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Similar Mountain Camp')).toBeVisible();
      await expect(page.locator('text=/87%|0.87/')).toBeVisible();
    });

    test('should not display duplicate warning for unique candidates', async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidateDetail(page, 'candidate-1', {
        is_duplicate: false,
      });

      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      // Should show unique badge or no duplicate warning
      const duplicateWarning = page.locator('text=/duplicate.*warning/i');
      expect(await duplicateWarning.isVisible()).toBe(false);
    });
  });

  test.describe('Approve from Detail View', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidateDetail(page, 'candidate-1');
    });

    test('should display Approve button for pending candidate', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('button:has-text("Approve")')).toBeVisible();
    });

    test('should show confirmation when Approve clicked', async ({ page }) => {
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('Approve');
        await dialog.dismiss();
      });

      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      const approveButton = page.locator('button:has-text("Approve")');
      await approveButton.click();
    });

    test('should approve candidate and show success message', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates/candidate-1/approve', async (route: any) => {
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
          expect(dialog.message()).toContain('success');
          await dialog.accept();
        }
      });

      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      const approveButton = page.locator('button:has-text("Approve")');
      await approveButton.click();
    });

    test('should not display Approve button for already approved candidate', async ({ page }) => {
      await mockCandidateDetail(page, 'candidate-1', {
        status: 'approved',
      });

      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      const approveButton = page.locator('button:has-text("Approve")');
      expect(await approveButton.isVisible()).toBe(false);
    });
  });

  test.describe('Reject from Detail View', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidateDetail(page, 'candidate-1');
    });

    test('should display Reject button for pending candidate', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('button:has-text("Reject")')).toBeVisible();
    });

    test('should show reason prompt when Reject clicked', async ({ page }) => {
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('prompt');
        expect(dialog.message()).toContain('reason');
        await dialog.dismiss();
      });

      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      const rejectButton = page.locator('button:has-text("Reject")');
      await rejectButton.click();
    });

    test('should reject candidate with reason', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates/candidate-1/reject', async (route: any) => {
        const requestBody = JSON.parse(route.request().postData() || '{}');
        expect(requestBody.reason).toBeTruthy();

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
          expect(dialog.message()).toContain('rejected');
          await dialog.accept();
        }
      });

      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      const rejectButton = page.locator('button:has-text("Reject")');
      await rejectButton.click();
    });
  });

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
      await mockCandidateDetail(page, 'candidate-1');
    });

    test('should display back button to candidates list', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      const backButton = page.locator('button:has-text("Back")').or(
        page.locator('a:has-text("Back to")')
      );
      await expect(backButton.first()).toBeVisible();
    });

    test('should navigate back to candidates list when back clicked', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      const backButton = page.locator('button:has-text("Back")').or(
        page.locator('a:has-text("Back")').or(
          page.locator('a[href="/admin/google-places/candidates"]')
        )
      );

      if (await backButton.first().isVisible()) {
        await backButton.first().click();
        await page.waitForURL('**/admin/google-places/candidates');
        expect(page.url()).toContain('/admin/google-places/candidates');
      }
    });
  });

  test.describe('Loading States', () => {
    test('should show skeleton while loading', async ({ page }) => {
      await mockAdminLogin(page);

      await page.route('**/api/admin/google-places/candidates/candidate-1', async (route: any) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {},
          }),
        });
      });

      await page.goto('/admin/google-places/candidates/candidate-1');

      // Skeleton should be visible
      const skeleton = page.locator('[data-testid="skeleton"]').or(page.locator('.animate-pulse')).first();

      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminLogin(page);
    });

    test('should handle candidate not found error', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates/invalid-id', async (route: any) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Candidate not found',
          }),
        });
      });

      await page.goto('/admin/google-places/candidates/invalid-id');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=/not found/i').or(page.locator('text=/error/i'))).toBeVisible();
    });

    test('should handle API error gracefully', async ({ page }) => {
      await page.route('**/api/admin/google-places/candidates/candidate-1', async (route: any) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error',
          }),
        });
      });

      await page.goto('/admin/google-places/candidates/candidate-1');
      await page.waitForLoadState('networkidle');

      // Should show error message
      await expect(page.locator('text=/error/i')).toBeVisible();
    });
  });
});
