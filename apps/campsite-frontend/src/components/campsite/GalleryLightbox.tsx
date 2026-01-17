'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CampsitePhoto } from '@campsite/shared';

interface GalleryLightboxProps {
  photos: CampsitePhoto[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  campsiteName: string;
}

export function GalleryLightbox({
  photos,
  initialIndex = 0,
  isOpen,
  onClose,
  campsiteName,
}: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset index when lightbox opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [isOpen, initialIndex]);

  // Navigation handlers
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    setIsZoomed(false);
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          setIsZoomed((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext]);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return;
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isZoomed) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - touchStart.x;
    setTouchDelta(delta);
  };

  const handleTouchEnd = () => {
    if (!touchStart || isZoomed) {
      setTouchStart(null);
      setTouchDelta(0);
      return;
    }

    const threshold = 50; // Minimum swipe distance

    if (touchDelta > threshold) {
      goToPrevious();
    } else if (touchDelta < -threshold) {
      goToNext();
    }

    setTouchStart(null);
    setTouchDelta(0);
  };

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white">
          <span className="text-lg font-medium">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setIsZoomed(!isZoomed)}
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
            aria-label="Close gallery"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Main Image Area */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous Button */}
        {photos.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 z-10 bg-black/50 hover:bg-black/70 text-white h-12 w-12"
            onClick={goToPrevious}
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}

        {/* Image */}
        <div
          className={cn(
            'relative w-full h-full transition-transform duration-300',
            isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          )}
          style={{
            transform: touchDelta && !isZoomed ? `translateX(${touchDelta}px)` : undefined,
          }}
          onClick={() => !touchDelta && setIsZoomed(!isZoomed)}
        >
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.alt_text || `${campsiteName} photo ${currentIndex + 1}`}
            fill
            className={cn(
              'object-contain transition-transform',
              isZoomed && 'object-cover'
            )}
            sizes="100vw"
            priority
          />
        </div>

        {/* Next Button */}
        {photos.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 z-10 bg-black/50 hover:bg-black/70 text-white h-12 w-12"
            onClick={goToNext}
            aria-label="Next photo"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}
      </div>

      {/* Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex gap-2 justify-center overflow-x-auto">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsZoomed(false);
                }}
                className={cn(
                  'relative flex-shrink-0 w-16 h-12 rounded-md overflow-hidden transition-all',
                  index === currentIndex
                    ? 'ring-2 ring-white'
                    : 'opacity-50 hover:opacity-100'
                )}
                aria-label={`View photo ${index + 1}`}
              >
                <Image
                  src={photo.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Photo Caption */}
      {currentPhoto.alt_text && (
        <div className="absolute bottom-20 left-0 right-0 text-center">
          <p className="text-white/80 text-sm px-4">{currentPhoto.alt_text}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-white/50 text-xs hidden md:block">
        Use arrow keys to navigate | Space to zoom | Esc to close
      </div>
    </div>
  );
}
