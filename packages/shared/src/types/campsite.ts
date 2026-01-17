export type CampsiteStatus = 'pending' | 'approved' | 'rejected' | 'archived';
export type CampsiteType = 'camping' | 'glamping' | 'tented-resort' | 'bungalow' | 'cabin' | 'rv-caravan';

export interface Campsite {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  province_id: number;
  address: string;
  latitude: number;
  longitude: number;
  campsite_type: CampsiteType;
  status: CampsiteStatus;
  is_featured: boolean;
  average_rating: number;
  review_count: number;
  min_price: number;
  max_price: number;
  check_in_time: string;
  check_out_time: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  booking_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Campsite Card - lightweight version for search results
 */
export interface CampsiteCard {
  id: string;
  name: string;
  description: string;
  slug: string;
  campsite_type: CampsiteType;
  province: {
    id: number;
    name_th: string;
    name_en: string;
    slug: string;
  };
  min_price: number;
  max_price: number;
  average_rating: number;
  review_count: number;
  is_featured: boolean;
  thumbnail_url: string | null;
  amenities: string[]; // slugs of amenities
}

/**
 * Campsite Type metadata
 */
export interface CampsiteTypeInfo {
  id: number;
  name_th: string;
  name_en: string;
  slug: string;
  color_hex: string;
  icon: string;
  description_th: string;
  description_en: string;
  sort_order: number;
}

export interface Province {
  id: number;
  name_th: string;
  name_en: string;
  slug: string;
  region: string;
  latitude?: number;
  longitude?: number;
}

export interface Amenity {
  id: number;
  name_th: string;
  name_en: string;
  slug: string;
  icon: string;
  category: string;
  sort_order: number;
}

/**
 * Search Results with Pagination
 */
export interface SearchResults {
  data: CampsiteCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    provinceId?: number;
    types?: string[];
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    minRating?: number;
  };
  sort: string;
}
