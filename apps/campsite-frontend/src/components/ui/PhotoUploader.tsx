'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Camera, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MAX_PHOTO_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
  validatePhotoFile,
} from '@campsite/shared';

interface PhotoUploaderProps {
  photos: File[];
  onChange: (photos: File[]) => void;
  maxPhotos?: number;
  maxSize?: number;
  className?: string;
}

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export function PhotoUploader({
  photos,
  onChange,
  maxPhotos = 5,
  maxSize = MAX_PHOTO_SIZE_BYTES,
  className,
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Generate previews when photos change
  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const valid: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        // Check file type
        const validation = validatePhotoFile(file);
        if (!validation.valid && validation.error) {
          errors.push(`${file.name}: ${validation.error}`);
          continue;
        }

        // Check custom max size if different from default
        if (maxSize !== MAX_PHOTO_SIZE_BYTES && file.size > maxSize) {
          errors.push(`${file.name}: File size exceeds ${maxSize / 1024 / 1024}MB limit`);
          continue;
        }

        valid.push(file);
      }

      return { valid, errors };
    },
    [maxSize]
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const files = Array.from(fileList);
      const { valid, errors: validationErrors } = validateFiles(files);

      // Check if adding these files would exceed the limit
      const remainingSlots = maxPhotos - photos.length;
      if (valid.length > remainingSlots) {
        validationErrors.push(
          `Can only add ${remainingSlots} more photo${remainingSlots !== 1 ? 's' : ''}. Maximum is ${maxPhotos}.`
        );
      }

      setErrors(validationErrors);

      if (valid.length > 0) {
        const photosToAdd = valid.slice(0, remainingSlots);
        if (photosToAdd.length > 0) {
          onChange([...photos, ...photosToAdd]);
        }
      }
    },
    [photos, maxPhotos, validateFiles, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input so same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [handleFiles]
  );

  const handleRemovePhoto = useCallback(
    (index: number) => {
      const newPhotos = [...photos];
      newPhotos.splice(index, 1);
      onChange(newPhotos);
      // Clear errors when removing a photo (user is taking action)
      setErrors([]);
    },
    [photos, onChange]
  );

  const handleDropZoneClick = useCallback(() => {
    if (photos.length < maxPhotos) {
      inputRef.current?.click();
    }
  }, [photos.length, maxPhotos]);

  const handleDropZoneKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDropZoneClick();
      }
    },
    [handleDropZoneClick]
  );

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnter={handleDragOver}
        onClick={handleDropZoneClick}
        onKeyDown={handleDropZoneKeyDown}
        role="button"
        tabIndex={canAddMore ? 0 : -1}
        aria-label={`Upload photos. ${photos.length} of ${maxPhotos} photos selected.`}
        aria-disabled={!canAddMore}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          canAddMore && 'cursor-pointer',
          isDragging && 'border-primary bg-primary/5',
          !canAddMore && 'opacity-50 cursor-not-allowed bg-muted/30',
          canAddMore && !isDragging && 'hover:border-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={!canAddMore}
          aria-hidden="true"
        />
        <Camera className="w-10 h-10 mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground mb-1">
          <span className="font-medium text-foreground">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          {ALLOWED_EXTENSIONS.map((ext) => ext.toUpperCase()).join(', ')} up to{' '}
          {maxSize / 1024 / 1024}MB each
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-medium">
          {photos.length}/{maxPhotos} photos
        </p>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div
          className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <ul className="text-sm text-destructive space-y-1">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Previews Grid */}
      {photos.length > 0 && (
        <div
          className="grid grid-cols-3 sm:grid-cols-5 gap-3"
          role="list"
          aria-label="Selected photos"
        >
          {photos.map((photo, index) => (
            <div
              key={`${photo.name}-${photo.lastModified}-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
              role="listitem"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previews[index]}
                alt={`Preview ${index + 1}: ${photo.name}`}
                className="w-full h-full object-cover"
              />
              {/* Remove button - visible on hover/focus */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePhoto(index);
                }}
                className={cn(
                  'absolute top-1 right-1 p-1.5 rounded-full',
                  'bg-black/60 text-white',
                  'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
                  'hover:bg-black/80 focus:opacity-100',
                  'transition-opacity',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1'
                )}
                aria-label={`Remove photo ${index + 1}`}
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}

          {/* Add more button (if space available) */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                'aspect-square rounded-lg border-2 border-dashed',
                'flex flex-col items-center justify-center gap-1',
                'text-muted-foreground hover:text-foreground',
                'hover:border-muted-foreground/50 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
              aria-label="Add more photos"
            >
              <Plus className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs">Add</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PhotoUploader;
