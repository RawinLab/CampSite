import type { Campsite, Amenity, Province } from './campsite';

export type ReviewerType = 'family' | 'couple' | 'solo' | 'group';
export type AttractionCategory = 'hiking' | 'waterfall' | 'temple' | 'viewpoint' | 'lake' | 'cave' | 'market' | 'other';
export type DifficultyLevel = 'easy' | 'moderate' | 'hard';

export interface CampsitePhoto {
  id: string;
  campsite_id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface AccommodationType {
  id: string;
  campsite_id: string;
  name: string;
  description: string | null;
  capacity: number;
  price_per_night: number;
  price_weekend: number | null;
  amenities_included: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NearbyAttraction {
  id: string;
  campsite_id: string;
  name: string;
  description: string | null;
  distance_km: number;
  category: AttractionCategory;
  difficulty: DifficultyLevel | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface ReviewPhoto {
  id: string;
  review_id: string;
  url: string;
  sort_order: number;
}

export interface CampsiteReview {
  id: string;
  campsite_id: string;
  user_id: string;
  rating_overall: number;
  rating_cleanliness: number | null;
  rating_staff: number | null;
  rating_facilities: number | null;
  rating_value: number | null;
  rating_location: number | null;
  reviewer_type: ReviewerType;
  title: string | null;
  content: string;
  pros: string | null;
  cons: string | null;
  helpful_count: number;
  is_reported: boolean;
  report_count: number;
  is_hidden: boolean;
  hidden_reason: string | null;
  hidden_at: string | null;
  hidden_by: string | null;
  owner_response: string | null;
  owner_response_at: string | null;
  visited_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data (required for display)
  reviewer_name: string;
  reviewer_avatar: string | null;
  photos: ReviewPhoto[];
  user_helpful_vote?: boolean;
}

export interface ReviewSummary {
  average_rating: number;
  total_count: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  rating_percentages: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  category_averages: {
    cleanliness: number | null;
    staff: number | null;
    facilities: number | null;
    value: number | null;
    location: number | null;
  };
}

export interface CampsiteOwner {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface CampsiteDetail extends Campsite {
  // Related data
  province: Province;
  owner: CampsiteOwner | null;
  photos: CampsitePhoto[];
  amenities: Amenity[];
  accommodation_types: AccommodationType[];
  nearby_attractions: NearbyAttraction[];
  review_summary: ReviewSummary;
  recent_reviews: CampsiteReview[];
  // Social info
  facebook_url: string | null;
  instagram_url: string | null;
}

export interface CampsiteDetailResponse {
  success: boolean;
  data: CampsiteDetail | null;
  error?: string;
}
