import { test, expect } from '@playwright/test';
import request from 'supertest';
import app from '../../../apps/campsite-backend/src/app';
import { supabaseAdmin } from '../../../apps/campsite-backend/src/lib/supabase';

/**
 * E2E Tests: Duplicate Review Prevention (T057)
 * Tests that users can only submit one review per campsite
 *
 * Tests cover:
 * 1. User can submit first review
 * 2. Form shows message when user already reviewed
 * 3. Cannot submit second review for same campsite
 * 4. Can still review different campsites
 * 5. Shows existing review to user
 */

test.describe('E2E: Duplicate Review Prevention', () => {
  let authToken: string;
  let userId: string;
  let campsiteId1: string;
  let campsiteId2: string;
  let reviewId: string;

  test.beforeAll(async () => {
    // Create test user
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: `test-duplicate-review-${Date.now()}@example.com`,
      password: 'testPassword123!',
      email_confirm: true,
    });

    if (signUpError || !authData.user) {
      throw new Error('Failed to create test user');
    }

    userId = authData.user.id;

    // Create user profile
    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name: 'Test Reviewer',
      user_role: 'user',
    });

    // Sign in to get access token
    const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
      email: authData.user.email!,
      password: 'testPassword123!',
    });

    if (signInData.session) {
      authToken = signInData.session.access_token;
    }

    // Create test campsites
    const { data: campsite1 } = await supabaseAdmin
      .from('campsites')
      .insert({
        owner_id: userId,
        name: `Test Campsite 1 ${Date.now()}`,
        description: 'First test campsite for duplicate review tests',
        slug: `test-campsite-1-${Date.now()}`,
        campsite_type: 'camping',
        province_id: 1,
        status: 'approved',
        min_price: 500,
        max_price: 1500,
        latitude: 13.7563,
        longitude: 100.5018,
      })
      .select()
      .single();

    const { data: campsite2 } = await supabaseAdmin
      .from('campsites')
      .insert({
        owner_id: userId,
        name: `Test Campsite 2 ${Date.now()}`,
        description: 'Second test campsite for duplicate review tests',
        slug: `test-campsite-2-${Date.now()}`,
        campsite_type: 'glamping',
        province_id: 1,
        status: 'approved',
        min_price: 1000,
        max_price: 2500,
        latitude: 13.7564,
        longitude: 100.5019,
      })
      .select()
      .single();

    if (!campsite1 || !campsite2) {
      throw new Error('Failed to create test campsites');
    }

    campsiteId1 = campsite1.id;
    campsiteId2 = campsite2.id;
  });

  test.afterAll(async () => {
    // Clean up test data
    if (reviewId) {
      await supabaseAdmin.from('reviews').delete().eq('id', reviewId);
    }
    if (campsiteId1) {
      await supabaseAdmin.from('reviews').delete().eq('campsite_id', campsiteId1);
      await supabaseAdmin.from('campsites').delete().eq('id', campsiteId1);
    }
    if (campsiteId2) {
      await supabaseAdmin.from('reviews').delete().eq('campsite_id', campsiteId2);
      await supabaseAdmin.from('campsites').delete().eq('id', campsiteId2);
    }
    if (userId) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }
  });

  test('T057.1: User can submit first review successfully', async ({ page }) => {
    // Navigate to campsite page
    await page.goto(`/campsites/${campsiteId1}`);
    await page.waitForLoadState('networkidle');

    // Mock authentication by setting token in storage or cookie
    await page.evaluate((token) => {
      localStorage.setItem('supabase.auth.token', token);
    }, authToken);

    // Reload to apply auth
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Find and click "Write a Review" button
    const writeReviewButton = page.getByRole('button', { name: /write.*review/i });
    await writeReviewButton.click();

    // Fill review form
    await page.getByLabel(/rating/i).first().click();
    await page.getByLabel(/select.*4.*stars?/i).click();

    await page.getByLabel(/reviewer.*type/i).selectOption('solo');

    await page.getByLabel(/review.*content/i).fill(
      'This is my first review for this campsite. Great location and facilities!'
    );

    // Submit the form
    const submitButton = page.getByRole('button', { name: /submit.*review/i });
    await submitButton.click();

    // Wait for success message
    await page.waitForTimeout(1000);

    // Verify success message or redirect
    const successMessage = page.getByText(/review.*submitted.*successfully/i);
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Store review ID for cleanup
    const { data: review } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('campsite_id', campsiteId1)
      .eq('user_id', userId)
      .single();

    if (review) {
      reviewId = review.id;
    }
  });

  test('T057.2: Form shows message when user already reviewed', async ({ page }) => {
    // Ensure a review exists from previous test
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('campsite_id', campsiteId1)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingReview) {
      // Create a review if it doesn't exist
      const { data: newReview } = await supabaseAdmin
        .from('reviews')
        .insert({
          campsite_id: campsiteId1,
          user_id: userId,
          rating_overall: 4,
          reviewer_type: 'solo',
          content: 'This is my existing review for this campsite. Great location and facilities!',
        })
        .select()
        .single();

      if (newReview) {
        reviewId = newReview.id;
      }
    }

    // Navigate to campsite page
    await page.goto(`/campsites/${campsiteId1}`);
    await page.waitForLoadState('networkidle');

    // Set authentication
    await page.evaluate((token) => {
      localStorage.setItem('supabase.auth.token', token);
    }, authToken);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for message indicating user already reviewed
    const alreadyReviewedMessage = page.getByText(/you.*already.*reviewed/i);
    await expect(alreadyReviewedMessage).toBeVisible({ timeout: 5000 });

    // Verify "Write a Review" button is either hidden or disabled
    const writeReviewButton = page.getByRole('button', { name: /write.*review/i });
    const isButtonVisible = await writeReviewButton.isVisible().catch(() => false);

    if (isButtonVisible) {
      // If visible, it should be disabled
      await expect(writeReviewButton).toBeDisabled();
    }
  });

  test('T057.3: Cannot submit second review via API for same campsite', async () => {
    // Ensure first review exists
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('campsite_id', campsiteId1)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingReview) {
      // Create first review
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          campsite_id: campsiteId1,
          rating_overall: 4,
          reviewer_type: 'solo',
          content: 'This is my first review for duplicate test.',
        })
        .expect(201);
    }

    // Attempt to submit duplicate review via API
    const response = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        campsite_id: campsiteId1,
        rating_overall: 5,
        reviewer_type: 'couple',
        content: 'Trying to submit another review for the same campsite. Should fail.',
      });

    // Should return 400 error
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('You have already reviewed this campsite');
  });

  test('T057.4: User can still review different campsites', async ({ page }) => {
    // Navigate to second campsite page
    await page.goto(`/campsites/${campsiteId2}`);
    await page.waitForLoadState('networkidle');

    // Set authentication
    await page.evaluate((token) => {
      localStorage.setItem('supabase.auth.token', token);
    }, authToken);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify "Write a Review" button is available
    const writeReviewButton = page.getByRole('button', { name: /write.*review/i });
    await expect(writeReviewButton).toBeVisible();
    await expect(writeReviewButton).toBeEnabled();

    // Click and fill review form
    await writeReviewButton.click();

    await page.getByLabel(/rating/i).first().click();
    await page.getByLabel(/select.*5.*stars?/i).click();

    await page.getByLabel(/reviewer.*type/i).selectOption('couple');

    await page.getByLabel(/review.*content/i).fill(
      'This is a review for a different campsite. Excellent glamping experience!'
    );

    // Submit the form
    const submitButton = page.getByRole('button', { name: /submit.*review/i });
    await submitButton.click();

    // Wait for success message
    await page.waitForTimeout(1000);

    // Verify success message
    const successMessage = page.getByText(/review.*submitted.*successfully/i);
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Verify review was created
    const { data: review } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('campsite_id', campsiteId2)
      .eq('user_id', userId)
      .single();

    expect(review).toBeDefined();
    expect(review?.id).toBeDefined();
  });

  test('T057.5: Shows existing review to user on campsite page', async ({ page }) => {
    // Ensure review exists for campsite1
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('id, content, rating_overall')
      .eq('campsite_id', campsiteId1)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingReview) {
      // Create review if it doesn't exist
      await supabaseAdmin.from('reviews').insert({
        campsite_id: campsiteId1,
        user_id: userId,
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'This is my existing review that should be displayed.',
      });
    }

    // Navigate to campsite page
    await page.goto(`/campsites/${campsiteId1}`);
    await page.waitForLoadState('networkidle');

    // Set authentication
    await page.evaluate((token) => {
      localStorage.setItem('supabase.auth.token', token);
    }, authToken);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Look for "Your Review" section or similar heading
    const yourReviewHeading = page.getByText(/your.*review/i);
    await expect(yourReviewHeading).toBeVisible({ timeout: 5000 });

    // Verify review content is displayed
    const reviewContent = await supabaseAdmin
      .from('reviews')
      .select('content')
      .eq('campsite_id', campsiteId1)
      .eq('user_id', userId)
      .single();

    if (reviewContent.data) {
      const contentText = page.getByText(reviewContent.data.content);
      await expect(contentText).toBeVisible();
    }

    // Verify edit/delete buttons are available
    const editButton = page.getByRole('button', { name: /edit.*review/i });
    const deleteButton = page.getByRole('button', { name: /delete.*review/i });

    // At least one of these should be visible
    const editVisible = await editButton.isVisible().catch(() => false);
    const deleteVisible = await deleteButton.isVisible().catch(() => false);

    expect(editVisible || deleteVisible).toBe(true);
  });

  test('T057.6: Database unique constraint prevents duplicate reviews', async () => {
    // Clean up any existing reviews first
    await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('campsite_id', campsiteId1)
      .eq('user_id', userId);

    // Create first review directly in database
    const { error: firstError } = await supabaseAdmin.from('reviews').insert({
      campsite_id: campsiteId1,
      user_id: userId,
      rating_overall: 4,
      reviewer_type: 'solo',
      content: 'First review inserted directly into database.',
    });

    expect(firstError).toBeNull();

    // Attempt to create duplicate review directly in database
    const { error: duplicateError } = await supabaseAdmin.from('reviews').insert({
      campsite_id: campsiteId1,
      user_id: userId,
      rating_overall: 5,
      reviewer_type: 'couple',
      content: 'Duplicate review that should be rejected by database constraint.',
    });

    // Should fail with unique constraint violation
    expect(duplicateError).not.toBeNull();
    expect(duplicateError?.message).toContain('duplicate');
  });

  test('T057.7: User can review after deleting their previous review', async () => {
    // Clean up and create initial review
    await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('campsite_id', campsiteId1)
      .eq('user_id', userId);

    const { data: firstReview } = await supabaseAdmin
      .from('reviews')
      .insert({
        campsite_id: campsiteId1,
        user_id: userId,
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'First review that will be deleted.',
      })
      .select()
      .single();

    expect(firstReview).toBeDefined();

    // Delete the review via API
    const deleteResponse = await request(app)
      .delete(`/api/reviews/${firstReview?.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteResponse.status).toBe(200);

    // Now submit a new review (should succeed)
    const newReviewResponse = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        campsite_id: campsiteId1,
        rating_overall: 5,
        reviewer_type: 'couple',
        content: 'New review after deleting the previous one. Should work!',
      });

    expect(newReviewResponse.status).toBe(201);
    expect(newReviewResponse.body.success).toBe(true);
    expect(newReviewResponse.body.data).toBeDefined();
  });
});
