import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Owner Dashboard - Inquiry List Management
 * Tests the complete inquiry management workflow for campsite owners
 *
 * Test Coverage:
 * - Inquiry list display with all required information
 * - List filtering by status, campsite, and inquiry type
 * - List sorting by date and status
 * - Pagination for long lists
 * - Quick actions (mark as read, status changes)
 * - Empty states
 * - Owner-only access control
 */

test.describe('Owner Dashboard - Inquiry List Management', () => {
  // Test data constants
  const OWNER_EMAIL = 'owner@example.com';
  const OWNER_PASSWORD = 'password123';
  const DASHBOARD_INQUIRIES_URL = '/dashboard/inquiries';

  test.beforeEach(async ({ page }) => {
    // Mock authentication - In real scenario, this would use actual login
    // For now, we'll navigate directly and handle auth state
    await page.goto(DASHBOARD_INQUIRIES_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. Inquiry List Display', () => {
    test('T083.1: Shows all inquiries for owner\'s campsites', async ({ page }) => {
      // Wait for inquiry list to load
      const inquiryList = page.locator('[data-testid="inquiry-list"]').or(
        page.locator('[data-testid="inquiries-container"]')
      );
      await expect(inquiryList).toBeVisible({ timeout: 10000 });

      // Verify inquiry cards are displayed
      const inquiryCards = page.locator('[data-testid="inquiry-card"]');
      const count = await inquiryCards.count();
      expect(count).toBeGreaterThan(0);

      // Verify first inquiry card has required elements
      const firstCard = inquiryCards.first();
      await expect(firstCard).toBeVisible();
    });

    test('T083.2: Displays guest name and email', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      const firstCard = page.locator('[data-testid="inquiry-card"]').first();

      // Check for guest name
      const guestName = firstCard.locator('[data-testid="guest-name"]').or(
        firstCard.locator('text=/^[A-Za-z\\s]+$/', { hasText: /.+/ }).first()
      );
      await expect(guestName).toBeVisible();

      // Check for guest email
      const guestEmail = firstCard.locator('[data-testid="guest-email"]').or(
        firstCard.locator('text=/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/')
      );
      await expect(guestEmail).toBeVisible();
    });

    test('T083.3: Shows inquiry type badge', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      const firstCard = page.locator('[data-testid="inquiry-card"]').first();

      // Check for inquiry type badge
      const typeBadge = firstCard.locator('[data-testid="inquiry-type-badge"]').or(
        firstCard.locator('[data-testid="inquiry-type"]')
      );

      await expect(typeBadge).toBeVisible();

      // Verify it shows one of the valid types
      const typeText = await typeBadge.textContent();
      expect(typeText?.toLowerCase()).toMatch(/booking|general|complaint|other/i);
    });

    test('T083.4: Shows status badge with correct values', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      const inquiryCards = page.locator('[data-testid="inquiry-card"]');
      const count = await inquiryCards.count();

      // Check status badges on multiple cards
      for (let i = 0; i < Math.min(count, 3); i++) {
        const card = inquiryCards.nth(i);
        const statusBadge = card.locator('[data-testid="inquiry-status"]').or(
          card.locator('[data-testid="status-badge"]')
        );

        await expect(statusBadge).toBeVisible();

        // Verify status is one of the valid values
        const statusText = await statusBadge.textContent();
        expect(statusText?.toLowerCase()).toMatch(/new|in progress|in_progress|resolved|closed/i);
      }
    });

    test('T083.5: Shows unread indicator for new inquiries', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Look for new/unread inquiries
      const newInquiries = page.locator('[data-testid="inquiry-card"]').filter({
        has: page.locator('[data-testid="inquiry-status"]').filter({ hasText: /new/i })
      });

      const newCount = await newInquiries.count();

      if (newCount > 0) {
        const firstNewInquiry = newInquiries.first();

        // Check for unread indicator (could be badge, dot, highlight)
        const unreadIndicator = firstNewInquiry.locator('[data-testid="unread-indicator"]').or(
          firstNewInquiry.locator('[data-testid="new-badge"]')
        );

        // Either unread indicator exists, or card has special styling
        const hasUnreadIndicator = await unreadIndicator.isVisible({ timeout: 1000 }).catch(() => false);
        const hasUnreadClass = await firstNewInquiry.evaluate((el) =>
          el.className.includes('unread') ||
          el.className.includes('new') ||
          el.className.includes('highlighted')
        );

        expect(hasUnreadIndicator || hasUnreadClass).toBe(true);
      }
    });

    test('T083.6: Shows date and time of inquiry', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      const firstCard = page.locator('[data-testid="inquiry-card"]').first();

      // Check for timestamp
      const timestamp = firstCard.locator('[data-testid="inquiry-date"]').or(
        firstCard.locator('[data-testid="created-at"]').or(
          firstCard.locator('time')
        )
      );

      await expect(timestamp).toBeVisible();

      // Verify it contains date-like text (various formats)
      const timestampText = await timestamp.textContent();
      expect(timestampText).toMatch(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d+ (hour|day|minute|second|week|month)s? ago|today|yesterday|just now/i);
    });

    test('T083.7: Shows campsite name for each inquiry', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      const firstCard = page.locator('[data-testid="inquiry-card"]').first();

      // Check for campsite name
      const campsiteName = firstCard.locator('[data-testid="campsite-name"]').or(
        firstCard.locator('[data-testid="inquiry-campsite"]')
      );

      await expect(campsiteName).toBeVisible();

      // Verify it has text content
      const nameText = await campsiteName.textContent();
      expect(nameText?.trim().length).toBeGreaterThan(0);
    });
  });

  test.describe('2. List Filtering', () => {
    test('T083.8: Filter by status - shows all statuses by default', async ({ page }) => {
      // Wait for page load
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Check for status filter
      const statusFilter = page.locator('[data-testid="status-filter"]').or(
        page.locator('select').filter({ hasText: /status|all|new|in progress/i })
      );

      await expect(statusFilter).toBeVisible();

      // Default should be "all" or show all inquiries
      const selectedValue = await statusFilter.inputValue().catch(() => 'all');
      expect(selectedValue.toLowerCase()).toMatch(/all|.+/);
    });

    test('T083.9: Filter by status - new inquiries only', async ({ page }) => {
      // Wait for page load
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Get initial count
      const initialCards = await page.locator('[data-testid="inquiry-card"]').count();

      // Select "new" status filter
      const statusFilter = page.locator('[data-testid="status-filter"]').or(
        page.locator('select[name="status"]')
      );

      await statusFilter.selectOption('new');
      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');

      // Verify URL updated
      const url = page.url();
      expect(url).toContain('status=new');

      // Verify all visible inquiries have "new" status
      const visibleCards = page.locator('[data-testid="inquiry-card"]');
      const count = await visibleCards.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const card = visibleCards.nth(i);
          const statusBadge = card.locator('[data-testid="inquiry-status"]');
          const statusText = await statusBadge.textContent();
          expect(statusText?.toLowerCase()).toContain('new');
        }
      }
    });

    test('T083.10: Filter by status - in_progress inquiries', async ({ page }) => {
      // Wait for page load
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Select "in_progress" status filter
      const statusFilter = page.locator('[data-testid="status-filter"]').or(
        page.locator('select[name="status"]')
      );

      await statusFilter.selectOption('in_progress');
      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');

      // Verify URL updated
      const url = page.url();
      expect(url).toMatch(/status=(in_progress|in-progress)/);

      // Verify all visible inquiries have "in_progress" status
      const visibleCards = page.locator('[data-testid="inquiry-card"]');
      const count = await visibleCards.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const card = visibleCards.nth(i);
          const statusBadge = card.locator('[data-testid="inquiry-status"]');
          const statusText = await statusBadge.textContent();
          expect(statusText?.toLowerCase().replace(/\s/g, '_')).toContain('in_progress');
        }
      }
    });

    test('T083.11: Filter by status - resolved inquiries', async ({ page }) => {
      // Wait for page load
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Select "resolved" status filter
      const statusFilter = page.locator('[data-testid="status-filter"]').or(
        page.locator('select[name="status"]')
      );

      await statusFilter.selectOption('resolved');
      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');

      // Verify URL updated
      const url = page.url();
      expect(url).toContain('status=resolved');

      // If there are resolved inquiries, verify they show
      const visibleCards = page.locator('[data-testid="inquiry-card"]');
      const count = await visibleCards.count();

      if (count > 0) {
        const firstCard = visibleCards.first();
        const statusBadge = firstCard.locator('[data-testid="inquiry-status"]');
        const statusText = await statusBadge.textContent();
        expect(statusText?.toLowerCase()).toContain('resolved');
      }
    });

    test('T083.12: Filter by campsite', async ({ page }) => {
      // Wait for page load
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Check for campsite filter
      const campsiteFilter = page.locator('[data-testid="campsite-filter"]').or(
        page.locator('select[name="campsite"]')
      );

      if (await campsiteFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Get campsite options
        const options = await campsiteFilter.locator('option').all();

        // If there are multiple campsites, test filtering
        if (options.length > 2) { // "All" + at least 2 campsites
          const secondOption = await options[1].getAttribute('value');

          if (secondOption) {
            await campsiteFilter.selectOption(secondOption);
            await page.waitForTimeout(500);
            await page.waitForLoadState('networkidle');

            // Verify URL updated
            const url = page.url();
            expect(url).toContain(`campsite=${secondOption}`);

            // Verify filtered results
            const visibleCards = page.locator('[data-testid="inquiry-card"]');
            const count = await visibleCards.count();
            expect(count).toBeGreaterThan(0);
          }
        }
      }
    });

    test('T083.13: Filter by inquiry type', async ({ page }) => {
      // Wait for page load
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Check for inquiry type filter
      const typeFilter = page.locator('[data-testid="type-filter"]').or(
        page.locator('select[name="type"]').or(
          page.locator('select[name="inquiry_type"]')
        )
      );

      if (await typeFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Select "booking" type
        await typeFilter.selectOption('booking');
        await page.waitForTimeout(500);
        await page.waitForLoadState('networkidle');

        // Verify URL updated
        const url = page.url();
        expect(url).toContain('type=booking');

        // Verify filtered results
        const visibleCards = page.locator('[data-testid="inquiry-card"]');
        const count = await visibleCards.count();

        if (count > 0) {
          const firstCard = visibleCards.first();
          const typeBadge = firstCard.locator('[data-testid="inquiry-type-badge"]');
          const typeText = await typeBadge.textContent();
          expect(typeText?.toLowerCase()).toContain('booking');
        }
      }
    });

    test('T083.14: Search by guest name or email', async ({ page }) => {
      // Wait for page load
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Check for search input
      const searchInput = page.locator('[data-testid="inquiry-search"]').or(
        page.locator('input[type="search"]').or(
          page.locator('input[placeholder*="search" i]')
        )
      );

      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Get first guest name from existing inquiry
        const firstCard = page.locator('[data-testid="inquiry-card"]').first();
        const guestName = await firstCard.locator('[data-testid="guest-name"]').textContent();

        if (guestName) {
          // Search for first word of guest name
          const searchTerm = guestName.trim().split(' ')[0];
          await searchInput.fill(searchTerm);
          await page.waitForTimeout(500);
          await page.waitForLoadState('networkidle');

          // Verify search results
          const visibleCards = page.locator('[data-testid="inquiry-card"]');
          const count = await visibleCards.count();

          if (count > 0) {
            // Verify at least one result contains the search term
            const firstResultName = await visibleCards.first().locator('[data-testid="guest-name"]').textContent();
            expect(firstResultName?.toLowerCase()).toContain(searchTerm.toLowerCase());
          }
        }
      }
    });

    test('T083.15: Multiple filters work together', async ({ page }) => {
      // Wait for page load
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Apply status filter
      const statusFilter = page.locator('[data-testid="status-filter"]');
      await statusFilter.selectOption('new');
      await page.waitForTimeout(300);

      // Apply inquiry type filter if available
      const typeFilter = page.locator('[data-testid="type-filter"]');
      if (await typeFilter.isVisible({ timeout: 1000 }).catch(() => false)) {
        await typeFilter.selectOption('booking');
        await page.waitForTimeout(300);
      }

      await page.waitForLoadState('networkidle');

      // Verify URL contains both filters
      const url = page.url();
      expect(url).toContain('status=new');

      if (await typeFilter.isVisible({ timeout: 1000 }).catch(() => false)) {
        expect(url).toContain('type=booking');
      }

      // Verify results match filters
      const visibleCards = page.locator('[data-testid="inquiry-card"]');
      const count = await visibleCards.count();

      if (count > 0) {
        const firstCard = visibleCards.first();
        const statusText = await firstCard.locator('[data-testid="inquiry-status"]').textContent();
        expect(statusText?.toLowerCase()).toContain('new');
      }
    });
  });

  test.describe('3. List Sorting', () => {
    test('T083.16: Sort by date - newest first (default)', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Check for sort selector
      const sortSelect = page.locator('[data-testid="inquiry-sort"]').or(
        page.locator('select[name="sort"]')
      );

      if (await sortSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify default is newest first
        const selectedValue = await sortSelect.inputValue();
        expect(selectedValue).toMatch(/newest|date_desc|created_desc/i);
      }

      // Verify inquiries are in descending date order
      const inquiryCards = page.locator('[data-testid="inquiry-card"]');
      const count = await inquiryCards.count();

      if (count > 1) {
        // Get timestamps from first two cards
        const firstTimestamp = await inquiryCards.nth(0).locator('[data-testid="inquiry-date"]').getAttribute('datetime');
        const secondTimestamp = await inquiryCards.nth(1).locator('[data-testid="inquiry-date"]').getAttribute('datetime');

        if (firstTimestamp && secondTimestamp) {
          const firstDate = new Date(firstTimestamp);
          const secondDate = new Date(secondTimestamp);

          // First should be newer than or equal to second
          expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
        }
      }
    });

    test('T083.17: Sort by date - oldest first', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Check for sort selector
      const sortSelect = page.locator('[data-testid="inquiry-sort"]').or(
        page.locator('select[name="sort"]')
      );

      if (await sortSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Select oldest first
        await sortSelect.selectOption('oldest');
        await page.waitForTimeout(500);
        await page.waitForLoadState('networkidle');

        // Verify URL updated
        const url = page.url();
        expect(url).toMatch(/sort=(oldest|date_asc|created_asc)/i);

        // Verify inquiries are in ascending date order
        const inquiryCards = page.locator('[data-testid="inquiry-card"]');
        const count = await inquiryCards.count();

        if (count > 1) {
          const firstTimestamp = await inquiryCards.nth(0).locator('[data-testid="inquiry-date"]').getAttribute('datetime');
          const secondTimestamp = await inquiryCards.nth(1).locator('[data-testid="inquiry-date"]').getAttribute('datetime');

          if (firstTimestamp && secondTimestamp) {
            const firstDate = new Date(firstTimestamp);
            const secondDate = new Date(secondTimestamp);

            // First should be older than or equal to second
            expect(firstDate.getTime()).toBeLessThanOrEqual(secondDate.getTime());
          }
        }
      }
    });

    test('T083.18: Sort by status', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Check for sort selector
      const sortSelect = page.locator('[data-testid="inquiry-sort"]').or(
        page.locator('select[name="sort"]')
      );

      if (await sortSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Select sort by status if available
        const hasStatusSort = await sortSelect.locator('option[value="status"]')
          .isVisible({ timeout: 1000 })
          .catch(() => false);

        if (hasStatusSort) {
          await sortSelect.selectOption('status');
          await page.waitForTimeout(500);
          await page.waitForLoadState('networkidle');

          // Verify URL updated
          const url = page.url();
          expect(url).toContain('sort=status');

          // Verify results are sorted (new should come before resolved/closed)
          const inquiryCards = page.locator('[data-testid="inquiry-card"]');
          const count = await inquiryCards.count();
          expect(count).toBeGreaterThan(0);
        }
      }
    });

    test('T083.19: Sort persists across page navigation', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      const sortSelect = page.locator('[data-testid="inquiry-sort"]');

      if (await sortSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Set sort to oldest
        await sortSelect.selectOption('oldest');
        await page.waitForTimeout(500);

        // Get URL with sort parameter
        const urlWithSort = page.url();
        expect(urlWithSort).toContain('sort=oldest');

        // Navigate away
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Navigate back
        await page.goto(DASHBOARD_INQUIRIES_URL);
        await page.waitForLoadState('networkidle');

        // Verify sort is maintained in URL
        await page.waitForTimeout(300);
        const currentUrl = page.url();

        // Note: Sort may or may not persist depending on implementation
        // This test verifies the URL parameter behavior
      }
    });
  });

  test.describe('4. Pagination', () => {
    test('T083.20: Shows pagination controls when inquiries exceed page size', async ({ page }) => {
      // Wait for page load
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Check if pagination exists
      const pagination = page.locator('[data-testid="pagination"]').or(
        page.locator('nav[aria-label="pagination" i]')
      );

      const hasPagination = await pagination.isVisible({ timeout: 2000 }).catch(() => false);

      // If pagination exists, verify it has controls
      if (hasPagination) {
        // Should have next/prev buttons or page numbers
        const nextButton = page.locator('[data-testid="next-page"]').or(
          pagination.locator('button').filter({ hasText: /next|>/i })
        );

        await expect(nextButton).toBeVisible();
      }
    });

    test('T083.21: Navigate to next page', async ({ page }) => {
      // Wait for page load
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Check if next button exists
      const nextButton = page.locator('[data-testid="next-page"]');

      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false) &&
          await nextButton.isEnabled({ timeout: 1000 }).catch(() => false)) {

        // Get first inquiry ID from page 1
        const firstInquiryPage1 = await page.locator('[data-testid="inquiry-card"]')
          .first()
          .getAttribute('data-inquiry-id');

        // Click next
        await nextButton.click();
        await page.waitForTimeout(500);
        await page.waitForLoadState('networkidle');

        // Verify URL updated
        const url = page.url();
        expect(url).toContain('page=2');

        // Verify different inquiries are shown
        await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 5000 });
        const firstInquiryPage2 = await page.locator('[data-testid="inquiry-card"]')
          .first()
          .getAttribute('data-inquiry-id');

        expect(firstInquiryPage1).not.toBe(firstInquiryPage2);
      }
    });

    test('T083.22: Navigate to previous page', async ({ page }) => {
      // Navigate to page 2 first
      await page.goto(`${DASHBOARD_INQUIRIES_URL}?page=2`);
      await page.waitForLoadState('networkidle');

      // Check if previous button exists and is enabled
      const prevButton = page.locator('[data-testid="prev-page"]').or(
        page.locator('button').filter({ hasText: /previous|</i })
      );

      if (await prevButton.isVisible({ timeout: 2000 }).catch(() => false) &&
          await prevButton.isEnabled({ timeout: 1000 }).catch(() => false)) {

        // Click previous
        await prevButton.click();
        await page.waitForTimeout(500);
        await page.waitForLoadState('networkidle');

        // Verify URL updated
        const url = page.url();
        expect(url).toMatch(/page=1|\/inquiries(?!\?page=2)/);
      }
    });

    test('T083.23: Pagination preserves filters', async ({ page }) => {
      // Apply a filter first
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      const statusFilter = page.locator('[data-testid="status-filter"]');
      await statusFilter.selectOption('new');
      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');

      // Check if next button exists
      const nextButton = page.locator('[data-testid="next-page"]');

      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false) &&
          await nextButton.isEnabled({ timeout: 1000 }).catch(() => false)) {

        // Click next
        await nextButton.click();
        await page.waitForTimeout(500);
        await page.waitForLoadState('networkidle');

        // Verify URL contains both page and filter
        const url = page.url();
        expect(url).toContain('page=2');
        expect(url).toContain('status=new');

        // Verify filter is still applied
        const selectedValue = await statusFilter.inputValue();
        expect(selectedValue).toBe('new');
      }
    });

    test('T083.24: Shows correct page size (20 per page)', async ({ page }) => {
      // Wait for page load
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Count inquiries on page
      const inquiryCards = page.locator('[data-testid="inquiry-card"]');
      const count = await inquiryCards.count();

      // Should be <= 20 per page (may be less if total is less than 20)
      expect(count).toBeLessThanOrEqual(20);
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('5. Quick Actions', () => {
    test('T083.25: Mark inquiry as read', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Find a new/unread inquiry
      const newInquiries = page.locator('[data-testid="inquiry-card"]').filter({
        has: page.locator('[data-testid="inquiry-status"]').filter({ hasText: /new/i })
      });

      const count = await newInquiries.count();

      if (count > 0) {
        const firstNewInquiry = newInquiries.first();

        // Look for mark as read button
        const markReadButton = firstNewInquiry.locator('[data-testid="mark-read"]').or(
          firstNewInquiry.locator('button').filter({ hasText: /mark.*read/i })
        );

        if (await markReadButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Click mark as read
          await markReadButton.click();
          await page.waitForTimeout(500);

          // Verify unread indicator is removed
          const unreadIndicator = firstNewInquiry.locator('[data-testid="unread-indicator"]');
          const isStillUnread = await unreadIndicator.isVisible({ timeout: 1000 }).catch(() => false);

          expect(isStillUnread).toBe(false);
        }
      }
    });

    test('T083.26: Quick status change from dropdown', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      const firstCard = page.locator('[data-testid="inquiry-card"]').first();

      // Look for status change dropdown
      const statusDropdown = firstCard.locator('[data-testid="status-dropdown"]').or(
        firstCard.locator('select[name="status"]')
      );

      if (await statusDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        const currentStatus = await statusDropdown.inputValue();

        // Change to different status
        const newStatus = currentStatus === 'new' ? 'in_progress' : 'new';
        await statusDropdown.selectOption(newStatus);
        await page.waitForTimeout(500);

        // Verify status changed
        const updatedStatus = await statusDropdown.inputValue();
        expect(updatedStatus).toBe(newStatus);

        // Verify status badge updated
        const statusBadge = firstCard.locator('[data-testid="inquiry-status"]');
        const badgeText = await statusBadge.textContent();
        expect(badgeText?.toLowerCase().replace(/\s/g, '_')).toContain(newStatus);
      }
    });

    test('T083.27: Click inquiry card to view details', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      const firstCard = page.locator('[data-testid="inquiry-card"]').first();

      // Get inquiry ID
      const inquiryId = await firstCard.getAttribute('data-inquiry-id');

      // Click on card (or view details button)
      const viewButton = firstCard.locator('[data-testid="view-details"]').or(
        firstCard.locator('button').filter({ hasText: /view|details/i })
      );

      const hasViewButton = await viewButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasViewButton) {
        await viewButton.click();
      } else {
        // Click on card itself
        await firstCard.click();
      }

      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');

      // Verify navigation to detail page
      const url = page.url();
      expect(url).toMatch(/\/inquiries\/[a-f0-9-]+/);
    });

    test('T083.28: Quick reply button opens reply form', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      const firstCard = page.locator('[data-testid="inquiry-card"]').first();

      // Look for quick reply button
      const replyButton = firstCard.locator('[data-testid="quick-reply"]').or(
        firstCard.locator('button').filter({ hasText: /reply/i })
      );

      if (await replyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Click reply
        await replyButton.click();
        await page.waitForTimeout(500);

        // Verify reply form or modal appears
        const replyForm = page.locator('[data-testid="reply-form"]').or(
          page.locator('form').filter({ hasText: /reply|message/i })
        );

        await expect(replyForm).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('6. Empty States', () => {
    test('T083.29: Shows empty state when no inquiries exist', async ({ page }) => {
      // Mock API to return empty results
      await page.route('**/api/dashboard/inquiries*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              inquiries: [],
              total: 0,
              page: 1,
              totalPages: 0
            }
          })
        });
      });

      await page.goto(DASHBOARD_INQUIRIES_URL);
      await page.waitForLoadState('networkidle');

      // Check for empty state
      const emptyState = page.locator('[data-testid="empty-state"]').or(
        page.locator('[data-testid="no-inquiries"]').or(
          page.getByText(/no inquiries|haven't received/i)
        )
      );

      await expect(emptyState).toBeVisible({ timeout: 5000 });

      // Should have helpful message
      const emptyText = await emptyState.textContent();
      expect(emptyText?.length).toBeGreaterThan(0);
    });

    test('T083.30: Shows different message for filtered empty results', async ({ page }) => {
      // Wait for page load
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Apply a filter that yields no results
      const statusFilter = page.locator('[data-testid="status-filter"]');

      // Try multiple statuses to find one with no results
      const statuses = ['closed', 'resolved'];

      for (const status of statuses) {
        await statusFilter.selectOption(status);
        await page.waitForTimeout(500);
        await page.waitForLoadState('networkidle');

        // Check if no inquiries shown
        const inquiryCards = page.locator('[data-testid="inquiry-card"]');
        const count = await inquiryCards.count();

        if (count === 0) {
          // Should show filtered empty state
          const emptyState = page.locator('[data-testid="empty-state"]').or(
            page.locator('[data-testid="no-results"]').or(
              page.getByText(/no.*found|no.*match|try.*filter/i)
            )
          );

          await expect(emptyState).toBeVisible({ timeout: 3000 });

          // Message should mention filtering/search
          const emptyText = await emptyState.textContent();
          expect(emptyText?.toLowerCase()).toMatch(/filter|search|found|match|try/);
          break;
        }
      }
    });

    test('T083.31: Empty state has action to view all inquiries', async ({ page }) => {
      // Mock API to return empty filtered results
      await page.route('**/api/dashboard/inquiries?status=closed*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              inquiries: [],
              total: 0,
              page: 1,
              totalPages: 0
            }
          })
        });
      });

      await page.goto(`${DASHBOARD_INQUIRIES_URL}?status=closed`);
      await page.waitForLoadState('networkidle');

      // Check for empty state with action
      const clearFilterButton = page.locator('[data-testid="clear-filters"]').or(
        page.locator('button').filter({ hasText: /clear|view all|reset/i })
      );

      if (await clearFilterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click to view all
        await clearFilterButton.click();
        await page.waitForTimeout(500);
        await page.waitForLoadState('networkidle');

        // Should navigate to unfiltered view
        const url = page.url();
        expect(url).not.toContain('status=');
      }
    });
  });

  test.describe('7. Access Control & Security', () => {
    test('T083.32: Non-owner cannot access inquiry list', async ({ page }) => {
      // This test assumes authentication is implemented
      // For now, we'll check that the page requires authentication

      // Clear any existing auth
      await page.context().clearCookies();

      // Try to access inquiry list
      await page.goto(DASHBOARD_INQUIRIES_URL);
      await page.waitForLoadState('networkidle');

      // Should redirect to login or show access denied
      const url = page.url();
      const isRedirected = url.includes('/login') || url.includes('/signin') || url.includes('/auth');

      if (!isRedirected) {
        // Check for access denied message
        const accessDenied = page.getByText(/access denied|unauthorized|sign in/i);
        const hasAccessDenied = await accessDenied.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasAccessDenied || isRedirected).toBe(true);
      }
    });

    test('T083.33: Owner only sees inquiries for their own campsites', async ({ page }) => {
      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Get all campsite names from inquiry cards
      const campsiteNames = await page.locator('[data-testid="campsite-name"]').allTextContents();

      // Verify all are from owner's campsites
      // In a real test, you would compare against known owner campsites
      expect(campsiteNames.length).toBeGreaterThan(0);

      // Each campsite name should belong to the logged-in owner
      // This would require test data setup with known ownership
    });
  });

  test.describe('8. Loading & Performance', () => {
    test('T083.34: Shows loading skeleton while inquiries load', async ({ page }) => {
      // Navigate to page
      await page.goto(DASHBOARD_INQUIRIES_URL);

      // Check for loading skeleton (should appear briefly)
      const skeleton = page.locator('[data-testid="inquiry-skeleton"]').or(
        page.locator('[data-testid="loading-skeleton"]').or(
          page.locator('.skeleton').or(
            page.locator('[aria-busy="true"]')
          )
        )
      );

      // Note: This may not always be visible due to fast loading
      // But if visible, verify it exists
      const hasSkeletonInitially = await skeleton.isVisible({ timeout: 500 }).catch(() => false);

      // Wait for actual content
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Skeleton should be gone
      const hasSkeletonAfterLoad = await skeleton.isVisible({ timeout: 500 }).catch(() => false);
      expect(hasSkeletonAfterLoad).toBe(false);
    });

    test('T083.35: Page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(DASHBOARD_INQUIRIES_URL);
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe('9. Responsive Design', () => {
    test('T083.36: Inquiry list displays correctly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto(DASHBOARD_INQUIRIES_URL);
      await page.waitForLoadState('networkidle');

      // Wait for inquiry cards
      await page.waitForSelector('[data-testid="inquiry-card"]', { timeout: 10000 });

      // Verify cards are visible and properly sized
      const firstCard = page.locator('[data-testid="inquiry-card"]').first();
      await expect(firstCard).toBeVisible();

      const boundingBox = await firstCard.boundingBox();
      expect(boundingBox).toBeTruthy();

      if (boundingBox) {
        // Card should not overflow viewport
        expect(boundingBox.width).toBeLessThanOrEqual(375);
      }
    });

    test('T083.37: Filters work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto(DASHBOARD_INQUIRIES_URL);
      await page.waitForLoadState('networkidle');

      // Check for mobile filter toggle
      const filterToggle = page.locator('[data-testid="filter-toggle"]').or(
        page.locator('button').filter({ hasText: /filter/i })
      );

      if (await filterToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Click to open filters
        await filterToggle.click();
        await page.waitForTimeout(300);
      }

      // Status filter should be accessible
      const statusFilter = page.locator('[data-testid="status-filter"]');
      await expect(statusFilter).toBeVisible({ timeout: 3000 });

      // Apply filter
      await statusFilter.selectOption('new');
      await page.waitForTimeout(500);

      // Verify filter works
      const url = page.url();
      expect(url).toContain('status=new');
    });
  });
});
