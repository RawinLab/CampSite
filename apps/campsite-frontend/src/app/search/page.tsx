'use client';

// Force dynamic rendering for pages using useSearchParams (via useSearch hook)
export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { useCampsites } from '@/hooks/useCampsites';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { FilterSidebar, MobileFilterModal } from '@/components/search/FilterSidebar';
import { Pagination } from '@/components/search/Pagination';
import { SortSelect } from '@/components/search/SortSelect';
import { Button } from '@/components/ui/button';
import { SEARCH_DEFAULTS } from '@campsite/shared';
import type { ProvinceSuggestion } from '@campsite/shared';

function SearchPageContent() {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<ProvinceSuggestion | null>(null);

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          ค้นหาแคมป์ปิ้ง
        </h1>
        <p className="mt-1 text-gray-600">
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
                className="lg:hidden"
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
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* Results Count */}
              {!isLoading && results && (
                <p className="text-sm text-gray-600">
                  พบ{' '}
                  <span className="font-medium text-gray-900">
                    {results.pagination.total}
                  </span>{' '}
                  แห่ง
                </p>
              )}
            </div>

            {/* Sort */}
            <SortSelect value={filters.sort} onChange={setSort} />
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-medium">เกิดข้อผิดพลาด</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

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
    <Suspense fallback={<div className="container mx-auto px-4 py-8">กำลังโหลด...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
