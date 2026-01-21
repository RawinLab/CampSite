/**
 * E2E Test Constants
 *
 * Shared constants for E2E tests including valid test campsite slugs.
 * These are fetched from the database at test setup time.
 */

import { createSupabaseAdmin } from './auth';
import { getApprovedCampsiteSlug, getApprovedCampsiteSlugs } from './test-data';

// Cached test campsite data
let cachedTestCampsite: { id: string; slug: string; name: string } | null = null;
let cachedTestCampsites: Array<{ id: string; slug: string; name: string }> = [];

/**
 * Initialize test constants by fetching from database
 * Call this in global setup or beforeAll
 */
export async function initTestConstants(): Promise<void> {
  const supabase = createSupabaseAdmin();

  // Get first approved campsite
  cachedTestCampsite = await getApprovedCampsiteSlug(supabase);

  // Get multiple approved campsites
  cachedTestCampsites = await getApprovedCampsiteSlugs(supabase, 5);

  if (!cachedTestCampsite) {
    console.warn('⚠️ No approved campsites found for E2E tests');
  }
}

/**
 * Get the primary test campsite slug
 * Falls back to a known slug if not initialized
 */
export function getTestCampsiteSlug(): string {
  if (cachedTestCampsite?.slug) {
    return cachedTestCampsite.slug;
  }
  // Fallback to first known approved campsite slug
  return 'test-approval-camp-908a0360';
}

/**
 * Get the primary test campsite ID
 */
export function getTestCampsiteId(): string {
  if (cachedTestCampsite?.id) {
    return cachedTestCampsite.id;
  }
  // Fallback
  return '908a0360-bd0c-4582-bb1d-718f6862ff10';
}

/**
 * Get test campsite URL path (with slug)
 */
export function getTestCampsiteUrl(): string {
  return `/campsites/${getTestCampsiteSlug()}`;
}

/**
 * Get multiple test campsite slugs
 */
export function getTestCampsiteSlugs(): string[] {
  if (cachedTestCampsites.length > 0) {
    return cachedTestCampsites.map(c => c.slug);
  }
  // Fallback
  return ['test-approval-camp-908a0360'];
}

/**
 * Get multiple test campsite IDs
 */
export function getTestCampsiteIds(): string[] {
  if (cachedTestCampsites.length > 0) {
    return cachedTestCampsites.map(c => c.id);
  }
  // Fallback
  return ['908a0360-bd0c-4582-bb1d-718f6862ff10'];
}

// Static exports for backward compatibility (hardcoded known test campsite)
export const TEST_CAMPSITE_SLUG = 'test-campsite-details-b7a9886a';
export const TEST_CAMPSITE_ID = 'b7a9886a-2c4d-4e5f-8a1b-3c6d7e8f9a0b'; // Update this if needed
export const TEST_CAMPSITE_URL = `/campsites/${TEST_CAMPSITE_SLUG}`;

// For tests that use /campsites/1 pattern - map to actual slugs
export const MOCK_CAMPSITE_SLUGS: Record<string, string> = {
  '1': TEST_CAMPSITE_SLUG,
  '2': 'mountain-view-campsite-50155b16',
  '3': 'mountain-view-campsite-b3a00b2f',
  '99999999': 'non-existent-slug-for-404-test',
  '999999': 'non-existent-slug-for-404-test',
};

/**
 * Convert mock ID to real slug
 * Use this to migrate tests from /campsites/1 to /campsites/{slug}
 */
export function mockIdToSlug(mockId: string): string {
  return MOCK_CAMPSITE_SLUGS[mockId] || mockId;
}
