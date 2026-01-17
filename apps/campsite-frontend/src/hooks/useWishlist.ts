'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchWishlist,
  addToWishlist as addToWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
  batchCheckWishlist,
  getWishlistCount,
} from '@/lib/api/wishlist';
import type { WishlistItemWithCampsite } from '@campsite/shared';

interface UseWishlistReturn {
  wishlist: WishlistItemWithCampsite[];
  wishlistIds: Set<string>;
  isLoading: boolean;
  error: Error | null;
  count: number;
  isInWishlist: (campsiteId: string) => boolean;
  addItem: (campsiteId: string) => Promise<void>;
  removeItem: (campsiteId: string) => Promise<void>;
  toggleItem: (campsiteId: string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
  checkBatch: (campsiteIds: string[]) => Promise<Record<string, boolean>>;
}

export function useWishlist(): UseWishlistReturn {
  const { user, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItemWithCampsite[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  // Load wishlist when user changes
  const loadWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setWishlistIds(new Set());
      setCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchWishlist(1, 100, 'newest');
      const items = response.data || [];

      setWishlist(items);
      setWishlistIds(new Set(items.map((item) => item.campsite_id)));
      setCount(response.count || items.length);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load wishlist on mount and when user changes
  useEffect(() => {
    if (!authLoading) {
      loadWishlist();
    }
  }, [authLoading, loadWishlist]);

  // Check if a campsite is in the wishlist
  const isInWishlist = useCallback(
    (campsiteId: string): boolean => {
      return wishlistIds.has(campsiteId);
    },
    [wishlistIds]
  );

  // Add item to wishlist
  const addItem = useCallback(
    async (campsiteId: string): Promise<void> => {
      if (!user) {
        throw new Error('Please log in to save to wishlist');
      }

      // Optimistic update
      setWishlistIds((prev) => new Set(prev).add(campsiteId));
      setCount((prev) => prev + 1);

      try {
        await addToWishlistApi(campsiteId);
        // Refresh to get full data
        await loadWishlist();
      } catch (err) {
        // Revert on error
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(campsiteId);
          return next;
        });
        setCount((prev) => prev - 1);
        throw err;
      }
    },
    [user, loadWishlist]
  );

  // Remove item from wishlist
  const removeItem = useCallback(
    async (campsiteId: string): Promise<void> => {
      if (!user) {
        throw new Error('Please log in to manage wishlist');
      }

      // Store for potential revert
      const previousWishlist = wishlist;
      const previousIds = wishlistIds;
      const previousCount = count;

      // Optimistic update
      setWishlist((prev) => prev.filter((item) => item.campsite_id !== campsiteId));
      setWishlistIds((prev) => {
        const next = new Set(prev);
        next.delete(campsiteId);
        return next;
      });
      setCount((prev) => Math.max(0, prev - 1));

      try {
        await removeFromWishlistApi(campsiteId);
      } catch (err) {
        // Revert on error
        setWishlist(previousWishlist);
        setWishlistIds(previousIds);
        setCount(previousCount);
        throw err;
      }
    },
    [user, wishlist, wishlistIds, count]
  );

  // Toggle item in wishlist (returns new state)
  const toggleItem = useCallback(
    async (campsiteId: string): Promise<boolean> => {
      const currentlyWishlisted = isInWishlist(campsiteId);

      if (currentlyWishlisted) {
        await removeItem(campsiteId);
        return false;
      } else {
        await addItem(campsiteId);
        return true;
      }
    },
    [isInWishlist, addItem, removeItem]
  );

  // Batch check wishlist status for multiple campsites
  const checkBatch = useCallback(
    async (campsiteIds: string[]): Promise<Record<string, boolean>> => {
      if (!user || campsiteIds.length === 0) {
        return campsiteIds.reduce((acc, id) => ({ ...acc, [id]: false }), {});
      }

      try {
        const response = await batchCheckWishlist(campsiteIds);
        return response.data || {};
      } catch (err) {
        console.error('Failed to check batch wishlist:', err);
        return campsiteIds.reduce((acc, id) => ({ ...acc, [id]: false }), {});
      }
    },
    [user]
  );

  // Refresh wishlist from server
  const refreshWishlist = useCallback(async () => {
    await loadWishlist();
  }, [loadWishlist]);

  return {
    wishlist,
    wishlistIds,
    isLoading,
    error,
    count,
    isInWishlist,
    addItem,
    removeItem,
    toggleItem,
    refreshWishlist,
    checkBatch,
  };
}

/**
 * Lightweight hook for wishlist count only (used in header)
 */
export function useWishlistCount(): { count: number; isLoading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getWishlistCount()
      .then((c) => setCount(c))
      .catch(() => setCount(0))
      .finally(() => setIsLoading(false));
  }, [user, authLoading]);

  return { count, isLoading };
}
