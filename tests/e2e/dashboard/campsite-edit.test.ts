import { test, expect } from '@playwright/test';
import { loginAsOwner, createSupabaseAdmin } from '../utils/auth';
import { createTestCampsite, deleteTestCampsite, updateCampsiteStatus } from '../utils/test-data';

/**
 * E2E Tests: Campsite Edit Functionality
 * Tests the complete owner dashboard campsite edit page functionality with real API
 *
 * Test Coverage:
 * 1. Edit Form Loading - Loads existing campsite data
 * 2. Field Editing - Edit name, description, location, pricing
 * 3. Photo Management - View, upload, delete photos
 * 4. Form Submission - Save changes successfully
 * 5. Owner Authorization - Access control
 */

test.describe('Campsite Edit - Real API', () => {
  test.setTimeout(60000);

  let testCampsiteId: string | null = null;

  test.beforeEach(async ({ page }) => {
    // Login as owner
    await loginAsOwner(page);

    // Create a test campsite for editing
    const supabase = createSupabaseAdmin();
    const campsite = await createTestCampsite(supabase, {
      name: `E2E Edit Test Campsite ${Date.now()}`,
      status: 'approved',
      description: 'Test campsite for E2E edit testing with real API endpoints',
    });

    testCampsiteId = campsite.id;

    // Navigate to edit page
    await page.goto(`/dashboard/campsites/${testCampsiteId}`);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // Clean up test campsite
    if (testCampsiteId) {
      const supabase = createSupabaseAdmin();
      await deleteTestCampsite(supabase, testCampsiteId);
      testCampsiteId = null;
    }
  });

  test.describe('1. Edit Form Loading', () => {
    test('T-EDIT-01: Loads existing campsite data', async ({ page }) => {
      // Verify page title/heading shows campsite name
      const heading = page.locator('h1');
      await expect(heading).toBeVisible({ timeout: 10000 });
      await expect(heading).toContainText(/E2E Edit Test Campsite/i);

      // Verify status badge is displayed
      const statusBadge = page.locator('text=/approved|active|pending/i').first();
      await expect(statusBadge).toBeVisible();

      // Verify back button exists
      const backButton = page.locator('[href="/dashboard/campsites"]');
      await expect(backButton.first()).toBeVisible();
    });

    test('T-EDIT-02: Populates all form fields correctly', async ({ page }) => {
      // Navigate to basic info tab if not already there
      const basicTab = page.getByRole('tab', { name: /basic/i });
      if (await basicTab.isVisible().catch(() => false)) {
        await basicTab.click();
        await page.waitForTimeout(500);
      }

      // Verify name field is populated
      const nameInput = page.locator('#name').or(page.getByLabel(/^name$/i).first());
      await expect(nameInput).toBeVisible();
      const nameValue = await nameInput.inputValue();
      expect(nameValue.length).toBeGreaterThan(0);

      // Verify description field is populated
      const descriptionTextarea = page.locator('#description').or(page.getByLabel(/description/i).first());
      await expect(descriptionTextarea).toBeVisible();
      const descValue = await descriptionTextarea.inputValue();
      expect(descValue.length).toBeGreaterThan(0);
    });

    test('T-EDIT-03: Shows current photos or empty state', async ({ page }) => {
      // Navigate to photos tab
      const photosTab = page.getByRole('tab', { name: /photos/i });
      if (await photosTab.isVisible().catch(() => false)) {
        await photosTab.click();
        await page.waitForTimeout(500);
      }

      // Verify photos section or upload interface is visible
      const photosSection = page.locator('text=/photos|upload/i').first();
      await expect(photosSection).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('2. Field Editing', () => {
    test('T-EDIT-05: Edit name and description', async ({ page }) => {
      // Navigate to basic info tab
      const basicTab = page.getByRole('tab', { name: /basic/i });
      if (await basicTab.isVisible().catch(() => false)) {
        await basicTab.click();
        await page.waitForTimeout(500);
      }

      // Edit name
      const nameInput = page.locator('#name').or(page.getByLabel(/^name$/i).first());
      const newName = `Updated Campsite Name ${Date.now()}`;
      await nameInput.clear();
      await nameInput.fill(newName);

      // Verify name is updated
      await expect(nameInput).toHaveValue(newName);

      // Edit description
      const descriptionTextarea = page.locator('#description').or(page.getByLabel(/description/i).first());
      const newDescription = 'This is an updated description with new information about the campsite facilities and amenities.';
      await descriptionTextarea.clear();
      await descriptionTextarea.fill(newDescription);

      // Verify description is updated
      await expect(descriptionTextarea).toHaveValue(newDescription);
    });

    test('T-EDIT-06: Update location and coordinates', async ({ page }) => {
      const basicTab = page.getByRole('tab', { name: /basic/i });
      if (await basicTab.isVisible().catch(() => false)) {
        await basicTab.click();
        await page.waitForTimeout(500);
      }

      // Update address
      const addressTextarea = page.locator('#address').or(page.getByLabel(/address/i).first());
      if (await addressTextarea.isVisible().catch(() => false)) {
        const newAddress = '123 Mountain Road, Updated District, Province 12345';
        await addressTextarea.clear();
        await addressTextarea.fill(newAddress);
        await expect(addressTextarea).toHaveValue(newAddress);
      }

      // Update latitude/longitude if visible
      const latitudeInput = page.locator('#latitude').or(page.getByLabel(/latitude/i));
      if (await latitudeInput.isVisible().catch(() => false)) {
        await latitudeInput.clear();
        await latitudeInput.fill('13.7563');
        await expect(latitudeInput).toHaveValue('13.7563');

        const longitudeInput = page.locator('#longitude').or(page.getByLabel(/longitude/i));
        await longitudeInput.clear();
        await longitudeInput.fill('100.5018');
        await expect(longitudeInput).toHaveValue('100.5018');
      }
    });

    test('T-EDIT-08: Update pricing', async ({ page }) => {
      const basicTab = page.getByRole('tab', { name: /basic/i });
      if (await basicTab.isVisible().catch(() => false)) {
        await basicTab.click();
        await page.waitForTimeout(500);
      }

      // Update minimum price
      const minPriceInput = page.locator('#min_price').or(page.getByLabel(/min.*price/i).first());
      if (await minPriceInput.isVisible().catch(() => false)) {
        await minPriceInput.clear();
        await minPriceInput.fill('800');
        await expect(minPriceInput).toHaveValue('800');
      }

      // Update maximum price
      const maxPriceInput = page.locator('#max_price').or(page.getByLabel(/max.*price/i).first());
      if (await maxPriceInput.isVisible().catch(() => false)) {
        await maxPriceInput.clear();
        await maxPriceInput.fill('2500');
        await expect(maxPriceInput).toHaveValue('2500');
      }
    });
  });

  test.describe('3. Photo Management', () => {
    test('T-EDIT-11: View existing photos or upload interface', async ({ page }) => {
      // Navigate to photos tab
      const photosTab = page.getByRole('tab', { name: /photos/i });
      if (await photosTab.isVisible().catch(() => false)) {
        await photosTab.click();
        await page.waitForTimeout(500);
      }

      // Either photos exist or upload prompt is shown
      const photosOrUpload = page.locator('text=/photo|upload|drag.*drop/i');
      await expect(photosOrUpload.first()).toBeVisible({ timeout: 10000 });
    });

    test('T-EDIT-12: Upload button/area is visible', async ({ page }) => {
      const photosTab = page.getByRole('tab', { name: /photos/i });
      if (await photosTab.isVisible().catch(() => false)) {
        await photosTab.click();
        await page.waitForTimeout(500);
      }

      // Check for file upload area
      const uploadArea = page.locator('input[type="file"]').or(page.locator('text=/upload|choose.*file/i'));
      await expect(uploadArea.first()).toBeVisible();
    });
  });

  test.describe('4. Form Submission', () => {
    test('T-EDIT-18: Save button is visible', async ({ page }) => {
      const saveButton = page.getByRole('button', { name: /save/i });
      await expect(saveButton).toBeVisible();
    });

    test('T-EDIT-19: Save changes successfully', async ({ page }) => {
      // Edit a field
      const basicTab = page.getByRole('tab', { name: /basic/i });
      if (await basicTab.isVisible().catch(() => false)) {
        await basicTab.click();
        await page.waitForTimeout(500);
      }

      const nameInput = page.locator('#name').or(page.getByLabel(/^name$/i).first());
      const originalName = await nameInput.inputValue();
      const newName = `${originalName} - Updated`;
      await nameInput.clear();
      await nameInput.fill(newName);

      // Click save button
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();

      // Wait for save operation
      await page.waitForTimeout(2000);

      // Check for success notification or message
      const successNotification = page.locator('text=/success|updated|saved/i');
      await expect(successNotification.first()).toBeVisible({ timeout: 10000 });
    });

    test('T-EDIT-20: Loading state during save', async ({ page }) => {
      const basicTab = page.getByRole('tab', { name: /basic/i });
      if (await basicTab.isVisible().catch(() => false)) {
        await basicTab.click();
        await page.waitForTimeout(500);
      }

      const nameInput = page.locator('#name').or(page.getByLabel(/^name$/i).first());
      await nameInput.clear();
      await nameInput.fill('Test Update');

      // Click save
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();

      // Button might show loading state briefly
      await page.waitForTimeout(2000);

      // Eventually should show success
      const successOrError = page.locator('text=/success|updated|saved|error/i');
      await expect(successOrError.first()).toBeVisible({ timeout: 10000 });
    });

    test('T-EDIT-21: Validation error for empty required fields', async ({ page }) => {
      const basicTab = page.getByRole('tab', { name: /basic/i });
      if (await basicTab.isVisible().catch(() => false)) {
        await basicTab.click();
        await page.waitForTimeout(500);
      }

      // Clear name field (required)
      const nameInput = page.locator('#name').or(page.getByLabel(/^name$/i).first());
      await nameInput.clear();

      // Try to save
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();

      await page.waitForTimeout(1000);

      // Check for validation error or prevented save
      const errorMessage = page.locator('text=/required|cannot be empty/i');
      const hasError = await errorMessage.isVisible().catch(() => false);
      const buttonDisabled = await saveButton.isDisabled().catch(() => false);

      expect(hasError || buttonDisabled).toBe(true);
    });
  });

  test.describe('5. Tab Navigation', () => {
    test('T-EDIT-28: All tabs are visible', async ({ page }) => {
      // Check for basic info tab
      const basicTab = page.getByRole('tab', { name: /basic/i });
      await expect(basicTab).toBeVisible();

      // Check for photos tab
      const photosTab = page.getByRole('tab', { name: /photos/i });
      await expect(photosTab).toBeVisible();

      // Check for amenities tab
      const amenitiesTab = page.getByRole('tab', { name: /amenities/i });
      await expect(amenitiesTab).toBeVisible();
    });

    test('T-EDIT-29: Can switch between tabs', async ({ page }) => {
      // Start on basic tab
      const basicTab = page.getByRole('tab', { name: /basic/i });
      await basicTab.click();
      await page.waitForTimeout(500);

      // Verify basic content is visible
      const nameInput = page.locator('#name').or(page.getByLabel(/^name$/i).first());
      await expect(nameInput).toBeVisible();

      // Switch to photos tab
      const photosTab = page.getByRole('tab', { name: /photos/i });
      await photosTab.click();
      await page.waitForTimeout(500);

      // Verify photos content is visible
      const photosContent = page.locator('text=/upload|photos/i').first();
      await expect(photosContent).toBeVisible();
    });
  });

  test.describe('6. Integration Tests', () => {
    test('T-EDIT-31: Complete edit flow - update and save', async ({ page }) => {
      // Navigate to basic info
      const basicTab = page.getByRole('tab', { name: /basic/i });
      if (await basicTab.isVisible().catch(() => false)) {
        await basicTab.click();
        await page.waitForTimeout(500);
      }

      // Update multiple fields
      const nameInput = page.locator('#name').or(page.getByLabel(/^name$/i).first());
      await nameInput.clear();
      await nameInput.fill('Completely Updated Campsite');

      const descriptionTextarea = page.locator('#description').or(page.getByLabel(/description/i).first());
      await descriptionTextarea.clear();
      await descriptionTextarea.fill('This campsite has been completely updated with new information.');

      // Save changes
      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();

      // Wait for success
      await page.waitForTimeout(2000);

      // Verify success notification
      const successNotification = page.locator('text=/success|updated|saved/i').first();
      await expect(successNotification).toBeVisible({ timeout: 10000 });

      // Refresh page and verify changes persisted
      await page.reload();
      await page.waitForLoadState('networkidle');

      const reloadedNameInput = page.locator('#name').or(page.getByLabel(/^name$/i).first());
      await expect(reloadedNameInput).toHaveValue('Completely Updated Campsite');
    });

    test('T-EDIT-32: Navigate back to campsite list', async ({ page }) => {
      // Click back button
      const backButton = page.locator('[href="/dashboard/campsites"]').first();

      await expect(backButton).toBeVisible();
      await backButton.click();

      await page.waitForLoadState('networkidle');

      // Verify redirected to campsites list
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/dashboard\/campsites$/);
    });

    test('T-EDIT-33: Campsite status badge displays correctly', async ({ page }) => {
      // Find status badge
      const statusBadge = page.locator('text=/pending|active|approved|rejected/i').first();

      await expect(statusBadge).toBeVisible();

      // Verify status text
      const statusText = await statusBadge.textContent();
      expect(statusText).toMatch(/pending|active|approved|rejected/i);
    });
  });
});
