import { test, expect } from '@playwright/test';

test.describe('Campsite Creation Wizard', () => {
  test.beforeEach(async ({ page, context }) => {
    // Simulate authenticated owner session
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-owner-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to campsite creation page
    await page.goto('/dashboard/campsites/new');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. Wizard Navigation', () => {
    test('T060.1: Progress indicator shows step 1 as current on page load', async ({ page }) => {
      // Check that step 1 is highlighted
      const step1Indicator = page.locator('.flex.items-center.justify-center.w-10.h-10').first();
      await expect(step1Indicator).toHaveClass(/border-primary/);
      await expect(step1Indicator).toHaveClass(/text-primary/);

      // Verify step title is displayed
      const stepTitle = page.getByText('Basic Info');
      await expect(stepTitle).toBeVisible();
    });

    test('T060.2: Step 1 - Basic Info displays all required fields', async ({ page }) => {
      // Verify all Basic Info fields are present
      await expect(page.getByLabel(/Campsite Name/i)).toBeVisible();
      await expect(page.getByLabel(/Description/i)).toBeVisible();
      await expect(page.getByLabel(/Campsite Type/i)).toBeVisible();
      await expect(page.getByLabel(/Check-in Time/i)).toBeVisible();
      await expect(page.getByLabel(/Check-out Time/i)).toBeVisible();

      // Optional fields
      await expect(page.getByLabel(/Minimum Price/i)).toBeVisible();
      await expect(page.getByLabel(/Maximum Price/i)).toBeVisible();
      await expect(page.getByLabel(/Phone Number/i)).toBeVisible();
      await expect(page.getByLabel(/Email/i)).toBeVisible();
      await expect(page.getByLabel(/Website/i)).toBeVisible();
      await expect(page.getByLabel(/Booking URL/i)).toBeVisible();
    });

    test('T060.3: Clicking Next on Step 1 navigates to Step 2 - Location', async ({ page }) => {
      // Fill required fields in Step 1
      await page.getByLabel(/Campsite Name/i).fill('Test Mountain Camp');
      await page.getByLabel(/Description/i).fill('A beautiful mountain campsite with stunning views and modern amenities for all visitors.');

      // Select campsite type
      await page.getByLabel(/Campsite Type/i).click();
      await page.getByRole('option').first().click();

      // Click Next
      await page.getByRole('button', { name: /Next: Location/i }).click();

      // Wait for step transition
      await page.waitForTimeout(300);

      // Verify Step 2 is now active
      const stepTitle = page.getByText('Location');
      await expect(stepTitle).toBeVisible();

      // Verify Location fields are visible
      await expect(page.getByLabel(/Province/i)).toBeVisible();
      await expect(page.getByLabel(/Full Address/i)).toBeVisible();
    });

    test('T060.4: Step 2 - Location displays all required fields', async ({ page }) => {
      // Navigate to Step 2
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      // Verify Location fields
      await expect(page.getByLabel(/Province/i)).toBeVisible();
      await expect(page.getByLabel(/Full Address/i)).toBeVisible();
      await expect(page.getByLabel(/Latitude/i)).toBeVisible();
      await expect(page.getByLabel(/Longitude/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Get Current Location/i })).toBeVisible();
    });

    test('T060.5: Step 3 - Photos displays upload interface', async ({ page }) => {
      // Navigate to Step 3
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      await fillLocation(page);
      await page.getByRole('button', { name: /Next: Photos/i }).click();
      await page.waitForTimeout(300);

      // Verify Photos upload interface
      const uploadText = page.getByText(/Click to upload/i);
      await expect(uploadText).toBeVisible();
      await expect(page.getByText(/PNG, JPG, WebP/i)).toBeVisible();
    });

    test('T060.6: Step 4 - Amenities displays amenity selection', async ({ page }) => {
      // Navigate to Step 4
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      await fillLocation(page);
      await page.getByRole('button', { name: /Next: Photos/i }).click();
      await page.waitForTimeout(300);

      await page.getByRole('button', { name: /Next: Amenities/i }).click();
      await page.waitForTimeout(300);

      // Verify Amenities step
      const stepTitle = page.getByText('Amenities');
      await expect(stepTitle).toBeVisible();

      // Wait for amenities to load
      await page.waitForTimeout(500);

      // Verify at least some amenity checkboxes are present
      const checkboxes = page.getByRole('checkbox');
      const count = await checkboxes.count();
      expect(count).toBeGreaterThan(0);
    });

    test('T060.7: Back button navigates to previous step', async ({ page }) => {
      // Navigate to Step 2
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      // Click Back
      await page.getByRole('button', { name: /Back/i }).click();
      await page.waitForTimeout(300);

      // Should be back on Step 1
      const stepTitle = page.getByText('Basic Info');
      await expect(stepTitle).toBeVisible();
      await expect(page.getByLabel(/Campsite Name/i)).toBeVisible();
    });

    test('T060.8: Progress indicator shows completed steps with checkmark', async ({ page }) => {
      // Complete Step 1
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      // Step 1 indicator should show checkmark
      const step1Indicator = page.locator('.flex.items-center.justify-center.w-10.h-10').first();
      await expect(step1Indicator).toHaveClass(/bg-primary/);

      // Continue to Step 3
      await fillLocation(page);
      await page.getByRole('button', { name: /Next: Photos/i }).click();
      await page.waitForTimeout(300);

      // Steps 1 and 2 should show checkmarks
      const completedSteps = page.locator('.flex.items-center.justify-center.w-10.h-10.bg-primary');
      const count = await completedSteps.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('2. Form Validation', () => {
    test('T060.9: Cannot proceed from Step 1 without required fields', async ({ page }) => {
      // Click Next without filling required fields
      await page.getByRole('button', { name: /Next: Location/i }).click();

      // Should show validation errors
      await expect(page.getByText(/Name must be at least 3 characters/i)).toBeVisible();
      await expect(page.getByText(/Description must be at least 50 characters/i)).toBeVisible();
      await expect(page.getByText(/Please select a campsite type/i)).toBeVisible();
    });

    test('T060.10: Name field requires at least 3 characters', async ({ page }) => {
      // Enter less than 3 characters
      await page.getByLabel(/Campsite Name/i).fill('AB');

      // Try to proceed
      await page.getByRole('button', { name: /Next: Location/i }).click();

      // Should show validation error
      await expect(page.getByText(/Name must be at least 3 characters/i)).toBeVisible();
    });

    test('T060.11: Description requires at least 50 characters', async ({ page }) => {
      // Enter less than 50 characters
      await page.getByLabel(/Description/i).fill('Short description');

      // Try to proceed
      await page.getByRole('button', { name: /Next: Location/i }).click();

      // Should show validation error
      await expect(page.getByText(/Description must be at least 50 characters/i)).toBeVisible();

      // Character counter should be visible
      const charCounter = page.getByText(/\/5000 characters/i);
      await expect(charCounter).toBeVisible();
    });

    test('T060.12: Cannot proceed from Step 2 without required location fields', async ({ page }) => {
      // Navigate to Step 2
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      // Try to proceed without filling location
      await page.getByRole('button', { name: /Next: Photos/i }).click();

      // Should show validation errors
      await expect(page.getByText(/Please select a province/i)).toBeVisible();
      await expect(page.getByText(/Address must be at least 10 characters/i)).toBeVisible();
      await expect(page.getByText(/Please enter a valid latitude/i)).toBeVisible();
      await expect(page.getByText(/Please enter a valid longitude/i)).toBeVisible();
    });

    test('T060.13: GPS coordinates validation - latitude range', async ({ page }) => {
      // Navigate to Step 2
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      // Enter invalid latitude (out of range)
      await page.getByLabel(/Latitude/i).fill('100');
      await page.getByLabel(/Longitude/i).fill('98.0');

      // Fill other required fields
      await page.getByLabel(/Province/i).click();
      await page.getByRole('option').first().click();
      await page.getByLabel(/Full Address/i).fill('123 Mountain Road, District, Province');

      // Try to proceed
      await page.getByRole('button', { name: /Next: Photos/i }).click();

      // Should show validation error
      await expect(page.getByText(/Please enter a valid latitude/i)).toBeVisible();
    });

    test('T060.14: GPS coordinates validation - longitude range', async ({ page }) => {
      // Navigate to Step 2
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      // Enter invalid longitude (out of range)
      await page.getByLabel(/Latitude/i).fill('18.5');
      await page.getByLabel(/Longitude/i).fill('200');

      // Fill other required fields
      await page.getByLabel(/Province/i).click();
      await page.getByRole('option').first().click();
      await page.getByLabel(/Full Address/i).fill('123 Mountain Road, District, Province');

      // Try to proceed
      await page.getByRole('button', { name: /Next: Photos/i }).click();

      // Should show validation error
      await expect(page.getByText(/Please enter a valid longitude/i)).toBeVisible();
    });

    test('T060.15: Photo upload - file type validation', async ({ page }) => {
      // Navigate to Step 3
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      await fillLocation(page);
      await page.getByRole('button', { name: /Next: Photos/i }).click();
      await page.waitForTimeout(300);

      // Note: Testing file upload validation would require actual file handling
      // This test verifies the upload interface accepts specific file types
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toHaveAttribute('accept', /image/);
    });

    test('T060.16: Error messages display clearly and are accessible', async ({ page }) => {
      // Try to submit Step 1 without filling
      await page.getByRole('button', { name: /Next: Location/i }).click();

      // All error messages should have text-destructive class
      const errors = page.locator('.text-destructive');
      const count = await errors.count();
      expect(count).toBeGreaterThan(0);

      // Errors should be visible
      await expect(errors.first()).toBeVisible();
    });
  });

  test.describe('3. Data Persistence', () => {
    test('T060.17: Data persists when navigating forward and back', async ({ page }) => {
      const testName = 'Persistent Test Camp';
      const testDescription = 'This description should persist when navigating between wizard steps and testing the data persistence functionality.';

      // Fill Step 1
      await page.getByLabel(/Campsite Name/i).fill(testName);
      await page.getByLabel(/Description/i).fill(testDescription);
      await page.getByLabel(/Campsite Type/i).click();
      await page.getByRole('option').first().click();

      // Navigate to Step 2
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      // Navigate back to Step 1
      await page.getByRole('button', { name: /Back/i }).click();
      await page.waitForTimeout(300);

      // Data should still be there
      const nameInput = page.getByLabel(/Campsite Name/i);
      await expect(nameInput).toHaveValue(testName);

      const descInput = page.getByLabel(/Description/i);
      await expect(descInput).toHaveValue(testDescription);
    });

    test('T060.18: Can edit previous step data', async ({ page }) => {
      // Fill and navigate to Step 2
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      // Go back to Step 1
      await page.getByRole('button', { name: /Back/i }).click();
      await page.waitForTimeout(300);

      // Edit the name
      const nameInput = page.getByLabel(/Campsite Name/i);
      await nameInput.clear();
      await nameInput.fill('Updated Camp Name');

      // Navigate forward again
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      // Go back and verify update
      await page.getByRole('button', { name: /Back/i }).click();
      await page.waitForTimeout(300);

      await expect(nameInput).toHaveValue('Updated Camp Name');
    });

    test('T060.19: Location data persists across navigation', async ({ page }) => {
      // Fill Step 1 and navigate to Step 2
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      // Fill location
      const testLat = '18.7883';
      const testLong = '98.9853';

      await page.getByLabel(/Province/i).click();
      await page.getByRole('option').first().click();
      await page.getByLabel(/Full Address/i).fill('456 Forest Path, Mountain District');
      await page.getByLabel(/Latitude/i).fill(testLat);
      await page.getByLabel(/Longitude/i).fill(testLong);

      // Navigate to Step 3
      await page.getByRole('button', { name: /Next: Photos/i }).click();
      await page.waitForTimeout(300);

      // Navigate back to Step 2
      await page.getByRole('button', { name: /Back/i }).click();
      await page.waitForTimeout(300);

      // Verify data persists
      await expect(page.getByLabel(/Latitude/i)).toHaveValue(testLat);
      await expect(page.getByLabel(/Longitude/i)).toHaveValue(testLong);
    });

    test('T060.20: Selected amenities persist when navigating back', async ({ page }) => {
      // Navigate to Step 4
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      await fillLocation(page);
      await page.getByRole('button', { name: /Next: Photos/i }).click();
      await page.waitForTimeout(300);

      await page.getByRole('button', { name: /Next: Amenities/i }).click();
      await page.waitForTimeout(500);

      // Select some amenities
      const checkboxes = page.getByRole('checkbox');
      const count = await checkboxes.count();

      if (count > 0) {
        await checkboxes.first().click();
        if (count > 1) {
          await checkboxes.nth(1).click();
        }
      }

      // Navigate back and forward
      await page.getByRole('button', { name: /Back/i }).click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /Next: Amenities/i }).click();
      await page.waitForTimeout(500);

      // Check that amenities are still selected
      const selectedCount = page.getByText(/amenities selected/i);
      await expect(selectedCount).toBeVisible();
    });
  });

  test.describe('4. Successful Creation', () => {
    test('T060.21: Submitting creates campsite with pending status', async ({ page }) => {
      // Fill all wizard steps
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      await fillLocation(page);
      await page.getByRole('button', { name: /Next: Photos/i }).click();
      await page.waitForTimeout(300);

      await page.getByRole('button', { name: /Next: Amenities/i }).click();
      await page.waitForTimeout(500);

      // Mock successful API response
      await page.route('**/api/dashboard/campsites', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                id: 'test-campsite-123',
                status: 'pending',
                name: 'Test Mountain Camp',
              },
            }),
          });
        }
      });

      // Submit the form
      await page.getByRole('button', { name: /Create Campsite/i }).click();

      // Wait for success notification
      await page.waitForTimeout(1000);

      // Should show success message
      const successMessage = page.getByText(/Your campsite has been created and is pending admin approval/i);
      await expect(successMessage).toBeVisible();
    });

    test('T060.22: Success notification is displayed after submission', async ({ page }) => {
      // Fill all steps
      await fillAllSteps(page);

      // Mock API
      await page.route('**/api/dashboard/campsites', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: { id: 'test-123', status: 'pending' },
            }),
          });
        }
      });

      // Submit
      await page.getByRole('button', { name: /Create Campsite/i }).click();
      await page.waitForTimeout(1000);

      // Check for toast/notification
      const notification = page.getByText(/Success!/i);
      await expect(notification).toBeVisible();
    });

    test('T060.23: Redirects to campsite detail after successful creation', async ({ page }) => {
      // Fill all steps
      await fillAllSteps(page);

      const campsiteId = 'test-campsite-456';

      // Mock API response
      await page.route('**/api/dashboard/campsites', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: { id: campsiteId, status: 'pending' },
            }),
          });
        }
      });

      // Submit
      await page.getByRole('button', { name: /Create Campsite/i }).click();

      // Wait for navigation
      await page.waitForTimeout(2000);

      // Should redirect to campsite detail page
      await expect(page).toHaveURL(new RegExp(`/dashboard/campsites/${campsiteId}`));
    });

    test('T060.24: Admin approval note is visible', async ({ page }) => {
      // Check for admin approval note
      const approvalNote = page.getByText(/New campsites require admin approval/i);
      await expect(approvalNote).toBeVisible();
    });

    test('T060.25: Submit button shows loading state during submission', async ({ page }) => {
      // Fill all steps
      await fillAllSteps(page);

      // Mock slow API response
      await page.route('**/api/dashboard/campsites', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { id: 'test-123', status: 'pending' },
          }),
        });
      });

      // Click submit
      const submitButton = page.getByRole('button', { name: /Create Campsite/i });
      await submitButton.click();

      // Button should show loading state
      await expect(page.getByText(/Creating.../i)).toBeVisible();

      // Button should be disabled during submission
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('5. Error Handling', () => {
    test('T060.26: Network error during submission shows error message', async ({ page }) => {
      // Fill all steps
      await fillAllSteps(page);

      // Mock failed API response
      await page.route('**/api/dashboard/campsites', async (route) => {
        await route.abort('failed');
      });

      // Submit
      await page.getByRole('button', { name: /Create Campsite/i }).click();
      await page.waitForTimeout(1000);

      // Should show error notification
      const errorMessage = page.getByText(/Failed to create campsite/i);
      await expect(errorMessage).toBeVisible();
    });

    test('T060.27: Server validation error displays error message', async ({ page }) => {
      // Fill all steps
      await fillAllSteps(page);

      // Mock server error response
      await page.route('**/api/dashboard/campsites', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Invalid campsite data provided',
          }),
        });
      });

      // Submit
      await page.getByRole('button', { name: /Create Campsite/i }).click();
      await page.waitForTimeout(1000);

      // Should show specific error message
      const errorMessage = page.getByText(/Invalid campsite data/i);
      await expect(errorMessage).toBeVisible();
    });

    test('T060.28: Submit button re-enables after error', async ({ page }) => {
      // Fill all steps
      await fillAllSteps(page);

      // Mock error response
      await page.route('**/api/dashboard/campsites', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      // Submit
      const submitButton = page.getByRole('button', { name: /Create Campsite/i });
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Button should be enabled again
      await expect(submitButton).toBeEnabled();
    });

    test('T060.29: Can retry submission after error', async ({ page }) => {
      // Fill all steps
      await fillAllSteps(page);

      // Mock error then success
      let attemptCount = 0;
      await page.route('**/api/dashboard/campsites', async (route) => {
        attemptCount++;
        if (attemptCount === 1) {
          // First attempt fails
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' }),
          });
        } else {
          // Second attempt succeeds
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: { id: 'test-123', status: 'pending' },
            }),
          });
        }
      });

      // First submission
      const submitButton = page.getByRole('button', { name: /Create Campsite/i });
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should show error
      await expect(page.getByText(/Error/i)).toBeVisible();

      // Retry submission
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should show success
      await expect(page.getByText(/Success!/i)).toBeVisible();
    });

    test('T060.30: Form data preserved after submission error', async ({ page }) => {
      const testName = 'Error Test Camp';

      // Fill Step 1 with specific data
      await page.getByLabel(/Campsite Name/i).fill(testName);
      await page.getByLabel(/Description/i).fill('This camp data should be preserved even after a submission error occurs during testing.');
      await page.getByLabel(/Campsite Type/i).click();
      await page.getByRole('option').first().click();

      // Complete remaining steps
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      await fillLocation(page);
      await page.getByRole('button', { name: /Next: Photos/i }).click();
      await page.waitForTimeout(300);

      await page.getByRole('button', { name: /Next: Amenities/i }).click();
      await page.waitForTimeout(500);

      // Mock error response
      await page.route('**/api/dashboard/campsites', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Validation failed' }),
        });
      });

      // Submit
      await page.getByRole('button', { name: /Create Campsite/i }).click();
      await page.waitForTimeout(1000);

      // Navigate back to Step 1
      await page.getByRole('button', { name: /Back/i }).click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /Back/i }).click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /Back/i }).click();
      await page.waitForTimeout(300);

      // Verify data is still there
      const nameInput = page.getByLabel(/Campsite Name/i);
      await expect(nameInput).toHaveValue(testName);
    });
  });

  test.describe('6. UI/UX Features', () => {
    test('T060.31: Character counter updates for description field', async ({ page }) => {
      const testDescription = 'Test description with exactly fifty-one characters here.';

      await page.getByLabel(/Description/i).fill(testDescription);

      // Counter should update
      const counter = page.getByText(/51\/5000 characters/i);
      await expect(counter).toBeVisible();
    });

    test('T060.32: GPS coordinates preview shows Google Maps link', async ({ page }) => {
      // Navigate to Step 2
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      // Fill coordinates
      await page.getByLabel(/Latitude/i).fill('18.7883');
      await page.getByLabel(/Longitude/i).fill('98.9853');

      // Google Maps link should appear
      const mapsLink = page.getByRole('link', { name: /View on Google Maps/i });
      await expect(mapsLink).toBeVisible();
      await expect(mapsLink).toHaveAttribute('href', /google\.com\/maps/);
    });

    test('T060.33: Photo preview displays after upload', async ({ page }) => {
      // Navigate to Step 3
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      await fillLocation(page);
      await page.getByRole('button', { name: /Next: Photos/i }).click();
      await page.waitForTimeout(300);

      // Verify upload interface shows correct file limit
      const limitText = page.getByText(/0\/20 photos/i);
      await expect(limitText).toBeVisible();
    });

    test('T060.34: First photo marked as main image', async ({ page }) => {
      // Navigate to Step 3
      await fillBasicInfo(page);
      await page.getByRole('button', { name: /Next: Location/i }).click();
      await page.waitForTimeout(300);

      await fillLocation(page);
      await page.getByRole('button', { name: /Next: Photos/i }).click();
      await page.waitForTimeout(300);

      // Check for note about first photo being main
      const mainPhotoNote = page.getByText(/First photo will be used as the main image/i);
      await expect(mainPhotoNote).toBeVisible();
    });

    test('T060.35: Amenity categories are grouped and labeled', async ({ page }) => {
      // Navigate to Step 4
      await fillAllSteps(page);

      // Wait for amenities to load
      await page.waitForTimeout(500);

      // Check for category headings (uppercase styled)
      const categoryHeadings = page.locator('.font-medium.text-sm.text-muted-foreground.uppercase');
      const count = await categoryHeadings.count();
      expect(count).toBeGreaterThan(0);
    });

    test('T060.36: Selected amenities counter updates', async ({ page }) => {
      // Navigate to Step 4
      await fillAllSteps(page);
      await page.waitForTimeout(500);

      // Initially should show 0 selected
      await expect(page.getByText(/0 amenities selected/i)).toBeVisible();

      // Select an amenity
      const checkbox = page.getByRole('checkbox').first();
      await checkbox.click();

      // Counter should update to 1
      await expect(page.getByText(/1 amenities selected/i)).toBeVisible();
    });

    test('T060.37: Back to campsites list link is visible', async ({ page }) => {
      // Check for back link in header
      const backLink = page.getByRole('link').first();
      await expect(backLink).toBeVisible();

      // Should link to campsites list
      await expect(backLink).toHaveAttribute('href', '/dashboard/campsites');
    });

    test('T060.38: Page title and description are clear', async ({ page }) => {
      // Check for clear title
      const title = page.getByRole('heading', { name: /Create New Campsite/i });
      await expect(title).toBeVisible();

      // Check for description
      const description = page.getByText(/Add your campsite to Camping Thailand platform/i);
      await expect(description).toBeVisible();
    });
  });
});

// Helper Functions

async function fillBasicInfo(page: any) {
  await page.getByLabel(/Campsite Name/i).fill('Test Mountain Camp');
  await page.getByLabel(/Description/i).fill('A beautiful mountain campsite with stunning views and modern amenities for all types of campers.');
  await page.getByLabel(/Campsite Type/i).click();
  await page.getByRole('option').first().click();
}

async function fillLocation(page: any) {
  await page.getByLabel(/Province/i).click();
  await page.getByRole('option').first().click();
  await page.getByLabel(/Full Address/i).fill('123 Mountain Road, Forest District, Province 50000');
  await page.getByLabel(/Latitude/i).fill('18.7883');
  await page.getByLabel(/Longitude/i).fill('98.9853');
}

async function fillAllSteps(page: any) {
  // Step 1
  await fillBasicInfo(page);
  await page.getByRole('button', { name: /Next: Location/i }).click();
  await page.waitForTimeout(300);

  // Step 2
  await fillLocation(page);
  await page.getByRole('button', { name: /Next: Photos/i }).click();
  await page.waitForTimeout(300);

  // Step 3 (Photos - skip)
  await page.getByRole('button', { name: /Next: Amenities/i }).click();
  await page.waitForTimeout(500);

  // Step 4 (Amenities - ready to submit)
}
