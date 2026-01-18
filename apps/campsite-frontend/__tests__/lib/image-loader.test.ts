/**
 * Unit Tests: Image Loader
 * Tests all image optimization and transformation utilities
 */

const MOCK_SUPABASE_URL = 'https://test.supabase.co';

// Mock environment variables before importing module
process.env.NEXT_PUBLIC_SUPABASE_URL = MOCK_SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_TRANSFORMS = 'false';

import {
  IMAGE_SIZES,
  supabaseImageLoader,
  getOptimizedImageUrl,
  generateSrcSet,
  getPlaceholderDataUrl,
  isValidImageUrl,
  getFallbackImageUrl,
} from '@/lib/image-loader';
import type { ImageLoaderProps } from 'next/image';

describe('Image Loader', () => {
  describe('IMAGE_SIZES', () => {
    it('should have correct thumbnail preset dimensions', () => {
      expect(IMAGE_SIZES.thumbnail).toEqual({ width: 300, height: 200 });
    });

    it('should have correct card preset dimensions', () => {
      expect(IMAGE_SIZES.card).toEqual({ width: 400, height: 300 });
    });

    it('should have correct gallery preset dimensions', () => {
      expect(IMAGE_SIZES.gallery).toEqual({ width: 800, height: 600 });
    });

    it('should have correct hero preset dimensions', () => {
      expect(IMAGE_SIZES.hero).toEqual({ width: 1200, height: 630 });
    });

    it('should have correct full preset dimensions', () => {
      expect(IMAGE_SIZES.full).toEqual({ width: 1920, height: 1080 });
    });

    it('should have all 5 preset sizes', () => {
      const keys = Object.keys(IMAGE_SIZES);
      expect(keys).toHaveLength(5);
      expect(keys).toEqual(['thumbnail', 'card', 'gallery', 'hero', 'full']);
    });
  });

  describe('supabaseImageLoader', () => {
    describe('non-Supabase URLs', () => {
      it('should return original URL for external HTTP URLs', () => {
        const props: ImageLoaderProps = {
          src: 'https://example.com/image.jpg',
          width: 800,
          quality: 75,
        };

        const result = supabaseImageLoader(props);
        expect(result).toBe('https://example.com/image.jpg');
      });

      it('should return original URL for external HTTPS URLs', () => {
        const props: ImageLoaderProps = {
          src: 'http://example.com/image.png',
          width: 640,
          quality: 80,
        };

        const result = supabaseImageLoader(props);
        expect(result).toBe('http://example.com/image.png');
      });
    });

    describe('relative paths', () => {
      it('should construct correct Supabase URL for relative paths', () => {
        const props: ImageLoaderProps = {
          src: 'campsites/image123.jpg',
          width: 800,
          quality: 75,
        };

        const result = supabaseImageLoader(props);
        // When SUPABASE_URL is empty, it still constructs the path
        expect(result).toContain('/storage/v1/object/public/campsites/image123.jpg');
      });

      it('should handle relative paths with leading slash', () => {
        const props: ImageLoaderProps = {
          src: '/campsites/folder/image.webp',
          width: 1024,
          quality: 90,
        };

        const result = supabaseImageLoader(props);
        expect(result).toContain('/storage/v1/object/public//campsites/folder/image.webp');
      });

      it('should handle nested folder paths', () => {
        const props: ImageLoaderProps = {
          src: 'bucket/subfolder/nested/photo.jpg',
          width: 500,
          quality: 70,
        };

        const result = supabaseImageLoader(props);
        expect(result).toContain('/storage/v1/object/public/bucket/subfolder/nested/photo.jpg');
      });
    });

    describe('Supabase URLs without transforms', () => {
      it('should return URL without params when transforms disabled', () => {
        const props: ImageLoaderProps = {
          src: 'campsites/image.jpg',
          width: 800,
          quality: 75,
        };

        const result = supabaseImageLoader(props);
        expect(result).not.toContain('width=');
        expect(result).not.toContain('quality=');
        expect(result).toContain('/storage/v1/object/public/campsites/image.jpg');
      });

      it('should return absolute Supabase URL as-is when transforms disabled', () => {
        const supabaseUrl = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/test.jpg`;
        const props: ImageLoaderProps = {
          src: supabaseUrl,
          width: 640,
          quality: 85,
        };

        const result = supabaseImageLoader(props);
        expect(result).toBe(supabaseUrl);
      });
    });

    describe('error handling', () => {
      it('should return original URL if URL construction fails', () => {
        const props: ImageLoaderProps = {
          src: 'campsites/image.jpg',
          width: 800,
          quality: 75,
        };

        // Mock URL constructor to throw
        const originalURL = global.URL;
        global.URL = jest.fn(() => {
          throw new Error('Invalid URL');
        }) as any;

        const result = supabaseImageLoader(props);
        expect(result).toContain('campsites/image.jpg');

        global.URL = originalURL;
      });
    });
  });

  describe('getOptimizedImageUrl', () => {
    const supabaseImageUrl = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/test.jpg`;

    it('should return non-Supabase URLs unchanged', () => {
      const externalUrl = 'https://example.com/image.jpg';
      const result = getOptimizedImageUrl(externalUrl);
      expect(result).toBe(externalUrl);
    });

    it('should add width parameter with default value', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl);
      expect(result).toContain('width=800');
    });

    it('should add custom width parameter', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { width: 1024 });
      expect(result).toContain('width=1024');
    });

    it('should add height parameter when provided', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, {
        width: 800,
        height: 600,
      });
      expect(result).toContain('height=600');
    });

    it('should not add height parameter when omitted', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { width: 800 });
      expect(result).not.toContain('height=');
    });

    it('should add quality parameter with default value', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl);
      expect(result).toContain('quality=75');
    });

    it('should add custom quality parameter', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { quality: 90 });
      expect(result).toContain('quality=90');
    });

    it('should add format parameter when not origin', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { format: 'webp' });
      expect(result).toContain('format=webp');
    });

    it('should add avif format parameter', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { format: 'avif' });
      expect(result).toContain('format=avif');
    });

    it('should not add format parameter when origin', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { format: 'origin' });
      expect(result).not.toContain('format=');
    });

    it('should add resize parameter with default cover', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl);
      expect(result).toContain('resize=cover');
    });

    it('should add custom resize parameter contain', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { resize: 'contain' });
      expect(result).toContain('resize=contain');
    });

    it('should add custom resize parameter fill', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { resize: 'fill' });
      expect(result).toContain('resize=fill');
    });

    it('should change pathname from object to render path', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl);
      expect(result).toContain('/storage/v1/render/image/public/');
      expect(result).not.toContain('/storage/v1/object/public/');
    });

    it('should not duplicate render path if already present', () => {
      const renderUrl = `${MOCK_SUPABASE_URL}/storage/v1/render/image/public/campsites/test.jpg`;
      const result = getOptimizedImageUrl(renderUrl);

      const renderPathCount = (result.match(/\/render\/image\//g) || []).length;
      expect(renderPathCount).toBe(1);
    });

    it('should add all parameters together', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, {
        width: 1200,
        height: 800,
        quality: 85,
        format: 'webp',
        resize: 'contain',
      });

      expect(result).toContain('width=1200');
      expect(result).toContain('height=800');
      expect(result).toContain('quality=85');
      expect(result).toContain('format=webp');
      expect(result).toContain('resize=contain');
    });

    it('should handle URL construction errors gracefully', () => {
      const originalURL = global.URL;
      global.URL = jest.fn(() => {
        throw new Error('Invalid URL');
      }) as any;

      const result = getOptimizedImageUrl(supabaseImageUrl);
      expect(result).toBe(supabaseImageUrl);

      global.URL = originalURL;
    });
  });

  describe('generateSrcSet', () => {
    const supabaseImageUrl = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/test.jpg`;

    it('should create srcset string with default widths', () => {
      const result = generateSrcSet(supabaseImageUrl);

      expect(result).toContain('320w');
      expect(result).toContain('640w');
      expect(result).toContain('768w');
      expect(result).toContain('1024w');
      expect(result).toContain('1280w');
      expect(result).toContain('1920w');
    });

    it('should separate srcset entries with comma and space', () => {
      const result = generateSrcSet(supabaseImageUrl);
      expect(result).toContain(', ');
    });

    it('should create srcset with custom widths', () => {
      const customWidths = [400, 800, 1200];
      const result = generateSrcSet(supabaseImageUrl, customWidths);

      expect(result).toContain('400w');
      expect(result).toContain('800w');
      expect(result).toContain('1200w');
      expect(result).not.toContain('320w');
      expect(result).not.toContain('1920w');
    });

    it('should include optimized URLs with width parameter', () => {
      const result = generateSrcSet(supabaseImageUrl, [800]);
      expect(result).toContain('width=800');
    });

    it('should generate valid srcset format', () => {
      const result = generateSrcSet(supabaseImageUrl, [640, 1280]);

      // Check format: URL 640w, URL 1280w
      const parts = result.split(', ');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatch(/^https:\/\/.+ 640w$/);
      expect(parts[1]).toMatch(/^https:\/\/.+ 1280w$/);
    });

    it('should handle single width', () => {
      const result = generateSrcSet(supabaseImageUrl, [1024]);
      expect(result).toContain('1024w');
      expect(result).not.toContain(', ');
    });

    it('should handle empty widths array', () => {
      const result = generateSrcSet(supabaseImageUrl, []);
      expect(result).toBe('');
    });

    it('should maintain URL integrity in srcset', () => {
      const result = generateSrcSet(supabaseImageUrl, [800]);
      expect(result).toContain(MOCK_SUPABASE_URL);
      expect(result).toContain('campsites/test.jpg');
    });
  });

  describe('getPlaceholderDataUrl', () => {
    it('should return valid base64 data URL', () => {
      const result = getPlaceholderDataUrl();
      expect(result).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should return consistent placeholder', () => {
      const result1 = getPlaceholderDataUrl();
      const result2 = getPlaceholderDataUrl();
      expect(result1).toBe(result2);
    });

    it('should return JPEG format data URL', () => {
      const result = getPlaceholderDataUrl();
      expect(result).toContain('data:image/jpeg;base64,');
    });

    it('should contain base64 encoded data', () => {
      const result = getPlaceholderDataUrl();
      const base64Part = result.split(',')[1];
      expect(base64Part).toBeTruthy();
      expect(base64Part.length).toBeGreaterThan(0);
    });

    it('should be a valid data URL format', () => {
      const result = getPlaceholderDataUrl();
      expect(result.split(',')).toHaveLength(2);
      expect(result.split(',')[0]).toBe('data:image/jpeg;base64');
    });
  });

  describe('isValidImageUrl', () => {
    it('should return true for valid HTTPS URLs', () => {
      expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true);
    });

    it('should return true for valid HTTP URLs', () => {
      expect(isValidImageUrl('http://example.com/photo.png')).toBe(true);
    });

    it('should return true for Supabase URLs', () => {
      const url = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/test.jpg`;
      expect(isValidImageUrl(url)).toBe(true);
    });

    it('should return true for URLs with query parameters', () => {
      expect(isValidImageUrl('https://example.com/image.jpg?width=800&quality=75')).toBe(true);
    });

    it('should return true for URLs with hash fragments', () => {
      expect(isValidImageUrl('https://example.com/image.jpg#section')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidImageUrl('not-a-url')).toBe(false);
    });

    it('should return false for relative paths', () => {
      expect(isValidImageUrl('/images/photo.jpg')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidImageUrl('')).toBe(false);
    });

    it('should return false for malformed URLs', () => {
      expect(isValidImageUrl('https://')).toBe(false);
    });

    it('should return false for null-like strings', () => {
      expect(isValidImageUrl('undefined')).toBe(false);
      expect(isValidImageUrl('null')).toBe(false);
    });

    it('should return true for data URLs', () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      expect(isValidImageUrl(dataUrl)).toBe(true);
    });
  });

  describe('getFallbackImageUrl', () => {
    it('should return placeholder path', () => {
      const result = getFallbackImageUrl();
      expect(result).toBe('/images/placeholder-campsite.jpg');
    });

    it('should return consistent fallback URL', () => {
      const result1 = getFallbackImageUrl();
      const result2 = getFallbackImageUrl();
      expect(result1).toBe(result2);
    });

    it('should return path starting with slash', () => {
      const result = getFallbackImageUrl();
      expect(result.startsWith('/')).toBe(true);
    });

    it('should return JPG image path', () => {
      const result = getFallbackImageUrl();
      expect(result.endsWith('.jpg')).toBe(true);
    });

    it('should contain "placeholder" in path', () => {
      const result = getFallbackImageUrl();
      expect(result).toContain('placeholder');
    });

    it('should contain "campsite" in path', () => {
      const result = getFallbackImageUrl();
      expect(result).toContain('campsite');
    });
  });
});
