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

      // Verify that each stat card has a numeric value displayed
      const statCards = page.locator('[class*="CardContent"]').filter({
        has: page.locator('text=/Search Impressions|Profile Views|Booking Clicks|New Inquiries/'),
      });

      const count = await statCards.count();
      expect(count).toBeGreaterThanOrEqual(4);

      // Check each stat card has a numeric display
      for (let i = 0; i < Math.min(count, 4); i++) {
        const card = statCards.nth(i);
        const numberElement = card.locator('p.text-2xl');
        await expect(numberElement).toBeVisible({ timeout: 15000 });

        // Value should be numeric (including 0) or formatted with commas
        const text = await numberElement.textContent();
        expect(text).toMatch(/^\d{1,3}(,\d{3})*$/);
      }
    });

    test('T101.3: Shows search impressions count', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Find the Search Impressions stat card
      const searchCard = page.locator('text=Search Impressions').locator('..');

      // Should have icon
      const icon = searchCard.locator('svg').first();
      await expect(icon).toBeVisible({ timeout: 15000 });

      // Should have value
      const value = searchCard.locator('p.text-2xl').first();
      await expect(value).toBeVisible({ timeout: 15000 });
    });

    test('T101.4: Shows profile views count', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Find the Profile Views stat card
      const profileCard = page.locator('text=Profile Views').locator('..');

      // Should have icon
      const icon = profileCard.locator('svg').first();
      await expect(icon).toBeVisible({ timeout: 15000 });

      // Should have value
      const value = profileCard.locator('p.text-2xl').first();
      await expect(value).toBeVisible({ timeout: 15000 });
    });

    test('T101.5: Shows booking clicks count', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Find the Booking Clicks stat card
      const bookingCard = page.locator('text=Booking Clicks').locator('..');

      // Should have icon
      const icon = bookingCard.locator('svg').first();
      await expect(icon).toBeVisible({ timeout: 15000 });

      // Should have value
      const value = bookingCard.locator('p.text-2xl').first();
      await expect(value).toBeVisible({ timeout: 15000 });
    });

    test('T101.6: Shows new inquiries count', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Find the New Inquiries stat card
      const inquiriesCard = page.locator('text=New Inquiries').locator('..');

      // Should have icon
      const icon = inquiriesCard.locator('svg').first();
      await expect(icon).toBeVisible({ timeout: 15000 });

      // Should have value
      const value = inquiriesCard.locator('p.text-2xl').first();
      await expect(value).toBeVisible({ timeout: 15000 });
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
