import type { CampsiteType } from '@campsite/shared';

/**
 * Map marker colors by campsite type
 */
export const MARKER_COLORS: Record<CampsiteType, string> = {
  camping: '#22c55e', // Green
  glamping: '#8b5cf6', // Purple
  'tented-resort': '#f97316', // Orange
  bungalow: '#3b82f6', // Blue
  cabin: '#854d0e', // Brown
  'rv-caravan': '#0891b2', // Cyan
};

/**
 * Map marker CSS classes by campsite type
 */
export const MARKER_CLASSES: Record<CampsiteType, string> = {
  camping: 'campsite-marker--camping',
  glamping: 'campsite-marker--glamping',
  'tented-resort': 'campsite-marker--tented-resort',
  bungalow: 'campsite-marker--bungalow',
  cabin: 'campsite-marker--cabin',
  'rv-caravan': 'campsite-marker--rv-caravan',
};

/**
 * Campsite type labels for display
 */
export const TYPE_LABELS: Record<CampsiteType, string> = {
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
 * Cluster configuration
 */
export const CLUSTER_CONFIG = {
  maxClusterRadius: 50,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 15,
};

/**
 * OpenStreetMap tile layer URL
 */
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * OpenStreetMap attribution
 */
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Map marker icons (emoji/unicode)
 */
export const MARKER_ICONS: Record<CampsiteType, string> = {
  camping: '⛺',
  glamping: '🏕️',
  'tented-resort': '🏖️',
  bungalow: '🏠',
  cabin: '🏡',
  'rv-caravan': '🚐',
};

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format rating for display
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}
