/**
 * Integration Test: Image Optimization Configuration
 * Tests Next.js image optimization setup and utility functions
 * Validates configuration, loader functions, and URL generation
 */

import {
  supabaseImageLoader,
  getOptimizedImageUrl,
  generateSrcSet,
  IMAGE_SIZES,
  isValidImageUrl,
  getFallbackImageUrl,
  getPlaceholderDataUrl,
} from '../../apps/campsite-frontend/src/lib/image-loader';

// Mock environment variables
const MOCK_SUPABASE_URL = 'https://test-project.supabase.co';
const MOCK_SUPABASE_STORAGE_URL = `${MOCK_SUPABASE_URL}/storage/v1`;

describe('Integration: Image Optimization Configuration', () => {
  beforeAll(() => {
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = MOCK_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_TRANSFORMS = 'false';
  });

  afterAll(() => {
    // Clean up environment variables
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_TRANSFORMS;
  });

  describe('Next.js Configuration Validation', () => {
    it('should have correct image formats configured', () => {
      // This is validated through next.config.js file structure
      // Expected: ['image/avif', 'image/webp']
      const nextConfig = require('../../apps/campsite-frontend/next.config.js');

      expect(nextConfig.images).toBeDefined();
      expect(nextConfig.images.formats).toBeDefined();
      expect(Array.isArray(nextConfig.images.formats)).toBe(true);
      expect(nextConfig.images.formats).toContain('image/avif');
      expect(nextConfig.images.formats).toContain('image/webp');
      expect(nextConfig.images.formats.length).toBe(2);
    });

    it('should have Supabase Storage in remotePatterns', () => {
      const nextConfig = require('../../apps/campsite-frontend/next.config.js');

      expect(nextConfig.images.remotePatterns).toBeDefined();
      expect(Array.isArray(nextConfig.images.remotePatterns)).toBe(true);

      const supabasePattern = nextConfig.images.remotePatterns.find(
        (pattern: any) => pattern.hostname === '**.supabase.co'
      );

      expect(supabasePattern).toBeDefined();
      expect(supabasePattern.protocol).toBe('https');
      expect(supabasePattern.pathname).toBe('/storage/v1/**');
    });

    it('should have correct deviceSizes configured', () => {
      const nextConfig = require('../../apps/campsite-frontend/next.config.js');

      expect(nextConfig.images.deviceSizes).toBeDefined();
      expect(Array.isArray(nextConfig.images.deviceSizes)).toBe(true);
      expect(nextConfig.images.deviceSizes).toEqual([640, 750, 828, 1080, 1200, 1920, 2048]);
    });

    it('should have correct imageSizes configured', () => {
      const nextConfig = require('../../apps/campsite-frontend/next.config.js');

      expect(nextConfig.images.imageSizes).toBeDefined();
      expect(Array.isArray(nextConfig.images.imageSizes)).toBe(true);
      expect(nextConfig.images.imageSizes).toEqual([16, 32, 48, 64, 96, 128, 256, 384]);
    });

    it('should have minimumCacheTTL configured', () => {
      const nextConfig = require('../../apps/campsite-frontend/next.config.js');

      expect(nextConfig.images.minimumCacheTTL).toBeDefined();
      expect(nextConfig.images.minimumCacheTTL).toBe(604800); // 7 days
    });

    it('should have Unsplash in remotePatterns for fallback images', () => {
      const nextConfig = require('../../apps/campsite-frontend/next.config.js');

      const unsplashPattern = nextConfig.images.remotePatterns.find(
        (pattern: any) => pattern.hostname === 'images.unsplash.com'
      );

      expect(unsplashPattern).toBeDefined();
      expect(unsplashPattern.protocol).toBe('https');
    });
  });

  describe('IMAGE_SIZES Constants', () => {
    it('should have all required image size presets', () => {
      expect(IMAGE_SIZES).toBeDefined();
      expect(IMAGE_SIZES.thumbnail).toEqual({ width: 300, height: 200 });
      expect(IMAGE_SIZES.card).toEqual({ width: 400, height: 300 });
      expect(IMAGE_SIZES.gallery).toEqual({ width: 800, height: 600 });
      expect(IMAGE_SIZES.hero).toEqual({ width: 1200, height: 630 });
      expect(IMAGE_SIZES.full).toEqual({ width: 1920, height: 1080 });
    });

    it('should have correct aspect ratios for card images', () => {
      const { width, height } = IMAGE_SIZES.card;
      const aspectRatio = width / height;
      expect(aspectRatio).toBeCloseTo(4 / 3, 2);
    });

    it('should have correct aspect ratios for hero images', () => {
      const { width, height } = IMAGE_SIZES.hero;
      const aspectRatio = width / height;
      expect(aspectRatio).toBeCloseTo(1.9, 1); // Close to 2:1
    });
  });

  describe('supabaseImageLoader Function', () => {
    it('should return non-Supabase external URLs as-is', () => {
      const externalUrl = 'https://example.com/image.jpg';
      const result = supabaseImageLoader({
        src: externalUrl,
        width: 800,
        quality: 75
      });

      expect(result).toBe(externalUrl);
    });

    it('should construct full Supabase URL from relative path', () => {
      const relativePath = 'campsites/campsite-123/photo1.jpg';
      const result = supabaseImageLoader({
        src: relativePath,
        width: 800,
        quality: 75
      });

      // When NEXT_PUBLIC_SUPABASE_URL is empty, it returns relative path
      expect(result).toContain('/object/public/');
      expect(result).toContain(relativePath);
    });

    it('should return original URL when transforms are disabled', () => {
      const supabaseUrl = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/photo.jpg`;
      const result = supabaseImageLoader({
        src: supabaseUrl,
        width: 800,
        quality: 75
      });

      expect(result).toBe(supabaseUrl);
    });

    it('should add transform parameters when transforms are enabled', () => {
      process.env.NEXT_PUBLIC_SUPABASE_TRANSFORMS = 'true';

      const supabaseUrl = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/photo.jpg`;
      const result = supabaseImageLoader({
        src: supabaseUrl,
        width: 800,
        quality: 85
      });

      expect(result).toContain('width=800');
      expect(result).toContain('quality=85');
      expect(result).toContain('resize=cover');
      expect(result).toContain('format=webp');

      process.env.NEXT_PUBLIC_SUPABASE_TRANSFORMS = 'false';
    });

    it('should use default quality of 75 when not specified', () => {
      process.env.NEXT_PUBLIC_SUPABASE_TRANSFORMS = 'true';

      const supabaseUrl = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/photo.jpg`;
      const result = supabaseImageLoader({
        src: supabaseUrl,
        width: 800
      });

      expect(result).toContain('quality=75');

      process.env.NEXT_PUBLIC_SUPABASE_TRANSFORMS = 'false';
    });

    it('should handle various width values correctly', () => {
      const widths = [320, 640, 1024, 1920];

      widths.forEach(width => {
        const result = supabaseImageLoader({
          src: 'campsites/photo.jpg',
          width,
          quality: 75
        });

        // Should construct a valid path with storage URL
        expect(result).toContain('/storage/v1/object/public/');
        expect(result).toContain('campsites/photo.jpg');
      });
    });
  });

  describe('getOptimizedImageUrl Function', () => {
    const supabaseImageUrl = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/photo.jpg`;

    it('should return non-Supabase URLs as-is', () => {
      const externalUrl = 'https://images.unsplash.com/photo-123';
      const result = getOptimizedImageUrl(externalUrl);

      expect(result).toBe(externalUrl);
    });

    it('should add render path for image transforms', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl);

      expect(result).toContain('/storage/v1/render/image/public/');
      expect(result).not.toContain('/storage/v1/object/public/');
    });

    it('should add default transformation parameters', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl);

      expect(result).toContain('width=800');
      expect(result).toContain('quality=75');
      expect(result).toContain('resize=cover');
      expect(result).toContain('format=webp');
    });

    it('should accept custom width parameter', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { width: 1200 });

      expect(result).toContain('width=1200');
    });

    it('should accept custom height parameter', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { width: 800, height: 600 });

      expect(result).toContain('width=800');
      expect(result).toContain('height=600');
    });

    it('should not add height parameter when not specified', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { width: 800 });

      expect(result).not.toContain('height=');
    });

    it('should accept custom quality parameter', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { quality: 90 });

      expect(result).toContain('quality=90');
    });

    it('should accept custom format parameter', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { format: 'avif' });

      expect(result).toContain('format=avif');
    });

    it('should not add format parameter when format is origin', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { format: 'origin' });

      expect(result).not.toContain('format=');
    });

    it('should accept custom resize parameter', () => {
      const result = getOptimizedImageUrl(supabaseImageUrl, { resize: 'contain' });

      expect(result).toContain('resize=contain');
    });

    it('should support all resize modes', () => {
      const resizeModes: Array<'cover' | 'contain' | 'fill'> = ['cover', 'contain', 'fill'];

      resizeModes.forEach(resize => {
        const result = getOptimizedImageUrl(supabaseImageUrl, { resize });
        expect(result).toContain(`resize=${resize}`);
      });
    });

    it('should handle malformed URLs gracefully', () => {
      const malformedUrl = 'not-a-valid-url';
      const result = getOptimizedImageUrl(malformedUrl);

      expect(result).toBe(malformedUrl);
    });

    it('should handle all IMAGE_SIZES presets correctly', () => {
      Object.entries(IMAGE_SIZES).forEach(([preset, { width, height }]) => {
        const result = getOptimizedImageUrl(supabaseImageUrl, { width, height });

        expect(result).toContain(`width=${width}`);
        expect(result).toContain(`height=${height}`);
      });
    });

    it('should not modify render path if already present', () => {
      const renderUrl = `${MOCK_SUPABASE_URL}/storage/v1/render/image/public/campsites/photo.jpg`;
      const result = getOptimizedImageUrl(renderUrl);

      // Should have only one occurrence of render path
      const matches = result.match(/\/render\/image\//g);
      expect(matches?.length).toBe(1);
    });
  });

  describe('generateSrcSet Function', () => {
    const supabaseImageUrl = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/photo.jpg`;

    it('should generate srcset with default widths', () => {
      const result = generateSrcSet(supabaseImageUrl);
      const defaultWidths = [320, 640, 768, 1024, 1280, 1920];

      defaultWidths.forEach(width => {
        expect(result).toContain(`${width}w`);
      });
    });

    it('should generate srcset with custom widths', () => {
      const customWidths = [400, 800, 1200];
      const result = generateSrcSet(supabaseImageUrl, customWidths);

      customWidths.forEach(width => {
        expect(result).toContain(`${width}w`);
      });
    });

    it('should generate comma-separated entries', () => {
      const customWidths = [400, 800, 1200];
      const result = generateSrcSet(supabaseImageUrl, customWidths);

      const entries = result.split(', ');
      expect(entries.length).toBe(customWidths.length);
    });

    it('should generate valid srcset format', () => {
      const customWidths = [400, 800];
      const result = generateSrcSet(supabaseImageUrl, customWidths);

      // Each entry should be in format: "url widthw"
      const entries = result.split(', ');
      entries.forEach((entry, index) => {
        expect(entry).toMatch(/.+ \d+w$/);
        expect(entry).toContain(`${customWidths[index]}w`);
      });
    });

    it('should include optimized URLs in srcset', () => {
      const result = generateSrcSet(supabaseImageUrl, [800]);

      expect(result).toContain('/storage/v1/render/image/public/');
      expect(result).toContain('width=800');
      expect(result).toContain('format=webp');
    });

    it('should handle single width', () => {
      const result = generateSrcSet(supabaseImageUrl, [1024]);

      expect(result).toContain('1024w');
      expect(result).not.toContain(',');
    });

    it('should handle many widths', () => {
      const manyWidths = [320, 480, 640, 800, 1024, 1280, 1600, 1920, 2560];
      const result = generateSrcSet(supabaseImageUrl, manyWidths);

      const entries = result.split(', ');
      expect(entries.length).toBe(manyWidths.length);
    });

    it('should maintain width order', () => {
      const widths = [320, 640, 1024, 1920];
      const result = generateSrcSet(supabaseImageUrl, widths);

      const entries = result.split(', ');
      entries.forEach((entry, index) => {
        expect(entry).toContain(`${widths[index]}w`);
      });
    });

    it('should work with deviceSizes from next.config', () => {
      const nextConfig = require('../../apps/campsite-frontend/next.config.js');
      const deviceSizes = nextConfig.images.deviceSizes;

      const result = generateSrcSet(supabaseImageUrl, deviceSizes);
      const entries = result.split(', ');

      expect(entries.length).toBe(deviceSizes.length);
    });

    it('should work with imageSizes from next.config', () => {
      const nextConfig = require('../../apps/campsite-frontend/next.config.js');
      const imageSizes = nextConfig.images.imageSizes;

      const result = generateSrcSet(supabaseImageUrl, imageSizes);
      const entries = result.split(', ');

      expect(entries.length).toBe(imageSizes.length);
    });
  });

  describe('Utility Functions', () => {
    describe('isValidImageUrl', () => {
      it('should return true for valid HTTP URLs', () => {
        expect(isValidImageUrl('http://example.com/image.jpg')).toBe(true);
      });

      it('should return true for valid HTTPS URLs', () => {
        expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true);
      });

      it('should return true for Supabase URLs', () => {
        const url = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/photo.jpg`;
        expect(isValidImageUrl(url)).toBe(true);
      });

      it('should return false for invalid URLs', () => {
        expect(isValidImageUrl('not-a-url')).toBe(false);
      });

      it('should return false for empty strings', () => {
        expect(isValidImageUrl('')).toBe(false);
      });

      it('should return false for relative paths', () => {
        expect(isValidImageUrl('/images/photo.jpg')).toBe(false);
      });

      it('should return true for data URLs', () => {
        expect(isValidImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
      });
    });

    describe('getFallbackImageUrl', () => {
      it('should return a fallback image path', () => {
        const fallback = getFallbackImageUrl();

        expect(fallback).toBeDefined();
        expect(typeof fallback).toBe('string');
        expect(fallback.length).toBeGreaterThan(0);
      });

      it('should return a path starting with /images/', () => {
        const fallback = getFallbackImageUrl();

        expect(fallback).toMatch(/^\/images\//);
      });

      it('should return a placeholder campsite image', () => {
        const fallback = getFallbackImageUrl();

        expect(fallback).toBe('/images/placeholder-campsite.jpg');
      });

      it('should always return the same fallback URL', () => {
        const fallback1 = getFallbackImageUrl();
        const fallback2 = getFallbackImageUrl();

        expect(fallback1).toBe(fallback2);
      });
    });

    describe('getPlaceholderDataUrl', () => {
      it('should return a data URL', () => {
        const placeholder = getPlaceholderDataUrl();

        expect(placeholder).toMatch(/^data:image\/jpeg;base64,/);
      });

      it('should return a valid base64 string', () => {
        const placeholder = getPlaceholderDataUrl();
        const base64Part = placeholder.split(',')[1];

        expect(base64Part).toBeDefined();
        expect(base64Part.length).toBeGreaterThan(0);
      });

      it('should return a consistent placeholder', () => {
        const placeholder1 = getPlaceholderDataUrl();
        const placeholder2 = getPlaceholderDataUrl();

        expect(placeholder1).toBe(placeholder2);
      });

      it('should be a small data URL for performance', () => {
        const placeholder = getPlaceholderDataUrl();

        // Should be less than 500 bytes for a tiny placeholder
        expect(placeholder.length).toBeLessThan(500);
      });

      it('should be usable as img src attribute', () => {
        const placeholder = getPlaceholderDataUrl();

        // Should be a valid data URL format
        expect(placeholder).toMatch(/^data:image\/[^;]+;base64,[A-Za-z0-9+/=]+$/);
      });
    });
  });

  describe('Integration: Real-World Scenarios', () => {
    it('should handle complete campsite image optimization flow', () => {
      const originalPath = 'campsites/campsite-123/hero.jpg';

      // Step 1: Load image with Next.js Image component
      const loaderUrl = supabaseImageLoader({
        src: originalPath,
        width: 1200,
        quality: 85
      });
      expect(loaderUrl).toContain('/storage/v1/object/public/');
      expect(loaderUrl).toContain(originalPath);

      // Step 2: Generate optimized URL for specific size
      const fullUrl = `${MOCK_SUPABASE_URL}/storage/v1/object/public/${originalPath}`;
      const optimizedUrl = getOptimizedImageUrl(fullUrl, {
        width: IMAGE_SIZES.hero.width,
        height: IMAGE_SIZES.hero.height,
        quality: 85,
        format: 'webp',
      });
      expect(optimizedUrl).toContain('width=1200');
      expect(optimizedUrl).toContain('height=630');

      // Step 3: Generate srcset for responsive images
      const srcset = generateSrcSet(fullUrl, [640, 1200, 1920]);
      expect(srcset.split(', ').length).toBe(3);
    });

    it('should handle image validation and fallback flow', () => {
      const validUrl = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/photo.jpg`;
      const invalidUrl = 'not-a-url';

      // Validate URLs
      expect(isValidImageUrl(validUrl)).toBe(true);
      expect(isValidImageUrl(invalidUrl)).toBe(false);

      // Get fallback for invalid URL
      const fallback = getFallbackImageUrl();
      expect(fallback).toBeTruthy();

      // Get placeholder for blur effect
      const placeholder = getPlaceholderDataUrl();
      expect(placeholder).toMatch(/^data:image/);
    });

    it('should support progressive image loading strategy', () => {
      const imagePath = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/gallery.jpg`;

      // Step 1: Show placeholder immediately
      const placeholder = getPlaceholderDataUrl();
      expect(placeholder.length).toBeLessThan(500);

      // Step 2: Load thumbnail size first
      const thumbnail = getOptimizedImageUrl(imagePath, {
        width: IMAGE_SIZES.thumbnail.width,
        quality: 60,
        format: 'webp',
      });
      expect(thumbnail).toContain('width=300');

      // Step 3: Load full size
      const full = getOptimizedImageUrl(imagePath, {
        width: IMAGE_SIZES.gallery.width,
        quality: 85,
        format: 'webp',
      });
      expect(full).toContain('width=800');
    });

    it('should handle different image formats based on browser support', () => {
      const imagePath = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/photo.jpg`;

      // Modern browsers: AVIF
      const avifUrl = getOptimizedImageUrl(imagePath, { format: 'avif' });
      expect(avifUrl).toContain('format=avif');

      // Fallback: WebP
      const webpUrl = getOptimizedImageUrl(imagePath, { format: 'webp' });
      expect(webpUrl).toContain('format=webp');

      // Original format
      const originalUrl = getOptimizedImageUrl(imagePath, { format: 'origin' });
      expect(originalUrl).not.toContain('format=');
    });

    it('should optimize images for different device types', () => {
      const nextConfig = require('../../apps/campsite-frontend/next.config.js');
      const imagePath = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/responsive.jpg`;

      // Mobile: smaller sizes
      const mobileSrcSet = generateSrcSet(imagePath, nextConfig.images.imageSizes.slice(0, 4));
      expect(mobileSrcSet).toContain('16w');
      expect(mobileSrcSet).toContain('32w');

      // Desktop: larger sizes
      const desktopSrcSet = generateSrcSet(imagePath, nextConfig.images.deviceSizes);
      expect(desktopSrcSet).toContain('1920w');
      expect(desktopSrcSet).toContain('2048w');
    });
  });

  describe('Performance Considerations', () => {
    it('should generate srcset efficiently for many widths', () => {
      const imagePath = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/photo.jpg`;
      const widths = Array.from({ length: 20 }, (_, i) => (i + 1) * 100);

      const startTime = Date.now();
      const result = generateSrcSet(imagePath, widths);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should be fast
      expect(result.split(', ').length).toBe(widths.length);
    });

    it('should handle URL construction efficiently', () => {
      const imagePath = `${MOCK_SUPABASE_URL}/storage/v1/object/public/campsites/photo.jpg`;
      const iterations = 1000;

      const startTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        getOptimizedImageUrl(imagePath, { width: 800, quality: 75 });
      }
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should handle 1000 URLs in < 1 second
    });
  });
});
