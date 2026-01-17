'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Star, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CampsitePhotoResponse } from '@campsite/shared';

interface DraggablePhotoGridProps {
  photos: CampsitePhotoResponse[];
  onReorder: (photos: CampsitePhotoResponse[]) => Promise<void>;
  onSetPrimary: (photoId: string) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  disabled?: boolean;
}

export function DraggablePhotoGrid({
  photos,
  onReorder,
  onSetPrimary,
  onDelete,
  disabled = false,
}: DraggablePhotoGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState<string | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex || disabled) return;

      const newPhotos = [...photos];
      const [removed] = newPhotos.splice(draggedIndex, 1);
      newPhotos.splice(dropIndex, 0, removed);

      // Update sort_order
      const reorderedPhotos = newPhotos.map((photo, index) => ({
        ...photo,
        sort_order: index,
      }));

      setDraggedIndex(null);
      await onReorder(reorderedPhotos);
    },
    [draggedIndex, photos, onReorder, disabled]
  );

  const handleSetPrimary = useCallback(
    async (photoId: string) => {
      if (disabled) return;
      setLoadingPhoto(photoId);
      try {
        await onSetPrimary(photoId);
      } finally {
        setLoadingPhoto(null);
      }
    },
    [onSetPrimary, disabled]
  );

  const handleDelete = useCallback(
    async (photoId: string) => {
      if (disabled) return;
      if (!confirm('Are you sure you want to delete this photo?')) return;

      setDeletingPhoto(photoId);
      try {
        await onDelete(photoId);
      } finally {
        setDeletingPhoto(null);
      }
    },
    [onDelete, disabled]
  );

  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">
          No photos uploaded yet. Upload photos to showcase your campsite.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          draggable={!disabled}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          className={cn(
            'relative group rounded-lg overflow-hidden border bg-muted aspect-[4/3]',
            draggedIndex === index && 'opacity-50',
            !disabled && 'cursor-move'
          )}
        >
          <Image
            src={photo.url}
            alt={photo.alt_text || `Photo ${index + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Primary badge */}
          {photo.is_primary && (
            <Badge className="absolute top-2 left-2 gap-1">
              <Star className="w-3 h-3 fill-current" />
              Primary
            </Badge>
          )}

          {/* Drag handle */}
          {!disabled && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 text-white p-1 rounded">
                <GripVertical className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Actions overlay */}
          {!disabled && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {!photo.is_primary && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleSetPrimary(photo.id)}
                  disabled={loadingPhoto === photo.id}
                >
                  {loadingPhoto === photo.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-1" />
                      Set Primary
                    </>
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(photo.id)}
                disabled={deletingPhoto === photo.id}
              >
                {deletingPhoto === photo.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
