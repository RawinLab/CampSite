'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MapPin, Star, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CampsiteDetail, CampsitePhoto } from '@campsite/shared';
import { formatRating, getRatingText } from '@/lib/utils/format';

interface HeroSectionProps {
  campsite: CampsiteDetail;
  onOpenGallery?: () => void;
  onShare?: () => void;
  onWishlist?: () => void;
  isWishlisted?: boolean;
}

export function HeroSection({
  campsite,
  onOpenGallery,
  onShare,
  onWishlist,
  isWishlisted = false,
}: HeroSectionProps) {
  const [imageError, setImageError] = useState(false);

  // Get primary photo or first photo
  const primaryPhoto = campsite.photos.find((p) => p.is_primary) || campsite.photos[0];
  const additionalPhotos = campsite.photos.slice(0, 5);

  return (
    <section className="relative">
      {/* Main Hero Image Grid */}
      <div className="relative grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 h-[300px] md:h-[400px] lg:h-[500px] rounded-xl overflow-hidden">
        {/* Main large image */}
        <div
          className="relative col-span-1 md:col-span-2 md:row-span-2 cursor-pointer"
          onClick={onOpenGallery}
        >
          {primaryPhoto && !imageError ? (
            <Image
              src={primaryPhoto.url}
              alt={primaryPhoto.alt_text || campsite.name}
              fill
              priority
              className="object-cover transition-transform hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}
        </div>

        {/* Smaller images grid (desktop only) */}
        {additionalPhotos.slice(1, 5).map((photo, index) => (
          <div
            key={photo.id}
            className={cn(
              'relative hidden md:block cursor-pointer',
              index >= 2 && 'hidden lg:block'
            )}
            onClick={onOpenGallery}
          >
            <Image
              src={photo.url}
              alt={photo.alt_text || `${campsite.name} photo ${index + 2}`}
              fill
              className="object-cover transition-transform hover:scale-105"
              sizes="25vw"
            />
          </div>
        ))}

        {/* View all photos button */}
        {campsite.photos.length > 1 && (
          <button
            onClick={onOpenGallery}
            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:bg-white transition-colors"
          >
            View all {campsite.photos.length} photos
          </button>
        )}
      </div>

      {/* Title and Quick Info */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            {/* Campsite Name */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">{campsite.name}</h1>

            {/* Location */}
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              <span>
                {campsite.province.name_th}, {campsite.province.name_en}
              </span>
            </div>

            {/* Rating */}
            {campsite.review_count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="ml-1 font-semibold">{formatRating(campsite.average_rating)}</span>
                </div>
                <span className="text-muted-foreground">
                  {getRatingText(campsite.average_rating)} ({campsite.review_count} reviews)
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onShare}
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onWishlist}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={cn(isWishlisted && 'text-red-500 border-red-500')}
            >
              <Heart className={cn('w-4 h-4', isWishlisted && 'fill-red-500')} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
