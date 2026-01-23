import { getAuthHeaders } from '@/lib/api/auth';
import type {
  WishlistResponse,
  AddToWishlistResponse,
  RemoveFromWishlistResponse,
  WishlistStatusResponse,
  BatchWishlistStatusResponse,
} from '@campsite/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3091';

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
 * Toggle campsite in wishlist (add if not exists, remove if exists)
 */
export async function toggleWishlist(
  campsiteId: string,
  notes?: string
): Promise<{ action: 'added' | 'removed'; isInWishlist: boolean; data?: any }> {
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
    const error = await response.json().catch(() => ({ error: 'Failed to toggle wishlist' }));
    throw new Error(error.error || 'Failed to toggle wishlist');
  }

  // Unwrap the response - backend returns { success: true, data: { action, isInWishlist, ... } }
  const result = await response.json();
  return result.data;
}

/**
 * Add campsite to wishlist (uses toggle API internally)
 * @deprecated Use toggleWishlist instead
 */
export async function addToWishlist(
  campsiteId: string,
  notes?: string
): Promise<AddToWishlistResponse> {
  return toggleWishlist(campsiteId, notes) as unknown as Promise<AddToWishlistResponse>;
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
  try {
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
  } catch (error) {
    return 0;
  }
}
