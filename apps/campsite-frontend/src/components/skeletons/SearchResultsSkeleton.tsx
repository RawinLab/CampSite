'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { CampsiteCardsGridSkeleton } from './CampsiteCardSkeleton';

/**
 * Complete search results skeleton including filters and cards
 */
export function SearchResultsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Search Bar Skeleton */}
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filter Sidebar Skeleton - Desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <Skeleton className="mb-6 h-6 w-24" />

          {/* Type Filter Skeleton */}
          <div className="mb-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </div>

          <Skeleton className="mb-6 h-px w-full" />

          {/* Price Filter Skeleton */}
          <div className="mb-6 space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-6 w-full" />
          </div>

          <Skeleton className="mb-6 h-px w-full" />

          {/* Amenities Filter Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </aside>

        {/* Results Area */}
        <div className="flex-1">
          {/* Results Header Skeleton */}
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Cards Grid Skeleton */}
          <CampsiteCardsGridSkeleton count={6} />

          {/* Pagination Skeleton */}
          <div className="mt-8 flex justify-center gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact search results skeleton (cards only)
 */
export function SearchResultsCompactSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div>
      {/* Results Header Skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Cards Grid Skeleton */}
      <CampsiteCardsGridSkeleton count={count} />
    </div>
  );
}

export default SearchResultsSkeleton;
