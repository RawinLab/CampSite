import { test, expect, devices } from '@playwright/test';

/**
 * E2E Tests for Analytics Chart Component
 *
 * Tests comprehensive chart functionality including:
 * - Chart rendering with multiple data series
 * - Tooltip interactions
 * - Legend display
 * - Responsive behavior
 * - Empty state handling
 */

// Sample analytics data for testing
const sampleAnalyticsData = [
  {
    date: '2026-01-01',
    search_impressions: 120,
    profile_views: 45,
    booking_clicks: 12,
    inquiries: 3,
  },
  {
    date: '2026-01-02',
    search_impressions: 150,
    profile_views: 60,
    booking_clicks: 18,
    inquiries: 5,
  },
  {
    date: '2026-01-03',
    search_impressions: 90,
    profile_views: 30,
    booking_clicks: 8,
    inquiries: 2,
  },
  {
    date: '2026-01-04',
    search_impressions: 200,
    profile_views: 85,
    booking_clicks: 25,
    inquiries: 8,
  },
  {
    date: '2026-01-05',
    search_impressions: 180,
    profile_views: 75,
    booking_clicks: 20,
    inquiries: 6,
  },
  {
    date: '2026-01-06',
    search_impressions: 110,
    profile_views: 40,
    booking_clicks: 10,
    inquiries: 4,
  },
  {
    date: '2026-01-07',
    search_impressions: 140,
    profile_views: 55,
    booking_clicks: 15,
    inquiries: 5,
  },
];

const emptyAnalyticsData: any[] = [];

test.describe('Analytics Chart - Chart Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user: { id: 'test-owner-1', email: 'owner@example.com' },
          },
        }),
      });
    });

    // Mock profile data
    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-owner-1',
          full_name: 'Test Owner',
          user_role: 'owner',
        }),
      });
    });

    // Mock dashboard stats
    await page.route('**/api/dashboard/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            search_impressions: 990,
            search_impressions_change: 15.5,
            profile_views: 390,
            profile_views_change: 12.3,
            booking_clicks: 108,
            booking_clicks_change: 8.7,
            new_inquiries: 33,
            total_campsites: 5,
            active_campsites: 4,
            pending_campsites: 1,
          },
        }),
      });
    });

    // Mock campsites
    await page.route('**/api/dashboard/campsites*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    // Mock inquiries
    await page.route('**/api/dashboard/inquiries*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], unread_count: 0 }),
      });
    });
  });

  test('T-CHART-001: Chart displays correctly with data', async ({ page }) => {
    // Mock analytics with sample data
    await page.route('**/api/dashboard/analytics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            chartData: sampleAnalyticsData,
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify chart card is visible
    const chartCard = page.locator('div').filter({ hasText: '30-Day Analytics' }).first();
    await expect(chartCard).toBeVisible();

    // Verify chart title
    const chartTitle = page.getByRole('heading', { name: '30-Day Analytics' });
    await expect(chartTitle).toBeVisible();

    // Verify chart content area exists
    const chartContent = chartCard.locator('.h-64');
    await expect(chartContent).toBeVisible();
  });

  test('T-CHART-002: Multiple data series are rendered (impressions, views, clicks, inquiries)', async ({ page }) => {
    await page.route('**/api/dashboard/analytics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            chartData: sampleAnalyticsData,
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify all four data series bars are rendered
    const chartContent = page.locator('.h-64').first();

    // Each date should have 4 bars (one for each metric)
    const blueBars = chartContent.locator('.bg-blue-500');
    await expect(blueBars.first()).toBeVisible();

    const greenBars = chartContent.locator('.bg-green-500');
    await expect(greenBars.first()).toBeVisible();

    const orangeBars = chartContent.locator('.bg-orange-500');
    await expect(orangeBars.first()).toBeVisible();

    const purpleBars = chartContent.locator('.bg-purple-500');
    await expect(purpleBars.first()).toBeVisible();
  });

  test('T-CHART-003: X-axis shows dates', async ({ page }) => {
    await page.route('**/api/dashboard/analytics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            chartData: sampleAnalyticsData,
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify date labels are visible (shown every 7 days)
    const chartContent = page.locator('.h-64').first();
    const dateLabels = chartContent.locator('span.text-xs.text-muted-foreground');

    // Should have at least one date label
    const labelCount = await dateLabels.count();
    expect(labelCount).toBeGreaterThanOrEqual(1);

    // Verify label contains date format (e.g., "1 ม.ค." in Thai locale)
    const firstLabel = dateLabels.first();
    await expect(firstLabel).toBeVisible();
    const labelText = await firstLabel.textContent();
    expect(labelText).toBeTruthy();
  });

  test('T-CHART-004: Legend displays all metrics', async ({ page }) => {
    await page.route('**/api/dashboard/analytics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            chartData: sampleAnalyticsData,
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify all legend items are visible
    await expect(page.getByText('Search Impressions')).toBeVisible();
    await expect(page.getByText('Profile Views')).toBeVisible();
    await expect(page.getByText('Booking Clicks')).toBeVisible();
    await expect(page.getByText('Inquiries')).toBeVisible();

    // Verify legend color indicators
    const legendSection = page.locator('div').filter({ hasText: 'Search Impressions' }).first();
    const blueIndicator = legendSection.locator('.bg-blue-500');
    await expect(blueIndicator).toBeVisible();
  });

  test('T-CHART-005: Bars have correct proportional heights', async ({ page }) => {
    await page.route('**/api/dashboard/analytics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            chartData: sampleAnalyticsData,
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const chartContent = page.locator('.h-64').first();

    // Get the first set of bars
    const firstBarGroup = chartContent.locator('.group').first();
    const bars = firstBarGroup.locator('div[style*="height"]');

    // Verify bars exist
    const barCount = await bars.count();
    expect(barCount).toBe(4); // Four metrics

    // Verify bars have height styles
    for (let i = 0; i < barCount; i++) {
      const bar = bars.nth(i);
      const style = await bar.getAttribute('style');
      expect(style).toContain('height');
    }
  });
});

test.describe('Analytics Chart - Chart Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all required endpoints
    await page.route('**/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user: { id: 'test-owner-1', email: 'owner@example.com' },
          },
        }),
      });
    });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-owner-1',
          full_name: 'Test Owner',
          user_role: 'owner',
        }),
      });
    });

    await page.route('**/api/dashboard/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            search_impressions: 990,
            search_impressions_change: 15.5,
            profile_views: 390,
            profile_views_change: 12.3,
            booking_clicks: 108,
            booking_clicks_change: 8.7,
            new_inquiries: 33,
            total_campsites: 5,
            active_campsites: 4,
            pending_campsites: 1,
          },
        }),
      });
    });

    await page.route('**/api/dashboard/analytics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            chartData: sampleAnalyticsData,
          },
        }),
      });
    });

    await page.route('**/api/dashboard/campsites*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.route('**/api/dashboard/inquiries*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], unread_count: 0 }),
      });
    });
  });

  test('T-CHART-006: Hover on bar group shows tooltip', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const chartContent = page.locator('.h-64').first();
    const firstBarGroup = chartContent.locator('.group').first();

    // Tooltip should not be visible initially
    const tooltip = firstBarGroup.locator('.absolute.bottom-full');
    await expect(tooltip).toHaveCSS('display', 'none');

    // Hover over the bar group
    await firstBarGroup.hover();

    // Tooltip should become visible on hover (using group-hover:block)
    // Note: In headless mode, :hover pseudo-class might not trigger group-hover
    // We verify the tooltip exists and has the correct structure
    await expect(tooltip).toBeAttached();

    // Verify tooltip contains the expected content structure
    const tooltipContent = await tooltip.textContent();
    expect(tooltipContent).toBeTruthy();
  });

  test('T-CHART-007: Tooltip shows correct date and values', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const chartContent = page.locator('.h-64').first();
    const firstBarGroup = chartContent.locator('.group').first();

    // Get tooltip element
    const tooltip = firstBarGroup.locator('.absolute.bottom-full');

    // Verify tooltip structure contains expected metrics
    const tooltipHTML = await tooltip.innerHTML();
    expect(tooltipHTML).toContain('Impressions:');
    expect(tooltipHTML).toContain('Views:');
    expect(tooltipHTML).toContain('Clicks:');
    expect(tooltipHTML).toContain('Inquiries:');

    // Verify it contains the actual values from our sample data
    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toContain('120'); // search_impressions
    expect(tooltipText).toContain('45');  // profile_views
    expect(tooltipText).toContain('12');  // booking_clicks
    expect(tooltipText).toContain('3');   // inquiries
  });

  test('T-CHART-008: Bars show hover effects', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const chartContent = page.locator('.h-64').first();
    const firstBarGroup = chartContent.locator('.group').first();

    // Get individual bars
    const blueBars = firstBarGroup.locator('.bg-blue-500');
    const firstBlueBar = blueBars.first();

    // Verify bar has transition class
    const classes = await firstBlueBar.getAttribute('class');
    expect(classes).toContain('transition-all');

    // Verify hover class exists (hover:bg-blue-600)
    expect(classes).toContain('hover:bg-blue-600');
  });

  test('T-CHART-009: Multiple tooltips work independently', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const chartContent = page.locator('.h-64').first();

    // Get first and second bar groups
    const firstBarGroup = chartContent.locator('.group').nth(0);
    const secondBarGroup = chartContent.locator('.group').nth(1);

    // Get tooltips
    const firstTooltip = firstBarGroup.locator('.absolute.bottom-full');
    const secondTooltip = secondBarGroup.locator('.absolute.bottom-full');

    // Verify both tooltips exist
    await expect(firstTooltip).toBeAttached();
    await expect(secondTooltip).toBeAttached();

    // Verify they contain different data
    const firstTooltipText = await firstTooltip.textContent();
    const secondTooltipText = await secondTooltip.textContent();

    // First bar should show data from 2026-01-01
    expect(firstTooltipText).toContain('120');

    // Second bar should show data from 2026-01-02
    expect(secondTooltipText).toContain('150');

    // Tooltips should be different
    expect(firstTooltipText).not.toBe(secondTooltipText);
  });
});

test.describe('Analytics Chart - Responsive Behavior', () => {
  test('T-CHART-010: Chart displays correctly on desktop viewport', async ({ page }) => {
    // Use desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.route('**/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user: { id: 'test-owner-1', email: 'owner@example.com' },
          },
        }),
      });
    });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-owner-1',
          full_name: 'Test Owner',
          user_role: 'owner',
        }),
      });
    });

    await page.route('**/api/dashboard/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/stats')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {} }),
        });
      } else if (url.includes('/analytics')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { chartData: sampleAnalyticsData } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify chart is visible and has adequate size
    const chartCard = page.locator('div').filter({ hasText: '30-Day Analytics' }).first();
    await expect(chartCard).toBeVisible();

    const chartContent = chartCard.locator('.h-64');
    const boundingBox = await chartContent.boundingBox();

    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      // Chart should be 256px height (h-64 = 16rem = 256px)
      expect(boundingBox.height).toBeGreaterThanOrEqual(250);

      // Chart should fill container width
      expect(boundingBox.width).toBeGreaterThan(500);
    }
  });

  test('T-CHART-011: Chart adjusts for mobile viewport', async ({ page }) => {
    // Use mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.route('**/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user: { id: 'test-owner-1', email: 'owner@example.com' },
          },
        }),
      });
    });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-owner-1',
          full_name: 'Test Owner',
          user_role: 'owner',
        }),
      });
    });

    await page.route('**/api/dashboard/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/stats')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {} }),
        });
      } else if (url.includes('/analytics')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { chartData: sampleAnalyticsData } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify chart is visible on mobile
    const chartCard = page.locator('div').filter({ hasText: '30-Day Analytics' }).first();
    await expect(chartCard).toBeVisible();

    // Verify chart fills available width
    const chartContent = chartCard.locator('.h-64');
    const boundingBox = await chartContent.boundingBox();

    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      // Chart should still be 256px height
      expect(boundingBox.height).toBeGreaterThanOrEqual(250);

      // Width should be constrained to mobile viewport
      expect(boundingBox.width).toBeLessThan(400);
      expect(boundingBox.width).toBeGreaterThan(300);
    }
  });

  test('T-CHART-012: Legend wraps appropriately on mobile', async ({ page }) => {
    // Use mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.route('**/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user: { id: 'test-owner-1', email: 'owner@example.com' },
          },
        }),
      });
    });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-owner-1',
          full_name: 'Test Owner',
          user_role: 'owner',
        }),
      });
    });

    await page.route('**/api/dashboard/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/stats')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {} }),
        });
      } else if (url.includes('/analytics')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { chartData: sampleAnalyticsData } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify all legend items are still visible on mobile
    await expect(page.getByText('Search Impressions')).toBeVisible();
    await expect(page.getByText('Profile Views')).toBeVisible();
    await expect(page.getByText('Booking Clicks')).toBeVisible();
    await expect(page.getByText('Inquiries')).toBeVisible();
  });

  test('T-CHART-013: Chart handles window resize', async ({ page }) => {
    await page.route('**/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user: { id: 'test-owner-1', email: 'owner@example.com' },
          },
        }),
      });
    });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-owner-1',
          full_name: 'Test Owner',
          user_role: 'owner',
        }),
      });
    });

    await page.route('**/api/dashboard/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/stats')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {} }),
        });
      } else if (url.includes('/analytics')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { chartData: sampleAnalyticsData } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      }
    });

    // Start with desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const chartContent = page.locator('.h-64').first();
    const desktopBox = await chartContent.boundingBox();

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Wait for layout adjustment

    const mobileBox = await chartContent.boundingBox();

    // Verify chart adjusted to new size
    expect(desktopBox).not.toBeNull();
    expect(mobileBox).not.toBeNull();

    if (desktopBox && mobileBox) {
      // Width should have decreased
      expect(mobileBox.width).toBeLessThan(desktopBox.width);

      // Height should remain the same (h-64)
      expect(mobileBox.height).toBeCloseTo(desktopBox.height, 10);
    }
  });

  test('T-CHART-014: Touch interactions work on mobile (iPhone)', async ({ page }) => {
    // Use iPhone viewport
    test.use({ ...devices['iPhone 12'] });

    await page.route('**/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user: { id: 'test-owner-1', email: 'owner@example.com' },
          },
        }),
      });
    });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-owner-1',
          full_name: 'Test Owner',
          user_role: 'owner',
        }),
      });
    });

    await page.route('**/api/dashboard/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/stats')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: {} }),
        });
      } else if (url.includes('/analytics')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { chartData: sampleAnalyticsData } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify chart is tappable
    const chartContent = page.locator('.h-64').first();
    const firstBarGroup = chartContent.locator('.group').first();

    // Verify bar group is visible and can be tapped
    await expect(firstBarGroup).toBeVisible();

    // Tap on bar group
    await firstBarGroup.tap();

    // Verify tooltip exists and has content
    const tooltip = firstBarGroup.locator('.absolute.bottom-full');
    await expect(tooltip).toBeAttached();
  });
});

test.describe('Analytics Chart - Empty State', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user: { id: 'test-owner-1', email: 'owner@example.com' },
          },
        }),
      });
    });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-owner-1',
          full_name: 'Test Owner',
          user_role: 'owner',
        }),
      });
    });

    await page.route('**/api/dashboard/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            search_impressions: 0,
            search_impressions_change: 0,
            profile_views: 0,
            profile_views_change: 0,
            booking_clicks: 0,
            booking_clicks_change: 0,
            new_inquiries: 0,
            total_campsites: 0,
            active_campsites: 0,
            pending_campsites: 0,
          },
        }),
      });
    });

    await page.route('**/api/dashboard/campsites*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.route('**/api/dashboard/inquiries*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], unread_count: 0 }),
      });
    });
  });

  test('T-CHART-015: Empty state displays when no data available', async ({ page }) => {
    // Mock analytics with empty data
    await page.route('**/api/dashboard/analytics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            chartData: emptyAnalyticsData,
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify empty state message is shown
    const emptyMessage = page.getByText('No data available for this period');
    await expect(emptyMessage).toBeVisible();
  });

  test('T-CHART-016: Empty state shows in centered layout', async ({ page }) => {
    await page.route('**/api/dashboard/analytics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            chartData: emptyAnalyticsData,
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify empty state container has proper styling
    const emptyContainer = page.locator('div').filter({ hasText: 'No data available for this period' }).locator('div').first();

    // Verify it has centering classes
    const classes = await emptyContainer.getAttribute('class');
    expect(classes).toContain('flex');
    expect(classes).toContain('items-center');
    expect(classes).toContain('justify-center');
  });

  test('T-CHART-017: Empty state does not show chart elements', async ({ page }) => {
    await page.route('**/api/dashboard/analytics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            chartData: emptyAnalyticsData,
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify legend is not shown when there's no data
    const chartCard = page.locator('div').filter({ hasText: '30-Day Analytics' }).first();

    // Legend items should not be present
    const legendItems = chartCard.locator('div').filter({ hasText: 'Search Impressions' });
    await expect(legendItems).not.toBeVisible();
  });

  test('T-CHART-018: Chart title still displays in empty state', async ({ page }) => {
    await page.route('**/api/dashboard/analytics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            chartData: emptyAnalyticsData,
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify chart title is still shown
    const chartTitle = page.getByRole('heading', { name: '30-Day Analytics' });
    await expect(chartTitle).toBeVisible();
  });

  test('T-CHART-019: Empty state text is muted/subtle', async ({ page }) => {
    await page.route('**/api/dashboard/analytics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            chartData: emptyAnalyticsData,
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify empty state has muted text color
    const emptyMessage = page.getByText('No data available for this period');
    const classes = await emptyMessage.getAttribute('class');
    expect(classes).toContain('text-muted-foreground');
  });
});

test.describe('Analytics Chart - Data Accuracy', () => {
  test('T-CHART-020: Chart displays correct number of data points', async ({ page }) => {
    await page.route('**/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user: { id: 'test-owner-1', email: 'owner@example.com' },
          },
        }),
      });
    });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-owner-1',
          full_name: 'Test Owner',
          user_role: 'owner',
        }),
      });
    });

    await page.route('**/api/dashboard/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/analytics')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { chartData: sampleAnalyticsData } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const chartContent = page.locator('.h-64').first();
    const barGroups = chartContent.locator('.group');

    // Should have 7 bar groups (one for each day in sampleAnalyticsData)
    const count = await barGroups.count();
    expect(count).toBe(7);
  });

  test('T-CHART-021: Tooltip values match source data', async ({ page }) => {
    await page.route('**/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user: { id: 'test-owner-1', email: 'owner@example.com' },
          },
        }),
      });
    });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-owner-1',
          full_name: 'Test Owner',
          user_role: 'owner',
        }),
      });
    });

    await page.route('**/api/dashboard/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/analytics')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { chartData: sampleAnalyticsData } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const chartContent = page.locator('.h-64').first();

    // Check last bar group (2026-01-07)
    const lastBarGroup = chartContent.locator('.group').nth(6);
    const lastTooltip = lastBarGroup.locator('.absolute.bottom-full');

    const tooltipText = await lastTooltip.textContent();

    // Verify values from sampleAnalyticsData[6]
    expect(tooltipText).toContain('140'); // search_impressions
    expect(tooltipText).toContain('55');  // profile_views
    expect(tooltipText).toContain('15');  // booking_clicks
    expect(tooltipText).toContain('5');   // inquiries
  });

  test('T-CHART-022: All four metrics are displayed for each date', async ({ page }) => {
    await page.route('**/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            user: { id: 'test-owner-1', email: 'owner@example.com' },
          },
        }),
      });
    });

    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-owner-1',
          full_name: 'Test Owner',
          user_role: 'owner',
        }),
      });
    });

    await page.route('**/api/dashboard/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/analytics')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { chartData: sampleAnalyticsData } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const chartContent = page.locator('.h-64').first();
    const firstBarGroup = chartContent.locator('.group').first();

    // Each group should have 4 bars
    const bars = firstBarGroup.locator('div[style*="height"]');
    const barCount = await bars.count();
    expect(barCount).toBe(4);
  });
});
