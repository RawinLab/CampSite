import type { CampsitePhotoResponse } from '@campsite/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3091';

export interface PhotoUploadResult {
  success: boolean;
  data: CampsitePhotoResponse;
  message?: string;
}

export interface PhotoDeleteResult {
  success: boolean;
  message?: string;
}

/**
 * Upload a photo to the backend API
 * The backend expects the file to be uploaded to Supabase Storage first,
 * then the URL is sent to create a photo record
 */
export async function uploadPhotoRecord(
  token: string,
  campsiteId: string,
  data: {
    url: string;
    alt_text?: string;
    is_primary?: boolean;
  }
): Promise<CampsitePhotoResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/dashboard/campsites/${campsiteId}/photos`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to create photo record' }));
    throw new Error(error.error || 'Failed to create photo record');
  }

  const result: PhotoUploadResult = await response.json();
  return result.data;
}

/**
 * Delete a photo via the backend API
 */
export async function deletePhoto(
  token: string,
  campsiteId: string,
  photoId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/dashboard/campsites/${campsiteId}/photos/${photoId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to delete photo' }));
    throw new Error(error.error || 'Failed to delete photo');
  }
}

/**
 * Reorder photos via backend API
 */
export async function reorderPhotos(
  token: string,
  campsiteId: string,
  photos: { id: string; sort_order: number }[]
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/dashboard/campsites/${campsiteId}/photos/reorder`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ photos }),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to reorder photos' }));
    throw new Error(error.error || 'Failed to reorder photos');
  }
}

/**
 * Set a photo as primary via backend API
 */
export async function setPhotoPrimary(
  token: string,
  campsiteId: string,
  photoId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/dashboard/campsites/${campsiteId}/photos/${photoId}/primary`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to set primary photo' }));
    throw new Error(error.error || 'Failed to set primary photo');
  }
}

/**
 * Upload a file to Supabase Storage via the backend API
 * This endpoint handles the actual file upload
 */
export async function uploadPhotoFile(
  token: string,
  campsiteId: string,
  file: File
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${API_BASE_URL}/api/dashboard/campsites/${campsiteId}/photos/upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to upload file' }));
    throw new Error(error.error || 'Failed to upload file');
  }

  const result = await response.json();
  return { url: result.data?.url || result.url };
}
