/**
 * Dynamic Sitemap Generation
 * Generates sitemap.xml for all public pages to improve SEO
 */

import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo/utils';

import { API_BASE_URL } from '@/lib/api/config';

// Types for API responses
interface CampsiteSitemapItem {
  id: string;
  slug?: string;
  updated_at: string;
}

interface ProvinceSitemapItem {
  id: string;
  slug: string;
  updated_at?: string;
}

/**
 * Fetch all approved campsites for sitemap
 */
async function getCampsites(): Promise<CampsiteSitemapItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/campsites/sitemap`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching campsites for sitemap:', error);
    return [];
  }
}

/**
 * Fetch all provinces for sitemap
 */
async function getProvinces(): Promise<ProvinceSitemapItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/provinces`, {
      next: { revalidate: 86400 }, // Revalidate daily
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching provinces for sitemap:', error);
    return [];
  }
}

/**
 * Campsite types for sitemap
 */
const CAMPSITE_TYPES = [
  'camping',
  'glamping',
  'tented-resort',
  'bungalow',
  'cabin',
  'rv-caravan',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.domain;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Campsite type pages
  const typePages: MetadataRoute.Sitemap = CAMPSITE_TYPES.map((type) => ({
    url: `${baseUrl}/types/${type}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dynamic campsite pages
  const campsites = await getCampsites();
  const campsitePages: MetadataRoute.Sitemap = campsites.map((campsite) => ({
    url: `${baseUrl}/campsites/${campsite.slug || campsite.id}`,
    lastModified: new Date(campsite.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Province pages
  const provinces = await getProvinces();
  const provincePages: MetadataRoute.Sitemap = provinces.map((province) => ({
    url: `${baseUrl}/provinces/${province.slug}`,
    lastModified: province.updated_at ? new Date(province.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...typePages,
    ...campsitePages,
    ...provincePages,
  ];
}
