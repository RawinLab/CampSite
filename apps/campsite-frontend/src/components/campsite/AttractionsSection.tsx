'use client';

import { useState, useEffect } from 'react';
import type { NearbyAttraction, AttractionCategory } from '@campsite/shared';
import { AttractionCard } from './AttractionCard';
import { CATEGORY_LABELS } from '@/lib/constants/attractionIcons';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AttractionsSectionProps {
  campsiteId: string;
  campsiteLocation: { lat: number; lng: number };
  maxDistanceKm?: number;
  className?: string;
}

/**
 * Attractions section component for campsite detail page
 */
export function AttractionsSection({
  campsiteId,
  campsiteLocation,
  maxDistanceKm = 20,
  className = '',
}: AttractionsSectionProps) {
  const [attractions, setAttractions] = useState<NearbyAttraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AttractionCategory | 'all'>('all');

  // Fetch attractions
  useEffect(() => {
    const fetchAttractions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          max_distance_km: maxDistanceKm.toString(),
          limit: '20',
        });

        const response = await fetch(
          `${API_BASE_URL}/api/campsites/${campsiteId}/attractions?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch attractions');
        }

        const data = await response.json();
        setAttractions(data.attractions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttractions();
  }, [campsiteId, maxDistanceKm]);

  // Get unique categories from attractions
  const categories = Array.from(
    new Set(attractions.map((a) => a.category))
  ) as AttractionCategory[];

  // Filter attractions by selected category
  const filteredAttractions =
    selectedCategory === 'all'
      ? attractions
      : attractions.filter((a) => a.category === selectedCategory);

  // Don't render if no attractions and no error
  if (!isLoading && !error && attractions.length === 0) {
    return null;
  }

  return (
    <section className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Nearby Attractions</h2>
        {!isLoading && attractions.length > 0 && (
          <span className="text-sm text-gray-500">
            Within {maxDistanceKm} km
          </span>
        )}
      </div>

      {/* Category Filter */}
      {!isLoading && categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({attractions.length})
          </button>
          {categories.map((category) => {
            const count = attractions.filter((a) => a.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {CATEGORY_LABELS[category]} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <AttractionCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Attractions List */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {filteredAttractions.map((attraction) => (
            <AttractionCard
              key={attraction.id}
              attraction={attraction}
              campsiteLocation={campsiteLocation}
            />
          ))}
        </div>
      )}

      {/* Empty State for Filter */}
      {!isLoading && !error && filteredAttractions.length === 0 && attractions.length > 0 && (
        <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
          No {CATEGORY_LABELS[selectedCategory as AttractionCategory]} attractions found nearby.
        </div>
      )}
    </section>
  );
}

/**
 * Loading skeleton for attraction card
 */
function AttractionCardSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-9 w-24 rounded-lg flex-shrink-0" />
    </div>
  );
}
