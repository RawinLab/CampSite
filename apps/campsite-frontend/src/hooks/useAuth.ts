'use client';

import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Hook for accessing auth functionality
 * Uses AuthContext for shared state across all components
 *
 * This prevents multiple API calls to /api/auth/me when many
 * components use useAuth() (e.g., WishlistButton in CampsiteCards)
 */
export function useAuth() {
  return useAuthContext();
}
