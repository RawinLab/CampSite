/**
 * Province type representing a Thai province
 */
export interface Province {
  id: number;
  name_th: string;
  name_en: string;
  slug: string;
  region: 'central' | 'north' | 'northeast' | 'east' | 'west' | 'south';
  latitude?: number;
  longitude?: number;
}

/**
 * Province autocomplete suggestion
 */
export interface ProvinceSuggestion {
  id: number;
  name_th: string;
  name_en: string;
  slug: string;
  region: string;
}

/**
 * Province autocomplete response
 */
export interface ProvinceAutocompleteResponse {
  data: ProvinceSuggestion[];
  count: number;
}
