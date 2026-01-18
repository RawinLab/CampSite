/**
 * Deduplication Service
 * Detects potential duplicate campsites using multi-factor comparison
 */

import { supabaseAdmin } from '../../lib/supabase';
import logger from '../../utils/logger';
import type { DuplicateDetection, SimilarCampsite } from '@campsite/shared';

class DeduplicationService {
  private static instance: DeduplicationService;

  private constructor() {}

  static getInstance(): DeduplicationService {
    if (!DeduplicationService.instance) {
      DeduplicationService.instance = new DeduplicationService();
    }
    return DeduplicationService.instance;
  }

  /**
   * Detect if a Google Place is a duplicate of an existing campsite
   */
  async detectDuplicate(
    placeName: string,
    placeAddress: string,
    placePhone?: string,
    placeWebsite?: string,
    placeLat?: number,
    placeLng?: number
  ): Promise<DuplicateDetection> {
    const similarCampsites: SimilarCampsite[] = [];
    let isDuplicate = false;
    let duplicateOfCampsiteId: string | undefined;

    // Factor 1: Name similarity (exact match)
    const nameMatches = await this.compareByName(placeName);
    for (const campsite of nameMatches) {
      const score = this.calculateSimilarity(placeName, placeAddress, campsite);
      if (score > 0.8) {
        similarCampsites.push({
          campsiteId: campsite.id,
          name: campsite.name,
          similarityScore: score,
          distanceKm: campsite.distance_km || 0,
          address: campsite.address,
        });
      }
    }

    // Factor 2: Location proximity (within 500m)
    if (placeLat !== undefined && placeLng !== undefined) {
      const locationMatches = await this.compareByLocation(placeLat, placeLng, 0.5); // 500m radius
      for (const campsite of locationMatches) {
        const existing = similarCampsites.find(s => s.campsiteId === campsite.id);
        if (existing) {
          // Boost score if also matched by name
          existing.similarityScore = Math.min(1, existing.similarityScore + 0.2);
        } else {
          similarCampsites.push({
            campsiteId: campsite.id,
            name: campsite.name,
            similarityScore: 0.6, // Base score for location match
            distanceKm: campsite.distance_km || 0,
            address: campsite.address,
          });
        }
      }
    }

    // Factor 3: Phone number match (strong indicator)
    if (placePhone) {
      const phoneMatch = await this.compareByPhone(placePhone);
      if (phoneMatch) {
        const existing = similarCampsites.find(s => s.campsiteId === phoneMatch.id);
        if (existing) {
          existing.similarityScore = 1; // Phone match = very high confidence
        } else {
          similarCampsites.push({
            campsiteId: phoneMatch.id,
            name: phoneMatch.name,
            similarityScore: 1,
            distanceKm: 0,
            address: phoneMatch.address,
          });
        }
      }
    }

    // Factor 4: Website URL match (strong indicator)
    if (placeWebsite) {
      const websiteMatch = await this.compareByWebsite(placeWebsite);
      if (websiteMatch) {
        const existing = similarCampsites.find(s => s.campsiteId === websiteMatch.id);
        if (existing) {
          existing.similarityScore = 1; // Website match = very high confidence
        } else {
          similarCampsites.push({
            campsiteId: websiteMatch.id,
            name: websiteMatch.name,
            similarityScore: 1,
            distanceKm: 0,
            address: websiteMatch.address,
          });
        }
      }
    }

    // Sort by similarity score descending
    similarCampsites.sort((a, b) => b.similarityScore - a.similarityScore);

    // Determine if duplicate based on highest similarity score
    if (similarCampsites.length > 0 && similarCampsites[0].similarityScore > 0.8) {
      isDuplicate = true;
      duplicateOfCampsiteId = similarCampsites[0].campsiteId;
    }

    return {
      isDuplicate,
      duplicateOfCampsiteId,
      similarityScore: similarCampsites[0]?.similarityScore || 0,
      similarCampsites,
    };
  }

  /**
   * Compare campsites by name similarity
   */
  private async compareByName(name: string): Promise<Array<{ id: string; name: string; address: string; distance_km?: number }>> {
    // Use PostgreSQL's word_similarity or pg_trgm for fuzzy matching
    const { data } = await supabaseAdmin.rpc('match_campsites_by_name', {
    search_name: name,
    threshold: 0.6,
  });

    return data || [];
  }

  /**
   * Compare campsites by location proximity
   */
  private async compareByLocation(lat: number, lng: number, radiusKm: number): Promise<Array<{ id: string; name: string; address: string; distance_km: number }>> {
    // Use PostGIS for location-based query if available, otherwise fall back to haversine formula
    const { data } = await supabaseAdmin
      .from('campsites')
      .select('id, name, address, latitude, longitude')
      .eq('is_active', true)
      .limit(50);

    if (!data) {
      return [];
    }

    const results = data
      .map((campsite: any) => {
        const distance = this.haversineDistance(
          lat,
          lng,
          campsite.latitude,
          campsite.longitude
        );
        return {
          id: campsite.id,
          name: campsite.name,
          address: campsite.address,
          distance_km: distance,
        };
      })
      .filter((c: any) => c.distance_km <= radiusKm);

    return results;
  }

  /**
   * Compare campsites by phone number
   */
  private async compareByPhone(phone: string): Promise<{ id: string; name: string; address: string } | null> {
    // Normalize phone number (remove spaces, dashes, parentheses)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

    const { data } = await supabaseAdmin
      .from('campsites')
      .select('id, name, address, phone')
      .eq('is_active', true)
      .limit(1);

    if (!data || data.length === 0) {
      return null;
    }

    // Check if any phone number matches
    for (const campsite of data) {
      if (campsite.phone) {
        const campPhoneNormalized = campsite.phone.replace(/[\s\-\(\)]/g, '');
        if (campPhoneNormalized === normalizedPhone ||
            campPhoneNormalized.includes(normalizedPhone) ||
            normalizedPhone.includes(campPhoneNormalized)) {
          return {
            id: campsite.id,
            name: campsite.name,
            address: campsite.address,
          };
        }
      }
    }

    return null;
  }

  /**
   * Compare campsites by website URL
   */
  private async compareByWebsite(website: string): Promise<{ id: string; name: string; address: string } | null> {
    // Normalize website URL
    const normalizedWebsite = this.normalizeWebsite(website);

    const { data } = await supabaseAdmin
      .from('campsites')
      .select('id, name, address, website')
      .eq('is_active', true)
      .not('website', 'is', null)
      .limit(100);

    if (!data) {
      return null;
    }

    // Check if any website matches
    for (const campsite of data) {
      if (campsite.website) {
        const campWebsiteNormalized = this.normalizeWebsite(campsite.website);
        if (campWebsiteNormalized === normalizedWebsite ||
            campWebsiteNormalized.includes(normalizedWebsite) ||
            normalizedWebsite.includes(campWebsiteNormalized)) {
          return {
            id: campsite.id,
            name: campsite.name,
            address: campsite.address,
          };
        }
      }
    }

    return null;
  }

  /**
   * Calculate similarity score between Google Place and existing campsite
   */
  private calculateSimilarity(
    placeName: string,
    placeAddress: string,
    campsite: { name: string; address: string; distance_km?: number }
  ): number {
    let score = 0;

    // Name similarity (40% weight)
    const nameSimilarity = this.stringSimilarity(placeName, campsite.name);
    score += nameSimilarity * 0.4;

    // Address similarity (30% weight)
    const addressSimilarity = this.stringSimilarity(placeAddress, campsite.address);
    score += addressSimilarity * 0.3;

    // Distance proximity (30% weight)
    // If within 100m, high confidence; within 500m, medium confidence
    if (campsite.distance_km !== undefined) {
      if (campsite.distance_km < 0.1) {
        score += 0.3;
      } else if (campsite.distance_km < 0.5) {
        score += 0.15;
      }
    }

    return Math.min(1, score);
  }

  /**
   * Calculate string similarity using Jaro-Winkler distance approximation
   */
  private stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    // Simple check: if one string contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.8;
    }

    // Count matching characters
    const matches = s1.split('').filter(char => s2.includes(char)).length;
    const maxLength = Math.max(s1.length, s2.length);

    return matches / maxLength;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
   * Normalize website URL for comparison
   */
  private normalizeWebsite(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.hostname}${urlObj.pathname}`.toLowerCase().replace(/^www\./, '');
    } catch {
      return url.toLowerCase().replace(/^https?:\/\/(www\.)?/, '');
    }
  }
}

export default DeduplicationService.getInstance();
