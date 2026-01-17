'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploader } from '@/components/ui/FileUploader';
import { DraggablePhotoGrid } from './DraggablePhotoGrid';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { CampsitePhotoResponse } from '@campsite/shared';

interface PhotosManagerProps {
  campsiteId: string;
  photos: CampsitePhotoResponse[];
  maxPhotos?: number;
}

export function PhotosManager({
  campsiteId,
  photos: initialPhotos,
  maxPhotos = 20,
}: PhotosManagerProps) {
  const [photos, setPhotos] = useState<CampsitePhotoResponse[]>(initialPhotos);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (photos.length + files.length > maxPhotos) {
        toast({
          title: 'Error',
          description: `Maximum ${maxPhotos} photos allowed`,
          variant: 'destructive',
        });
        return;
      }

      setIsUploading(true);

      try {
        for (const file of files) {
          // Upload to Supabase Storage
          const fileName = `${campsiteId}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('campsite-photos')
            .upload(fileName, file);

          if (uploadError) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('campsite-photos')
            .getPublicUrl(fileName);

          // Create photo record
          const response = await fetch(`/api/dashboard/campsites/${campsiteId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: publicUrl,
              alt_text: file.name.replace(/\.[^/.]+$/, ''),
              is_primary: photos.length === 0,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create photo record');
          }

          const { data: newPhoto } = await response.json();
          setPhotos((prev) => [...prev, newPhoto]);
        }

        toast({
          title: 'Success',
          description: `${files.length} photo${files.length > 1 ? 's' : ''} uploaded successfully`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to upload photos',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [campsiteId, photos.length, maxPhotos, toast, supabase]
  );

  const handleReorder = useCallback(
    async (reorderedPhotos: CampsitePhotoResponse[]) => {
      const previousPhotos = [...photos];
      setPhotos(reorderedPhotos);

      try {
        const response = await fetch(
          `/api/dashboard/campsites/${campsiteId}/photos/reorder`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photos: reorderedPhotos.map((p, index) => ({
                id: p.id,
                sort_order: index,
              })),
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to reorder photos');
        }
      } catch (error) {
        setPhotos(previousPhotos);
        toast({
          title: 'Error',
          description: 'Failed to reorder photos',
          variant: 'destructive',
        });
      }
    },
    [campsiteId, photos, toast]
  );

  const handleSetPrimary = useCallback(
    async (photoId: string) => {
      const previousPhotos = [...photos];
      setPhotos((prev) =>
        prev.map((p) => ({ ...p, is_primary: p.id === photoId }))
      );

      try {
        const response = await fetch(
          `/api/dashboard/campsites/${campsiteId}/photos/${photoId}/primary`,
          { method: 'PATCH' }
        );

        if (!response.ok) {
          throw new Error('Failed to set primary photo');
        }

        toast({
          title: 'Success',
          description: 'Primary photo updated',
        });
      } catch (error) {
        setPhotos(previousPhotos);
        toast({
          title: 'Error',
          description: 'Failed to set primary photo',
          variant: 'destructive',
        });
      }
    },
    [campsiteId, photos, toast]
  );

  const handleDelete = useCallback(
    async (photoId: string) => {
      const photoToDelete = photos.find((p) => p.id === photoId);
      const previousPhotos = [...photos];
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));

      try {
        const response = await fetch(
          `/api/dashboard/campsites/${campsiteId}/photos/${photoId}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          throw new Error('Failed to delete photo');
        }

        // Delete from storage
        if (photoToDelete) {
          const path = photoToDelete.url.split('/campsite-photos/')[1];
          if (path) {
            await supabase.storage.from('campsite-photos').remove([path]);
          }
        }

        toast({
          title: 'Success',
          description: 'Photo deleted',
        });
      } catch (error) {
        setPhotos(previousPhotos);
        toast({
          title: 'Error',
          description: 'Failed to delete photo',
          variant: 'destructive',
        });
      }
    },
    [campsiteId, photos, toast, supabase]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos ({photos.length}/{maxPhotos})</CardTitle>
        <CardDescription>
          Upload photos of your campsite. First photo will be used as the main image.
          Maximum {maxPhotos} photos, 5MB each.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUploader
          onUpload={handleUpload}
          disabled={isUploading || photos.length >= maxPhotos}
          maxFiles={maxPhotos - photos.length}
        />

        <DraggablePhotoGrid
          photos={photos}
          onReorder={handleReorder}
          onSetPrimary={handleSetPrimary}
          onDelete={handleDelete}
          disabled={isUploading}
        />
      </CardContent>
    </Card>
  );
}
