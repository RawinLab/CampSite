'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotosStepProps {
  photos: File[];
  onChange: (photos: File[]) => void;
  onBack: () => void;
  onNext: () => void;
}

const MAX_PHOTOS = 20;
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function PhotosStep({ photos, onChange, onBack, onNext }: PhotosStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Use JPG, PNG, or WebP.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        errors.push(`${file.name}: File too large. Max ${MAX_SIZE_MB}MB.`);
        continue;
      }
      valid.push(file);
    }

    return { valid, errors };
  };

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const files = Array.from(fileList);
      const remainingSlots = MAX_PHOTOS - photos.length;

      if (files.length > remainingSlots) {
        setErrors([`Can only add ${remainingSlots} more photo(s). Maximum ${MAX_PHOTOS}.`]);
        return;
      }

      const { valid, errors: validationErrors } = validateFiles(files);
      setErrors(validationErrors);

      if (valid.length > 0) {
        const newPhotos = [...photos, ...valid];
        onChange(newPhotos);

        // Create previews
        const newPreviews = valid.map((file) => URL.createObjectURL(file));
        setPreviews((prev) => [...prev, ...newPreviews]);
      }
    },
    [photos, onChange]
  );

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    onChange(newPhotos);

    // Revoke and remove preview
    URL.revokeObjectURL(previews[index]);
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging && 'border-primary bg-primary/5',
          photos.length >= MAX_PHOTOS && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          type="file"
          id="photo-upload"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
          disabled={photos.length >= MAX_PHOTOS}
        />
        <label
          htmlFor="photo-upload"
          className={cn(
            'cursor-pointer',
            photos.length >= MAX_PHOTOS && 'cursor-not-allowed'
          )}
        >
          <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm mb-1">
            <span className="font-medium text-foreground">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WebP up to {MAX_SIZE_MB}MB ({photos.length}/{MAX_PHOTOS} photos)
          </p>
        </label>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <ul className="text-sm text-destructive space-y-1">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Photo previews */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            First photo will be used as the main image. You can reorder photos after creating
            the campsite.
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
              >
                {previews[index] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previews[index]}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Main
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Photos are optional but highly recommended. Campsites with photos get more
          visibility.
        </p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next: Amenities</Button>
      </div>
    </div>
  );
}
