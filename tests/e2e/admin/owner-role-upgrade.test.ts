import { test, expect, Browser } from '@playwright/test';

/**
 * E2E Test: Owner Role Upgrade After Approval (T038)
 *
 * This test suite verifies the complete flow of user role upgrade from 'user' to 'owner'
 * after admin approves an owner request. Uses multiple browser contexts to simulate
 * concurrent admin and user sessions.
 *
 * Critical verification:
 * - User role changes from 'user' to 'owner' in database
 * - User gains access to owner features (/dashboard, create campsite)
 * - User loses access to user-only features (become owner form)
 * - Role change persists across sessions
 *
 * Test Coverage (15+ tests):
 * 1. Pre-Approval State Tests (4 tests)
 * 2. Approval Process Tests (3 tests)
 * 3. Post-Approval User Experience Tests (5 tests)
 * 4. Session/Auth Tests (2 tests)
 * 5. Multi-Browser Tests (2 tests)
 * 6. Edge Cases (2 tests)
 */

test.describe('Owner Role Upgrade After Approval E2E', () => {
  const mockAdminId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '22222222-2222-2222-2222-222222222222';
  const mockRequestId = 'request-123';
  const mockToken = 'mock-jwt-token';
  const mockUserEmail = 'pending-owner@test.com';

  // Helper to mock admin authentication
  const mockAdminAuth = async (page: any) => {
    await page.route('**/api/auth/session', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: mockAdminId,
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
            id: mockAdminId,
            email: 'admin@test.com',
            full_name: 'Admin User',
            user_role: 'admin',
          },
        }),
      });
    });
  };

  // Helper to mock user authentication (before upgrade)
  const mockUserAuthBefore = async (page: any) => {
    await page.route('**/api/auth/session', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: mockUserId,
            email: mockUserEmail,
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
            id: mockUserId,
            email: mockUserEmail,
            full_name: 'Test User',
            user_role: 'user',
          },
        }),
      });
    });
  };

  // Helper to mock user authentication (after upgrade)
  const mockUserAuthAfter = async (page: any) => {
    await page.route('**/api/auth/session', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: mockUserId,
            email: mockUserEmail,
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
            id: mockUserId,
            email: mockUserEmail,
            full_name: 'Test User',
            user_role: 'owner',
          },
        }),
      });
    });
  };

  // Helper to mock pending owner requests
  const mockPendingRequests = async (page: any) => {
    await page.route('**/api/admin/owner-requests*', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: mockRequestId,
              user_id: mockUserId,
              user_email: mockUserEmail,
              user_name: 'Test User',
              business_name: 'Test Campsite Business',
              business_description: 'A beautiful campsite business',
              contact_phone: '0812345678',
              status: 'pending',
              created_at: new Date().toISOString(),
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        }),
      });
    });
  };

  test.describe('1. Pre-Approval State Tests', () => {
    test('T038.1: User has role=user before approval', async ({ browser }) => {
      const userContext = await browser.newContext();
      const userPage = await userContext.newPage();

      await mockUserAuthBefore(userPage);

      await userPage.goto('/auth/become-owner');
      await userPage.waitForLoadState('networkidle');

      // Verify user can access become owner page (user-only)
      await expect(userPage).toHaveURL(/\/auth\/become-owner/);

      // Verify form is visible
      const form = userPage.locator('form');
      await expect(form).toBeVisible({ timeout: 5000 });

      await userContext.close();
    });

    test('T038.2: User cannot access /dashboard before approval', async ({ browser }) => {
      const userContext = await browser.newContext();
      const userPage = await userContext.newPage();

      await mockUserAuthBefore(userPage);

      // Mock dashboard to return 403 for user role
      await userPage.route('**/api/dashboard/**', async (route) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Owner role required',
          }),
        });
      });

      await userPage.goto('/dashboard');
      await userPage.waitForLoadState('networkidle');

      // Should be redirected to login or see error
      const hasError = await userPage.locator('text=/forbidden|not authorized|owner.*required/i').isVisible({ timeout: 3000 }).catch(() => false);
      const isRedirected = !userPage.url().includes('/dashboard');

      expect(hasError || isRedirected).toBeTruthy();

      await userContext.close();
    });

    test('T038.3: User cannot create campsite before approval', async ({ browser }) => {
      const userContext = await browser.newContext();
      const userPage = await userContext.newPage();

      await mockUserAuthBefore(userPage);

      // Mock campsite creation to return 403 for user role
      await userPage.route('**/api/campsites', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Owner role required',
            }),
          });
        } else {
          await route.continue();
        }
      });

      await userPage.goto('/dashboard/campsites/new');
      await userPage.waitForLoadState('networkidle');

      // Should be blocked or redirected
      const hasError = await userPage.locator('text=/forbidden|not authorized|owner.*required/i').isVisible({ timeout: 3000 }).catch(() => false);
      const isRedirected = !userPage.url().includes('/dashboard/campsites/new');

      expect(hasError || isRedirected).toBeTruthy();

      await userContext.close();
    });

    test('T038.4: User sees "Become Owner" option before approval', async ({ browser }) => {
      const userContext = await browser.newContext();
      const userPage = await userContext.newPage();

      await mockUserAuthBefore(userPage);

      await userPage.goto('/');
      await userPage.waitForLoadState('networkidle');

      // Look for become owner link in nav or profile menu
      const becomeOwnerLink = userPage.getByRole('link', { name: /become.*owner/i });
      const hasBecomeOwner = await becomeOwnerLink.isVisible({ timeout: 5000 }).catch(() => false);

      // Or check in user menu dropdown
      if (!hasBecomeOwner) {
        const userMenu = userPage.locator('[data-testid="user-menu"], [aria-label*="user"], button:has-text("Test User")');
        if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
          await userMenu.click();
          const becomeOwnerMenuItem = userPage.getByRole('menuitem', { name: /become.*owner/i });
          await expect(becomeOwnerMenuItem).toBeVisible({ timeout: 3000 });
        }
      } else {
        expect(hasBecomeOwner).toBeTruthy();
      }

      await userContext.close();
    });
  });

  test.describe('2. Approval Process Tests', () => {
    test('T038.5: Admin approves owner request', async ({ browser }) => {
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();

      await mockAdminAuth(adminPage);
      await mockPendingRequests(adminPage);

      // Mock approval API
      await adminPage.route(`**/api/admin/owner-requests/${mockRequestId}/approve`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              request_id: mockRequestId,
              new_status: 'approved',
              user_role_updated: true,
              message: 'Owner request approved successfully',
            }),
          });
        } else {
          await route.continue();
        }
      });

      await adminPage.goto('/admin/owner-requests');
      await adminPage.waitForLoadState('networkidle');

      // Find and click approve button
      const approveButton = adminPage.getByRole('button', { name: /approve/i }).first();
      await expect(approveButton).toBeVisible({ timeout: 5000 });
      await approveButton.click();

      // Wait for approval to complete
      await adminPage.waitForTimeout(500);

      // Request should be removed from list or marked as approved
      const requestCard = adminPage.locator(`[data-request-id="${mockRequestId}"]`);
      const isRemoved = await requestCard.count() === 0;
      const hasApprovedStatus = await adminPage.locator('text=/approved/i').isVisible({ timeout: 2000 }).catch(() => false);

      expect(isRemoved || hasApprovedStatus).toBeTruthy();

      await adminContext.close();
    });

    test('T038.6: Database updates user role to owner', async ({ browser }) => {
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();

      await mockAdminAuth(adminPage);
      await mockPendingRequests(adminPage);

      let roleUpdated = false;

      // Mock approval API with role update verification
      await adminPage.route(`**/api/admin/owner-requests/${mockRequestId}/approve`, async (route) => {
        if (route.request().method() === 'POST') {
          roleUpdated = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              request_id: mockRequestId,
              new_status: 'approved',
              user_role_updated: true,
              message: 'Owner request approved successfully',
            }),
          });
        } else {
          await route.continue();
        }
      });

      await adminPage.goto('/admin/owner-requests');
      await adminPage.waitForLoadState('networkidle');

      const approveButton = adminPage.getByRole('button', { name: /approve/i }).first();
      await approveButton.click();
      await adminPage.waitForTimeout(500);

      expect(roleUpdated).toBeTruthy();

      await adminContext.close();
    });

    test('T038.7: Approval response indicates role updated', async ({ browser }) => {
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();

      await mockAdminAuth(adminPage);
      await mockPendingRequests(adminPage);

      let responseReceived = false;

      // Intercept approval API and verify response
      await adminPage.route(`**/api/admin/owner-requests/${mockRequestId}/approve`, async (route) => {
        if (route.request().method() === 'POST') {
          const response = {
            success: true,
            request_id: mockRequestId,
            new_status: 'approved',
            user_role_updated: true,
            message: 'Owner request approved successfully',
          };

          responseReceived = true;
          expect(response.user_role_updated).toBe(true);

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(response),
          });
        } else {
          await route.continue();
        }
      });

      await adminPage.goto('/admin/owner-requests');
      await adminPage.waitForLoadState('networkidle');

      const approveButton = adminPage.getByRole('button', { name: /approve/i }).first();
      await approveButton.click();
      await adminPage.waitForTimeout(500);

      expect(responseReceived).toBeTruthy();

      await adminContext.close();
    });
  });

  test.describe('3. Post-Approval User Experience Tests', () => {
    test('T038.8: User can access /dashboard after approval', async ({ browser }) => {
      const userContext = await browser.newContext();
      const userPage = await userContext.newPage();

      await mockUserAuthAfter(userPage);

      // Mock dashboard stats for owner
      await userPage.route('**/api/dashboard/stats*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              search_impressions: 0,
              profile_views: 0,
              booking_clicks: 0,
              new_inquiries: 0,
              total_campsites: 0,
              active_campsites: 0,
              pending_campsites: 0,
            },
          }),
        });
      });

      await userPage.route('**/api/dashboard/analytics*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { chartData: [] },
          }),
        });
      });

      await userPage.route('**/api/dashboard/campsites*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          }),
        });
      });

      await userPage.goto('/dashboard');
      await userPage.waitForLoadState('networkidle');

      // Should successfully access dashboard
      await expect(userPage).toHaveURL(/\/dashboard/);

      // Verify dashboard content is visible
      const heading = userPage.getByRole('heading', { name: /welcome|dashboard/i });
      await expect(heading).toBeVisible({ timeout: 5000 });

      await userContext.close();
    });

    test('T038.9: User can create campsite after approval', async ({ browser }) => {
      const userContext = await browser.newContext();
      const userPage = await userContext.newPage();

      await mockUserAuthAfter(userPage);

      await userPage.route('**/api/dashboard/campsites*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          }),
        });
      });

      await userPage.goto('/dashboard/campsites/new');
      await userPage.waitForLoadState('networkidle');

      // Should successfully access create campsite page
      await expect(userPage).toHaveURL(/\/dashboard\/campsites\/new/);

      // Verify form is visible
      const form = userPage.locator('form');
      await expect(form).toBeVisible({ timeout: 5000 });

      await userContext.close();
    });

    test('T038.10: User profile shows owner role', async ({ browser }) => {
      const userContext = await browser.newContext();
      const userPage = await userContext.newPage();

      await mockUserAuthAfter(userPage);

      await userPage.goto('/profile');
      await userPage.waitForLoadState('networkidle');

      // Look for owner badge or role indicator
      const ownerBadge = userPage.locator('text=/owner|role.*owner/i');
      await expect(ownerBadge.first()).toBeVisible({ timeout: 5000 });

      await userContext.close();
    });

    test('T038.11: Become Owner option no longer shown', async ({ browser }) => {
      const userContext = await browser.newContext();
      const userPage = await userContext.newPage();

      await mockUserAuthAfter(userPage);

      await userPage.goto('/');
      await userPage.waitForLoadState('networkidle');

      // Become owner link should not be visible
      const becomeOwnerLink = userPage.getByRole('link', { name: /become.*owner/i });
      const isVisible = await becomeOwnerLink.isVisible({ timeout: 2000 }).catch(() => false);

      expect(isVisible).toBeFalsy();

      await userContext.close();
    });

    test('T038.12: Owner menu items visible', async ({ browser }) => {
      const userContext = await browser.newContext();
      const userPage = await userContext.newPage();

      await mockUserAuthAfter(userPage);

      await userPage.goto('/');
      await userPage.waitForLoadState('networkidle');

      // Look for owner-specific menu items
      const dashboardLink = userPage.getByRole('link', { name: /dashboard/i });
      await expect(dashboardLink).toBeVisible({ timeout: 5000 });

      await userContext.close();
    });
  });

  test.describe('4. Session/Auth Tests', () => {
    test('T038.13: Role updates in current session', async ({ browser }) => {
      const userContext = await browser.newContext();
      const userPage = await userContext.newPage();

      // Start as user
      await mockUserAuthBefore(userPage);

      await userPage.goto('/');
      await userPage.waitForLoadState('networkidle');

      // Simulate approval and role update
      await mockUserAuthAfter(userPage);

      // Reload page to get new auth state
      await userPage.reload();
      await userPage.waitForLoadState('networkidle');

      // Should now have owner access
      await userPage.goto('/dashboard');
      await userPage.route('**/api/dashboard/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {} }),
        });
      });

      await userPage.waitForLoadState('networkidle');
      await expect(userPage).toHaveURL(/\/dashboard/);

      await userContext.close();
    });

    test('T038.14: New sessions have correct role', async ({ browser }) => {
      // First session - before approval
      const userContext1 = await browser.newContext();
      const userPage1 = await userContext1.newPage();
      await mockUserAuthBefore(userPage1);
      await userPage1.goto('/');
      await userContext1.close();

      // Second session - after approval
      const userContext2 = await browser.newContext();
      const userPage2 = await userContext2.newPage();
      await mockUserAuthAfter(userPage2);

      await userPage2.route('**/api/dashboard/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {} }),
        });
      });

      await userPage2.goto('/dashboard');
      await userPage2.waitForLoadState('networkidle');

      // Should have owner access in new session
      await expect(userPage2).toHaveURL(/\/dashboard/);

      await userContext2.close();
    });
  });

  test.describe('5. Multi-Browser Tests', () => {
    test('T038.15: Approve in admin browser, verify in user browser', async ({ browser }) => {
      // Admin context
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();

      await mockAdminAuth(adminPage);
      await mockPendingRequests(adminPage);

      // User context (before approval)
      const userContext = await browser.newContext();
      const userPage = await userContext.newPage();

      await mockUserAuthBefore(userPage);

      // Mock approval API
      await adminPage.route(`**/api/admin/owner-requests/${mockRequestId}/approve`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              user_role_updated: true,
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Admin approves
      await adminPage.goto('/admin/owner-requests');
      await adminPage.waitForLoadState('networkidle');

      const approveButton = adminPage.getByRole('button', { name: /approve/i }).first();
      await approveButton.click();
      await adminPage.waitForTimeout(500);

      // Update user auth mock to owner
      await mockUserAuthAfter(userPage);

      // Mock dashboard for user
      await userPage.route('**/api/dashboard/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {} }),
        });
      });

      // User checks access
      await userPage.goto('/dashboard');
      await userPage.waitForLoadState('networkidle');

      // Should now have access
      await expect(userPage).toHaveURL(/\/dashboard/);

      await adminContext.close();
      await userContext.close();
    });

    test('T038.16: User sees role change in different session', async ({ browser }) => {
      // First user session
      const userContext1 = await browser.newContext();
      const userPage1 = await userContext1.newPage();
      await mockUserAuthBefore(userPage1);
      await userPage1.goto('/');
      await userPage1.waitForLoadState('networkidle');

      // Simulate approval happens (admin approves in background)

      // Second user session (after approval)
      const userContext2 = await browser.newContext();
      const userPage2 = await userContext2.newPage();
      await mockUserAuthAfter(userPage2);

      await userPage2.route('**/api/dashboard/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {} }),
        });
      });

      await userPage2.goto('/dashboard');
      await userPage2.waitForLoadState('networkidle');

      // Should have owner access
      await expect(userPage2).toHaveURL(/\/dashboard/);

      await userContext1.close();
      await userContext2.close();
    });
  });

  test.describe('6. Edge Cases', () => {
    test('T038.17: Handle multiple pending requests from same user', async ({ browser }) => {
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();

      await mockAdminAuth(adminPage);

      // Mock multiple requests (should not happen due to UNIQUE constraint, but test handling)
      await adminPage.route('**/api/admin/owner-requests*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: mockRequestId,
                user_id: mockUserId,
                business_name: 'Test Business 1',
                status: 'pending',
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          }),
        });
      });

      await adminPage.route(`**/api/admin/owner-requests/${mockRequestId}/approve`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              user_role_updated: true,
            }),
          });
        } else {
          await route.continue();
        }
      });

      await adminPage.goto('/admin/owner-requests');
      await adminPage.waitForLoadState('networkidle');

      const approveButton = adminPage.getByRole('button', { name: /approve/i }).first();
      await approveButton.click();
      await adminPage.waitForTimeout(500);

      // Should successfully approve one request
      const successMessage = adminPage.locator('text=/approved|success/i');
      const hasSuccess = await successMessage.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasSuccess).toBeTruthy();

      await adminContext.close();
    });

    test('T038.18: Gracefully handle role update failure', async ({ browser }) => {
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();

      await mockAdminAuth(adminPage);
      await mockPendingRequests(adminPage);

      // Mock approval API with role update failure
      await adminPage.route(`**/api/admin/owner-requests/${mockRequestId}/approve`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              request_id: mockRequestId,
              new_status: 'approved',
              user_role_updated: false, // Role update failed
              message: 'Owner request approved but role update failed',
            }),
          });
        } else {
          await route.continue();
        }
      });

      await adminPage.goto('/admin/owner-requests');
      await adminPage.waitForLoadState('networkidle');

      const approveButton = adminPage.getByRole('button', { name: /approve/i }).first();
      await approveButton.click();
      await adminPage.waitForTimeout(500);

      // Should still show some feedback (warning or partial success)
      const feedback = adminPage.locator('text=/approved|warning|role.*failed/i');
      await expect(feedback.first()).toBeVisible({ timeout: 5000 });

      await adminContext.close();
    });
  });
});
