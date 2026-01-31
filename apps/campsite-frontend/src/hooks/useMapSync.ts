'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { MapCampsite, MapBounds, MapFilters } from '@campsite/shared';

import { API_BASE_URL } from '@/lib/api/config';

interface UseMapSyncOptions {
  initialFilters?: MapFilters;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseMapSyncReturn {
  campsites: MapCampsite[];
  isLoading: boolean;
  error: string | null;
  bounds: MapBounds | null;
  setBounds: (bounds: MapBounds) => void;
  setFilters: (filters: MapFilters) => void;
  filters: MapFilters;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for syncing map data with filters and bounds
 */
export function useMapSync(options: UseMapSyncOptions = {}): UseMapSyncReturn {
  const {
    initialFilters = {},
    debounceMs = 300,
    enabled = true,
  } = options;

  const [campsites, setCampsites] = useState<MapCampsite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [filters, setFilters] = useState<MapFilters>(initialFilters);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use refs to avoid stale closure issues in debounced callbacks
  const boundsRef = useRef<MapBounds | null>(bounds);
  const filtersRef = useRef<MapFilters>(filters);

  // Keep refs in sync with state
  useEffect(() => {
    boundsRef.current = bounds;
  }, [bounds]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  /**
   * Fetch campsites from API
   * @param useRefs - When true, use refs for bounds/filters (for debounced calls)
   */
  const fetchCampsites = useCallback(async (useRefs = false) => {
    if (!enabled) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    // Use refs for debounced calls to get latest values, state for direct calls
    const currentBounds = useRefs ? boundsRef.current : bounds;
    const currentFilters = useRefs ? filtersRef.current : filters;

    // Prefer bounds state, but fallback to filters.bounds if available
    const effectiveBounds = currentBounds || currentFilters.bounds;

    try {
      // Build query params
      const params = new URLSearchParams();

      // Add bounds if available (from state or filters)
      if (effectiveBounds) {
        params.append('north', effectiveBounds.north.toString());
        params.append('south', effectiveBounds.south.toString());
        params.append('east', effectiveBounds.east.toString());
        params.append('west', effectiveBounds.west.toString());
      }

      // Add filters
      if (currentFilters.campsite_types && currentFilters.campsite_types.length > 0) {
        params.append('campsite_types', currentFilters.campsite_types.join(','));
      }

      if (currentFilters.province_id) {
        params.append('province_id', currentFilters.province_id.toString());
      }

      if (currentFilters.min_price !== undefined) {
        params.append('min_price', currentFilters.min_price.toString());
      }

      if (currentFilters.max_price !== undefined) {
        params.append('max_price', currentFilters.max_price.toString());
      }

      if (currentFilters.min_rating !== undefined) {
        params.append('min_rating', currentFilters.min_rating.toString());
      }

      if (currentFilters.amenity_ids && currentFilters.amenity_ids.length > 0) {
        params.append('amenity_ids', currentFilters.amenity_ids.join(','));
      }

      const response = await fetch(
        `${API_BASE_URL}/api/map/campsites?${params.toString()}`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch campsites');
      }

      const data = await response.json();
      setCampsites(data.campsites);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, ignore
        return;
      }
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCampsites([]);
    } finally {
      setIsLoading(false);
    }
  }, [bounds, filters, enabled]);

  /**
   * Debounced bounds change handler
   */
  const handleBoundsChange = useCallback(
    (newBounds: MapBounds) => {
      setBounds(newBounds);
      // Also update ref immediately for debounced callback
      boundsRef.current = newBounds;

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer - use refs to get latest values
      debounceTimerRef.current = setTimeout(() => {
        fetchCampsites(true);
      }, debounceMs);
    },
    [fetchCampsites, debounceMs]
  );

  /**
   * Handle filter changes (immediate fetch)
   */
  const handleFiltersChange = useCallback(
    (newFilters: MapFilters) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchCampsites();

    return () => {
      // Cleanup on unmount
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filters]); // Only re-fetch when filters change, bounds are handled with debounce

  return {
    campsites,
    isLoading,
    error,
    bounds,
    setBounds: handleBoundsChange,
    setFilters: handleFiltersChange,
    filters,
    refetch: fetchCampsites,
  };
}
