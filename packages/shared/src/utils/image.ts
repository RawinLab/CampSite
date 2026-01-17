/**
 * Supabase Storage Transform utilities
 * Based on Q3 decision: Use Supabase Storage Transform for image processing
 */

export type ImageSize = 'thumbnail' | 'gallery' | 'full' | 'og';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  resize?: 'cover' | 'contain' | 'fill';
  quality?: number;
  format?: 'webp' | 'png' | 'jpeg';
}

// Predefined image sizes based on requirements
export const IMAGE_SIZES: Record<ImageSize, ImageTransformOptions> = {
  thumbnail: { width: 300, height: 200, resize: 'cover', quality: 80 },
  gallery: { width: 800, height: 600, resize: 'cover', quality: 85 },
  full: { width: 1920, height: 1080, resize: 'contain', quality: 90 },
  og: { width: 1200, height: 630, resize: 'cover', quality: 85 },
};

/**
 * Build Supabase Storage transform URL
 * @param storageUrl - Base Supabase storage URL
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param options - Transform options
 * @returns Transformed image URL
 */
export function getTransformedImageUrl(
  storageUrl: string,
  bucket: string,
  path: string,
  options: ImageTransformOptions
): string {
  const params = new URLSearchParams();

  if (options.width) params.set('width', options.width.toString());
  if (options.height) params.set('height', options.height.toString());
  if (options.resize) params.set('resize', options.resize);
  if (options.quality) params.set('quality', options.quality.toString());
  if (options.format) params.set('format', options.format);

  const transformParams = params.toString();
  const baseUrl = `${storageUrl}/storage/v1/render/image/public/${bucket}/${path}`;

  return transformParams ? `${baseUrl}?${transformParams}` : baseUrl;
}

/**
 * Get image URL for a predefined size
 * @param storageUrl - Base Supabase storage URL
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param size - Predefined image size
 * @returns Transformed image URL
 */
export function getImageUrl(
  storageUrl: string,
  bucket: string,
  path: string,
  size: ImageSize = 'gallery'
): string {
  return getTransformedImageUrl(storageUrl, bucket, path, IMAGE_SIZES[size]);
}

/**
 * Extract path from full Supabase storage URL
 * @param fullUrl - Full Supabase storage URL
 * @returns Object containing bucket and path, or null if invalid
 */
export function parseStorageUrl(fullUrl: string): { bucket: string; path: string } | null {
  // Match pattern: .../storage/v1/object/public/{bucket}/{path}
  const publicMatch = fullUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (publicMatch) {
    return { bucket: publicMatch[1], path: publicMatch[2] };
  }

  // Match pattern: .../storage/v1/render/image/public/{bucket}/{path}
  const renderMatch = fullUrl.match(/\/storage\/v1\/render\/image\/public\/([^/]+)\/([^?]+)/);
  if (renderMatch) {
    return { bucket: renderMatch[1], path: renderMatch[2] };
  }

  return null;
}

/**
 * Transform an existing full URL to a different size
 * @param fullUrl - Full Supabase storage URL
 * @param storageUrl - Base Supabase storage URL (for building new URL)
 * @param size - Target image size
 * @returns Transformed URL or original if parsing fails
 */
export function transformImageUrl(
  fullUrl: string,
  storageUrl: string,
  size: ImageSize
): string {
  const parsed = parseStorageUrl(fullUrl);
  if (!parsed) return fullUrl;

  return getImageUrl(storageUrl, parsed.bucket, parsed.path, size);
}

/**
 * Generate srcSet for responsive images
 * @param storageUrl - Base Supabase storage URL
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @returns srcSet string for use in img tag
 */
export function generateSrcSet(
  storageUrl: string,
  bucket: string,
  path: string
): string {
  const sizes = [
    { width: 400, descriptor: '400w' },
    { width: 800, descriptor: '800w' },
    { width: 1200, descriptor: '1200w' },
    { width: 1920, descriptor: '1920w' },
  ];

  return sizes
    .map(({ width, descriptor }) => {
      const url = getTransformedImageUrl(storageUrl, bucket, path, {
        width,
        resize: 'cover',
        quality: 85,
      });
      return `${url} ${descriptor}`;
    })
    .join(', ');
}

/**
 * Get placeholder blur data URL (for Next.js blurDataURL)
 * Returns a tiny placeholder for loading states
 */
export function getPlaceholderBlur(): string {
  // Tiny 1x1 gray pixel as base64
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

/**
 * Check if URL is a Supabase storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('/storage/v1/');
}
