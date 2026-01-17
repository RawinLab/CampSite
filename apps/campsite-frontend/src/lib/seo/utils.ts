/**
 * SEO Utility Functions
 * Common utilities for generating SEO metadata across the application
 */

import type { Metadata } from 'next';

// Site configuration
export const SITE_CONFIG = {
  name: 'Camping Thailand',
  siteName: 'Camping Thailand',
  domain: process.env.NEXT_PUBLIC_SITE_URL || 'https://campingthailand.com',
  description: 'ค้นหาและจองแคมป์ไซต์ทั่วประเทศไทย - Camping Thailand เว็บไซต์รวมที่พักแคมป์ปิ้ง แกลมปิ้ง รีสอร์ทเต็นท์ บังกะโล และกระท่อมพักผ่อนทั่วประเทศไทย',
  keywords: [
    'camping thailand',
    'แคมป์ปิ้งไทย',
    'แคมป์ปิ้ง',
    'glamping',
    'แกลมปิ้ง',
    'ที่พักธรรมชาติ',
    'รีสอร์ทเต็นท์',
    'บังกะโล',
    'กระท่อม',
    'ท่องเที่ยวเชิงธรรมชาติ',
  ],
  locale: 'th_TH',
  language: 'th',
  twitterHandle: '@campingthailand',
};

/**
 * Generate base metadata for pages
 */
export function generateBaseMetadata(overrides?: Partial<Metadata>): Metadata {
  return {
    metadataBase: new URL(SITE_CONFIG.domain),
    title: {
      default: SITE_CONFIG.name,
      template: `%s | ${SITE_CONFIG.name}`,
    },
    description: SITE_CONFIG.description,
    keywords: SITE_CONFIG.keywords,
    authors: [{ name: SITE_CONFIG.name }],
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: SITE_CONFIG.locale,
      siteName: SITE_CONFIG.siteName,
      title: SITE_CONFIG.name,
      description: SITE_CONFIG.description,
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    ...overrides,
  };
}

/**
 * Truncate text to a maximum length while respecting word boundaries
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Generate SEO-friendly description from content
 */
export function generateDescription(content: string, maxLength: number = 160): string {
  // Remove HTML tags if present
  const cleanContent = content.replace(/<[^>]*>/g, '');
  // Remove multiple spaces and newlines
  const normalized = cleanContent.replace(/\s+/g, ' ').trim();
  return truncateText(normalized, maxLength);
}

/**
 * Generate SEO-friendly title
 */
export function generateTitle(
  title: string,
  suffix?: string,
  maxLength: number = 60
): string {
  const fullTitle = suffix ? `${title} | ${suffix}` : title;

  if (fullTitle.length <= maxLength) return fullTitle;

  // If with suffix is too long, truncate the title part
  if (suffix) {
    const maxTitleLength = maxLength - suffix.length - 4; // 4 for " | " and "..."
    return `${truncateText(title, maxTitleLength)} | ${suffix}`;
  }

  return truncateText(fullTitle, maxLength);
}

/**
 * Generate Open Graph image URL with text overlay
 * (placeholder for future implementation with image generation service)
 */
export function generateOGImageUrl(
  title: string,
  subtitle?: string,
  imageUrl?: string
): string {
  // If a specific image is provided, use it
  if (imageUrl) return imageUrl;

  // Default OG image
  return `${SITE_CONFIG.domain}/og-default.jpg`;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `฿${price.toLocaleString('th-TH')}`;
}

/**
 * Format price range for display
 */
export function formatPriceRange(minPrice: number, maxPrice: number): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice);
  }
  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
}

/**
 * Type name mapping (Thai)
 */
export const CAMPSITE_TYPE_NAMES: Record<string, string> = {
  camping: 'แคมป์ปิ้ง',
  glamping: 'แกลมปิ้ง',
  'tented-resort': 'รีสอร์ทเต็นท์',
  bungalow: 'บังกะโล',
  cabin: 'กระท่อม',
  'rv-caravan': 'RV/คาราวาน',
};

/**
 * Get Thai name for campsite type
 */
export function getCampsiteTypeName(type: string): string {
  return CAMPSITE_TYPE_NAMES[type] || type;
}

/**
 * Generate keywords from campsite data
 */
export function generateCampsiteKeywords(campsite: {
  name: string;
  campsite_type: string;
  province?: { name_en: string; name_th: string };
  amenities?: Array<{ name_th: string }>;
}): string[] {
  const keywords = [
    'camping',
    'thailand',
    campsite.name,
    campsite.campsite_type,
    getCampsiteTypeName(campsite.campsite_type),
  ];

  if (campsite.province) {
    keywords.push(campsite.province.name_en, campsite.province.name_th);
  }

  if (campsite.amenities) {
    keywords.push(...campsite.amenities.slice(0, 5).map((a) => a.name_th));
  }

  return keywords;
}
