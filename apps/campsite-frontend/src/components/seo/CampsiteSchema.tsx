/**
 * Campsite JSON-LD Schema Component
 * Adds LocalBusiness/LodgingBusiness structured data for campsite pages
 */

import { SITE_CONFIG, formatPriceRange } from '@/lib/seo/utils';
import { getCampsiteCanonicalUrl } from '@/lib/seo/canonical';

interface CampsiteSchemaProps {
  campsite: {
    id: string;
    slug?: string | null;
    name: string;
    description?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    min_price: number;
    max_price: number;
    check_in_time?: string | null;
    check_out_time?: string | null;
    average_rating?: number | null;
    review_count?: number | null;
    campsite_type: string;
    province: {
      name_en: string;
      name_th: string;
    };
    photos?: Array<{
      url: string;
      alt_text?: string | null;
      is_primary?: boolean;
    }>;
    amenities?: Array<{
      name_en: string;
      name_th: string;
    }>;
    recent_reviews?: Array<{
      rating_overall: number;
      content?: string | null;
      reviewer_name?: string;
      created_at: string;
    }>;
  };
}

export function CampsiteSchema({ campsite }: CampsiteSchemaProps) {
  const primaryPhoto =
    campsite.photos?.find((p) => p.is_primary) || campsite.photos?.[0];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': getCampsiteCanonicalUrl(campsite.slug || campsite.id),
    name: campsite.name,
    description: campsite.description,
    url: getCampsiteCanonicalUrl(campsite.slug || campsite.id),
    image: primaryPhoto?.url,
    telephone: campsite.phone,
    email: campsite.email,
    priceRange: formatPriceRange(campsite.min_price, campsite.max_price),
    checkinTime: campsite.check_in_time,
    checkoutTime: campsite.check_out_time,
    address: {
      '@type': 'PostalAddress',
      streetAddress: campsite.address,
      addressRegion: campsite.province.name_en,
      addressCountry: 'TH',
    },
    ...(campsite.latitude &&
      campsite.longitude && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: campsite.latitude,
          longitude: campsite.longitude,
        },
      }),
    ...(campsite.website && { sameAs: campsite.website }),
    ...(campsite.average_rating &&
      campsite.review_count &&
      campsite.review_count > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: campsite.average_rating.toFixed(1),
          reviewCount: campsite.review_count,
          bestRating: 5,
          worstRating: 1,
        },
      }),
    ...(campsite.amenities &&
      campsite.amenities.length > 0 && {
        amenityFeature: campsite.amenities.map((amenity) => ({
          '@type': 'LocationFeatureSpecification',
          name: amenity.name_en,
          value: true,
        })),
      }),
    ...(campsite.photos &&
      campsite.photos.length > 0 && {
        photo: campsite.photos.slice(0, 5).map((photo) => ({
          '@type': 'ImageObject',
          url: photo.url,
          description: photo.alt_text || campsite.name,
        })),
      }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default CampsiteSchema;
