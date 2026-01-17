import { supabaseAdmin } from '../lib/supabase';
import type { Province, ProvinceSuggestion } from '@campsite/shared';

/**
 * Province Service
 * Handles all province-related database operations
 */
export class ProvinceService {
  /**
   * Search provinces by name (Thai or English) using ILIKE
   * @param query Search string (minimum 2 characters)
   * @param limit Maximum number of results (default 10)
   * @returns Array of matching provinces
   */
  async searchProvinces(query: string, limit: number = 10): Promise<ProvinceSuggestion[]> {
    const searchPattern = `%${query}%`;

    const { data, error } = await supabaseAdmin
      .from('provinces')
      .select('id, name_th, name_en, slug, region')
      .or(`name_th.ilike.${searchPattern},name_en.ilike.${searchPattern}`)
      .order('name_en', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search provinces: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all provinces
   * @returns Array of all provinces
   */
  async getAllProvinces(): Promise<Province[]> {
    const { data, error } = await supabaseAdmin
      .from('provinces')
      .select('id, name_th, name_en, slug, region, latitude, longitude')
      .order('name_en', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch provinces: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get province by ID
   * @param id Province ID
   * @returns Province or null
   */
  async getProvinceById(id: number): Promise<Province | null> {
    const { data, error } = await supabaseAdmin
      .from('provinces')
      .select('id, name_th, name_en, slug, region, latitude, longitude')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch province: ${error.message}`);
    }

    return data;
  }

  /**
   * Get province by slug
   * @param slug Province slug
   * @returns Province or null
   */
  async getProvinceBySlug(slug: string): Promise<Province | null> {
    const { data, error } = await supabaseAdmin
      .from('provinces')
      .select('id, name_th, name_en, slug, region, latitude, longitude')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch province: ${error.message}`);
    }

    return data;
  }

  /**
   * Get provinces by region
   * @param region Region name
   * @returns Array of provinces in region
   */
  async getProvincesByRegion(region: string): Promise<Province[]> {
    const { data, error } = await supabaseAdmin
      .from('provinces')
      .select('id, name_th, name_en, slug, region, latitude, longitude')
      .eq('region', region)
      .order('name_en', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch provinces by region: ${error.message}`);
    }

    return data || [];
  }
}

// Export singleton instance
export const provinceService = new ProvinceService();
