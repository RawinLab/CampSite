/**
 * Canonical URL Generator
 * Generates canonical URLs for all pages to prevent duplicate content issues
 */

import { SITE_CONFIG } from './utils';

/**
 * Generate absolute canonical URL from a relative path
 */
export function getCanonicalUrl(path: string): string {
  // Remove leading slash if present for consistency
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Remove trailing slash except for root
  const normalizedPath = cleanPath === '/' ? '/' : cleanPath.replace(/\/$/, '');

  return `${SITE_CONFIG.domain}${normalizedPath}`;
}

/**
 * Generate canonical URL for campsite detail page
 */
export function getCampsiteCanonicalUrl(idOrSlug: string): string {
  return getCanonicalUrl(`/campsites/${idOrSlug}`);
}

/**
 * Generate canonical URL for search page with filters
 */
export function getSearchCanonicalUrl(params?: {
  q?: string;
  province?: string;
  type?: string;
  page?: number;
}): string {
  const baseUrl = '/search';

  if (!params || Object.keys(params).length === 0) {
    return getCanonicalUrl(baseUrl);
  }

  const searchParams = new URLSearchParams();

  // Only include significant parameters in canonical URL
  if (params.q) searchParams.set('q', params.q);
  if (params.province) searchParams.set('province', params.province);
  if (params.type) searchParams.set('type', params.type);
  if (params.page && params.page > 1) searchParams.set('page', params.page.toString());

  const queryString = searchParams.toString();
  return getCanonicalUrl(queryString ? `${baseUrl}?${queryString}` : baseUrl);
}

/**
 * Generate canonical URL for province page
 */
export function getProvinceCanonicalUrl(slug: string): string {
  return getCanonicalUrl(`/provinces/${slug}`);
}

/**
 * Generate canonical URL for campsite type page
 */
export function getCampsiteTypeCanonicalUrl(type: string): string {
  return getCanonicalUrl(`/types/${type}`);
}

/**
 * Generate alternate language URLs (for future i18n support)
 */
export function getAlternateUrls(path: string): Record<string, string> {
  const canonicalUrl = getCanonicalUrl(path);

  return {
    'x-default': canonicalUrl,
    th: canonicalUrl,
    // Future: Add English version when i18n is implemented
    // en: `${SITE_CONFIG.domain}/en${path}`,
  };
}

/**
 * Generate pagination URLs for search results
 */
export function getPaginationUrls(
  basePath: string,
  currentPage: number,
  totalPages: number
): {
  prev?: string;
  next?: string;
  first: string;
  last: string;
} {
  const result: {
    prev?: string;
    next?: string;
    first: string;
    last: string;
  } = {
    first: getCanonicalUrl(basePath),
    last: getCanonicalUrl(totalPages > 1 ? `${basePath}?page=${totalPages}` : basePath),
  };

  if (currentPage > 1) {
    result.prev = getCanonicalUrl(
      currentPage === 2 ? basePath : `${basePath}?page=${currentPage - 1}`
    );
  }

  if (currentPage < totalPages) {
    result.next = getCanonicalUrl(`${basePath}?page=${currentPage + 1}`);
  }

  return result;
}
