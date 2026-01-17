import type { CampsiteType } from './campsite';
import type { NearbyAttraction } from './campsite-detail';

/**
 * Lightweight campsite data for map markers
 */
export interface MapCampsite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  campsite_type: CampsiteType;
  average_rating: number;
  review_count: number;
  min_price: number;
  max_price: number;
  province_name_en: string;
  primary_photo_url: string | null;
}

/**
 * Map bounds for filtering
 */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Map filter parameters
 */
export interface MapFilters {
  bounds?: MapBounds;
  campsite_types?: CampsiteType[];
  province_id?: number;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  amenity_ids?: number[];
}

/**
 * Map campsites API response
 */
export interface MapCampsitesResponse {
  campsites: MapCampsite[];
  total: number;
}

/**
 * Attractions list response
 */
export interface AttractionsResponse {
  attractions: NearbyAttraction[];
  total: number;
}

/**
 * Map marker theme colors by campsite type
 */
export const CAMPSITE_TYPE_COLORS: Record<CampsiteType, string> = {
  camping: '#22c55e',
  glamping: '#8b5cf6',
  'tented-resort': '#f97316',
  bungalow: '#3b82f6',
  cabin: '#854d0e',
  'rv-caravan': '#0891b2',
};

/**
 * Map marker theme labels by campsite type
 */
export const CAMPSITE_TYPE_LABELS: Record<CampsiteType, string> = {
  camping: 'Camping',
  glamping: 'Glamping',
  'tented-resort': 'Tented Resort',
  bungalow: 'Bungalow',
  cabin: 'Cabin',
  'rv-caravan': 'RV/Caravan',
};

/**
 * Thailand map center coordinates
 */
export const THAILAND_CENTER = {
  lat: 13.7563,
  lng: 100.5018,
};

/**
 * Default map zoom levels
 */
export const MAP_ZOOM = {
  DEFAULT: 6,
  PROVINCE: 9,
  CAMPSITE: 14,
  MIN: 5,
  MAX: 18,
};

/**
 * Generate Google Maps directions URL
 */
export function getGoogleMapsDirectionsUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): string {
  return `https://www.google.com/maps/dir/${originLat},${originLng}/${destLat},${destLng}`;
}

/**
 * Generate Google Maps place URL from coordinates
 */
export function getGoogleMapsPlaceUrl(lat: number, lng: number, placeName?: string): string {
  const query = placeName ? encodeURIComponent(placeName) : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
