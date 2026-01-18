'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploader } from '@/components/ui/FileUploader';
import { DraggablePhotoGrid } from './DraggablePhotoGrid';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { CampsitePhotoResponse } from '@campsite/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3091';

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
  const { session } = useAuth();

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

      if (!session?.access_token) {
        toast({
          title: 'Error',
          description: 'You must be logged in to upload photos',
          variant: 'destructive',
        });
        return;
      }

      setIsUploading(true);

      try {
        for (const file of files) {
          // Upload directly to backend API using multipart form data
          const formData = new FormData();
          formData.append('photo', file);
          formData.append('alt_text', file.name.replace(/\.[^/.]+$/, ''));
          formData.append('is_primary', String(photos.length === 0));

          const response = await fetch(
            `${API_BASE_URL}/api/dashboard/campsites/${campsiteId}/photos`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
              body: formData,
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(errorData.error || `Failed to upload ${file.name}`);
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
    [campsiteId, photos.length, maxPhotos, toast, session?.access_token]
  );

  const handleReorder = useCallback(
    async (reorderedPhotos: CampsitePhotoResponse[]) => {
      if (!session?.access_token) {
        toast({
          title: 'Error',
          description: 'You must be logged in to reorder photos',
          variant: 'destructive',
        });
        return;
      }

      const previousPhotos = [...photos];
      setPhotos(reorderedPhotos);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/dashboard/campsites/${campsiteId}/photos/reorder`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
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
    [campsiteId, photos, toast, session?.access_token]
  );

  const handleSetPrimary = useCallback(
    async (photoId: string) => {
      if (!session?.access_token) {
        toast({
          title: 'Error',
          description: 'You must be logged in to set primary photo',
          variant: 'destructive',
        });
        return;
      }

      const previousPhotos = [...photos];
      setPhotos((prev) =>
        prev.map((p) => ({ ...p, is_primary: p.id === photoId }))
      );

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/dashboard/campsites/${campsiteId}/photos/${photoId}/primary`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
          }
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
    [campsiteId, photos, toast, session?.access_token]
  );

  const handleDelete = useCallback(
    async (photoId: string) => {
      if (!session?.access_token) {
        toast({
          title: 'Error',
          description: 'You must be logged in to delete photos',
          variant: 'destructive',
        });
        return;
      }

      const previousPhotos = [...photos];
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));

      try {
        // Delete via backend API - backend handles storage deletion
        const response = await fetch(
          `${API_BASE_URL}/api/dashboard/campsites/${campsiteId}/photos/${photoId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete photo');
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
    [campsiteId, photos, toast, session?.access_token]
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
