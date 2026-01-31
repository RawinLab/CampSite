'use client';

import { useState, Suspense, useEffect, useMemo } from 'react';
import nextDynamic from 'next/dynamic';
import { useSearch } from '@/hooks/useSearch';
import { useCampsites } from '@/hooks/useCampsites';
import { useMapSync } from '@/hooks/useMapSync';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { FilterSidebar, MobileFilterModal } from '@/components/search/FilterSidebar';
import { Pagination } from '@/components/search/Pagination';
import { SortSelect } from '@/components/search/SortSelect';
import { ViewToggle, useViewToggle, type ViewMode } from '@/components/search/ViewToggle';
import { Button } from '@/components/ui/button';
import { SEARCH_DEFAULTS } from '@campsite/shared';
import type { ProvinceSuggestion, MapFilters, MapCampsite } from '@campsite/shared';

// Dynamic import for CampsiteMap to handle SSR safely (Leaflet requires window)
const CampsiteMap = nextDynamic(
  () => import('@/components/map/CampsiteMap').then((mod) => mod.CampsiteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] items-center justify-center rounded-2xl bg-brand-bg">
        <div className="map-loading__spinner" />
      </div>
    ),
  }
);

function SearchPageContent() {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<ProvinceSuggestion | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // View toggle with localStorage persistence
  const { getInitialView, saveView } = useViewToggle('list');

  // Initialize view from localStorage on client
  useEffect(() => {
    setViewMode(getInitialView());
  }, [getInitialView]);

  // Handle view change with persistence
  const handleViewChange = (view: ViewMode) => {
    setViewMode(view);
    saveView(view);
  };

  const {
    filters,
    setQuery,
    setProvince,
    setTypes,
    setPriceRange,
    setAmenities,
    setSort,
    setPage,
    clearFilters,
    hasActiveFilters,
  } = useSearch();

  const { results, isLoading, error } = useCampsites({
    q: filters.q,
    provinceId: filters.provinceId,
    types: filters.types,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    amenities: filters.amenities,
    minRating: filters.minRating,
    sort: filters.sort,
    page: filters.page,
    limit: SEARCH_DEFAULTS.LIMIT,
  });

  const handleProvinceChange = (province: ProvinceSuggestion | null) => {
    setSelectedProvince(province);
    setProvince(province?.id, province?.slug);
  };

  const handleClearAllFilters = () => {
    setSelectedProvince(null);
    clearFilters();
  };

  const activeFilterCount = [
    filters.types?.length ?? 0,
    filters.minPrice !== undefined && filters.minPrice !== SEARCH_DEFAULTS.MIN_PRICE ? 1 : 0,
    filters.maxPrice !== undefined && filters.maxPrice !== SEARCH_DEFAULTS.MAX_PRICE ? 1 : 0,
    filters.amenities?.length ?? 0,
  ].reduce((a, b) => a + b, 0);

  // Convert search filters to map filters format
  const mapFilters = useMemo<MapFilters>(() => ({
    campsite_types: filters.types as MapFilters['campsite_types'],
    province_id: filters.provinceId,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    min_rating: filters.minRating,
    amenity_ids: filters.amenities?.map(Number).filter((n) => !isNaN(n)),
  }), [filters.types, filters.provinceId, filters.minPrice, filters.maxPrice, filters.minRating, filters.amenities]);

  // Use map sync hook for fetching map markers
  const {
    campsites: mapCampsites,
    isLoading: isMapLoading,
    error: mapError,
    setBounds: setMapBounds,
    setFilters: setMapFilters,
  } = useMapSync({
    initialFilters: mapFilters,
    enabled: viewMode === 'map',
  });

  // Sync filters to map when they change
  useEffect(() => {
    if (viewMode === 'map') {
      setMapFilters(mapFilters);
    }
  }, [mapFilters, viewMode, setMapFilters]);

  // Handle map marker click - navigate to campsite detail
  const handleMapMarkerClick = (campsite: MapCampsite) => {
    window.open(`/campsite/${campsite.id}`, '_blank');
  };

  return (
    <div className="container mx-auto bg-background-warm px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text sm:text-3xl">
          ค้นหาแคมป์ปิ้ง
        </h1>
        <p className="mt-1 text-muted-foreground">
          ค้นหาและเปรียบเทียบที่พักแคมป์ปิ้งทั่วประเทศไทย
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          query={filters.q || ''}
          province={selectedProvince}
          onQueryChange={setQuery}
          onProvinceChange={handleProvinceChange}
        />
      </div>

      <div className="flex gap-8">
        {/* Filter Sidebar - Desktop */}
        <FilterSidebar
          className="hidden w-64 shrink-0 lg:block"
          selectedTypes={filters.types || []}
          minPrice={filters.minPrice ?? SEARCH_DEFAULTS.MIN_PRICE}
          maxPrice={filters.maxPrice ?? SEARCH_DEFAULTS.MAX_PRICE}
          selectedAmenities={filters.amenities || []}
          onTypesChange={setTypes}
          onPriceChange={setPriceRange}
          onAmenitiesChange={setAmenities}
          onClearAll={handleClearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Results Area */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                className="rounded-xl lg:hidden"
                onClick={() => setIsMobileFilterOpen(true)}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                ตัวกรอง
                {activeFilterCount > 0 && (
                  <span className="ml-2 rounded-full bg-brand-green/10 px-2 py-0.5 text-xs text-brand-green">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* Results Count */}
              {!isLoading && results && (
                <p className="text-sm text-muted-foreground">
                  พบ{' '}
                  <span className="font-medium text-brand-text">
                    {results.pagination.total}
                  </span>{' '}
                  แห่ง
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <ViewToggle
                view={viewMode}
                onViewChange={handleViewChange}
                listCount={results?.pagination.total}
              />

              {/* Sort - only show in list view */}
              {viewMode === 'list' && (
                <SortSelect value={filters.sort} onChange={setSort} />
              )}
            </div>
          </div>

          {/* Error State */}
          {(error || mapError) && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-700">
              <p className="font-medium">เกิดข้อผิดพลาด</p>
              <p className="text-sm">{error || mapError}</p>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <>
              {/* Results Grid */}
              <SearchResults
                campsites={results?.data || []}
                isLoading={isLoading}
              />

              {/* Pagination */}
              {results && results.pagination.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={results.pagination.page}
                    totalPages={results.pagination.totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}

          {/* Map View */}
          {viewMode === 'map' && (
            <div className="h-[600px] w-full overflow-hidden rounded-2xl lg:h-[700px]">
              <CampsiteMap
                campsites={mapCampsites}
                onBoundsChange={setMapBounds}
                onMarkerClick={handleMapMarkerClick}
                showLegend={true}
                showControls={true}
                isLoading={isMapLoading}
                className="h-full w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <MobileFilterModal
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        selectedTypes={filters.types || []}
        minPrice={filters.minPrice ?? SEARCH_DEFAULTS.MIN_PRICE}
        maxPrice={filters.maxPrice ?? SEARCH_DEFAULTS.MAX_PRICE}
        selectedAmenities={filters.amenities || []}
        onTypesChange={setTypes}
        onPriceChange={setPriceRange}
        onAmenitiesChange={setAmenities}
        onClearAll={handleClearAllFilters}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto bg-background-warm px-4 py-8">กำลังโหลด...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
