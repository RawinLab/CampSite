import request from 'supertest';
import app from '../../../apps/campsite-backend/src/app';
import { supabaseAdmin } from '../../../apps/campsite-backend/src/lib/supabase';

/**
 * Integration Tests: Review Submission API (T042)
 * Tests POST /api/reviews endpoint
 *
 * Tests cover:
 * 1. Successful review creation
 * 2. Review auto-approved (no pending status per Q11)
 * 3. Requires authentication (401 if not logged in)
 * 4. Validates required fields (rating_overall, reviewer_type, content)
 * 5. Validates content length (20-2000 chars per schema)
 * 6. Validates rating range (1-5)
 * 7. Prevents duplicate review (409 conflict)
 * 8. Optional fields accepted (title, sub-ratings)
 * 9. Response includes created review
 */

describe('Integration: Review Submission API - POST /api/reviews', () => {
  let authToken: string;
  let userId: string;
  let campsiteId: string;
  let unauthorizedCampsiteId: string;

  beforeAll(async () => {
    // Create test user
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: `test-review-${Date.now()}@example.com`,
      password: 'testPassword123!',
      email_confirm: true,
    });

    if (signUpError || !authData.user) {
      throw new Error('Failed to create test user');
    }

    userId = authData.user.id;

    // Create user session to get token
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: authData.user.email!,
    });

    if (sessionError) {
      throw new Error('Failed to generate session');
    }

    // Sign in to get access token
    const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
      email: authData.user.email!,
      password: 'testPassword123!',
    });

    if (signInData.session) {
      authToken = signInData.session.access_token;
    }

    // Create test campsite (approved)
    const { data: campsite, error: campsiteError } = await supabaseAdmin
      .from('campsites')
      .insert({
        owner_id: userId,
        name: `Test Campsite ${Date.now()}`,
        description: 'A test campsite for review submission tests',
        slug: `test-campsite-${Date.now()}`,
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

    if (campsiteError || !campsite) {
      throw new Error('Failed to create test campsite');
    }

    campsiteId = campsite.id;

    // Create another campsite for duplicate test
    const { data: campsite2 } = await supabaseAdmin
      .from('campsites')
      .insert({
        owner_id: userId,
        name: `Test Campsite 2 ${Date.now()}`,
        description: 'Another test campsite',
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

    if (campsite2) {
      unauthorizedCampsiteId = campsite2.id;
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (campsiteId) {
      await supabaseAdmin.from('reviews').delete().eq('campsite_id', campsiteId);
      await supabaseAdmin.from('campsites').delete().eq('id', campsiteId);
    }
    if (unauthorizedCampsiteId) {
      await supabaseAdmin.from('reviews').delete().eq('campsite_id', unauthorizedCampsiteId);
      await supabaseAdmin.from('campsites').delete().eq('id', unauthorizedCampsiteId);
    }
    if (userId) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }
  });

  describe('T042.1: Successful review creation', () => {
    it('should create a review with required fields only', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'This is a great campsite with beautiful views and friendly staff. Highly recommended!',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Review submitted successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.rating_overall).toBe(4);
      expect(response.body.data.reviewer_type).toBe('solo');
      expect(response.body.data.content).toBe(reviewData.content);
    });
  });

  describe('T042.2: Review auto-approved (no pending status)', () => {
    it('should create review without pending status (auto-approved per Q11)', async () => {
      const reviewData = {
        campsite_id: unauthorizedCampsiteId,
        rating_overall: 5,
        reviewer_type: 'family',
        content: 'Amazing campsite for families. Kids loved it! Very clean and well-maintained.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // Verify review is immediately visible (no approval status field)
      const { data: review } = await supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('id', response.body.data.id)
        .single();

      expect(review).toBeDefined();
      expect(review?.is_hidden).toBe(false);
      // No status field should exist (auto-approved per Q11)
      expect(review).not.toHaveProperty('status');
    });
  });

  describe('T042.3: Requires authentication', () => {
    it('should return 401 when not authenticated', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(reviewData)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 401 with invalid token', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', 'Bearer invalid-token-here')
        .send(reviewData)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('T042.4: Validates required fields', () => {
    it('should return 400 when campsite_id is missing', async () => {
      const reviewData = {
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when rating_overall is missing', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        reviewer_type: 'solo',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when reviewer_type is missing', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when content is missing', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when reviewer_type is invalid', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'invalid_type',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('T042.5: Validates content length (20-2000 chars)', () => {
    it('should return 400 when content is too short (< 20 chars)', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'Too short',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when content is too long (> 2000 chars)', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'a'.repeat(2001),
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should accept content at minimum length (20 chars)', async () => {
      // Clean up first if exists
      await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('campsite_id', campsiteId)
        .eq('user_id', userId);

      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'a'.repeat(20),
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should accept content at maximum length (2000 chars)', async () => {
      // Clean up first
      await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('campsite_id', unauthorizedCampsiteId)
        .eq('user_id', userId);

      const reviewData = {
        campsite_id: unauthorizedCampsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'a'.repeat(2000),
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('T042.6: Validates rating range (1-5)', () => {
    it('should return 400 when rating_overall is below 1', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 0,
        reviewer_type: 'solo',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when rating_overall is above 5', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 6,
        reviewer_type: 'solo',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when rating_overall is not an integer', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4.5,
        reviewer_type: 'solo',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should accept rating_overall = 1', async () => {
      // Clean up first
      await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('campsite_id', campsiteId)
        .eq('user_id', userId);

      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 1,
        reviewer_type: 'solo',
        content: 'This campsite needs improvement and better maintenance.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating_overall).toBe(1);
    });

    it('should accept rating_overall = 5', async () => {
      // Clean up first
      await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('campsite_id', unauthorizedCampsiteId)
        .eq('user_id', userId);

      const reviewData = {
        campsite_id: unauthorizedCampsiteId,
        rating_overall: 5,
        reviewer_type: 'solo',
        content: 'This campsite is absolutely perfect and exceeded all expectations.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating_overall).toBe(5);
    });

    it('should validate sub-ratings are within 1-5 range', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        rating_cleanliness: 6,
        reviewer_type: 'solo',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('T042.7: Prevents duplicate review', () => {
    it('should return 400 when user already reviewed the campsite', async () => {
      // Ensure a review exists
      await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('campsite_id', campsiteId)
        .eq('user_id', userId);

      // Create first review
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      // Try to create duplicate review
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBe('You have already reviewed this campsite');
    });
  });

  describe('T042.8: Optional fields accepted', () => {
    it('should accept optional title field', async () => {
      // Clean up first
      await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('campsite_id', campsiteId)
        .eq('user_id', userId);

      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
        title: 'Great Experience',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Great Experience');
    });

    it('should accept optional sub-rating fields', async () => {
      // Clean up first
      await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('campsite_id', unauthorizedCampsiteId)
        .eq('user_id', userId);

      const reviewData = {
        campsite_id: unauthorizedCampsiteId,
        rating_overall: 4,
        rating_cleanliness: 5,
        rating_staff: 4,
        rating_facilities: 3,
        rating_value: 4,
        rating_location: 5,
        reviewer_type: 'couple',
        content: 'Excellent campsite with outstanding cleanliness and beautiful location.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating_cleanliness).toBe(5);
      expect(response.body.data.rating_staff).toBe(4);
      expect(response.body.data.rating_facilities).toBe(3);
      expect(response.body.data.rating_value).toBe(4);
      expect(response.body.data.rating_location).toBe(5);
    });

    it('should accept optional pros and cons fields', async () => {
      // Clean up first
      await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('campsite_id', campsiteId)
        .eq('user_id', userId);

      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'family',
        content: 'Overall a great experience for our family vacation.',
        pros: 'Beautiful location, friendly staff, clean facilities',
        cons: 'Slightly expensive, limited parking spaces',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pros).toBe('Beautiful location, friendly staff, clean facilities');
      expect(response.body.data.cons).toBe('Slightly expensive, limited parking spaces');
    });

    it('should accept optional visited_at field', async () => {
      // Clean up first
      await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('campsite_id', unauthorizedCampsiteId)
        .eq('user_id', userId);

      const reviewData = {
        campsite_id: unauthorizedCampsiteId,
        rating_overall: 5,
        reviewer_type: 'group',
        content: 'Had an amazing time with our group of friends.',
        visited_at: '2025-12-15',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.visited_at).toBeDefined();
    });

    it('should accept optional photo_urls field', async () => {
      // Clean up first
      await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('campsite_id', campsiteId)
        .eq('user_id', userId);

      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 5,
        reviewer_type: 'couple',
        content: 'Beautiful campsite with stunning views and great amenities.',
        photo_urls: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg',
        ],
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.photos).toBeDefined();
      expect(Array.isArray(response.body.data.photos)).toBe(true);
    });

    it('should validate title max length (100 chars)', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
        title: 'a'.repeat(101),
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should validate photo_urls max 5 photos', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'This campsite is great and I really enjoyed my stay here.',
        photo_urls: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
          'https://example.com/6.jpg',
        ],
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('T042.9: Response includes created review', () => {
    it('should return complete review data with user info', async () => {
      // Clean up first
      await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('campsite_id', campsiteId)
        .eq('user_id', userId);

      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
        title: 'Wonderful Stay',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const review = response.body.data;
      // Verify required fields
      expect(review.id).toBeDefined();
      expect(review.campsite_id).toBe(campsiteId);
      expect(review.rating_overall).toBe(4);
      expect(review.reviewer_type).toBe('solo');
      expect(review.title).toBe('Wonderful Stay');
      expect(review.content).toBe(reviewData.content);
      expect(review.created_at).toBeDefined();
      expect(review.is_hidden).toBe(false);

      // Verify user info included
      expect(review.reviewer).toBeDefined();
      expect(review.reviewer.full_name).toBeDefined();
    });

    it('should return review with photos when provided', async () => {
      // Clean up first
      await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('campsite_id', unauthorizedCampsiteId)
        .eq('user_id', userId);

      const reviewData = {
        campsite_id: unauthorizedCampsiteId,
        rating_overall: 5,
        reviewer_type: 'family',
        content: 'Amazing experience with beautiful scenery and great facilities.',
        photo_urls: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg',
        ],
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.photos).toBeDefined();
      expect(Array.isArray(response.body.data.photos)).toBe(true);
      expect(response.body.data.photos.length).toBeGreaterThan(0);
    });
  });

  describe('T042.10: Edge cases and error handling', () => {
    it('should return 400 for non-existent campsite', async () => {
      const reviewData = {
        campsite_id: '00000000-0000-0000-0000-000000000000',
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBe('Campsite not found or not available for reviews');
    });

    it('should return 400 for invalid campsite_id format', async () => {
      const reviewData = {
        campsite_id: 'invalid-uuid',
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'This campsite is great and I really enjoyed my stay here.',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid photo URL', async () => {
      const reviewData = {
        campsite_id: campsiteId,
        rating_overall: 4,
        reviewer_type: 'solo',
        content: 'This campsite is great and I really enjoyed my stay here.',
        photo_urls: ['not-a-valid-url', 'also-invalid'],
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
