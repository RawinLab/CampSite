'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SEARCH_DEFAULTS, type SortOption } from '@campsite/shared';

interface SearchFilters {
  q?: string;
  provinceId?: number;
  provinceSlug?: string;
  types?: string[];
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  minRating?: number;
  sort: SortOption;
  page: number;
}

interface UseSearchReturn {
  filters: SearchFilters;
  setQuery: (q: string) => void;
  setProvince: (provinceId: number | undefined, provinceSlug?: string) => void;
  setTypes: (types: string[]) => void;
  toggleType: (type: string) => void;
  setPriceRange: (min: number, max: number) => void;
  setAmenities: (amenities: string[]) => void;
  toggleAmenity: (amenity: string) => void;
  setMinRating: (rating: number | undefined) => void;
  setSort: (sort: SortOption) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Custom hook for managing search state with URL synchronization
 */
export function useSearch(): UseSearchReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL
  const [filters, setFilters] = useState<SearchFilters>(() => {
    const types = searchParams.get('types');
    const amenities = searchParams.get('amenities');

    return {
      q: searchParams.get('q') || undefined,
      provinceId: searchParams.get('provinceId')
        ? parseInt(searchParams.get('provinceId')!, 10)
        : undefined,
      provinceSlug: searchParams.get('province') || undefined,
      types: types ? types.split(',') : undefined,
      minPrice: searchParams.get('minPrice')
        ? parseInt(searchParams.get('minPrice')!, 10)
        : undefined,
      maxPrice: searchParams.get('maxPrice')
        ? parseInt(searchParams.get('maxPrice')!, 10)
        : undefined,
      amenities: amenities ? amenities.split(',') : undefined,
      minRating: searchParams.get('minRating')
        ? parseFloat(searchParams.get('minRating')!)
        : undefined,
      sort: (searchParams.get('sort') as SortOption) || SEARCH_DEFAULTS.SORT,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : SEARCH_DEFAULTS.PAGE,
    };
  });

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: SearchFilters) => {
      const params = new URLSearchParams();

      if (newFilters.q) params.set('q', newFilters.q);
      if (newFilters.provinceId) params.set('provinceId', String(newFilters.provinceId));
      if (newFilters.provinceSlug) params.set('province', newFilters.provinceSlug);
      if (newFilters.types?.length) params.set('types', newFilters.types.join(','));
      if (newFilters.minPrice !== undefined && newFilters.minPrice !== SEARCH_DEFAULTS.MIN_PRICE) {
        params.set('minPrice', String(newFilters.minPrice));
      }
      if (newFilters.maxPrice !== undefined && newFilters.maxPrice !== SEARCH_DEFAULTS.MAX_PRICE) {
        params.set('maxPrice', String(newFilters.maxPrice));
      }
      if (newFilters.amenities?.length) params.set('amenities', newFilters.amenities.join(','));
      if (newFilters.minRating) params.set('minRating', String(newFilters.minRating));
      if (newFilters.sort !== SEARCH_DEFAULTS.SORT) params.set('sort', newFilters.sort);
      if (newFilters.page !== SEARCH_DEFAULTS.PAGE) params.set('page', String(newFilters.page));

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.push(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  // Filter setters
  const setQuery = useCallback(
    (q: string) => {
      const newFilters = { ...filters, q: q || undefined, page: 1 };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const setProvince = useCallback(
    (provinceId: number | undefined, provinceSlug?: string) => {
      const newFilters = { ...filters, provinceId, provinceSlug, page: 1 };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const setTypes = useCallback(
    (types: string[]) => {
      const newFilters = { ...filters, types: types.length ? types : undefined, page: 1 };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const toggleType = useCallback(
    (type: string) => {
      const currentTypes = filters.types || [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter((t) => t !== type)
        : [...currentTypes, type];
      setTypes(newTypes);
    },
    [filters.types, setTypes]
  );

  const setPriceRange = useCallback(
    (min: number, max: number) => {
      const newFilters = { ...filters, minPrice: min, maxPrice: max, page: 1 };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const setAmenities = useCallback(
    (amenities: string[]) => {
      const newFilters = { ...filters, amenities: amenities.length ? amenities : undefined, page: 1 };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const toggleAmenity = useCallback(
    (amenity: string) => {
      const currentAmenities = filters.amenities || [];
      const newAmenities = currentAmenities.includes(amenity)
        ? currentAmenities.filter((a) => a !== amenity)
        : [...currentAmenities, amenity];
      setAmenities(newAmenities);
    },
    [filters.amenities, setAmenities]
  );

  const setMinRating = useCallback(
    (rating: number | undefined) => {
      const newFilters = { ...filters, minRating: rating, page: 1 };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const setSort = useCallback(
    (sort: SortOption) => {
      const newFilters = { ...filters, sort, page: 1 };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const setPage = useCallback(
    (page: number) => {
      const newFilters = { ...filters, page };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const clearFilters = useCallback(() => {
    const newFilters: SearchFilters = {
      sort: SEARCH_DEFAULTS.SORT,
      page: SEARCH_DEFAULTS.PAGE,
    };
    setFilters(newFilters);
    updateURL(newFilters);
  }, [updateURL]);

  const hasActiveFilters =
    !!filters.q ||
    !!filters.provinceId ||
    !!filters.types?.length ||
    (filters.minPrice !== undefined && filters.minPrice !== SEARCH_DEFAULTS.MIN_PRICE) ||
    (filters.maxPrice !== undefined && filters.maxPrice !== SEARCH_DEFAULTS.MAX_PRICE) ||
    !!filters.amenities?.length ||
    !!filters.minRating;

  return {
    filters,
    setQuery,
    setProvince,
    setTypes,
    toggleType,
    setPriceRange,
    setAmenities,
    toggleAmenity,
    setMinRating,
    setSort,
    setPage,
    clearFilters,
    hasActiveFilters,
  };
}
