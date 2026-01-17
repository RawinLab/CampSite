import type { CampsiteCard } from './campsite';

/**
 * Wishlist item as stored in database
 */
export interface WishlistItem {
  id: string;
  user_id: string;
  campsite_id: string;
  notes: string | null;
  created_at: string;
}

/**
 * Wishlist item with campsite data for display
 */
export interface WishlistItemWithCampsite extends WishlistItem {
  campsite: CampsiteCard;
}

/**
 * Wishlist API response
 */
export interface WishlistResponse {
  success: boolean;
  data: WishlistItemWithCampsite[];
  count: number;
}

/**
 * Add to wishlist request
 */
export interface AddToWishlistRequest {
  campsite_id: string;
  notes?: string;
}

/**
 * Add to wishlist response
 */
export interface AddToWishlistResponse {
  success: boolean;
  data: WishlistItem | null;
  error?: string;
}

/**
 * Remove from wishlist response
 */
export interface RemoveFromWishlistResponse {
  success: boolean;
  error?: string;
}

/**
 * Check wishlist status response
 */
export interface WishlistStatusResponse {
  success: boolean;
  data: {
    is_wishlisted: boolean;
    wishlist_id: string | null;
  };
}

/**
 * Batch check wishlist status response
 */
export interface BatchWishlistStatusResponse {
  success: boolean;
  data: Record<string, boolean>;
}
