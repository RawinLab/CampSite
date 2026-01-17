/**
 * Tests for Supabase Storage Transform utilities
 */

import {
  getTransformedImageUrl,
  getImageUrl,
  parseStorageUrl,
  transformImageUrl,
  generateSrcSet,
  getPlaceholderBlur,
  isSupabaseStorageUrl,
  IMAGE_SIZES,
  type ImageSize,
  type ImageTransformOptions,
} from '../../src/utils/image';

describe('Image Transformation Utilities', () => {
  const STORAGE_URL = 'https://test.supabase.co';
  const BUCKET = 'campsite-images';
  const PATH = 'campsites/test-image.jpg';

  describe('getTransformedImageUrl', () => {
    it('should generate URL with width parameter', () => {
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { width: 300 });
      expect(url).toBe(
        `${STORAGE_URL}/storage/v1/render/image/public/${BUCKET}/${PATH}?width=300`
      );
    });

    it('should generate URL with height parameter', () => {
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { height: 200 });
      expect(url).toBe(
        `${STORAGE_URL}/storage/v1/render/image/public/${BUCKET}/${PATH}?height=200`
      );
    });

    it('should generate URL with all parameters', () => {
      const options: ImageTransformOptions = {
        width: 800,
        height: 600,
        resize: 'cover',
        quality: 85,
        format: 'webp',
      };
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, options);
      expect(url).toContain('width=800');
      expect(url).toContain('height=600');
      expect(url).toContain('resize=cover');
      expect(url).toContain('quality=85');
      expect(url).toContain('format=webp');
    });

    it('should generate URL without query params when options are empty', () => {
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, {});
      expect(url).toBe(`${STORAGE_URL}/storage/v1/render/image/public/${BUCKET}/${PATH}`);
    });

    it('should handle resize modes correctly', () => {
      const coverUrl = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { resize: 'cover' });
      expect(coverUrl).toContain('resize=cover');

      const containUrl = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { resize: 'contain' });
      expect(containUrl).toContain('resize=contain');

      const fillUrl = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { resize: 'fill' });
      expect(fillUrl).toContain('resize=fill');
    });

    it('should handle format options correctly', () => {
      const webpUrl = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { format: 'webp' });
      expect(webpUrl).toContain('format=webp');

      const pngUrl = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { format: 'png' });
      expect(pngUrl).toContain('format=png');

      const jpegUrl = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { format: 'jpeg' });
      expect(jpegUrl).toContain('format=jpeg');
    });

    it('should handle quality settings correctly', () => {
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { quality: 90 });
      expect(url).toContain('quality=90');
    });

    it('should handle paths with special characters', () => {
      const specialPath = 'campsites/user-123/image name with spaces.jpg';
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, specialPath, { width: 300 });
      expect(url).toContain(specialPath);
    });
  });

  describe('getImageUrl', () => {
    it('should generate thumbnail URL with correct dimensions', () => {
      const url = getImageUrl(STORAGE_URL, BUCKET, PATH, 'thumbnail');
      expect(url).toContain('width=300');
      expect(url).toContain('height=200');
      expect(url).toContain('resize=cover');
      expect(url).toContain('quality=80');
    });

    it('should generate gallery URL (medium size) with correct dimensions', () => {
      const url = getImageUrl(STORAGE_URL, BUCKET, PATH, 'gallery');
      expect(url).toContain('width=800');
      expect(url).toContain('height=600');
      expect(url).toContain('resize=cover');
      expect(url).toContain('quality=85');
    });

    it('should generate full URL (large size) with correct dimensions', () => {
      const url = getImageUrl(STORAGE_URL, BUCKET, PATH, 'full');
      expect(url).toContain('width=1920');
      expect(url).toContain('height=1080');
      expect(url).toContain('resize=contain');
      expect(url).toContain('quality=90');
    });

    it('should generate og image URL with correct dimensions', () => {
      const url = getImageUrl(STORAGE_URL, BUCKET, PATH, 'og');
      expect(url).toContain('width=1200');
      expect(url).toContain('height=630');
      expect(url).toContain('resize=cover');
      expect(url).toContain('quality=85');
    });

    it('should default to gallery size when no size specified', () => {
      const url = getImageUrl(STORAGE_URL, BUCKET, PATH);
      expect(url).toContain('width=800');
      expect(url).toContain('height=600');
    });

    it('should use predefined IMAGE_SIZES constants', () => {
      expect(IMAGE_SIZES.thumbnail).toEqual({
        width: 300,
        height: 200,
        resize: 'cover',
        quality: 80,
      });
      expect(IMAGE_SIZES.gallery).toEqual({
        width: 800,
        height: 600,
        resize: 'cover',
        quality: 85,
      });
      expect(IMAGE_SIZES.full).toEqual({
        width: 1920,
        height: 1080,
        resize: 'contain',
        quality: 90,
      });
      expect(IMAGE_SIZES.og).toEqual({
        width: 1200,
        height: 630,
        resize: 'cover',
        quality: 85,
      });
    });
  });

  describe('parseStorageUrl', () => {
    it('should parse standard public object URL', () => {
      const fullUrl = `${STORAGE_URL}/storage/v1/object/public/${BUCKET}/${PATH}`;
      const result = parseStorageUrl(fullUrl);
      expect(result).toEqual({ bucket: BUCKET, path: PATH });
    });

    it('should parse render image URL', () => {
      const fullUrl = `${STORAGE_URL}/storage/v1/render/image/public/${BUCKET}/${PATH}`;
      const result = parseStorageUrl(fullUrl);
      expect(result).toEqual({ bucket: BUCKET, path: PATH });
    });

    it('should parse render image URL with query parameters', () => {
      const fullUrl = `${STORAGE_URL}/storage/v1/render/image/public/${BUCKET}/${PATH}?width=800&height=600`;
      const result = parseStorageUrl(fullUrl);
      expect(result).toEqual({ bucket: BUCKET, path: PATH });
    });

    it('should handle nested paths correctly', () => {
      const nestedPath = 'campsites/owner-123/location-456/image.jpg';
      const fullUrl = `${STORAGE_URL}/storage/v1/object/public/${BUCKET}/${nestedPath}`;
      const result = parseStorageUrl(fullUrl);
      expect(result).toEqual({ bucket: BUCKET, path: nestedPath });
    });

    it('should return null for invalid URLs', () => {
      expect(parseStorageUrl('https://example.com/image.jpg')).toBeNull();
      expect(parseStorageUrl('not-a-url')).toBeNull();
      expect(parseStorageUrl('')).toBeNull();
    });

    it('should return null for malformed storage URLs', () => {
      const malformedUrl = `${STORAGE_URL}/storage/invalid/path`;
      expect(parseStorageUrl(malformedUrl)).toBeNull();
    });

    it('should handle URLs with different bucket names', () => {
      const differentBucket = 'avatars';
      const fullUrl = `${STORAGE_URL}/storage/v1/object/public/${differentBucket}/${PATH}`;
      const result = parseStorageUrl(fullUrl);
      expect(result).toEqual({ bucket: differentBucket, path: PATH });
    });
  });

  describe('transformImageUrl', () => {
    it('should transform public object URL to thumbnail', () => {
      const fullUrl = `${STORAGE_URL}/storage/v1/object/public/${BUCKET}/${PATH}`;
      const transformed = transformImageUrl(fullUrl, STORAGE_URL, 'thumbnail');
      expect(transformed).toContain('width=300');
      expect(transformed).toContain('height=200');
    });

    it('should transform public object URL to gallery size', () => {
      const fullUrl = `${STORAGE_URL}/storage/v1/object/public/${BUCKET}/${PATH}`;
      const transformed = transformImageUrl(fullUrl, STORAGE_URL, 'gallery');
      expect(transformed).toContain('width=800');
      expect(transformed).toContain('height=600');
    });

    it('should transform render URL to different size', () => {
      const fullUrl = `${STORAGE_URL}/storage/v1/render/image/public/${BUCKET}/${PATH}?width=400`;
      const transformed = transformImageUrl(fullUrl, STORAGE_URL, 'full');
      expect(transformed).toContain('width=1920');
      expect(transformed).toContain('height=1080');
    });

    it('should return original URL when parsing fails', () => {
      const invalidUrl = 'https://example.com/image.jpg';
      const result = transformImageUrl(invalidUrl, STORAGE_URL, 'thumbnail');
      expect(result).toBe(invalidUrl);
    });

    it('should handle all image sizes', () => {
      const fullUrl = `${STORAGE_URL}/storage/v1/object/public/${BUCKET}/${PATH}`;

      const thumbnail = transformImageUrl(fullUrl, STORAGE_URL, 'thumbnail');
      expect(thumbnail).toContain('width=300');

      const gallery = transformImageUrl(fullUrl, STORAGE_URL, 'gallery');
      expect(gallery).toContain('width=800');

      const full = transformImageUrl(fullUrl, STORAGE_URL, 'full');
      expect(full).toContain('width=1920');

      const og = transformImageUrl(fullUrl, STORAGE_URL, 'og');
      expect(og).toContain('width=1200');
    });
  });

  describe('generateSrcSet', () => {
    it('should generate srcSet with multiple sizes', () => {
      const srcSet = generateSrcSet(STORAGE_URL, BUCKET, PATH);
      expect(srcSet).toContain('400w');
      expect(srcSet).toContain('800w');
      expect(srcSet).toContain('1200w');
      expect(srcSet).toContain('1920w');
    });

    it('should include correct URLs for each size', () => {
      const srcSet = generateSrcSet(STORAGE_URL, BUCKET, PATH);
      expect(srcSet).toContain(`${STORAGE_URL}/storage/v1/render/image/public/${BUCKET}/${PATH}`);
      expect(srcSet).toContain('width=400');
      expect(srcSet).toContain('width=800');
      expect(srcSet).toContain('width=1200');
      expect(srcSet).toContain('width=1920');
    });

    it('should use cover resize mode and quality 85', () => {
      const srcSet = generateSrcSet(STORAGE_URL, BUCKET, PATH);
      const parts = srcSet.split(', ');
      parts.forEach(part => {
        expect(part).toContain('resize=cover');
        expect(part).toContain('quality=85');
      });
    });

    it('should format srcSet correctly with comma separators', () => {
      const srcSet = generateSrcSet(STORAGE_URL, BUCKET, PATH);
      const parts = srcSet.split(', ');
      expect(parts).toHaveLength(4);
      parts.forEach(part => {
        expect(part).toMatch(/^https:\/\/.+ \d+w$/);
      });
    });

    it('should handle different bucket names', () => {
      const differentBucket = 'avatars';
      const srcSet = generateSrcSet(STORAGE_URL, differentBucket, PATH);
      expect(srcSet).toContain(differentBucket);
    });
  });

  describe('getPlaceholderBlur', () => {
    it('should return a valid data URL', () => {
      const placeholder = getPlaceholderBlur();
      expect(placeholder).toMatch(/^data:image\/png;base64,/);
    });

    it('should return a base64 encoded string', () => {
      const placeholder = getPlaceholderBlur();
      const base64Part = placeholder.split(',')[1];
      expect(base64Part).toBeTruthy();
      expect(() => Buffer.from(base64Part, 'base64')).not.toThrow();
    });

    it('should always return the same placeholder', () => {
      const placeholder1 = getPlaceholderBlur();
      const placeholder2 = getPlaceholderBlur();
      expect(placeholder1).toBe(placeholder2);
    });

    it('should be a valid PNG data URL', () => {
      const placeholder = getPlaceholderBlur();
      expect(placeholder).toContain('data:image/png;base64,');
    });
  });

  describe('isSupabaseStorageUrl', () => {
    it('should return true for public object URLs', () => {
      const url = `${STORAGE_URL}/storage/v1/object/public/${BUCKET}/${PATH}`;
      expect(isSupabaseStorageUrl(url)).toBe(true);
    });

    it('should return true for render image URLs', () => {
      const url = `${STORAGE_URL}/storage/v1/render/image/public/${BUCKET}/${PATH}`;
      expect(isSupabaseStorageUrl(url)).toBe(true);
    });

    it('should return true for any URL containing storage/v1/', () => {
      expect(isSupabaseStorageUrl('https://example.com/storage/v1/test')).toBe(true);
    });

    it('should return false for non-Supabase URLs', () => {
      expect(isSupabaseStorageUrl('https://example.com/image.jpg')).toBe(false);
      expect(isSupabaseStorageUrl('https://cdn.example.com/assets/photo.png')).toBe(false);
    });

    it('should return false for empty strings', () => {
      expect(isSupabaseStorageUrl('')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isSupabaseStorageUrl('not-a-url')).toBe(false);
      expect(isSupabaseStorageUrl('/local/path/image.jpg')).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty bucket name', () => {
      const url = getTransformedImageUrl(STORAGE_URL, '', PATH, { width: 300 });
      expect(url).toContain('/storage/v1/render/image/public//');
    });

    it('should handle empty path', () => {
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, '', { width: 300 });
      expect(url).toBe(`${STORAGE_URL}/storage/v1/render/image/public/${BUCKET}/?width=300`);
    });

    it('should handle very large width values', () => {
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { width: 10000 });
      expect(url).toContain('width=10000');
    });

    it('should handle very high quality values', () => {
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { quality: 100 });
      expect(url).toContain('quality=100');
    });

    it('should handle zero quality values', () => {
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { quality: 0 });
      expect(url).toContain('quality=0');
    });

    it('should handle paths with query string characters', () => {
      const queryPath = 'path?with=query&params=test.jpg';
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, queryPath, { width: 300 });
      expect(url).toContain(queryPath);
    });

    it('should handle storage URL with trailing slash', () => {
      const urlWithSlash = 'https://test.supabase.co/';
      const url = getTransformedImageUrl(urlWithSlash, BUCKET, PATH, { width: 300 });
      expect(url).toContain('/storage/v1/render/image/public/');
    });
  });

  describe('WebP Format Output', () => {
    it('should support WebP format explicitly', () => {
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { format: 'webp' });
      expect(url).toContain('format=webp');
    });

    it('should generate WebP URLs for all predefined sizes when format is specified', () => {
      const options: ImageTransformOptions = { ...IMAGE_SIZES.thumbnail, format: 'webp' };
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, options);
      expect(url).toContain('format=webp');
    });

    it('should not include format parameter when not specified', () => {
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { width: 300 });
      expect(url).not.toContain('format=');
    });
  });

  describe('Quality Settings', () => {
    it('should use quality 80 for thumbnails', () => {
      const url = getImageUrl(STORAGE_URL, BUCKET, PATH, 'thumbnail');
      expect(url).toContain('quality=80');
    });

    it('should use quality 85 for gallery images', () => {
      const url = getImageUrl(STORAGE_URL, BUCKET, PATH, 'gallery');
      expect(url).toContain('quality=85');
    });

    it('should use quality 90 for full size images', () => {
      const url = getImageUrl(STORAGE_URL, BUCKET, PATH, 'full');
      expect(url).toContain('quality=90');
    });

    it('should use quality 85 for OG images', () => {
      const url = getImageUrl(STORAGE_URL, BUCKET, PATH, 'og');
      expect(url).toContain('quality=85');
    });

    it('should allow custom quality override', () => {
      const url = getTransformedImageUrl(STORAGE_URL, BUCKET, PATH, { quality: 75 });
      expect(url).toContain('quality=75');
    });
  });
});
