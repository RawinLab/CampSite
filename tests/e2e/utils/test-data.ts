/**
 * E2E Test Data Utilities
 *
 * Utilities for creating and managing test data in real database.
 * Uses Supabase admin client for direct database access.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdmin, TEST_USERS } from './auth';

// Test data IDs for easy cleanup
export const TEST_DATA_PREFIX = 'e2e-test-';

export interface TestCampsite {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  owner_id?: string;
  province_id?: string;
  campsite_type?: string;
  description?: string;
  price_min?: number;
  price_max?: number;
}

export interface TestReview {
  id: string;
  campsite_id: string;
  user_id: string;
  rating: number;
  comment: string;
  status?: 'visible' | 'hidden';
}

export interface TestInquiry {
  id: string;
  campsite_id: string;
  user_id?: string;
  name: string;
  email: string;
  message: string;
}

/**
 * Get user ID by email
 */
export async function getUserIdByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('auth_user_id')
    .eq('email', email)
    .single();

  if (error || !data) return null;
  return data.auth_user_id;
}

/**
 * Get owner user ID
 */
export async function getOwnerUserId(supabase: SupabaseClient): Promise<string> {
  const id = await getUserIdByEmail(supabase, TEST_USERS.owner.email);
  if (!id) throw new Error('Owner test user not found. Run seed-test-users.ts first.');
  return id;
}

/**
 * Get admin user ID
 */
export async function getAdminUserId(supabase: SupabaseClient): Promise<string> {
  const id = await getUserIdByEmail(supabase, TEST_USERS.admin.email);
  if (!id) throw new Error('Admin test user not found. Run seed-test-users.ts first.');
  return id;
}

/**
 * Get regular user ID
 */
export async function getRegularUserId(supabase: SupabaseClient): Promise<string> {
  const id = await getUserIdByEmail(supabase, TEST_USERS.user.email);
  if (!id) throw new Error('Regular test user not found. Run seed-test-users.ts first.');
  return id;
}

/**
 * Create test campsite
 */
export async function createTestCampsite(
  supabase: SupabaseClient,
  data: Partial<TestCampsite> = {}
): Promise<TestCampsite> {
  const ownerId = await getOwnerUserId(supabase);

  // Get first province for testing
  const { data: provinces } = await supabase
    .from('provinces')
    .select('id')
    .limit(1);

  const provinceId = provinces?.[0]?.id;

  const campsite = {
    id: data.id || `${TEST_DATA_PREFIX}campsite-${Date.now()}`,
    name: data.name || `Test Campsite ${Date.now()}`,
    description: data.description || 'Test campsite for E2E testing',
    status: data.status || 'pending',
    owner_id: data.owner_id || ownerId,
    province_id: data.province_id || provinceId,
    campsite_type: data.campsite_type || 'camping',
    price_min: data.price_min || 500,
    price_max: data.price_max || 1500,
    latitude: 13.7563,
    longitude: 100.5018,
  };

  const { data: created, error } = await supabase
    .from('campsites')
    .insert(campsite)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test campsite: ${error.message}`);
  }

  return created as TestCampsite;
}

/**
 * Create multiple test campsites
 */
export async function createTestCampsites(
  supabase: SupabaseClient,
  count: number,
  defaults: Partial<TestCampsite> = {}
): Promise<TestCampsite[]> {
  const campsites: TestCampsite[] = [];

  for (let i = 0; i < count; i++) {
    const campsite = await createTestCampsite(supabase, {
      ...defaults,
      name: `${defaults.name || 'Test Campsite'} ${i + 1}`,
    });
    campsites.push(campsite);
  }

  return campsites;
}

/**
 * Create test review
 */
export async function createTestReview(
  supabase: SupabaseClient,
  campsiteId: string,
  data: Partial<TestReview> = {}
): Promise<TestReview> {
  const userId = data.user_id || await getRegularUserId(supabase);

  const review = {
    id: data.id || `${TEST_DATA_PREFIX}review-${Date.now()}`,
    campsite_id: campsiteId,
    user_id: userId,
    rating: data.rating || 4,
    comment: data.comment || 'Test review comment for E2E testing',
    status: data.status || 'visible',
  };

  const { data: created, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test review: ${error.message}`);
  }

  return created as TestReview;
}

/**
 * Create test inquiry
 */
export async function createTestInquiry(
  supabase: SupabaseClient,
  campsiteId: string,
  data: Partial<TestInquiry> = {}
): Promise<TestInquiry> {
  const inquiry = {
    id: data.id || `${TEST_DATA_PREFIX}inquiry-${Date.now()}`,
    campsite_id: campsiteId,
    user_id: data.user_id,
    name: data.name || 'Test User',
    email: data.email || 'test@example.com',
    message: data.message || 'Test inquiry message for E2E testing',
  };

  const { data: created, error } = await supabase
    .from('inquiries')
    .insert(inquiry)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test inquiry: ${error.message}`);
  }

  return created as TestInquiry;
}

/**
 * Create owner request
 */
export async function createOwnerRequest(
  supabase: SupabaseClient,
  userId?: string
): Promise<{ id: string; user_id: string }> {
  const userIdToUse = userId || await getRegularUserId(supabase);

  const request = {
    id: `${TEST_DATA_PREFIX}owner-req-${Date.now()}`,
    user_id: userIdToUse,
    business_name: 'Test Business',
    reason: 'E2E test owner request',
    status: 'pending',
  };

  const { data: created, error } = await supabase
    .from('owner_requests')
    .insert(request)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create owner request: ${error.message}`);
  }

  return created;
}

/**
 * Create review report
 */
export async function createReviewReport(
  supabase: SupabaseClient,
  reviewId: string,
  reporterId?: string
): Promise<{ id: string }> {
  const userId = reporterId || await getRegularUserId(supabase);

  const report = {
    id: `${TEST_DATA_PREFIX}report-${Date.now()}`,
    review_id: reviewId,
    reporter_id: userId,
    reason: 'inappropriate',
    description: 'E2E test report',
    status: 'pending',
  };

  const { data: created, error } = await supabase
    .from('review_reports')
    .insert(report)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create review report: ${error.message}`);
  }

  return created;
}

/**
 * Update campsite status
 */
export async function updateCampsiteStatus(
  supabase: SupabaseClient,
  campsiteId: string,
  status: 'pending' | 'approved' | 'rejected'
): Promise<void> {
  const { error } = await supabase
    .from('campsites')
    .update({ status })
    .eq('id', campsiteId);

  if (error) {
    throw new Error(`Failed to update campsite status: ${error.message}`);
  }
}

/**
 * Update review status
 */
export async function updateReviewStatus(
  supabase: SupabaseClient,
  reviewId: string,
  status: 'visible' | 'hidden'
): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update({ status })
    .eq('id', reviewId);

  if (error) {
    throw new Error(`Failed to update review status: ${error.message}`);
  }
}

/**
 * Delete test campsite
 */
export async function deleteTestCampsite(
  supabase: SupabaseClient,
  campsiteId: string
): Promise<void> {
  // Delete related data first
  await supabase.from('reviews').delete().eq('campsite_id', campsiteId);
  await supabase.from('inquiries').delete().eq('campsite_id', campsiteId);
  await supabase.from('campsite_photos').delete().eq('campsite_id', campsiteId);
  await supabase.from('campsite_amenities').delete().eq('campsite_id', campsiteId);

  // Delete campsite
  const { error } = await supabase
    .from('campsites')
    .delete()
    .eq('id', campsiteId);

  if (error) {
    throw new Error(`Failed to delete test campsite: ${error.message}`);
  }
}

/**
 * Clean up all test data with prefix
 */
export async function cleanupTestData(supabase: SupabaseClient): Promise<void> {
  // Delete in order to respect foreign keys

  // Delete review reports
  await supabase
    .from('review_reports')
    .delete()
    .like('id', `${TEST_DATA_PREFIX}%`);

  // Delete reviews
  await supabase
    .from('reviews')
    .delete()
    .like('id', `${TEST_DATA_PREFIX}%`);

  // Delete inquiries
  await supabase
    .from('inquiries')
    .delete()
    .like('id', `${TEST_DATA_PREFIX}%`);

  // Delete owner requests
  await supabase
    .from('owner_requests')
    .delete()
    .like('id', `${TEST_DATA_PREFIX}%`);

  // Delete campsite photos
  const { data: testCampsites } = await supabase
    .from('campsites')
    .select('id')
    .like('id', `${TEST_DATA_PREFIX}%`);

  if (testCampsites) {
    for (const campsite of testCampsites) {
      await supabase.from('campsite_photos').delete().eq('campsite_id', campsite.id);
      await supabase.from('campsite_amenities').delete().eq('campsite_id', campsite.id);
    }
  }

  // Delete campsites
  await supabase
    .from('campsites')
    .delete()
    .like('id', `${TEST_DATA_PREFIX}%`);

  console.log('✅ Cleaned up all test data');
}

/**
 * Get pending campsites for admin testing
 */
export async function getPendingCampsites(
  supabase: SupabaseClient,
  limit = 10
): Promise<TestCampsite[]> {
  const { data, error } = await supabase
    .from('campsites')
    .select('*')
    .eq('status', 'pending')
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get pending campsites: ${error.message}`);
  }

  return data as TestCampsite[];
}

/**
 * Get campsites by owner
 */
export async function getCampsitesByOwner(
  supabase: SupabaseClient,
  ownerId: string
): Promise<TestCampsite[]> {
  const { data, error } = await supabase
    .from('campsites')
    .select('*')
    .eq('owner_id', ownerId);

  if (error) {
    throw new Error(`Failed to get owner campsites: ${error.message}`);
  }

  return data as TestCampsite[];
}
