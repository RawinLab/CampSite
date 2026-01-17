import type { CampsiteDetail, Amenity } from '@campsite/shared';

export interface ComparisonRow {
  key: string;
  label: string;
  labelTh?: string;
  render: (campsite: CampsiteDetail) => string | number | React.ReactNode;
}

// Type name mapping
const typeNames: Record<string, string> = {
  camping: 'Camping',
  glamping: 'Glamping',
  'tented-resort': 'Tented Resort',
  bungalow: 'Bungalow',
  cabin: 'Cabin',
  'rv-caravan': 'RV/Caravan',
};

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    key: 'type',
    label: 'Type',
    render: (c) => typeNames[c.campsite_type] || c.campsite_type,
  },
  {
    key: 'province',
    label: 'Province',
    render: (c) => c.province?.name_en || '-',
  },
  {
    key: 'price',
    label: 'Price Range',
    render: (c) => {
      const min = c.min_price?.toLocaleString() || '0';
      const max = c.max_price?.toLocaleString() || '0';
      return c.min_price === c.max_price
        ? `${min} THB`
        : `${min} - ${max} THB`;
    },
  },
  {
    key: 'rating',
    label: 'Rating',
    render: (c) => {
      const rating = c.average_rating?.toFixed(1) || '0.0';
      const count = c.review_count || 0;
      return `${rating} (${count} reviews)`;
    },
  },
  {
    key: 'checkin',
    label: 'Check-in',
    render: (c) => c.check_in_time || '14:00',
  },
  {
    key: 'checkout',
    label: 'Check-out',
    render: (c) => c.check_out_time || '12:00',
  },
];

// Common amenities to compare
export const COMPARISON_AMENITIES = [
  { slug: 'wifi', name: 'WiFi' },
  { slug: 'electricity', name: 'Electricity' },
  { slug: 'ac', name: 'Air Conditioning' },
  { slug: 'hot-water', name: 'Hot Water' },
  { slug: 'private-bathroom', name: 'Private Bathroom' },
  { slug: 'restaurant', name: 'Restaurant' },
  { slug: 'kitchen', name: 'Kitchen' },
  { slug: 'parking', name: 'Parking' },
];

/**
 * Check if campsite has a specific amenity
 */
export function hasAmenity(campsite: CampsiteDetail, amenitySlug: string): boolean {
  return campsite.amenities?.some((a: Amenity) => a.slug === amenitySlug) || false;
}
