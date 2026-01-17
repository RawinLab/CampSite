/**
 * Breadcrumb JSON-LD Schema Component
 * Adds BreadcrumbList structured data for navigation paths
 */

import { SITE_CONFIG } from '@/lib/seo/utils';
import { getCanonicalUrl } from '@/lib/seo/canonical';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  // Always start with home
  const breadcrumbItems = [
    { name: 'หน้าหลัก', url: '/' },
    ...items,
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : getCanonicalUrl(item.url),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Generate breadcrumb items for campsite detail page
 */
export function generateCampsiteBreadcrumbs(campsite: {
  name: string;
  id: string;
  slug?: string;
  province: {
    name_th: string;
    slug: string;
  };
}): BreadcrumbItem[] {
  return [
    { name: 'ค้นหา', url: '/search' },
    { name: campsite.province.name_th, url: `/provinces/${campsite.province.slug}` },
    { name: campsite.name, url: `/campsites/${campsite.slug || campsite.id}` },
  ];
}

/**
 * Generate breadcrumb items for province page
 */
export function generateProvinceBreadcrumbs(province: {
  name_th: string;
  slug: string;
}): BreadcrumbItem[] {
  return [
    { name: 'จังหวัด', url: '/provinces' },
    { name: province.name_th, url: `/provinces/${province.slug}` },
  ];
}

/**
 * Generate breadcrumb items for search page
 */
export function generateSearchBreadcrumbs(query?: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ name: 'ค้นหา', url: '/search' }];

  if (query) {
    items.push({ name: `"${query}"`, url: `/search?q=${encodeURIComponent(query)}` });
  }

  return items;
}

/**
 * Generate breadcrumb items for campsite type page
 */
export function generateTypeBreadcrumbs(type: {
  name_th: string;
  slug: string;
}): BreadcrumbItem[] {
  return [
    { name: 'ประเภทที่พัก', url: '/types' },
    { name: type.name_th, url: `/types/${type.slug}` },
  ];
}

export default BreadcrumbSchema;
