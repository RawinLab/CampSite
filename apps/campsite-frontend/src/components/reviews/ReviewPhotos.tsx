'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ReviewPhoto } from '@campsite/shared';

interface ReviewPhotosProps {
  photos: ReviewPhoto[];
  maxVisible?: number;
  className?: string;
}

export function ReviewPhotos({
  photos,
  maxVisible = 4,
  className,
}: ReviewPhotosProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  const visiblePhotos = photos.slice(0, maxVisible);
  const remainingCount = photos.length - maxVisible;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedIndex === null) return;

    if (e.key === 'ArrowLeft') {
      setSelectedIndex((prev) =>
        prev === null ? null : prev === 0 ? photos.length - 1 : prev - 1
      );
    } else if (e.key === 'ArrowRight') {
      setSelectedIndex((prev) =>
        prev === null ? null : (prev + 1) % photos.length
      );
    } else if (e.key === 'Escape') {
      setSelectedIndex(null);
    }
  };

  return (
    <>
      <div className={cn('flex gap-2 flex-wrap', className)}>
        {visiblePhotos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setSelectedIndex(index)}
            className="relative w-20 h-20 rounded-lg overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Image
              src={photo.url}
              alt={`Review photo ${index + 1}`}
              fill
              sizes="80px"
              className="object-cover"
            />
            {index === maxVisible - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-medium">+{remainingCount}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setSelectedIndex(null)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Close gallery"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) =>
                  prev === null ? null : prev === 0 ? photos.length - 1 : prev - 1
                );
              }}
              className="absolute left-4 p-2 text-white hover:text-gray-300 transition-colors"
              aria-label="Previous photo"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-4xl max-h-[80vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[selectedIndex].url}
              alt={`Review photo ${selectedIndex + 1}`}
              width={800}
              height={600}
              className="object-contain max-h-[80vh]"
            />
          </div>

          {/* Next button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) =>
                  prev === null ? null : (prev + 1) % photos.length
                );
              }}
              className="absolute right-4 p-2 text-white hover:text-gray-300 transition-colors"
              aria-label="Next photo"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}

export default ReviewPhotos;
