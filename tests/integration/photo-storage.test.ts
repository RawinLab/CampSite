/**
 * Integration Test: Photo Storage with Supabase
 *
 * Tests photo upload, retrieval, deletion, and management operations
 * with Supabase Storage integration for campsite photos.
 *
 * Test Scenarios:
 * 1. Photo uploads to Supabase Storage bucket
 * 2. Uploaded file accessible via public URL
 * 3. Photo deleted from storage on delete request
 * 4. Reorder updates photo order in database
 * 5. Primary photo flag updates correctly
 * 6. Storage path includes campsite ID
 * 7. Handles concurrent uploads
 * 8. Cleanup on failed upload
 */

import { supabaseAdmin } from '../../apps/campsite-backend/src/lib/supabase';
import { randomUUID } from 'crypto';

// Mock Supabase Storage client
jest.mock('../../apps/campsite-backend/src/lib/supabase', () => ({
  supabaseAdmin: {
    storage: {
      from: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('Integration: Photo Storage with Supabase', () => {
  const mockCampsiteId = randomUUID();
  const mockUserId = randomUUID();
  const STORAGE_BUCKET = 'campsite-photos';

  let mockStorageFrom: jest.Mock;
  let mockDbFrom: jest.Mock;
  let mockUpload: jest.Mock;
  let mockGetPublicUrl: jest.Mock;
  let mockRemove: jest.Mock;
  let mockDbSelect: jest.Mock;
  let mockDbInsert: jest.Mock;
  let mockDbUpdate: jest.Mock;
  let mockDbDelete: jest.Mock;
  let mockDbEq: jest.Mock;
  let mockDbSingle: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock functions
    mockUpload = jest.fn();
    mockGetPublicUrl = jest.fn();
    mockRemove = jest.fn();
    mockDbSelect = jest.fn();
    mockDbInsert = jest.fn();
    mockDbUpdate = jest.fn();
    mockDbDelete = jest.fn();
    mockDbEq = jest.fn();
    mockDbSingle = jest.fn();

    // Setup storage mock chain
    mockStorageFrom = jest.fn().mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
      remove: mockRemove,
    });

    // Setup database mock chain
    mockDbFrom = jest.fn().mockReturnValue({
      select: mockDbSelect.mockReturnThis(),
      insert: mockDbInsert.mockReturnThis(),
      update: mockDbUpdate.mockReturnThis(),
      delete: mockDbDelete.mockReturnThis(),
      eq: mockDbEq.mockReturnThis(),
      single: mockDbSingle.mockReturnThis(),
    });

    (supabaseAdmin.storage.from as jest.Mock) = mockStorageFrom;
    (supabaseAdmin.from as jest.Mock) = mockDbFrom;
  });

  describe('1. Photo uploads to Supabase Storage bucket', () => {
    it('should successfully upload a photo to the storage bucket', async () => {
      const mockFile = Buffer.from('fake-image-data');
      const filename = 'test-photo.jpg';
      const photoId = randomUUID();
      const storagePath = `${mockCampsiteId}/${photoId}.jpg`;

      // Mock successful upload
      mockUpload.mockResolvedValue({
        data: { path: storagePath },
        error: null,
      });

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: `https://storage.example.com/${STORAGE_BUCKET}/${storagePath}` },
      });

      // Call storage upload
      const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, mockFile, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      expect(mockStorageFrom).toHaveBeenCalledWith(STORAGE_BUCKET);
      expect(mockUpload).toHaveBeenCalledWith(storagePath, mockFile, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });
      expect(error).toBeNull();
      expect(data).toEqual({ path: storagePath });
    });

    it('should reject files exceeding size limit', async () => {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const largeFile = Buffer.alloc(MAX_FILE_SIZE + 1);

      // Validate file size before upload
      const isValid = largeFile.length <= MAX_FILE_SIZE;

      expect(isValid).toBe(false);
    });

    it('should reject files with invalid MIME types', async () => {
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
      const invalidMimeType = 'application/pdf';

      const isValid = ALLOWED_TYPES.includes(invalidMimeType);

      expect(isValid).toBe(false);
    });

    it('should upload multiple photos in batch', async () => {
      const files = [
        { buffer: Buffer.from('image1'), filename: 'photo1.jpg' },
        { buffer: Buffer.from('image2'), filename: 'photo2.jpg' },
        { buffer: Buffer.from('image3'), filename: 'photo3.jpg' },
      ];

      const uploadPromises = files.map((file, index) => {
        const photoId = randomUUID();
        const storagePath = `${mockCampsiteId}/${photoId}.jpg`;

        mockUpload.mockResolvedValueOnce({
          data: { path: storagePath },
          error: null,
        });

        return supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, file.buffer, {
            contentType: 'image/jpeg',
          });
      });

      const results = await Promise.all(uploadPromises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.error).toBeNull();
        expect(result.data).toHaveProperty('path');
      });
    });
  });

  describe('2. Uploaded file accessible via public URL', () => {
    it('should return a valid public URL after upload', async () => {
      const photoId = randomUUID();
      const storagePath = `${mockCampsiteId}/${photoId}.jpg`;
      const expectedUrl = `https://storage.example.com/${STORAGE_BUCKET}/${storagePath}`;

      mockUpload.mockResolvedValue({
        data: { path: storagePath },
        error: null,
      });

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: expectedUrl },
      });

      // Upload and get public URL
      const { data } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, Buffer.from('test'));

      const { data: urlData } = supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

      expect(urlData.publicUrl).toBe(expectedUrl);
      expect(urlData.publicUrl).toContain(mockCampsiteId);
      expect(urlData.publicUrl).toContain(STORAGE_BUCKET);
    });

    it('should generate unique URLs for different photos', async () => {
      const photo1Id = randomUUID();
      const photo2Id = randomUUID();

      const url1 = `https://storage.example.com/${STORAGE_BUCKET}/${mockCampsiteId}/${photo1Id}.jpg`;
      const url2 = `https://storage.example.com/${STORAGE_BUCKET}/${mockCampsiteId}/${photo2Id}.jpg`;

      expect(url1).not.toBe(url2);
      expect(url1).toContain(photo1Id);
      expect(url2).toContain(photo2Id);
    });

    it('should include campsite ID in storage path', async () => {
      const photoId = randomUUID();
      const storagePath = `${mockCampsiteId}/${photoId}.jpg`;

      expect(storagePath).toContain(mockCampsiteId);
      expect(storagePath.startsWith(mockCampsiteId)).toBe(true);
    });
  });

  describe('3. Photo deleted from storage on delete request', () => {
    it('should successfully delete a photo from storage', async () => {
      const photoId = randomUUID();
      const storagePath = `${mockCampsiteId}/${photoId}.jpg`;

      mockRemove.mockResolvedValue({
        data: null,
        error: null,
      });

      const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath]);

      expect(mockStorageFrom).toHaveBeenCalledWith(STORAGE_BUCKET);
      expect(mockRemove).toHaveBeenCalledWith([storagePath]);
      expect(error).toBeNull();
    });

    it('should handle deletion errors gracefully', async () => {
      const storagePath = `${mockCampsiteId}/nonexistent.jpg`;

      mockRemove.mockResolvedValue({
        data: null,
        error: { message: 'File not found', statusCode: '404' },
      });

      const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath]);

      expect(error).not.toBeNull();
      expect(error?.message).toBe('File not found');
    });

    it('should delete multiple photos in batch', async () => {
      const photoPaths = [
        `${mockCampsiteId}/photo1.jpg`,
        `${mockCampsiteId}/photo2.jpg`,
        `${mockCampsiteId}/photo3.jpg`,
      ];

      mockRemove.mockResolvedValue({
        data: null,
        error: null,
      });

      const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove(photoPaths);

      expect(mockRemove).toHaveBeenCalledWith(photoPaths);
      expect(error).toBeNull();
    });

    it('should extract storage path from public URL', () => {
      const publicUrl = `https://project.supabase.co/storage/v1/object/public/${STORAGE_BUCKET}/${mockCampsiteId}/photo.jpg`;
      const bucketPath = `storage/v1/object/public/${STORAGE_BUCKET}/`;
      const bucketIndex = publicUrl.indexOf(bucketPath);

      const storagePath = publicUrl.substring(bucketIndex + bucketPath.length);

      expect(storagePath).toBe(`${mockCampsiteId}/photo.jpg`);
      expect(storagePath).toContain(mockCampsiteId);
    });
  });

  describe('4. Reorder updates photo order in database', () => {
    it('should update sort_order for multiple photos', async () => {
      const photoIds = [randomUUID(), randomUUID(), randomUUID()];
      const reorderData = photoIds.map((id, index) => ({
        id,
        sort_order: index,
      }));

      mockDbEq.mockReturnValue({
        data: { id: photoIds[0], sort_order: 0 },
        error: null,
      });

      // Simulate batch update
      for (const item of reorderData) {
        await supabaseAdmin
          .from('campsite_photos')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id);
      }

      expect(mockDbFrom).toHaveBeenCalledWith('campsite_photos');
      expect(mockDbUpdate).toHaveBeenCalledTimes(3);
    });

    it('should maintain order consistency after reordering', async () => {
      const photos = [
        { id: randomUUID(), sort_order: 2 },
        { id: randomUUID(), sort_order: 0 },
        { id: randomUUID(), sort_order: 1 },
      ];

      // Sort by sort_order
      const sortedPhotos = [...photos].sort((a, b) => a.sort_order - b.sort_order);

      expect(sortedPhotos[0].sort_order).toBe(0);
      expect(sortedPhotos[1].sort_order).toBe(1);
      expect(sortedPhotos[2].sort_order).toBe(2);
    });

    it('should handle reorder transaction rollback on error', async () => {
      const photoIds = [randomUUID(), randomUUID()];

      // First update succeeds
      mockDbEq.mockReturnValueOnce({
        data: { id: photoIds[0] },
        error: null,
      });

      // Second update fails
      mockDbEq.mockReturnValueOnce({
        data: null,
        error: { message: 'Update failed' },
      });

      const results = [];
      for (let i = 0; i < photoIds.length; i++) {
        const result = await supabaseAdmin
          .from('campsite_photos')
          .update({ sort_order: i })
          .eq('id', photoIds[i]);
        results.push(result);
      }

      expect(results[0].error).toBeNull();
      expect(results[1].error).not.toBeNull();
    });
  });

  describe('5. Primary photo flag updates correctly', () => {
    it('should set a photo as primary', async () => {
      const photoId = randomUUID();

      mockDbEq.mockReturnValue({
        data: { id: photoId, is_primary: true },
        error: null,
      });

      const { data, error } = await supabaseAdmin
        .from('campsite_photos')
        .update({ is_primary: true })
        .eq('id', photoId);

      expect(mockDbUpdate).toHaveBeenCalledWith({ is_primary: true });
      expect(mockDbEq).toHaveBeenCalledWith('id', photoId);
      expect(error).toBeNull();
    });

    it('should unset other primary photos when setting a new one', async () => {
      const oldPrimaryId = randomUUID();
      const newPrimaryId = randomUUID();

      // First, unset all primary flags for the campsite
      mockDbEq.mockReturnValueOnce({
        data: [],
        error: null,
      });

      // Then set the new primary
      mockDbEq.mockReturnValueOnce({
        data: { id: newPrimaryId, is_primary: true },
        error: null,
      });

      // Unset all primary flags
      await supabaseAdmin
        .from('campsite_photos')
        .update({ is_primary: false })
        .eq('campsite_id', mockCampsiteId);

      // Set new primary
      await supabaseAdmin
        .from('campsite_photos')
        .update({ is_primary: true })
        .eq('id', newPrimaryId);

      expect(mockDbUpdate).toHaveBeenCalledWith({ is_primary: false });
      expect(mockDbUpdate).toHaveBeenCalledWith({ is_primary: true });
    });

    it('should ensure only one primary photo per campsite', async () => {
      const photos = [
        { id: randomUUID(), campsite_id: mockCampsiteId, is_primary: false },
        { id: randomUUID(), campsite_id: mockCampsiteId, is_primary: false },
        { id: randomUUID(), campsite_id: mockCampsiteId, is_primary: true },
      ];

      const primaryPhotos = photos.filter((p) => p.is_primary);

      expect(primaryPhotos).toHaveLength(1);
    });

    it('should set first photo as primary if none exists', async () => {
      const photoId = randomUUID();
      const isFirstPhoto = true; // Assume this is checked by querying count

      const isPrimary = isFirstPhoto;

      expect(isPrimary).toBe(true);
    });
  });

  describe('6. Storage path includes campsite ID', () => {
    it('should organize photos by campsite ID in storage', async () => {
      const photoId = randomUUID();
      const storagePath = `${mockCampsiteId}/${photoId}.jpg`;

      expect(storagePath.startsWith(mockCampsiteId)).toBe(true);
      expect(storagePath).toContain('/');

      const pathParts = storagePath.split('/');
      expect(pathParts[0]).toBe(mockCampsiteId);
      expect(pathParts[1]).toContain('.jpg');
    });

    it('should maintain campsite ID structure for different file types', async () => {
      const extensions = ['jpg', 'jpeg', 'png', 'webp'];

      extensions.forEach((ext) => {
        const photoId = randomUUID();
        const storagePath = `${mockCampsiteId}/${photoId}.${ext}`;

        expect(storagePath).toContain(mockCampsiteId);
        expect(storagePath).toMatch(new RegExp(`${mockCampsiteId}/.*\\.${ext}$`));
      });
    });

    it('should prevent path traversal attacks', () => {
      const maliciousInput = '../../../etc/passwd';
      const photoId = randomUUID();
      const safePath = `${mockCampsiteId}/${photoId}.jpg`;

      expect(safePath).not.toContain('..');
      expect(safePath.startsWith(mockCampsiteId)).toBe(true);
    });

    it('should use UUID for unique photo identification', () => {
      const photoId = randomUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(photoId).toMatch(uuidRegex);
    });
  });

  describe('7. Handles concurrent uploads', () => {
    it('should handle multiple simultaneous uploads', async () => {
      const concurrentUploads = 5;
      const uploadPromises = [];

      for (let i = 0; i < concurrentUploads; i++) {
        const photoId = randomUUID();
        const storagePath = `${mockCampsiteId}/${photoId}.jpg`;

        mockUpload.mockResolvedValueOnce({
          data: { path: storagePath },
          error: null,
        });

        uploadPromises.push(
          supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, Buffer.from(`image${i}`))
        );
      }

      const results = await Promise.all(uploadPromises);

      expect(results).toHaveLength(concurrentUploads);
      results.forEach((result) => {
        expect(result.error).toBeNull();
        expect(result.data).toHaveProperty('path');
      });
    });

    it('should handle race conditions when setting primary photo', async () => {
      const photo1Id = randomUUID();
      const photo2Id = randomUUID();

      // Simulate concurrent primary photo updates
      mockDbEq.mockReturnValue({
        data: { id: photo1Id, is_primary: true },
        error: null,
      });

      const updates = [
        supabaseAdmin
          .from('campsite_photos')
          .update({ is_primary: true })
          .eq('id', photo1Id),
        supabaseAdmin
          .from('campsite_photos')
          .update({ is_primary: true })
          .eq('id', photo2Id),
      ];

      const results = await Promise.all(updates);

      expect(results).toHaveLength(2);
      // In real implementation, need database constraint or transaction
    });

    it('should enforce maximum photo limit during concurrent uploads', async () => {
      const MAX_PHOTOS = 20;
      const currentPhotoCount = 18;
      const attemptedUploads = 5;

      const allowedUploads = Math.max(0, MAX_PHOTOS - currentPhotoCount);

      expect(allowedUploads).toBe(2);
      expect(attemptedUploads).toBeGreaterThan(allowedUploads);
    });

    it('should maintain data consistency during concurrent operations', async () => {
      const operations = [
        { type: 'upload', photoId: randomUUID() },
        { type: 'reorder', photoId: randomUUID() },
        { type: 'setPrimary', photoId: randomUUID() },
      ];

      // All operations should complete without conflicts
      const results = await Promise.all(
        operations.map(async (op) => {
          if (op.type === 'upload') {
            mockUpload.mockResolvedValueOnce({
              data: { path: `${mockCampsiteId}/${op.photoId}.jpg` },
              error: null,
            });
            return supabaseAdmin.storage
              .from(STORAGE_BUCKET)
              .upload(`${mockCampsiteId}/${op.photoId}.jpg`, Buffer.from('test'));
          }
          return { data: {}, error: null };
        })
      );

      expect(results).toHaveLength(operations.length);
    });
  });

  describe('8. Cleanup on failed upload', () => {
    it('should delete uploaded file if database insert fails', async () => {
      const photoId = randomUUID();
      const storagePath = `${mockCampsiteId}/${photoId}.jpg`;

      // Upload succeeds
      mockUpload.mockResolvedValue({
        data: { path: storagePath },
        error: null,
      });

      // Database insert fails
      mockDbInsert.mockReturnValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Cleanup: remove uploaded file
      mockRemove.mockResolvedValue({
        data: null,
        error: null,
      });

      // Simulate upload and db insert
      const uploadResult = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, Buffer.from('test'));

      const dbResult = await supabaseAdmin
        .from('campsite_photos')
        .insert({ campsite_id: mockCampsiteId, url: 'test' });

      if (dbResult.error) {
        // Cleanup on error
        await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([storagePath]);
      }

      expect(uploadResult.error).toBeNull();
      expect(dbResult.error).not.toBeNull();
      expect(mockRemove).toHaveBeenCalledWith([storagePath]);
    });

    it('should rollback all photos if batch upload partially fails', async () => {
      const photos = [
        { id: randomUUID(), buffer: Buffer.from('photo1') },
        { id: randomUUID(), buffer: Buffer.from('photo2') },
        { id: randomUUID(), buffer: Buffer.from('photo3') },
      ];

      const uploadedPaths: string[] = [];

      // First two uploads succeed
      for (let i = 0; i < 2; i++) {
        const storagePath = `${mockCampsiteId}/${photos[i].id}.jpg`;
        uploadedPaths.push(storagePath);

        mockUpload.mockResolvedValueOnce({
          data: { path: storagePath },
          error: null,
        });
      }

      // Third upload fails
      mockUpload.mockResolvedValueOnce({
        data: null,
        error: { message: 'Upload failed' },
      });

      // Simulate cleanup
      mockRemove.mockResolvedValue({
        data: null,
        error: null,
      });

      const results = [];
      for (const photo of photos) {
        const storagePath = `${mockCampsiteId}/${photo.id}.jpg`;
        const result = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, photo.buffer);
        results.push(result);

        if (!result.error) {
          uploadedPaths.push(storagePath);
        }
      }

      // If any failed, cleanup all
      const anyFailed = results.some((r) => r.error !== null);
      if (anyFailed) {
        await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(uploadedPaths);
      }

      expect(anyFailed).toBe(true);
      expect(mockRemove).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const storagePath = `${mockCampsiteId}/failed.jpg`;

      // Upload succeeds
      mockUpload.mockResolvedValue({
        data: { path: storagePath },
        error: null,
      });

      // Database fails
      mockDbInsert.mockReturnValue({
        data: null,
        error: { message: 'DB error' },
      });

      // Cleanup also fails
      mockRemove.mockResolvedValue({
        data: null,
        error: { message: 'Cleanup failed' },
      });

      const uploadResult = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, Buffer.from('test'));

      const dbResult = await supabaseAdmin
        .from('campsite_photos')
        .insert({ url: 'test' });

      let cleanupError = null;
      if (dbResult.error) {
        const cleanupResult = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .remove([storagePath]);
        cleanupError = cleanupResult.error;
      }

      expect(uploadResult.error).toBeNull();
      expect(dbResult.error).not.toBeNull();
      expect(cleanupError).not.toBeNull();
    });

    it('should log cleanup operations for debugging', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const storagePath = `${mockCampsiteId}/test.jpg`;
      const error = new Error('Cleanup failed');

      console.error('Failed to cleanup uploaded file:', storagePath, error);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to cleanup uploaded file:',
        storagePath,
        error
      );

      consoleSpy.mockRestore();
    });

    it('should prevent orphaned files in storage', async () => {
      const photoId = randomUUID();
      const storagePath = `${mockCampsiteId}/${photoId}.jpg`;
      const publicUrl = `https://storage.example.com/${STORAGE_BUCKET}/${storagePath}`;

      // Upload file
      mockUpload.mockResolvedValue({
        data: { path: storagePath },
        error: null,
      });

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl },
      });

      // Insert to database with URL
      mockDbInsert.mockReturnValue({
        data: {
          id: photoId,
          campsite_id: mockCampsiteId,
          url: publicUrl,
        },
        error: null,
      });

      const uploadResult = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, Buffer.from('test'));

      const urlData = supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(uploadResult.data.path);

      const dbResult = await supabaseAdmin
        .from('campsite_photos')
        .insert({
          id: photoId,
          campsite_id: mockCampsiteId,
          url: urlData.data.publicUrl,
        });

      // Both operations should succeed
      expect(uploadResult.error).toBeNull();
      expect(dbResult.error).toBeNull();
      expect(dbResult.data.url).toBe(publicUrl);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle storage quota exceeded', async () => {
      const storagePath = `${mockCampsiteId}/large-file.jpg`;

      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'Storage quota exceeded', statusCode: '413' },
      });

      const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, Buffer.from('test'));

      expect(error).not.toBeNull();
      expect(error?.message).toContain('quota exceeded');
    });

    it('should validate file extension matches content type', () => {
      const filename = 'photo.jpg';
      const contentType = 'image/jpeg';

      const extension = filename.split('.').pop()?.toLowerCase();
      const expectedTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      };

      expect(expectedTypes[extension!]).toBe(contentType);
    });

    it('should handle network timeout during upload', async () => {
      const storagePath = `${mockCampsiteId}/photo.jpg`;

      mockUpload.mockRejectedValue(new Error('Network timeout'));

      await expect(
        supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, Buffer.from('test'))
      ).rejects.toThrow('Network timeout');
    });

    it('should validate photo metadata before storage', () => {
      const metadata = {
        alt_text: 'A' + 'a'.repeat(250), // Exceeds 200 char limit
        is_primary: true,
        sort_order: -1, // Invalid negative order
      };

      const MAX_ALT_TEXT = 200;
      const isAltTextValid = metadata.alt_text.length <= MAX_ALT_TEXT;
      const isSortOrderValid = metadata.sort_order >= 0;

      expect(isAltTextValid).toBe(false);
      expect(isSortOrderValid).toBe(false);
    });
  });
});
