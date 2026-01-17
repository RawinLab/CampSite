/**
 * Organization JSON-LD Schema Component
 * Adds structured data for the organization to help search engines understand the business
 */

import { SITE_CONFIG } from '@/lib/seo/utils';

interface OrganizationSchemaProps {
  // Optional overrides for customization
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
}

export function OrganizationSchema({
  name = SITE_CONFIG.name,
  description = SITE_CONFIG.description,
  url = SITE_CONFIG.domain,
  logo = `${SITE_CONFIG.domain}/logo.png`,
  sameAs = [],
}: OrganizationSchemaProps = {}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    description,
    url,
    logo: {
      '@type': 'ImageObject',
      url: logo,
      width: 512,
      height: 512,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Thai', 'English'],
    },
    sameAs: [
      'https://www.facebook.com/campingthailand',
      'https://www.instagram.com/campingthailand',
      'https://twitter.com/campingthailand',
      ...sameAs,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default OrganizationSchema;
