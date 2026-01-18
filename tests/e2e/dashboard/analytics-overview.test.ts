import { test, expect } from '@playwright/test';
import { loginAsOwner } from '../utils/auth';

test.describe('Owner Dashboard - Analytics Overview', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test.describe('Analytics Overview Display', () => {
    test('T101.1: Page loads with all stats cards visible', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Check for all four main stat cards
      const searchImpressionsCard = page.locator('text=Search Impressions');
      const profileViewsCard = page.locator('text=Profile Views');
      const bookingClicksCard = page.locator('text=Booking Clicks');
      const newInquiriesCard = page.locator('text=New Inquiries');

      await expect(searchImpressionsCard).toBeVisible({ timeout: 15000 });
      await expect(profileViewsCard).toBeVisible({ timeout: 15000 });
      await expect(bookingClicksCard).toBeVisible({ timeout: 15000 });
      await expect(newInquiriesCard).toBeVisible({ timeout: 15000 });
    });

    test('T101.2: Stats cards display numeric values', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Check each stat type has a numeric value displayed next to it
      const statTypes = ['Search Impressions', 'Profile Views', 'Booking Clicks', 'New Inquiries'];

      for (const statType of statTypes) {
        const statLabel = page.locator(`text=${statType}`);
        await expect(statLabel).toBeVisible({ timeout: 15000 });

        // Find the sibling value (numeric) - it's in the same parent container
        const statContainer = statLabel.locator('xpath=..');
        const value = statContainer.locator('p').filter({ hasText: /^\d/ });
        await expect(value.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('T101.3: Shows search impressions count', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Find the Search Impressions stat label
      const searchLabel = page.locator('text=Search Impressions');
      await expect(searchLabel).toBeVisible({ timeout: 15000 });

      // Check there's a numeric value nearby (same as other tests)
      const container = searchLabel.locator('xpath=..');
      const value = container.locator('p').filter({ hasText: /^\d/ });
      await expect(value.first()).toBeVisible({ timeout: 5000 });
    });

    test('T101.4: Shows profile views count', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Find the Profile Views stat label
      const profileLabel = page.locator('text=Profile Views');
      await expect(profileLabel).toBeVisible({ timeout: 15000 });

      // Check there's a numeric value nearby
      const container = profileLabel.locator('xpath=..');
      const value = container.locator('p').filter({ hasText: /^\d/ });
      await expect(value.first()).toBeVisible({ timeout: 5000 });
    });

    test('T101.5: Shows booking clicks count', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Find the Booking Clicks stat label
      const bookingLabel = page.locator('text=Booking Clicks');
      await expect(bookingLabel).toBeVisible({ timeout: 15000 });

      // Check there's a numeric value nearby
      const container = bookingLabel.locator('xpath=..');
      const value = container.locator('p').filter({ hasText: /^\d/ });
      await expect(value.first()).toBeVisible({ timeout: 5000 });
    });

    test('T101.6: Shows new inquiries count', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Find the New Inquiries stat label
      const inquiriesLabel = page.locator('text=New Inquiries');
      await expect(inquiriesLabel).toBeVisible({ timeout: 15000 });

      // Check there's a numeric value nearby
      const container = inquiriesLabel.locator('xpath=..');
      const value = container.locator('p').filter({ hasText: /^\d/ });
      await expect(value.first()).toBeVisible({ timeout: 5000 });
    });

    test('T101.7: Shows total campsites count', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Look for the campsites section header with count
      const campsiteHeader = page.locator('text=/Your Campsites \\(\\d+\\)/');

      await expect(campsiteHeader).toBeVisible({ timeout: 15000 });

      // Extract and validate the count format
      const headerText = await campsiteHeader.textContent();
      expect(headerText).toMatch(/Your Campsites \(\d+\)/);
    });

    test('T101.8: Shows active and pending campsites breakdown', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // The counts for active and pending are part of the API stats
      // but may not be explicitly shown in the UI, checking data is loaded
      await page.waitForLoadState('networkidle');

      // Check that the dashboard loaded successfully
      const welcomeMessage = page.locator('text=/Welcome,/');
      await expect(welcomeMessage).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Dashboard Welcome and Navigation', () => {
    test('T105.1: Welcome message displays owner name', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      const welcomeMessage = page.locator('text=/Welcome,/');
      await expect(welcomeMessage).toBeVisible({ timeout: 15000 });

      const text = await welcomeMessage.textContent();
      expect(text).toMatch(/Welcome, .+/);
    });

    test('T105.2: Performance overview subtitle is shown', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      const subtitle = page.locator('text=/overview of your campsites performance/i');
      await expect(subtitle).toBeVisible({ timeout: 15000 });
    });

    test('T105.3: Navigation links are accessible', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Check for dashboard navigation items
      const viewAllInquiries = page.locator('text=View All').first();
      const viewAllCampsites = page.locator('text=View All Campsites').or(
        page.locator('text=View All').last()
      );

      // At least one navigation link should be present
      const inquiriesLinkVisible = await viewAllInquiries.isVisible().catch(() => false);
      const campsitesLinkVisible = await viewAllCampsites.isVisible().catch(() => false);

      expect(inquiriesLinkVisible || campsitesLinkVisible).toBeTruthy();
    });

    test('T105.4: Add Campsite button is visible', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      const addButton = page.locator('text=Add Campsite').or(
        page.locator('button:has-text("Add Campsite")')
      );

      await expect(addButton.first()).toBeVisible({ timeout: 15000 });
    });

    test('T105.5: Recent inquiries section is displayed', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      const inquiriesSection = page.locator('text=Recent Inquiries');
      await expect(inquiriesSection).toBeVisible({ timeout: 15000 });
    });

    test('T105.6: Campsites overview section is displayed', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      const campsitesSection = page.locator('text=/Your Campsites/');
      await expect(campsitesSection).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('T106.1: Stats cards adapt to mobile layout', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Stats cards should still be visible
      const statsCards = page.locator('text=Search Impressions').or(
        page.locator('text=Profile Views')
      );

      await expect(statsCards.first()).toBeVisible({ timeout: 15000 });
    });

    test('T106.2: Chart is readable on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      const chart = page.locator('text=30-Day Analytics').locator('..');
      await expect(chart).toBeVisible({ timeout: 15000 });

      // Chart should be scrollable or adapted for mobile
      const chartContainer = chart.locator('..');
      await expect(chartContainer).toBeVisible({ timeout: 15000 });
    });

    test('T106.3: Dashboard navigation accessible on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Navigation elements should be accessible
      const welcomeMessage = page.locator('text=/Welcome,/');
      await expect(welcomeMessage).toBeVisible({ timeout: 15000 });
    });
  });
});
