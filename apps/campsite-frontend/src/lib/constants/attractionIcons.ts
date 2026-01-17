import type { AttractionCategory } from '@campsite/shared';
// AttractionCategory is exported from campsite-detail.ts via shared/types

/**
 * Lucide icon names for attraction categories
 */
export const ATTRACTION_ICONS: Record<AttractionCategory, string> = {
  hiking: 'Mountain',
  waterfall: 'Droplets',
  temple: 'Landmark',
  viewpoint: 'Eye',
  lake: 'Waves',
  cave: 'MountainSnow',
  market: 'Store',
  other: 'MapPin',
};

/**
 * Category display labels
 */
export const CATEGORY_LABELS: Record<AttractionCategory, string> = {
  hiking: 'Hiking Trail',
  waterfall: 'Waterfall',
  temple: 'Temple',
  viewpoint: 'Viewpoint',
  lake: 'Lake',
  cave: 'Cave',
  market: 'Market',
  other: 'Other',
};

/**
 * Category colors for icons
 */
export const CATEGORY_COLORS: Record<AttractionCategory, string> = {
  hiking: '#22c55e', // Green
  waterfall: '#3b82f6', // Blue
  temple: '#f97316', // Orange
  viewpoint: '#8b5cf6', // Purple
  lake: '#06b6d4', // Cyan
  cave: '#6b7280', // Gray
  market: '#ec4899', // Pink
  other: '#64748b', // Slate
};
