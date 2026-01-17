import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Review Photo Upload Functionality', () => {
  const validPhotoPath = path.join(__dirname, '../../fixtures/images/valid-photo.jpg');
  const largePhotoPath = path.join(__dirname, '../../fixtures/images/large-photo.jpg');
  const invalidFilePath = path.join(__dirname, '../../fixtures/images/invalid-file.txt');

  test.beforeEach(async ({ page }) => {
    // Navigate to a campsite detail page with review form
    // Assuming campsite ID 1 exists for testing
    await page.goto('/campsites/1');
    await page.waitForLoadState('networkidle');

    // Click "Write a Review" button to open review form
    const writeReviewButton = page.getByRole('button', { name: /write.*review/i });
    await writeReviewButton.click();

    // Wait for review form to appear
    await page.waitForSelector('[data-testid="review-form"]', { timeout: 10000 });
  });

  test('T056.1: Upload button is visible in review form', async ({ page }) => {
    // Verify photo upload button/input exists
    const uploadInput = page.locator('[data-testid="photo-upload-input"]');
    await expect(uploadInput).toBeAttached();

    // Check for upload button or label
    const uploadButton = page.locator('[data-testid="photo-upload-button"]');
    await expect(uploadButton).toBeVisible();
  });

  test('T056.2: Can select and upload a photo file', async ({ page }) => {
    // Upload a valid photo
    const uploadInput = page.locator('[data-testid="photo-upload-input"]');
    await uploadInput.setInputFiles(validPhotoPath);

    // Wait for upload to process
    await page.waitForTimeout(500);

    // Verify photo was added (check for preview or count)
    const photoPreview = page.locator('[data-testid="photo-preview"]').first();
    await expect(photoPreview).toBeVisible();
  });

  test('T056.3: Photo preview appears after selection', async ({ page }) => {
    // Upload a photo
    const uploadInput = page.locator('[data-testid="photo-upload-input"]');
    await uploadInput.setInputFiles(validPhotoPath);

    // Wait for preview to render
    await page.waitForTimeout(500);

    // Verify preview is visible
    const photoPreview = page.locator('[data-testid="photo-preview"]').first();
    await expect(photoPreview).toBeVisible();

    // Verify preview contains an image
    const previewImage = photoPreview.locator('img');
    await expect(previewImage).toBeVisible();

    // Verify image has src attribute (data URL or blob URL)
    const imgSrc = await previewImage.getAttribute('src');
    expect(imgSrc).toBeTruthy();
    expect(imgSrc?.length).toBeGreaterThan(0);
  });

  test('T056.4: Can remove a selected photo', async ({ page }) => {
    // Upload a photo
    const uploadInput = page.locator('[data-testid="photo-upload-input"]');
    await uploadInput.setInputFiles(validPhotoPath);

    // Wait for preview
    await page.waitForTimeout(500);

    // Verify photo is visible
    let photoPreview = page.locator('[data-testid="photo-preview"]').first();
    await expect(photoPreview).toBeVisible();

    // Click remove button
    const removeButton = photoPreview.locator('[data-testid="remove-photo-button"]');
    await expect(removeButton).toBeVisible();
    await removeButton.click();

    // Wait for removal
    await page.waitForTimeout(300);

    // Verify photo was removed
    photoPreview = page.locator('[data-testid="photo-preview"]').first();
    await expect(photoPreview).not.toBeVisible();
  });

  test('T056.5: Maximum 5 photos enforced', async ({ page }) => {
    const uploadInput = page.locator('[data-testid="photo-upload-input"]');

    // Upload 5 photos
    for (let i = 0; i < 5; i++) {
      await uploadInput.setInputFiles(validPhotoPath);
      await page.waitForTimeout(300);
    }

    // Verify 5 photos are displayed
    const photoPreviews = await page.locator('[data-testid="photo-preview"]').all();
    expect(photoPreviews.length).toBe(5);

    // Upload button should be disabled or hidden after 5 photos
    const uploadButton = page.locator('[data-testid="photo-upload-button"]');
    const isDisabled = await uploadButton.isDisabled().catch(() => false);
    const isVisible = await uploadButton.isVisible().catch(() => true);

    // Either disabled or hidden
    expect(isDisabled || !isVisible).toBeTruthy();
  });

  test('T056.6: File size validation rejects files over 5MB', async ({ page }) => {
    // Upload a large file (> 5MB)
    const uploadInput = page.locator('[data-testid="photo-upload-input"]');
    await uploadInput.setInputFiles(largePhotoPath);

    // Wait for validation
    await page.waitForTimeout(500);

    // Verify error message appears
    const errorMessage = page.getByText(/file.*too.*large|exceed.*5.*mb|maximum.*5.*mb/i);
    await expect(errorMessage).toBeVisible();

    // Verify photo was not added
    const photoPreviews = await page.locator('[data-testid="photo-preview"]').all();
    expect(photoPreviews.length).toBe(0);
  });

  test('T056.7: File type validation accepts only images', async ({ page }) => {
    // Try to upload a non-image file
    const uploadInput = page.locator('[data-testid="photo-upload-input"]');
    await uploadInput.setInputFiles(invalidFilePath);

    // Wait for validation
    await page.waitForTimeout(500);

    // Verify error message appears
    const errorMessage = page.getByText(/invalid.*file.*type|only.*image|must.*be.*image/i);
    await expect(errorMessage).toBeVisible();

    // Verify file was not added
    const photoPreviews = await page.locator('[data-testid="photo-preview"]').all();
    expect(photoPreviews.length).toBe(0);
  });

  test('T056.8: Photos are uploaded with review submission', async ({ page }) => {
    // Fill out review form
    const ratingStars = page.locator('[data-testid="rating-star-5"]');
    await ratingStars.click();

    const commentField = page.locator('[data-testid="review-comment"]');
    await commentField.fill('Great campsite with beautiful scenery!');

    // Upload a photo
    const uploadInput = page.locator('[data-testid="photo-upload-input"]');
    await uploadInput.setInputFiles(validPhotoPath);

    // Wait for photo preview
    await page.waitForTimeout(500);

    // Verify photo is attached
    const photoPreview = page.locator('[data-testid="photo-preview"]').first();
    await expect(photoPreview).toBeVisible();

    // Submit review
    const submitButton = page.getByRole('button', { name: /submit.*review/i });
    await submitButton.click();

    // Wait for submission
    await page.waitForTimeout(1000);

    // Verify success (check for success message or redirect)
    const successMessage = page.getByText(/review.*submitted|thank.*you/i);
    const isSuccess = await successMessage.isVisible().catch(() => false);

    if (isSuccess) {
      await expect(successMessage).toBeVisible();
    } else {
      // Alternative: check if form closed and review appears
      const reviewForm = page.locator('[data-testid="review-form"]');
      await expect(reviewForm).not.toBeVisible();
    }
  });

  test('T056.9: Multiple photos can be uploaded and previewed', async ({ page }) => {
    const uploadInput = page.locator('[data-testid="photo-upload-input"]');

    // Upload 3 photos
    for (let i = 0; i < 3; i++) {
      await uploadInput.setInputFiles(validPhotoPath);
      await page.waitForTimeout(300);
    }

    // Verify all 3 photos are displayed
    const photoPreviews = await page.locator('[data-testid="photo-preview"]').all();
    expect(photoPreviews.length).toBe(3);

    // Verify each preview has an image
    for (const preview of photoPreviews) {
      const img = preview.locator('img');
      await expect(img).toBeVisible();
    }
  });

  test('T056.10: Photo upload persists during form interaction', async ({ page }) => {
    // Upload a photo
    const uploadInput = page.locator('[data-testid="photo-upload-input"]');
    await uploadInput.setInputFiles(validPhotoPath);

    // Wait for preview
    await page.waitForTimeout(500);

    // Verify photo is visible
    let photoPreview = page.locator('[data-testid="photo-preview"]').first();
    await expect(photoPreview).toBeVisible();

    // Fill other form fields
    const ratingStars = page.locator('[data-testid="rating-star-4"]');
    await ratingStars.click();

    const commentField = page.locator('[data-testid="review-comment"]');
    await commentField.fill('Nice place to camp');

    // Verify photo is still visible after form interactions
    photoPreview = page.locator('[data-testid="photo-preview"]').first();
    await expect(photoPreview).toBeVisible();

    // Verify photo count hasn't changed
    const photoPreviews = await page.locator('[data-testid="photo-preview"]').all();
    expect(photoPreviews.length).toBe(1);
  });

  test('T056.11: Upload button shows correct state with photo count', async ({ page }) => {
    const uploadInput = page.locator('[data-testid="photo-upload-input"]');

    // Initial state: upload button enabled
    let uploadButton = page.locator('[data-testid="photo-upload-button"]');
    await expect(uploadButton).toBeVisible();
    await expect(uploadButton).toBeEnabled();

    // Upload photos one by one and check button state
    for (let i = 1; i <= 4; i++) {
      await uploadInput.setInputFiles(validPhotoPath);
      await page.waitForTimeout(300);

      // Button should still be enabled (less than 5 photos)
      uploadButton = page.locator('[data-testid="photo-upload-button"]');
      await expect(uploadButton).toBeEnabled();
    }

    // Upload 5th photo
    await uploadInput.setInputFiles(validPhotoPath);
    await page.waitForTimeout(300);

    // Button should now be disabled
    uploadButton = page.locator('[data-testid="photo-upload-button"]');
    const isDisabledOrHidden =
      await uploadButton.isDisabled().catch(() => false) ||
      !(await uploadButton.isVisible().catch(() => true));

    expect(isDisabledOrHidden).toBeTruthy();
  });

  test('T056.12: Can remove and re-add photos', async ({ page }) => {
    const uploadInput = page.locator('[data-testid="photo-upload-input"]');

    // Upload 2 photos
    await uploadInput.setInputFiles(validPhotoPath);
    await page.waitForTimeout(300);
    await uploadInput.setInputFiles(validPhotoPath);
    await page.waitForTimeout(300);

    // Verify 2 photos
    let photoPreviews = await page.locator('[data-testid="photo-preview"]').all();
    expect(photoPreviews.length).toBe(2);

    // Remove first photo
    const removeButton = photoPreviews[0].locator('[data-testid="remove-photo-button"]');
    await removeButton.click();
    await page.waitForTimeout(300);

    // Verify only 1 photo remains
    photoPreviews = await page.locator('[data-testid="photo-preview"]').all();
    expect(photoPreviews.length).toBe(1);

    // Upload another photo
    await uploadInput.setInputFiles(validPhotoPath);
    await page.waitForTimeout(300);

    // Verify 2 photos again
    photoPreviews = await page.locator('[data-testid="photo-preview"]').all();
    expect(photoPreviews.length).toBe(2);
  });
});
