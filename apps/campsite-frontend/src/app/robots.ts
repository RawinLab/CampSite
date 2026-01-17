/**
 * Robots.txt Configuration
 * Controls how search engine crawlers interact with the site
 */

import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo/utils';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_CONFIG.domain;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/auth/callback',
          '/auth/reset-password',
          '/_next/',
          '/private/',
        ],
      },
      // Specific rules for Googlebot
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/auth/callback',
          '/auth/reset-password',
        ],
      },
      // Block bad bots
      {
        userAgent: 'AhrefsBot',
        disallow: '/',
      },
      {
        userAgent: 'MJ12bot',
        disallow: '/',
      },
      {
        userAgent: 'SemrushBot',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
