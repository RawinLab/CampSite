'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { getWishlistCount } from '@/lib/api/wishlist';

/**
 * Hook for accessing wishlist functionality
 * Uses WishlistContext for shared state across all components
 */
export function useWishlist() {
  return useWishlistContext();
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
