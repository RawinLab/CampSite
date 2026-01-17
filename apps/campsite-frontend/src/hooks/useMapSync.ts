'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { MapCampsite, MapBounds, MapFilters } from '@campsite/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

  /**
   * Fetch campsites from API
   */
  const fetchCampsites = useCallback(async () => {
    if (!enabled) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();

      // Add bounds if available
      if (bounds) {
        params.append('north', bounds.north.toString());
        params.append('south', bounds.south.toString());
        params.append('east', bounds.east.toString());
        params.append('west', bounds.west.toString());
      }

      // Add filters
      if (filters.campsite_types && filters.campsite_types.length > 0) {
        params.append('campsite_types', filters.campsite_types.join(','));
      }

      if (filters.province_id) {
        params.append('province_id', filters.province_id.toString());
      }

      if (filters.min_price !== undefined) {
        params.append('min_price', filters.min_price.toString());
      }

      if (filters.max_price !== undefined) {
        params.append('max_price', filters.max_price.toString());
      }

      if (filters.min_rating !== undefined) {
        params.append('min_rating', filters.min_rating.toString());
      }

      if (filters.amenity_ids && filters.amenity_ids.length > 0) {
        params.append('amenity_ids', filters.amenity_ids.join(','));
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

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        fetchCampsites();
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
