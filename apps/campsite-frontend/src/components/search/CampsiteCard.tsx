'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { TypeBadge } from '@/components/ui/TypeBadge';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { cn } from '@/lib/utils';
import type { CampsiteCard as CampsiteCardType } from '@campsite/shared';

interface CampsiteCardProps {
  campsite: CampsiteCardType;
  className?: string;
}

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
  camping: 'แคมป์ปิ้ง',
  glamping: 'แกลมปิ้ง',
  'tented-resort': 'รีสอร์ทเต็นท์',
  bungalow: 'บังกะโล',
  cabin: 'กระท่อม',
  'rv-caravan': 'RV/คาราวาน',
};

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-1">
      <svg
        className="h-4 w-4 fill-amber-500 text-amber-500"
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

export function CampsiteCard({ campsite, className }: CampsiteCardProps) {
  const formatPrice = (price: number) => {
    return `฿${price.toLocaleString()}`;
  };

  const priceDisplay =
    campsite.min_price === campsite.max_price
      ? formatPrice(campsite.min_price)
      : `${formatPrice(campsite.min_price)} - ${formatPrice(campsite.max_price)}`;

  return (
    <div className="relative" data-testid="campsite-card" data-campsite-id={campsite.id}>
      {/* Wishlist button - outside Link to ensure clickability */}
      <div className="absolute right-2 top-2 z-20 rounded-full bg-white/80 p-2 backdrop-blur-sm">
        <WishlistButton
          campsiteId={campsite.id}
          size="sm"
          variant="icon"
        />
      </div>

      <Link href={`/campsites/${campsite.slug || campsite.id}`}>
        <Card
          className={cn(
            'group overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
            className
          )}
        >
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
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
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}

            {/* Featured badge */}
            {campsite.is_featured && (
              <div className="absolute left-2 top-2 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-medium text-yellow-900">
                แนะนำ
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
            {/* Name & Location */}
            <h3 className="line-clamp-1 font-semibold text-brand-text group-hover:text-brand-green">
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
              {campsite.province.name_th}
            </p>

            {/* Description */}
            <p className="mt-2 line-clamp-2 text-sm text-gray-600">
              {campsite.description}
            </p>

            {/* Footer: Rating & Price */}
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <StarRating
                rating={campsite.average_rating}
                reviewCount={campsite.review_count}
              />
              <div className="text-right">
                <span className="text-sm text-gray-500">เริ่มต้น</span>
                <p className="font-bold text-brand-green">{priceDisplay}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

export default CampsiteCard;
