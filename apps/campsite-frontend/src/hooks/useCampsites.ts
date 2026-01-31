'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SearchResults, CampsiteCard, CampsiteTypeInfo, Amenity } from '@campsite/shared';

import { API_BASE_URL as API_URL } from '@/lib/api/config';

interface SearchParams {
  q?: string;
  provinceId?: number;
  types?: string[];
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

interface UseCampsitesReturn {
  results: SearchResults | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook for fetching campsite search results
 */
export function useCampsites(params: SearchParams): UseCampsitesReturn {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const fetchCampsites = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();

        if (params.q) queryParams.set('q', params.q);
        if (params.provinceId) queryParams.set('provinceId', String(params.provinceId));
        if (params.types?.length) queryParams.set('types', params.types.join(','));
        if (params.minPrice !== undefined) queryParams.set('minPrice', String(params.minPrice));
        if (params.maxPrice !== undefined) queryParams.set('maxPrice', String(params.maxPrice));
        if (params.amenities?.length) queryParams.set('amenities', params.amenities.join(','));
        if (params.minRating !== undefined) queryParams.set('minRating', String(params.minRating));
        if (params.sort) queryParams.set('sort', params.sort);
        if (params.page) queryParams.set('page', String(params.page));
        if (params.limit) queryParams.set('limit', String(params.limit));

        const response = await fetch(`${API_URL}/api/search?${queryParams.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch campsites');
        }

        const result = await response.json();
        setResults(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampsites();
  }, [
    params.q,
    params.provinceId,
    params.types?.join(','),
    params.minPrice,
    params.maxPrice,
    params.amenities?.join(','),
    params.minRating,
    params.sort,
    params.page,
    params.limit,
    refetchTrigger,
  ]);

  return { results, isLoading, error, refetch };
}

/**
 * Custom hook for fetching featured campsites
 */
export function useFeaturedCampsites(limit: number = 6) {
  const [campsites, setCampsites] = useState<CampsiteCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/search/featured?limit=${limit}`);

        if (!response.ok) {
          throw new Error('Failed to fetch featured campsites');
        }

        const result = await response.json();
        setCampsites(result.data?.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load featured campsites');
        setCampsites([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, [limit]);

  return { campsites, isLoading, error };
}

/**
 * Custom hook for fetching campsite types
 */
export function useCampsiteTypes() {
  const [types, setTypes] = useState<CampsiteTypeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTypes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/search/types`);

        if (!response.ok) {
          throw new Error('Failed to fetch campsite types');
        }

        const result = await response.json();
        setTypes(result.data?.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load types');
        setTypes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTypes();
  }, []);

  return { types, isLoading, error };
}

/**
 * Custom hook for fetching amenities
 */
export function useAmenities(grouped: boolean = false) {
  const [amenities, setAmenities] = useState<Amenity[] | Record<string, Amenity[]>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAmenities = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/api/search/amenities${grouped ? '?grouped=true' : ''}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch amenities');
        }

        const result = await response.json();
        setAmenities(grouped ? result.data : result.data?.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load amenities');
        setAmenities(grouped ? {} : []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAmenities();
  }, [grouped]);

  return { amenities, isLoading, error };
}
