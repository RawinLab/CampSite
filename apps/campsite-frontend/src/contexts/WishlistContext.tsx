'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchWishlist,
  toggleWishlist as toggleWishlistApi,
  addToWishlist as addToWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
  batchCheckWishlist,
  getWishlistCount,
} from '@/lib/api/wishlist';
import type { WishlistItemWithCampsite } from '@campsite/shared';

interface WishlistContextType {
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

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
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

      const response = await fetchWishlist(1, 50, 'newest');
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
      if (!user) {
        throw new Error('Please log in to manage wishlist');
      }

      // Optimistic update based on current state
      const currentlyWishlisted = isInWishlist(campsiteId);

      if (currentlyWishlisted) {
        // Optimistically remove
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(campsiteId);
          return next;
        });
        setCount((prev) => Math.max(0, prev - 1));
      } else {
        // Optimistically add
        setWishlistIds((prev) => new Set(prev).add(campsiteId));
        setCount((prev) => prev + 1);
      }

      try {
        // Call toggle API - it will add or remove based on server state
        const result = await toggleWishlistApi(campsiteId);

        // Update state based on actual server response
        if (result.isInWishlist) {
          setWishlistIds((prev) => new Set(prev).add(campsiteId));
        } else {
          setWishlistIds((prev) => {
            const next = new Set(prev);
            next.delete(campsiteId);
            return next;
          });
        }

        // Refresh to get accurate count and data
        await loadWishlist();

        return result.isInWishlist;
      } catch (err) {
        // Revert optimistic update on error
        if (currentlyWishlisted) {
          setWishlistIds((prev) => new Set(prev).add(campsiteId));
          setCount((prev) => prev + 1);
        } else {
          setWishlistIds((prev) => {
            const next = new Set(prev);
            next.delete(campsiteId);
            return next;
          });
          setCount((prev) => Math.max(0, prev - 1));
        }
        throw err;
      }
    },
    [user, isInWishlist, loadWishlist]
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

  return (
    <WishlistContext.Provider
      value={{
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
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistContext(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlistContext must be used within a WishlistProvider');
  }
  return context;
}

export { WishlistContext };
