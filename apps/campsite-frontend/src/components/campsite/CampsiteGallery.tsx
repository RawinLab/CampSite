'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CampsitePhoto } from '@campsite/shared';
import { GalleryLightbox } from './GalleryLightbox';

interface CampsiteGalleryProps {
  photos: CampsitePhoto[];
  campsiteName: string;
  className?: string;
}

export function CampsiteGallery({ photos, campsiteName, className }: CampsiteGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handleOpenLightbox = (index: number) => {
    setLightboxStartIndex(index);
    setLightboxOpen(true);
  };

  if (!photos || photos.length === 0) {
    return (
      <div className={cn('relative aspect-video bg-muted rounded-xl flex items-center justify-center', className)}>
        <span className="text-muted-foreground">No photos available</span>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <>
      <div className={cn('space-y-4', className)}>
        {/* Main Image */}
        <div className="relative aspect-video rounded-xl overflow-hidden group">
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.alt_text || `${campsiteName} photo ${currentIndex + 1}`}
            fill
            priority
            className="object-cover cursor-pointer"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
            onClick={() => handleOpenLightbox(currentIndex)}
          />

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handlePrevious}
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleNext}
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
              {currentIndex + 1} / {photos.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  'relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden transition-all',
                  index === currentIndex
                    ? 'ring-2 ring-primary ring-offset-2'
                    : 'opacity-70 hover:opacity-100'
                )}
                aria-label={`View photo ${index + 1}`}
              >
                <Image
                  src={photo.url}
                  alt={photo.alt_text || `Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <GalleryLightbox
        photos={photos}
        initialIndex={lightboxStartIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        campsiteName={campsiteName}
      />
    </>
  );
}
