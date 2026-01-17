/**
 * Supabase Storage Image Loader
 * Custom image loader for Next.js Image component with Supabase Storage
 */

import type { ImageLoaderProps } from 'next/image';

// Supabase project URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_STORAGE_URL = `${SUPABASE_URL}/storage/v1`;

/**
 * Image size presets for responsive images
 */
export const IMAGE_SIZES = {
  thumbnail: { width: 300, height: 200 },
  card: { width: 400, height: 300 },
  gallery: { width: 800, height: 600 },
  hero: { width: 1200, height: 630 },
  full: { width: 1920, height: 1080 },
} as const;

/**
 * Supabase Storage image loader for Next.js Image component
 * Generates optimized image URLs using Supabase Storage transforms
 */
export function supabaseImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // If the URL is already a full URL and not from Supabase, return as-is
  if (!src.includes('supabase.co') && src.startsWith('http')) {
    return src;
  }

  // If it's a relative path, construct the full Supabase URL
  const isRelativePath = !src.startsWith('http');
  const imageUrl = isRelativePath ? `${SUPABASE_STORAGE_URL}/object/public/${src}` : src;

  // Check if Supabase supports image transforms (Pro tier)
  // For basic tier, return the original URL
  const transformsEnabled = process.env.NEXT_PUBLIC_SUPABASE_TRANSFORMS === 'true';

  if (!transformsEnabled) {
    return imageUrl;
  }

  // Parse the URL to add transform parameters
  try {
    const url = new URL(imageUrl);

    // Add transformation query parameters
    url.searchParams.set('width', width.toString());
    url.searchParams.set('quality', (quality || 75).toString());
    url.searchParams.set('resize', 'cover');
    url.searchParams.set('format', 'webp');

    return url.toString();
  } catch {
    return imageUrl;
  }
}

/**
 * Get optimized image URL with Supabase transforms
 */
export function getOptimizedImageUrl(
  src: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'origin';
    resize?: 'cover' | 'contain' | 'fill';
  }
): string {
  const {
    width = 800,
    height,
    quality = 75,
    format = 'webp',
    resize = 'cover',
  } = options || {};

  // If not a Supabase URL, return as-is
  if (!src.includes('supabase.co')) {
    return src;
  }

  try {
    const url = new URL(src);

    // Add render path for image transforms
    if (!url.pathname.includes('/render/image')) {
      const renderPath = url.pathname.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/'
      );
      url.pathname = renderPath;
    }

    // Add transform parameters
    url.searchParams.set('width', width.toString());
    if (height) {
      url.searchParams.set('height', height.toString());
    }
    url.searchParams.set('quality', quality.toString());
    url.searchParams.set('resize', resize);
    if (format !== 'origin') {
      url.searchParams.set('format', format);
    }

    return url.toString();
  } catch {
    return src;
  }
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(
  src: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1920]
): string {
  return widths
    .map((width) => {
      const url = getOptimizedImageUrl(src, { width });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Get placeholder blur data URL for images
 * Uses a tiny base64 encoded placeholder
 */
export function getPlaceholderDataUrl(): string {
  // Tiny 10x10 grey gradient placeholder
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAAoACgMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABv/EAB4QAAICAgIDAAAAAAAAAAAAAAECAAMEBREhMUFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAwT/xAAZEQEAAwEBAAAAAAAAAAAAAAABAAIDESH/2gAMAwEAAhEDEQA/AKuJhVnGquZqLLqxYykgggHr5iPWMptoX//Z';
}

/**
 * Check if image URL is valid
 */
export function isValidImageUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get fallback image URL
 */
export function getFallbackImageUrl(): string {
  return '/images/placeholder-campsite.jpg';
}

export default supabaseImageLoader;
