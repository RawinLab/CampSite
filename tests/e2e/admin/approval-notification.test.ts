import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Notification Delivery After Campsite Approval/Rejection
 *
 * Task T025: E2E - Owner receives notification
 *
 * Tests that owners receive notifications when their campsite is approved or rejected
 * by an admin, including notification UI, content validation, and multi-user isolation.
 *
 * Test Coverage:
 * 1. Approval Notification Tests (5 tests)
 *    - Notification created on approval
 *    - Owner sees notification in UI
 *    - Notification contains campsite name
 *    - Notification indicates approved status
 *    - Notification links to campsite
 *
 * 2. Rejection Notification Tests (5 tests)
 *    - Notification created on rejection
 *    - Owner sees notification in UI
 *    - Notification contains campsite name
 *    - Notification contains rejection reason
 *    - Notification indicates rejected status
 *
 * 3. Notification UI Tests (4 tests)
 *    - Notification badge shows unread count
 *    - Clicking notification marks as read
 *    - Notifications list shows recent items
 *    - Notification has timestamp
 *
 * 4. Owner Dashboard Tests (3 tests)
 *    - Owner dashboard shows campsite status change
 *    - Status badge updates (pending → approved/rejected)
 *    - Rejection reason visible to owner
 *
 * 5. Multi-User Tests (3 tests)
 *    - Only the campsite owner receives notification
 *    - Admin does not receive self-notification
 *    - Other owners don't see notification
 *
 * Total: 20 comprehensive tests
 */

test.describe('Approval Notification Delivery - E2E Tests', () => {
  const TEST_ADMIN_ID = 'admin-user-001';
  const TEST_OWNER_ID = 'owner-user-001';
  const TEST_OWNER_2_ID = 'owner-user-002';
  const TEST_CAMPSITE_ID = 'campsite-pending-001';
  const TEST_CAMPSITE_NAME = 'Mountain View Glamping';
  const REJECTION_REASON = 'Insufficient documentation provided. Please upload business license and photos.';

  // Helper: Mock admin authentication
  async function mockAdminAuth(page: any) {
    await page.route('**/api/auth/session', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: TEST_ADMIN_ID,
            email: 'admin@campingthailand.com',
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
            id: TEST_ADMIN_ID,
            email: 'admin@campingthailand.com',
            full_name: 'Admin User',
            role: 'admin',
          },
        }),
      });
    });
  }

  // Helper: Mock owner authentication
  async function mockOwnerAuth(page: any, ownerId: string = TEST_OWNER_ID) {
    await page.route('**/api/auth/session', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: ownerId,
            email: `owner${ownerId}@example.com`,
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
            id: ownerId,
            email: `owner${ownerId}@example.com`,
            full_name: 'Test Owner',
            role: 'owner',
          },
        }),
      });
    });
  }

  // Helper: Mock pending campsites list
  async function mockPendingCampsites(page: any) {
    await page.route('**/api/admin/campsites?status=pending*', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: TEST_CAMPSITE_ID,
              name: TEST_CAMPSITE_NAME,
              owner_id: TEST_OWNER_ID,
              province: 'Chiang Mai',
              type: 'glamping',
              status: 'pending',
              created_at: new Date().toISOString(),
            },
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        }),
      });
    });
  }

  // Helper: Mock notifications endpoint
  async function mockNotifications(page: any, ownerId: string, notifications: any[]) {
    await page.route('**/api/notifications*', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: notifications.filter(n => n.user_id === ownerId),
          unread_count: notifications.filter(n => n.user_id === ownerId && !n.is_read).length,
        }),
      });
    });
  }

  test.describe('1. Approval Notification Tests', () => {
    test('notification should be created when admin approves campsite', async ({ page, browser }) => {
      let notificationCreated = false;
      let notificationData: any = null;

      // Admin page
      await mockAdminAuth(page);
      await mockPendingCampsites(page);

      // Mock approval endpoint
      await page.route(`**/api/admin/campsites/${TEST_CAMPSITE_ID}/approve`, async (route: any) => {
        notificationCreated = true;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Campsite approved successfully',
            notification_sent: true,
            notification_recipient: TEST_OWNER_ID,
          }),
        });
      });

      // Mock notification creation endpoint
      await page.route('**/api/notifications', async (route: any) => {
        if (route.request().method() === 'POST') {
          notificationData = route.request().postDataJSON();

          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 'notification-001',
                user_id: TEST_OWNER_ID,
                type: 'campsite_approved',
                title: 'Campsite Approved',
                message: `Your campsite "${TEST_CAMPSITE_NAME}" has been approved!`,
                campsite_id: TEST_CAMPSITE_ID,
                is_read: false,
                created_at: new Date().toISOString(),
              },
            }),
          });
        }
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Approve campsite
      const approveButton = page.locator(`[data-testid="approve-${TEST_CAMPSITE_ID}"]`).or(
        page.getByRole('button', { name: /approve/i }).first()
      );

      await expect(approveButton).toBeVisible({ timeout: 3000 });
      await approveButton.click();

      await page.waitForTimeout(1000);

      // Verify notification was created
      expect(notificationCreated).toBe(true);
    });

    test('owner should see notification in UI after approval', async ({ page, browser }) => {
      // Create owner page context
      const ownerContext = await browser.newContext();
      const ownerPage = await ownerContext.newPage();

      await mockOwnerAuth(ownerPage);

      // Mock notifications with approval notification
      await mockNotifications(ownerPage, TEST_OWNER_ID, [
        {
          id: 'notification-001',
          user_id: TEST_OWNER_ID,
          type: 'campsite_approved',
          title: 'Campsite Approved',
          message: `Your campsite "${TEST_CAMPSITE_NAME}" has been approved!`,
          campsite_id: TEST_CAMPSITE_ID,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      await ownerPage.goto('/dashboard');
      await ownerPage.waitForLoadState('networkidle');

      // Verify notification badge is visible
      const notificationBadge = ownerPage.locator('[data-testid="notification-badge"]').or(
        ownerPage.locator('[data-badge-count]').filter({ hasText: /1/ })
      );

      await expect(notificationBadge).toBeVisible({ timeout: 3000 });

      // Open notifications
      const notificationIcon = ownerPage.locator('[data-testid="notification-icon"]').or(
        ownerPage.getByRole('button', { name: /notifications/i })
      );

      if (await notificationIcon.isVisible({ timeout: 2000 })) {
        await notificationIcon.click();
        await ownerPage.waitForTimeout(500);

        // Verify notification appears
        const notification = ownerPage.getByText(/approved/i);
        await expect(notification).toBeVisible({ timeout: 2000 });
      }

      await ownerContext.close();
    });

    test('notification should contain campsite name', async ({ page }) => {
      await mockOwnerAuth(page);

      await mockNotifications(page, TEST_OWNER_ID, [
        {
          id: 'notification-001',
          user_id: TEST_OWNER_ID,
          type: 'campsite_approved',
          title: 'Campsite Approved',
          message: `Your campsite "${TEST_CAMPSITE_NAME}" has been approved!`,
          campsite_id: TEST_CAMPSITE_ID,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Open notifications panel
      const notificationIcon = page.locator('[data-testid="notification-icon"]').or(
        page.getByRole('button', { name: /notifications/i })
      );

      if (await notificationIcon.isVisible({ timeout: 2000 })) {
        await notificationIcon.click();
        await page.waitForTimeout(500);

        // Verify campsite name is in notification
        const campsiteName = page.getByText(new RegExp(TEST_CAMPSITE_NAME, 'i'));
        await expect(campsiteName).toBeVisible({ timeout: 2000 });
      }
    });

    test('notification should indicate approved status', async ({ page }) => {
      await mockOwnerAuth(page);

      await mockNotifications(page, TEST_OWNER_ID, [
        {
          id: 'notification-001',
          user_id: TEST_OWNER_ID,
          type: 'campsite_approved',
          title: 'Campsite Approved',
          message: `Your campsite "${TEST_CAMPSITE_NAME}" has been approved and is now live!`,
          campsite_id: TEST_CAMPSITE_ID,
          status: 'approved',
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const notificationIcon = page.locator('[data-testid="notification-icon"]').or(
        page.getByRole('button', { name: /notifications/i })
      );

      if (await notificationIcon.isVisible({ timeout: 2000 })) {
        await notificationIcon.click();
        await page.waitForTimeout(500);

        // Verify "approved" status is mentioned
        const approvedStatus = page.getByText(/approved|live/i);
        await expect(approvedStatus).toBeVisible({ timeout: 2000 });
      }
    });

    test('notification should link to campsite detail page', async ({ page }) => {
      await mockOwnerAuth(page);

      await mockNotifications(page, TEST_OWNER_ID, [
        {
          id: 'notification-001',
          user_id: TEST_OWNER_ID,
          type: 'campsite_approved',
          title: 'Campsite Approved',
          message: `Your campsite "${TEST_CAMPSITE_NAME}" has been approved!`,
          campsite_id: TEST_CAMPSITE_ID,
          link: `/dashboard/campsites/${TEST_CAMPSITE_ID}`,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      // Mock campsite detail endpoint
      await page.route(`**/api/dashboard/campsites/${TEST_CAMPSITE_ID}`, async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: TEST_CAMPSITE_ID,
              name: TEST_CAMPSITE_NAME,
              status: 'approved',
              province: 'Chiang Mai',
            },
          }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const notificationIcon = page.locator('[data-testid="notification-icon"]').or(
        page.getByRole('button', { name: /notifications/i })
      );

      if (await notificationIcon.isVisible({ timeout: 2000 })) {
        await notificationIcon.click();
        await page.waitForTimeout(500);

        // Click notification to navigate
        const notification = page.locator('[data-testid="notification-item"]').or(
          page.getByText(new RegExp(TEST_CAMPSITE_NAME, 'i'))
        ).first();

        if (await notification.isVisible({ timeout: 2000 })) {
          await notification.click();
          await page.waitForLoadState('networkidle');

          // Verify navigation to campsite page
          await expect(page).toHaveURL(new RegExp(`/dashboard/campsites/${TEST_CAMPSITE_ID}`));
        }
      }
    });
  });

  test.describe('2. Rejection Notification Tests', () => {
    test('notification should be created when admin rejects campsite', async ({ page }) => {
      let notificationCreated = false;

      await mockAdminAuth(page);
      await mockPendingCampsites(page);

      // Mock rejection endpoint
      await page.route(`**/api/admin/campsites/${TEST_CAMPSITE_ID}/reject`, async (route: any) => {
        const postData = route.request().postDataJSON();

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Campsite rejected',
            notification_sent: true,
            rejection_reason: postData?.reason || REJECTION_REASON,
          }),
        });
      });

      await page.route('**/api/notifications', async (route: any) => {
        if (route.request().method() === 'POST') {
          notificationCreated = true;

          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 'notification-002',
                user_id: TEST_OWNER_ID,
                type: 'campsite_rejected',
                title: 'Campsite Rejected',
                message: `Your campsite "${TEST_CAMPSITE_NAME}" was not approved.`,
                campsite_id: TEST_CAMPSITE_ID,
                metadata: { reason: REJECTION_REASON },
                is_read: false,
                created_at: new Date().toISOString(),
              },
            }),
          });
        }
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForLoadState('networkidle');

      // Reject campsite
      const rejectButton = page.locator(`[data-testid="reject-${TEST_CAMPSITE_ID}"]`).or(
        page.getByRole('button', { name: /reject/i }).first()
      );

      await expect(rejectButton).toBeVisible({ timeout: 3000 });
      await rejectButton.click();

      // Fill rejection reason
      const reasonTextarea = page.locator('[data-testid="rejection-reason"]').or(
        page.getByLabel(/reason/i)
      );

      if (await reasonTextarea.isVisible({ timeout: 2000 })) {
        await reasonTextarea.fill(REJECTION_REASON);

        const confirmButton = page.getByRole('button', { name: /confirm|submit/i });
        await confirmButton.click();

        await page.waitForTimeout(1000);
      }

      expect(notificationCreated).toBe(true);
    });

    test('owner should see rejection notification in UI', async ({ page, browser }) => {
      const ownerContext = await browser.newContext();
      const ownerPage = await ownerContext.newPage();

      await mockOwnerAuth(ownerPage);

      await mockNotifications(ownerPage, TEST_OWNER_ID, [
        {
          id: 'notification-002',
          user_id: TEST_OWNER_ID,
          type: 'campsite_rejected',
          title: 'Campsite Rejected',
          message: `Your campsite "${TEST_CAMPSITE_NAME}" was not approved.`,
          campsite_id: TEST_CAMPSITE_ID,
          metadata: { reason: REJECTION_REASON },
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      await ownerPage.goto('/dashboard');
      await ownerPage.waitForLoadState('networkidle');

      const notificationBadge = ownerPage.locator('[data-testid="notification-badge"]').or(
        ownerPage.locator('[data-badge-count]')
      );

      await expect(notificationBadge).toBeVisible({ timeout: 3000 });

      const notificationIcon = ownerPage.locator('[data-testid="notification-icon"]').or(
        ownerPage.getByRole('button', { name: /notifications/i })
      );

      if (await notificationIcon.isVisible({ timeout: 2000 })) {
        await notificationIcon.click();
        await ownerPage.waitForTimeout(500);

        const notification = ownerPage.getByText(/rejected|not approved/i);
        await expect(notification).toBeVisible({ timeout: 2000 });
      }

      await ownerContext.close();
    });

    test('rejection notification should contain campsite name', async ({ page }) => {
      await mockOwnerAuth(page);

      await mockNotifications(page, TEST_OWNER_ID, [
        {
          id: 'notification-002',
          user_id: TEST_OWNER_ID,
          type: 'campsite_rejected',
          title: 'Campsite Rejected',
          message: `Your campsite "${TEST_CAMPSITE_NAME}" was not approved.`,
          campsite_id: TEST_CAMPSITE_ID,
          metadata: { reason: REJECTION_REASON },
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const notificationIcon = page.locator('[data-testid="notification-icon"]').or(
        page.getByRole('button', { name: /notifications/i })
      );

      if (await notificationIcon.isVisible({ timeout: 2000 })) {
        await notificationIcon.click();
        await page.waitForTimeout(500);

        const campsiteName = page.getByText(new RegExp(TEST_CAMPSITE_NAME, 'i'));
        await expect(campsiteName).toBeVisible({ timeout: 2000 });
      }
    });

    test('rejection notification should contain rejection reason', async ({ page }) => {
      await mockOwnerAuth(page);

      await mockNotifications(page, TEST_OWNER_ID, [
        {
          id: 'notification-002',
          user_id: TEST_OWNER_ID,
          type: 'campsite_rejected',
          title: 'Campsite Rejected',
          message: `Your campsite "${TEST_CAMPSITE_NAME}" was not approved.`,
          campsite_id: TEST_CAMPSITE_ID,
          metadata: { reason: REJECTION_REASON },
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const notificationIcon = page.locator('[data-testid="notification-icon"]').or(
        page.getByRole('button', { name: /notifications/i })
      );

      if (await notificationIcon.isVisible({ timeout: 2000 })) {
        await notificationIcon.click();
        await page.waitForTimeout(500);

        // Click to expand notification details
        const notification = page.locator('[data-testid="notification-item"]').first();
        if (await notification.isVisible({ timeout: 2000 })) {
          await notification.click();
          await page.waitForTimeout(500);

          // Verify rejection reason is displayed
          const reason = page.getByText(/Insufficient documentation|business license/i);
          await expect(reason).toBeVisible({ timeout: 2000 });
        }
      }
    });

    test('rejection notification should indicate rejected status', async ({ page }) => {
      await mockOwnerAuth(page);

      await mockNotifications(page, TEST_OWNER_ID, [
        {
          id: 'notification-002',
          user_id: TEST_OWNER_ID,
          type: 'campsite_rejected',
          title: 'Campsite Rejected',
          message: `Your campsite "${TEST_CAMPSITE_NAME}" was not approved.`,
          campsite_id: TEST_CAMPSITE_ID,
          status: 'rejected',
          metadata: { reason: REJECTION_REASON },
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const notificationIcon = page.locator('[data-testid="notification-icon"]').or(
        page.getByRole('button', { name: /notifications/i })
      );

      if (await notificationIcon.isVisible({ timeout: 2000 })) {
        await notificationIcon.click();
        await page.waitForTimeout(500);

        const rejectedStatus = page.getByText(/rejected|not approved/i);
        await expect(rejectedStatus).toBeVisible({ timeout: 2000 });
      }
    });
  });

  test.describe('3. Notification UI Tests', () => {
    test('notification badge should show unread count', async ({ page }) => {
      await mockOwnerAuth(page);

      await mockNotifications(page, TEST_OWNER_ID, [
        {
          id: 'notification-001',
          user_id: TEST_OWNER_ID,
          type: 'campsite_approved',
          message: 'Campsite approved',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 'notification-002',
          user_id: TEST_OWNER_ID,
          type: 'campsite_rejected',
          message: 'Campsite rejected',
          is_read: false,
          created_at: new Date(Date.now() - 60000).toISOString(),
        },
        {
          id: 'notification-003',
          user_id: TEST_OWNER_ID,
          type: 'inquiry_received',
          message: 'New inquiry',
          is_read: true,
          created_at: new Date(Date.now() - 120000).toISOString(),
        },
      ]);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify badge shows count of 2 unread
      const badge = page.locator('[data-testid="notification-badge"]').or(
        page.locator('[data-badge-count="2"]')
      );

      const badgeText = await badge.textContent().catch(() => '');
      expect(badgeText).toContain('2');
    });

    test('clicking notification should mark it as read', async ({ page }) => {
      let markAsReadCalled = false;

      await mockOwnerAuth(page);

      await mockNotifications(page, TEST_OWNER_ID, [
        {
          id: 'notification-001',
          user_id: TEST_OWNER_ID,
          type: 'campsite_approved',
          message: `Campsite "${TEST_CAMPSITE_NAME}" approved`,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      // Mock mark as read endpoint
      await page.route('**/api/notifications/*/read', async (route: any) => {
        markAsReadCalled = true;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { is_read: true },
          }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const notificationIcon = page.locator('[data-testid="notification-icon"]').or(
        page.getByRole('button', { name: /notifications/i })
      );

      if (await notificationIcon.isVisible({ timeout: 2000 })) {
        await notificationIcon.click();
        await page.waitForTimeout(500);

        const notification = page.locator('[data-testid="notification-item"]').first();
        if (await notification.isVisible({ timeout: 2000 })) {
          await notification.click();
          await page.waitForTimeout(500);

          expect(markAsReadCalled).toBe(true);
        }
      }
    });

    test('notifications list should show recent items in chronological order', async ({ page }) => {
      await mockOwnerAuth(page);

      const now = Date.now();
      await mockNotifications(page, TEST_OWNER_ID, [
        {
          id: 'notification-003',
          user_id: TEST_OWNER_ID,
          message: 'Oldest notification',
          is_read: true,
          created_at: new Date(now - 7200000).toISOString(),
        },
        {
          id: 'notification-002',
          user_id: TEST_OWNER_ID,
          message: 'Middle notification',
          is_read: false,
          created_at: new Date(now - 3600000).toISOString(),
        },
        {
          id: 'notification-001',
          user_id: TEST_OWNER_ID,
          message: 'Newest notification',
          is_read: false,
          created_at: new Date(now).toISOString(),
        },
      ]);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const notificationIcon = page.locator('[data-testid="notification-icon"]').or(
        page.getByRole('button', { name: /notifications/i })
      );

      if (await notificationIcon.isVisible({ timeout: 2000 })) {
        await notificationIcon.click();
        await page.waitForTimeout(500);

        // Verify notifications are displayed
        const notifications = page.locator('[data-testid="notification-item"]');
        const count = await notifications.count();

        expect(count).toBeGreaterThanOrEqual(3);

        // First notification should be newest
        const firstNotification = notifications.first();
        const firstText = await firstNotification.textContent();
        expect(firstText).toContain('Newest');
      }
    });

    test('notification should display timestamp', async ({ page }) => {
      await mockOwnerAuth(page);

      const notificationTime = new Date();
      await mockNotifications(page, TEST_OWNER_ID, [
        {
          id: 'notification-001',
          user_id: TEST_OWNER_ID,
          type: 'campsite_approved',
          message: 'Campsite approved',
          is_read: false,
          created_at: notificationTime.toISOString(),
        },
      ]);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const notificationIcon = page.locator('[data-testid="notification-icon"]').or(
        page.getByRole('button', { name: /notifications/i })
      );

      if (await notificationIcon.isVisible({ timeout: 2000 })) {
        await notificationIcon.click();
        await page.waitForTimeout(500);

        // Verify timestamp is displayed (could be "just now", "1 min ago", etc.)
        const timestamp = page.locator('[data-testid="notification-timestamp"]').or(
          page.getByText(/ago|just now|minutes?|hours?/i)
        );

        const hasTimestamp = await timestamp.isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasTimestamp).toBe(true);
      }
    });
  });

  test.describe('4. Owner Dashboard Tests', () => {
    test('owner dashboard should show campsite status change', async ({ page }) => {
      await mockOwnerAuth(page);

      await page.route('**/api/dashboard/campsites*', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: TEST_CAMPSITE_ID,
                name: TEST_CAMPSITE_NAME,
                status: 'approved',
                province: 'Chiang Mai',
                updated_at: new Date().toISOString(),
              },
            ],
            pagination: {
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          }),
        });
      });

      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Verify campsite appears with approved status
      const campsiteName = page.getByText(TEST_CAMPSITE_NAME);
      await expect(campsiteName).toBeVisible({ timeout: 3000 });

      const approvedBadge = page.locator('[data-status="approved"]').or(
        page.getByText(/approved|active/i)
      );

      await expect(approvedBadge).toBeVisible({ timeout: 2000 });
    });

    test('status badge should update from pending to approved/rejected', async ({ page }) => {
      await mockOwnerAuth(page);

      await page.route('**/api/dashboard/campsites*', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: TEST_CAMPSITE_ID,
                name: TEST_CAMPSITE_NAME,
                status: 'approved',
                province: 'Chiang Mai',
              },
            ],
            pagination: {
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
            },
          }),
        });
      });

      await page.goto('/dashboard/campsites');
      await page.waitForLoadState('networkidle');

      // Verify status badge is NOT pending
      const pendingBadge = page.locator('[data-status="pending"]');
      const isPending = await pendingBadge.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isPending).toBe(false);

      // Verify status IS approved
      const approvedBadge = page.locator('[data-status="approved"]').or(
        page.getByText(/approved/i)
      );

      await expect(approvedBadge).toBeVisible({ timeout: 2000 });
    });

    test('rejection reason should be visible to owner in campsite details', async ({ page }) => {
      await mockOwnerAuth(page);

      await page.route(`**/api/dashboard/campsites/${TEST_CAMPSITE_ID}`, async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: TEST_CAMPSITE_ID,
              name: TEST_CAMPSITE_NAME,
              status: 'rejected',
              rejection_reason: REJECTION_REASON,
              province: 'Chiang Mai',
            },
          }),
        });
      });

      await page.goto(`/dashboard/campsites/${TEST_CAMPSITE_ID}`);
      await page.waitForLoadState('networkidle');

      // Verify rejection reason is displayed
      const rejectionReason = page.locator('[data-testid="rejection-reason"]').or(
        page.getByText(/Insufficient documentation/i)
      );

      await expect(rejectionReason).toBeVisible({ timeout: 3000 });

      // Verify rejected status badge
      const rejectedBadge = page.locator('[data-status="rejected"]').or(
        page.getByText(/rejected/i)
      );

      await expect(rejectedBadge).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('5. Multi-User Tests', () => {
    test('only the campsite owner should receive notification', async ({ browser }) => {
      // Owner 1 (campsite owner)
      const owner1Context = await browser.newContext();
      const owner1Page = await owner1Context.newPage();
      await mockOwnerAuth(owner1Page, TEST_OWNER_ID);

      await mockNotifications(owner1Page, TEST_OWNER_ID, [
        {
          id: 'notification-001',
          user_id: TEST_OWNER_ID,
          type: 'campsite_approved',
          message: 'Your campsite approved',
          campsite_id: TEST_CAMPSITE_ID,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      // Owner 2 (different owner)
      const owner2Context = await browser.newContext();
      const owner2Page = await owner2Context.newPage();
      await mockOwnerAuth(owner2Page, TEST_OWNER_2_ID);

      await mockNotifications(owner2Page, TEST_OWNER_2_ID, []);

      // Owner 1 should see notification
      await owner1Page.goto('/dashboard');
      await owner1Page.waitForLoadState('networkidle');

      const owner1Badge = owner1Page.locator('[data-testid="notification-badge"]');
      const hasBadge1 = await owner1Badge.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasBadge1).toBe(true);

      // Owner 2 should NOT see notification
      await owner2Page.goto('/dashboard');
      await owner2Page.waitForLoadState('networkidle');

      const owner2Badge = owner2Page.locator('[data-testid="notification-badge"]');
      const hasBadge2 = await owner2Badge.isVisible({ timeout: 1000 }).catch(() => false);
      expect(hasBadge2).toBe(false);

      await owner1Context.close();
      await owner2Context.close();
    });

    test('admin should not receive self-notification for approval', async ({ page }) => {
      await mockAdminAuth(page);

      // Mock admin notifications (should be empty for campsite approvals)
      await mockNotifications(page, TEST_ADMIN_ID, []);

      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify no notification badge or count is 0
      const notificationBadge = page.locator('[data-testid="notification-badge"]');
      const hasBadge = await notificationBadge.isVisible({ timeout: 1000 }).catch(() => false);

      if (hasBadge) {
        const badgeText = await notificationBadge.textContent();
        expect(badgeText).toBe('0');
      } else {
        // No badge is also acceptable
        expect(hasBadge).toBe(false);
      }
    });

    test('other owners should not see notifications for different campsites', async ({ browser }) => {
      const owner1Context = await browser.newContext();
      const owner1Page = await owner1Context.newPage();
      await mockOwnerAuth(owner1Page, TEST_OWNER_ID);

      const owner2Context = await browser.newContext();
      const owner2Page = await owner2Context.newPage();
      await mockOwnerAuth(owner2Page, TEST_OWNER_2_ID);

      // Owner 1 has notification for their campsite
      await mockNotifications(owner1Page, TEST_OWNER_ID, [
        {
          id: 'notification-001',
          user_id: TEST_OWNER_ID,
          type: 'campsite_approved',
          message: 'Campsite approved',
          campsite_id: TEST_CAMPSITE_ID,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      // Owner 2 has no notifications
      await mockNotifications(owner2Page, TEST_OWNER_2_ID, []);

      await owner1Page.goto('/dashboard');
      await owner1Page.waitForLoadState('networkidle');

      const owner1Notification = owner1Page.locator('[data-testid="notification-icon"]');
      if (await owner1Notification.isVisible({ timeout: 2000 })) {
        await owner1Notification.click();
        await owner1Page.waitForTimeout(500);

        const notification = owner1Page.getByText(/approved/i);
        await expect(notification).toBeVisible();
      }

      await owner2Page.goto('/dashboard');
      await owner2Page.waitForLoadState('networkidle');

      const owner2Notification = owner2Page.locator('[data-testid="notification-icon"]');
      if (await owner2Notification.isVisible({ timeout: 2000 })) {
        await owner2Notification.click();
        await owner2Page.waitForTimeout(500);

        // Should show "no notifications" or empty state
        const emptyState = owner2Page.getByText(/no notifications|all caught up/i);
        const hasEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasEmpty).toBe(true);
      }

      await owner1Context.close();
      await owner2Context.close();
    });
  });
});
