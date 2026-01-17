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

export interface AccommodationListResponse {
  success: boolean;
  data: AccommodationType[];
}

export interface CreateAccommodationInput {
  campsite_id: string;
  name: string;
  description?: string;
  capacity: number;
  price_per_night: number;
  price_weekend?: number;
  amenities_included?: string[];
  sort_order?: number;
}

export interface UpdateAccommodationInput {
  name?: string;
  description?: string;
  capacity?: number;
  price_per_night?: number;
  price_weekend?: number;
  amenities_included?: string[];
  sort_order?: number;
  is_active?: boolean;
}

export interface AccommodationPricing {
  weekday: number;
  weekend: number | null;
  hasWeekendPricing: boolean;
}

export function getAccommodationPricing(accommodation: AccommodationType): AccommodationPricing {
  return {
    weekday: accommodation.price_per_night,
    weekend: accommodation.price_weekend,
    hasWeekendPricing: accommodation.price_weekend !== null && accommodation.price_weekend !== accommodation.price_per_night,
  };
}
