/**
 * Province Matcher Service
 * Matches coordinates to Thai provinces
 */

import { supabaseAdmin } from '../../lib/supabase';
import logger from '../../utils/logger';

class ProvinceMatcherService {
  private static instance: ProvinceMatcherService;
  private provinceCache: Map<string, any> = new Map();

  private constructor() {
    this.loadProvinces();
  }

  static getInstance(): ProvinceMatcherService {
    if (!ProvinceMatcherService.instance) {
      ProvinceMatcherService.instance = new ProvinceMatcherService();
    }
    return ProvinceMatcherService.instance;
  }

  /**
   * Load all provinces into cache
   */
  private async loadProvinces(): Promise<void> {
    const { data: provinces } = await supabaseAdmin
      .from('provinces')
      .select('id, name_th, name_en, slug, latitude, longitude');

    if (provinces) {
      for (const province of provinces) {
        this.provinceCache.set(province.slug, province);
        this.provinceCache.set(province.name_en.toLowerCase(), province);
        this.provinceCache.set(province.name_th, province);
      }
      logger.info('Provinces loaded into cache', { count: provinces.length });
    }
  }

  /**
   * Match coordinates to nearest province
   */
  async matchByCoordinates(lat: number, lng: number): Promise<{ id: number; name: string } | null> {
    let nearestProvince: any = null;
    let minDistance = Infinity;

    for (const province of this.provinceCache.values()) {
      const distance = this.calculateDistance(
        lat,
        lng,
        province.latitude,
        province.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestProvince = province;
      }
    }

    // If distance is too large (>100km), return null
    if (minDistance > 100) {
      logger.warn('Coordinate too far from any province center', { lat, lng, minDistance });
      return null;
    }

    return {
      id: nearestProvince.id,
      name: nearestProvince.name_en,
    };
  }

  /**
   * Match province by name (Thai or English)
   */
  async matchByName(name: string): Promise<{ id: number; name: string } | null> {
    const normalizedName = name.toLowerCase().trim();

    // Try exact match first
    const province = this.provinceCache.get(normalizedName);
    if (province) {
      return {
        id: province.id,
        name: province.name_en,
      };
    }

    // Try partial match
    for (const [key, value] of this.provinceCache.entries()) {
      if (key.includes(normalizedName) || normalizedName.includes(key)) {
        return {
          id: value.id,
          name: value.name_en,
        };
      }
    }

    return null;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get all provinces
   */
  async getAllProvinces(): Promise<Array<{ id: number; name_th: string; name_en: string; slug: string }>> {
    const { data } = await supabaseAdmin
      .from('provinces')
      .select('id, name_th, name_en, slug')
      .order('name_en');

    return data || [];
  }
}

export default ProvinceMatcherService.getInstance();
