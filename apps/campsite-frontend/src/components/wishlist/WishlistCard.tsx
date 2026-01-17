'use client';

import Link from 'next/link';
import Image from 'next/image';
import { X, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TypeBadge } from '@/components/ui/TypeBadge';
import { cn } from '@/lib/utils';
import type { WishlistItemWithCampsite } from '@campsite/shared';

// Type color mapping
const typeColors: Record<string, string> = {
  camping: '#22C55E',
  glamping: '#8B5CF6',
  'tented-resort': '#F59E0B',
  bungalow: '#3B82F6',
  cabin: '#EF4444',
  'rv-caravan': '#EC4899',
};

// Type name mapping (Thai)
const typeNames: Record<string, string> = {
  camping: 'Camping',
  glamping: 'Glamping',
  'tented-resort': 'Tented Resort',
  bungalow: 'Bungalow',
  cabin: 'Cabin',
  'rv-caravan': 'RV/Caravan',
};

interface WishlistCardProps {
  item: WishlistItemWithCampsite;
  isSelected?: boolean;
  selectionMode?: boolean;
  onToggleSelection?: (id: string) => void;
  onRemove?: (campsiteId: string) => void;
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-1">
      <svg
        className="h-4 w-4 text-yellow-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      <span className="text-xs text-gray-500">({reviewCount})</span>
    </div>
  );
}

export function WishlistCard({
  item,
  isSelected = false,
  selectionMode = false,
  onToggleSelection,
  onRemove,
}: WishlistCardProps) {
  const { campsite } = item;

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} THB`;
  };

  const priceDisplay =
    campsite.min_price === campsite.max_price
      ? formatPrice(campsite.min_price)
      : `${formatPrice(campsite.min_price)} - ${formatPrice(campsite.max_price)}`;

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove?.(campsite.id);
  };

  const handleSelectionToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSelection?.(campsite.id);
  };

  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all',
        isSelected && 'ring-2 ring-green-500',
        selectionMode && 'cursor-pointer'
      )}
      onClick={selectionMode ? handleSelectionToggle : undefined}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {campsite.thumbnail_url ? (
          <Image
            src={campsite.thumbnail_url}
            alt={campsite.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <svg
              className="h-12 w-12 text-gray-300"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        {/* Selection checkbox */}
        {selectionMode && (
          <div className="absolute left-3 top-3">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                isSelected
                  ? 'border-green-500 bg-green-500'
                  : 'border-white bg-white/80'
              )}
            >
              {isSelected && <Check className="h-4 w-4 text-white" />}
            </div>
          </div>
        )}

        {/* Remove button */}
        {!selectionMode && (
          <button
            onClick={handleRemove}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
            aria-label="Remove from wishlist"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        )}

        {/* Featured badge */}
        {campsite.is_featured && (
          <div className="absolute left-2 top-2 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-medium text-yellow-900">
            Featured
          </div>
        )}

        {/* Type badge */}
        <div className="absolute bottom-2 left-2">
          <TypeBadge
            name={typeNames[campsite.campsite_type] || campsite.campsite_type}
            colorHex={typeColors[campsite.campsite_type] || '#6B7280'}
            size="sm"
          />
        </div>
      </div>

      <CardContent className="p-4">
        {/* Link wrapper for card content */}
        <Link
          href={`/campsites/${campsite.slug || campsite.id}`}
          className={selectionMode ? 'pointer-events-none' : ''}
        >
          {/* Name & Location */}
          <h3 className="line-clamp-1 font-semibold text-gray-900 group-hover:text-green-600">
            {campsite.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <svg
              className="h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {campsite.province.name_en}
          </p>

          {/* Footer: Rating & Price */}
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <StarRating
              rating={campsite.average_rating}
              reviewCount={campsite.review_count}
            />
            <div className="text-right">
              <span className="text-sm text-gray-500">From</span>
              <p className="font-semibold text-green-600">{priceDisplay}</p>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

export default WishlistCard;
