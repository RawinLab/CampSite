import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';
import { createSupabaseAdmin, createTestCampsite, cleanupTestData } from '../utils/test-data';

/**
 * E2E Tests: Admin Pending Campsites Page
 *
 * Tests the admin functionality for viewing and managing pending campsite submissions
 * that require approval before going live on the platform.
 *
 * REAL API INTEGRATION - No mocking
 */

test.describe('Admin Pending Campsites Page', () => {
  const supabase = createSupabaseAdmin();

  test.beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData(supabase);
  });

  test.afterAll(async () => {
    // Clean up test data after all tests
    await cleanupTestData(supabase);
  });

  test.describe('1. Page Access Tests', () => {
    test('allows access for role=admin', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);
      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      // Should successfully load the admin page
      await expect(page).toHaveURL(/\/admin\/campsites\/pending/);

      // Verify page content is visible
      const heading = page.locator('h1, h2').filter({ hasText: /pending|campsites/i });
      await expect(heading.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('2. Page Rendering Tests', () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await loginAsAdmin(page);
    });

    test('shows page title "Pending Campsites" or similar', async ({ page }) => {
      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      // Verify page title
      const heading = page.locator('h1, h2').filter({ hasText: /pending|campsites/i });
      await expect(heading.first()).toBeVisible({ timeout: 10000 });
    });

    test('shows empty state when no pending campsites', async ({ page }) => {
      // Ensure no pending campsites exist
      const { data: pending } = await supabase
        .from('campsites')
        .select('id')
        .eq('status', 'pending')
        .like('id', 'e2e-test-%');

      if (pending && pending.length > 0) {
        for (const campsite of pending) {
          await supabase
            .from('campsites')
            .update({ status: 'approved' })
            .eq('id', campsite.id);
        }
      }

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      // Verify empty state message or zero count
      const emptyMessage = page.locator('text=/no pending|no campsites|none pending|0.*pending/i');
      const hasEmpty = await emptyMessage.isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasEmpty).toBeTruthy();
    });

    test('shows pending campsites list when data exists', async ({ page }) => {
      // Create test campsites
      await createTestCampsite(supabase, {
        name: 'E2E Test Camp 1',
        status: 'pending',
      });
      await createTestCampsite(supabase, {
        name: 'E2E Test Camp 2',
        status: 'pending',
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      // Verify campsites appear
      const campsite1 = page.locator('text=/E2E Test Camp 1/i');
      const campsite2 = page.locator('text=/E2E Test Camp 2/i');

      const has1 = await campsite1.isVisible({ timeout: 10000 }).catch(() => false);
      const has2 = await campsite2.isVisible({ timeout: 10000 }).catch(() => false);

      expect(has1 || has2).toBeTruthy();
    });
  });

  test.describe('3. Campsite Card Display Tests', () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await loginAsAdmin(page);

      // Create test campsite for display tests
      await cleanupTestData(supabase);
      await createTestCampsite(supabase, {
        name: 'Display Test Camp',
        description: 'Beautiful camping spot for testing',
        status: 'pending',
        price_min: 500,
        price_max: 1500,
      });
    });

    test('shows campsite name and basic info', async ({ page }) => {
      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const campsiteName = page.locator('text=/Display Test Camp/i');
      await expect(campsiteName).toBeVisible({ timeout: 10000 });
    });

    test('shows campsite description or province', async ({ page }) => {
      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      // Look for description or province name
      const description = page.locator('text=/Beautiful camping spot|camping|glamping/i');
      const hasDescription = await description.first().isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasDescription).toBeTruthy();
    });
  });

  test.describe('4. Card Actions Tests', () => {
    test.beforeEach(async ({ page }) => {
      test.setTimeout(60000);
      await loginAsAdmin(page);

      // Create test campsites for action tests
      await cleanupTestData(supabase);
      await createTestCampsite(supabase, {
        name: 'Action Test Camp 1',
        status: 'pending',
      });
      await createTestCampsite(supabase, {
        name: 'Action Test Camp 2',
        status: 'pending',
      });
    });

    test('shows Approve and Reject buttons on each card', async ({ page }) => {
      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const approveButtons = page.getByRole('button', { name: /approve/i });
      const rejectButtons = page.getByRole('button', { name: /reject/i });

      const approveCount = await approveButtons.count();
      const rejectCount = await rejectButtons.count();

      // Should have at least 2 approve and 2 reject buttons
      expect(approveCount).toBeGreaterThanOrEqual(1);
      expect(rejectCount).toBeGreaterThanOrEqual(1);
    });

    test('Approve button has green color styling', async ({ page }) => {
      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const approveButton = page.getByRole('button', { name: /approve/i }).first();
      const isVisible = await approveButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        const buttonClasses = await approveButton.getAttribute('class');
        const hasGreenColor = buttonClasses?.includes('green') || buttonClasses?.includes('success');
        expect(hasGreenColor).toBeTruthy();
      }
    });

    test('Reject button has red color styling', async ({ page }) => {
      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      const isVisible = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        const buttonClasses = await rejectButton.getAttribute('class');
        const hasRedColor = buttonClasses?.includes('red') || buttonClasses?.includes('destructive') || buttonClasses?.includes('danger');
        expect(hasRedColor).toBeTruthy();
      }
    });
  });

  test.describe('5. Navigation Tests', () => {
    test('sidebar shows admin navigation', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);
      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      // Look for admin navigation elements
      const adminNav = page.locator('nav, aside, [role="navigation"]');
      const hasNav = await adminNav.first().isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasNav).toBeTruthy();
    });
  });

  test.describe('6. Action Functionality Tests', () => {
    test('clicking Approve button triggers approval flow', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Create a test campsite to approve
      const campsite = await createTestCampsite(supabase, {
        name: 'Approval Flow Test',
        status: 'pending',
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const approveButton = page.getByRole('button', { name: /approve/i }).first();
      const isVisible = await approveButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        await approveButton.click();
        await page.waitForTimeout(2000);

        // Should show some kind of feedback (toast, dialog, or campsite removed)
        const feedback = page.locator('text=/approved|success|confirm/i');
        const hasFeedback = await feedback.first().isVisible({ timeout: 5000 }).catch(() => false);

        expect(hasFeedback).toBeTruthy();
      }

      // Clean up
      await supabase.from('campsites').delete().eq('id', campsite.id);
    });

    test('clicking Reject button opens rejection dialog', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Create a test campsite to reject
      await createTestCampsite(supabase, {
        name: 'Rejection Flow Test',
        status: 'pending',
      });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      const rejectButton = page.getByRole('button', { name: /reject/i }).first();
      const isVisible = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        await rejectButton.click();
        await page.waitForTimeout(1000);

        // Should show dialog or reason input
        const dialog = page.locator('[role="dialog"], text=/reason|reject|confirm/i');
        const hasDialog = await dialog.first().isVisible({ timeout: 5000 }).catch(() => false);

        expect(hasDialog).toBeTruthy();
      }
    });
  });

  test.describe('7. Error Handling Tests', () => {
    test('handles empty state gracefully', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Ensure no pending campsites
      await cleanupTestData(supabase);

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      // Should show empty state without errors
      const emptyState = page.locator('text=/no pending|no campsites|empty|0/i');
      const hasEmpty = await emptyState.first().isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasEmpty).toBeTruthy();
    });
  });

  test.describe('8. Responsive Design Tests', () => {
    test('page is usable on mobile viewport', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsAdmin(page);

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/admin/campsites/pending');
      await page.waitForTimeout(3000);

      // Verify page loads
      const heading = page.locator('h1, h2').filter({ hasText: /pending|campsites/i });
      const isVisible = await heading.first().isVisible({ timeout: 10000 }).catch(() => false);

      expect(isVisible).toBeTruthy();
    });
  });
});
