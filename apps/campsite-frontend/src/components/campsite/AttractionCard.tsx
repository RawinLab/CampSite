'use client';

import type { NearbyAttraction } from '@campsite/shared';
import { getGoogleMapsDirectionsUrl } from '@campsite/shared';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/constants/attractionIcons';
import { getDifficultyClasses, DIFFICULTY_LABELS } from '@/lib/constants/difficultyColors';

interface AttractionCardProps {
  attraction: NearbyAttraction;
  campsiteLocation?: { lat: number; lng: number };
}

/**
 * Category icon component
 */
function CategoryIcon({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#64748b';

  // Simple icon based on category
  const iconPaths: Record<string, JSX.Element> = {
    hiking: (
      <path d="M8 3l4 8 5-5 5 15H2L8 3z" />
    ),
    waterfall: (
      <>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </>
    ),
    temple: (
      <>
        <rect x="3" y="21" width="18" height="2" rx="1" />
        <path d="M5 21V11l7-4 7 4v10" />
        <path d="M9 21v-4a3 3 0 0 1 6 0v4" />
      </>
    ),
    viewpoint: (
      <>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    lake: (
      <>
        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      </>
    ),
    cave: (
      <path d="M8 3l4 8 5-5 5 15H2L8 3zM12 18v3" />
    ),
    market: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
    other: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[category] || iconPaths.other}
    </svg>
  );
}

/**
 * Attraction card component for displaying nearby attractions
 */
export function AttractionCard({ attraction, campsiteLocation }: AttractionCardProps) {
  const categoryLabel = CATEGORY_LABELS[attraction.category] || 'Attraction';
  const categoryColor = CATEGORY_COLORS[attraction.category] || '#64748b';

  // Generate directions URL if coordinates are available
  const directionsUrl =
    attraction.latitude &&
    attraction.longitude &&
    campsiteLocation
      ? getGoogleMapsDirectionsUrl(
          campsiteLocation.lat,
          campsiteLocation.lng,
          attraction.latitude,
          attraction.longitude
        )
      : null;

  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      {/* Icon */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${categoryColor}15` }}
      >
        <CategoryIcon category={attraction.category} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-base font-semibold text-gray-900 truncate">
            {attraction.name}
          </h4>
          {attraction.difficulty && (
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getDifficultyClasses(attraction.difficulty)}`}
            >
              {DIFFICULTY_LABELS[attraction.difficulty]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
          >
            {categoryLabel}
          </span>
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {attraction.distance_km.toFixed(1)} km away
          </span>
        </div>

        {attraction.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {attraction.description}
          </p>
        )}
      </div>

      {/* Directions Button */}
      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
          aria-label={`Get directions to ${attraction.name}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          Directions
        </a>
      )}
    </div>
  );
}
