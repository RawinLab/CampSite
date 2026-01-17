'use client';

import type { MapCampsite } from '@campsite/shared';
import {
  MARKER_COLORS,
  TYPE_LABELS,
  formatPrice,
  formatRating,
} from '@/lib/constants/mapTheme';
import Link from 'next/link';

interface MapInfoWindowProps {
  campsite: MapCampsite;
}

/**
 * Info window popup content for map markers
 */
export function MapInfoWindow({ campsite }: MapInfoWindowProps) {
  const typeColor = MARKER_COLORS[campsite.campsite_type];
  const typeLabel = TYPE_LABELS[campsite.campsite_type];

  return (
    <div className="map-popup-card">
      {/* Image */}
      {campsite.primary_photo_url ? (
        <img
          src={campsite.primary_photo_url}
          alt={campsite.name}
          className="map-popup-card__image"
        />
      ) : (
        <div className="map-popup-card__image bg-gray-200 flex items-center justify-center">
          <span className="text-4xl">
            {campsite.campsite_type === 'camping' && '⛺'}
            {campsite.campsite_type === 'glamping' && '🏕️'}
            {campsite.campsite_type === 'tented-resort' && '🏖️'}
            {campsite.campsite_type === 'bungalow' && '🏠'}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="map-popup-card__content">
        {/* Type Badge */}
        <span
          className="map-popup-card__type"
          style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
        >
          {typeLabel}
        </span>

        {/* Name */}
        <h3 className="map-popup-card__name">{campsite.name}</h3>

        {/* Location */}
        <p className="map-popup-card__location">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {campsite.province_name_en}
        </p>

        {/* Rating */}
        {campsite.review_count > 0 && (
          <div className="map-popup-card__rating">
            <span className="map-popup-card__rating-star">★</span>
            <span className="map-popup-card__rating-value">
              {formatRating(campsite.average_rating)}
            </span>
            <span className="map-popup-card__rating-count">
              ({campsite.review_count} reviews)
            </span>
          </div>
        )}

        {/* Price */}
        <p className="map-popup-card__price">
          From{' '}
          <span className="map-popup-card__price-value">
            {formatPrice(campsite.min_price)}
          </span>
          /night
        </p>

        {/* View Details Button */}
        <Link
          href={`/campsites/${campsite.id}`}
          className="map-popup-card__button"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

/**
 * Generate HTML string for popup content (used with Leaflet)
 */
export function generatePopupHTML(campsite: MapCampsite): string {
  const typeColor = MARKER_COLORS[campsite.campsite_type];
  const typeLabel = TYPE_LABELS[campsite.campsite_type];

  const imageHtml = campsite.primary_photo_url
    ? `<img src="${campsite.primary_photo_url}" alt="${campsite.name}" class="map-popup-card__image" />`
    : `<div class="map-popup-card__image bg-gray-200" style="display:flex;align-items:center;justify-content:center;background:#e5e7eb;">
        <span style="font-size:32px;">
          ${campsite.campsite_type === 'camping' ? '⛺' : ''}
          ${campsite.campsite_type === 'glamping' ? '🏕️' : ''}
          ${campsite.campsite_type === 'tented-resort' ? '🏖️' : ''}
          ${campsite.campsite_type === 'bungalow' ? '🏠' : ''}
        </span>
      </div>`;

  const ratingHtml =
    campsite.review_count > 0
      ? `<div class="map-popup-card__rating">
          <span class="map-popup-card__rating-star">★</span>
          <span class="map-popup-card__rating-value">${formatRating(campsite.average_rating)}</span>
          <span class="map-popup-card__rating-count">(${campsite.review_count} reviews)</span>
        </div>`
      : '';

  return `
    <div class="map-popup-card">
      ${imageHtml}
      <div class="map-popup-card__content">
        <span class="map-popup-card__type" style="background-color:${typeColor}20;color:${typeColor};">
          ${typeLabel}
        </span>
        <h3 class="map-popup-card__name">${campsite.name}</h3>
        <p class="map-popup-card__location">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          ${campsite.province_name_en}
        </p>
        ${ratingHtml}
        <p class="map-popup-card__price">
          From <span class="map-popup-card__price-value">${formatPrice(campsite.min_price)}</span>/night
        </p>
        <a href="/campsites/${campsite.id}" class="map-popup-card__button">View Details</a>
      </div>
    </div>
  `;
}
