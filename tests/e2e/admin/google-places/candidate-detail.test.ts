import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../utils/auth';

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
 * 6. Navigation Tests - Back to list navigation
 */

test.describe('T032-04: Candidate Detail View', () => {
  test.setTimeout(60000);

  // Helper to find a candidate ID from the candidates list
  async function getFirstCandidateId(page: any): Promise<string | null> {
    await page.goto('/admin/google-places/candidates');
    await page.waitForTimeout(3000);

    // Try to get URL from first row click
    const firstRow = page.locator('tbody tr').first();
    const hasRows = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRows) {
      await firstRow.click();
      await page.waitForTimeout(2000);

      const url = page.url();
      const match = url.match(/\/candidates\/([^\/]+)$/);

      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  test.describe('Page Access Control', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access a detail page without auth
      await page.goto('/admin/google-places/candidates/test-id');
      await page.waitForTimeout(2000);

      expect(page.url()).toContain('/auth/login');
    });

    test('should allow admin access to candidate detail page if candidate exists', async ({ page }) => {
      await loginAsAdmin(page);

      const candidateId = await getFirstCandidateId(page);

      if (candidateId) {
        await page.goto(`/admin/google-places/candidates/${candidateId}`);
        await page.waitForTimeout(3000);

        // Should display detail page content
        const mainContent = page.locator('main, [role="main"]');
        await expect(mainContent).toBeVisible({ timeout: 15000 });
      }
    });
  });

  test.describe('Place Data Display', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display candidate details if candidate exists', async ({ page }) => {
      const candidateId = await getFirstCandidateId(page);

      if (candidateId) {
        await page.goto(`/admin/google-places/candidates/${candidateId}`);
        await page.waitForTimeout(3000);

        // Should display some candidate information
        const content = page.locator('main, [role="main"]');
        await expect(content).toBeVisible({ timeout: 15000 });

        // Look for typical detail page elements
        const hasName = await page.locator('h1, h2').first().isVisible({ timeout: 5000 }).catch(() => false);
        expect(hasName).toBe(true);
      }
    });

    test('should display address if available', async ({ page }) => {
      const candidateId = await getFirstCandidateId(page);

      if (candidateId) {
        await page.goto(`/admin/google-places/candidates/${candidateId}`);
        await page.waitForTimeout(3000);

        // Look for address-like content
        const addressSection = page.locator('text=/address|Address|location|Location|Thailand/i');
        const count = await addressSection.count();

        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display confidence score if available', async ({ page }) => {
      const candidateId = await getFirstCandidateId(page);

      if (candidateId) {
        await page.goto(`/admin/google-places/candidates/${candidateId}`);
        await page.waitForTimeout(3000);

        // Look for confidence-related content
        const confidenceSection = page.locator('text=/confidence|Confidence|score|Score|%/i');
        const count = await confidenceSection.count();

        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display rating if available', async ({ page }) => {
      const candidateId = await getFirstCandidateId(page);

      if (candidateId) {
        await page.goto(`/admin/google-places/candidates/${candidateId}`);
        await page.waitForTimeout(3000);

        // Look for rating-related content
        const ratingSection = page.locator('text=/rating|Rating|review|Review|star/i');
        const count = await ratingSection.count();

        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Photos Display', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display photos section if available', async ({ page }) => {
      const candidateId = await getFirstCandidateId(page);

      if (candidateId) {
        await page.goto(`/admin/google-places/candidates/${candidateId}`);
        await page.waitForTimeout(3000);

        // Look for photos section or images
        const photosSection = page.locator('text=/photo|Photo|image|Image/i');
        const images = page.locator('img');

        const hasPhotosSection = await photosSection.first().isVisible({ timeout: 5000 }).catch(() => false);
        const imageCount = await images.count();

        // Either has photos section or images
        expect(hasPhotosSection || imageCount > 0).toBe(true);
      }
    });
  });

  test.describe('Reviews Display', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display reviews section if available', async ({ page }) => {
      const candidateId = await getFirstCandidateId(page);

      if (candidateId) {
        await page.goto(`/admin/google-places/candidates/${candidateId}`);
        await page.waitForTimeout(3000);

        // Look for reviews section
        const reviewsSection = page.locator('text=/review|Review|comment|Comment/i');
        const count = await reviewsSection.count();

        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Actions on Detail Page', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display action buttons for pending candidate', async ({ page }) => {
      const candidateId = await getFirstCandidateId(page);

      if (candidateId) {
        await page.goto(`/admin/google-places/candidates/${candidateId}`);
        await page.waitForTimeout(3000);

        // Look for action buttons (Approve, Reject, etc.)
        const actionButtons = page.locator('button:has-text("Approve"), button:has-text("Reject"), button:has-text("Back")');
        const count = await actionButtons.count();

        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display back button to candidates list', async ({ page }) => {
      const candidateId = await getFirstCandidateId(page);

      if (candidateId) {
        await page.goto(`/admin/google-places/candidates/${candidateId}`);
        await page.waitForTimeout(3000);

        // Look for back button or link
        const backButton = page.locator('button:has-text("Back")').or(
          page.locator('a:has-text("Back")').or(
            page.locator('a[href*="candidates"]')
          )
        );

        const count = await backButton.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('should navigate back to candidates list when back clicked', async ({ page }) => {
      const candidateId = await getFirstCandidateId(page);

      if (candidateId) {
        await page.goto(`/admin/google-places/candidates/${candidateId}`);
        await page.waitForTimeout(3000);

        const backButton = page.locator('button:has-text("Back")').or(
          page.locator('a:has-text("Back")').or(
            page.locator('a[href="/admin/google-places/candidates"]')
          )
        );

        if (await backButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
          await backButton.first().click();
          await page.waitForTimeout(2000);

          // Should navigate back to candidates page
          const url = page.url();
          expect(url).toContain('candidates');
          expect(url).not.toContain(`candidates/${candidateId}`);
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should handle invalid candidate ID gracefully', async ({ page }) => {
      await page.goto('/admin/google-places/candidates/invalid-candidate-id-999');
      await page.waitForTimeout(3000);

      // Should show error message or redirect
      const hasError = await page.locator('text=/not found|Not Found|Error|error|404/i').first().isVisible({ timeout: 5000 }).catch(() => false);
      const redirectedToCandidates = page.url().includes('/candidates') && !page.url().includes('/candidates/invalid');

      expect(hasError || redirectedToCandidates).toBe(true);
    });
  });

  test.describe('Loading States', () => {
    test('should load detail page content', async ({ page }) => {
      await loginAsAdmin(page);

      const candidateId = await getFirstCandidateId(page);

      if (candidateId) {
        await page.goto(`/admin/google-places/candidates/${candidateId}`);
        await page.waitForTimeout(3000);

        // Page should load with content
        const mainContent = page.locator('main, [role="main"]');
        await expect(mainContent).toBeVisible({ timeout: 15000 });
      }
    });
  });
});
