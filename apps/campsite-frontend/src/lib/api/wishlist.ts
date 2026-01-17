import { createClient } from '@/lib/supabase/client';
import type {
  WishlistResponse,
  AddToWishlistResponse,
  RemoveFromWishlistResponse,
  WishlistStatusResponse,
  BatchWishlistStatusResponse,
} from '@campsite/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get auth headers for API requests
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

/**
 * Fetch user's wishlist
 */
export async function fetchWishlist(
  page = 1,
  limit = 20,
  sort: 'newest' | 'oldest' | 'name' = 'newest'
): Promise<WishlistResponse> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
  });

  const response = await fetch(`${API_BASE_URL}/api/wishlist?${params}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch wishlist' }));
    throw new Error(error.error || 'Failed to fetch wishlist');
  }

  return response.json();
}

/**
 * Add campsite to wishlist
 */
export async function addToWishlist(
  campsiteId: string,
  notes?: string
): Promise<AddToWishlistResponse> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      campsite_id: campsiteId,
      notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to add to wishlist' }));
    throw new Error(error.error || 'Failed to add to wishlist');
  }

  return response.json();
}

/**
 * Remove campsite from wishlist
 */
export async function removeFromWishlist(
  campsiteId: string
): Promise<RemoveFromWishlistResponse> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/wishlist/${campsiteId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to remove from wishlist' }));
    throw new Error(error.error || 'Failed to remove from wishlist');
  }

  return response.json();
}

/**
 * Check if campsite is in user's wishlist
 */
export async function checkWishlistStatus(
  campsiteId: string
): Promise<WishlistStatusResponse> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/wishlist/check/${campsiteId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to check wishlist status' }));
    throw new Error(error.error || 'Failed to check wishlist status');
  }

  return response.json();
}

/**
 * Batch check if multiple campsites are in user's wishlist
 */
export async function batchCheckWishlist(
  campsiteIds: string[]
): Promise<BatchWishlistStatusResponse> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/wishlist/check-batch`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ campsite_ids: campsiteIds }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to check wishlist status' }));
    throw new Error(error.error || 'Failed to check wishlist status');
  }

  return response.json();
}

/**
 * Get wishlist count for user
 */
export async function getWishlistCount(): Promise<number> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/wishlist/count`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    return 0;
  }

  const result = await response.json();
  return result.data?.count || 0;
}
