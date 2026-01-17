/**
 * Review JSON-LD Schema Component
 * Adds Review and AggregateRating structured data for review sections
 */

import { getCanonicalUrl } from '@/lib/seo/canonical';

interface Review {
  id: string;
  rating_overall: number;
  content?: string;
  reviewer_name: string;
  created_at: string;
  rating_cleanliness?: number;
  rating_facilities?: number;
  rating_location?: number;
  rating_value?: number;
}

interface ReviewSchemaProps {
  reviews: Review[];
  itemReviewed: {
    name: string;
    url: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export function ReviewSchema({
  reviews,
  itemReviewed,
  aggregateRating,
}: ReviewSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: itemReviewed.name,
    url: itemReviewed.url.startsWith('http')
      ? itemReviewed.url
      : getCanonicalUrl(itemReviewed.url),
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue.toFixed(1),
        reviewCount: aggregateRating.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    review: reviews.slice(0, 10).map((review) => ({
      '@type': 'Review',
      '@id': `${itemReviewed.url}#review-${review.id}`,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating_overall,
        bestRating: 5,
        worstRating: 1,
      },
      author: {
        '@type': 'Person',
        name: review.reviewer_name,
      },
      datePublished: review.created_at,
      ...(review.content && { reviewBody: review.content }),
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
 * Standalone Aggregate Rating Schema
 * For use when only showing aggregate rating without individual reviews
 */
interface AggregateRatingSchemaProps {
  itemReviewed: {
    '@type': string;
    name: string;
    url: string;
  };
  ratingValue: number;
  reviewCount: number;
}

export function AggregateRatingSchema({
  itemReviewed,
  ratingValue,
  reviewCount,
}: AggregateRatingSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': itemReviewed['@type'],
    name: itemReviewed.name,
    url: itemReviewed.url.startsWith('http')
      ? itemReviewed.url
      : getCanonicalUrl(itemReviewed.url),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: ratingValue.toFixed(1),
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default ReviewSchema;
