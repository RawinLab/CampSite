/**
 * Google Places Sync Service
 * Manages scheduled and manual sync operations with Google Places API
 */

import axios from 'axios';
import cron from 'node-cron';
import { supabaseAdmin } from '../../lib/supabase';
import logger from '../../utils/logger';
import { sendSuccess, sendError } from '../../utils/response';
import type {
  SyncLog,
  SyncConfig,
  SyncStatus,
} from '@campsite/shared';
import { GooglePlacesError } from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GOOGLE_PLACES_API_BASE = 'https://maps.googleapis.com/maps/api';
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!API_KEY) {
  logger.warn('GOOGLE_PLACES_API_KEY environment variable not set - Google Places sync will be disabled');
}

// Sync configuration
const SYNC_SCHEDULE = process.env.GOOGLE_PLACES_SYNC_SCHEDULE || '0 2 * * 0'; // Weekly: Sunday 2 AM
const MAX_PLACES_PER_SYNC = parseInt(process.env.GOOGLE_PLACES_MAX_PLACES_PER_SYNC || '5000', 10);
const MAX_REQUESTS_PER_SYNC = parseInt(process.env.GOOGLE_PLACES_MAX_REQUESTS_PER_SYNC || '10000', 10);
const MAX_COST_PER_SYNC = parseFloat(process.env.GOOGLE_PLACES_MAX_COST_PER_SYNC || '80', 10);
const ALERT_COST = parseFloat(process.env.GOOGLE_PLACES_ALERT_COST || '50', 10);

// API pricing (per request)
const PRICING = {
  textSearch: 0.017,
  nearbySearch: 0.017,
  placeDetails: 0.032,
  placePhoto: 0.007,
};

// ============================================================================
// SYNC SERVICE
// ============================================================================

class GooglePlacesSyncService {
  private static instance: GooglePlacesSyncService;
  private currentSyncId: string | null = null;
  private isSyncRunning = false;
  private scheduledJob: cron.ScheduledTask | null = null;

  private constructor() {
    this.initializeScheduledSync();
  }

  static getInstance(): GooglePlacesSyncService {
    if (!GooglePlacesSyncService.instance) {
      GooglePlacesSyncService.instance = new GooglePlacesSyncService();
    }
    return GooglePlacesSyncService.instance;
  }

  /**
   * Initialize scheduled sync (weekly cron job)
   */
  private initializeScheduledSync(): void {
    try {
      this.scheduledJob = cron.schedule(
        SYNC_SCHEDULE,
        () => this.runScheduledSync(),
        {
          timezone: 'Asia/Bangkok',
        }
      );
      logger.info('Google Places sync scheduled', { schedule: SYNC_SCHEDULE });
    } catch (error) {
      logger.error('Failed to schedule Google Places sync', { error });
    }
  }

  /**
   * Run scheduled sync (incremental by default)
   */
  private async runScheduledSync(): Promise<void> {
    try {
      logger.info('Starting scheduled Google Places sync');
      await this.startSync({
        type: 'incremental',
        downloadPhotos: true,
        fetchReviews: true,
      });
    } catch (error) {
      logger.error('Scheduled sync failed', { error });
    }
  }

  /**
   * Start a new sync operation
   */
  async startSync(config: SyncConfig): Promise<SyncLog> {
    // Check if sync is already processing
    if (this.isSyncRunning) {
      throw new GooglePlacesError('GP_008', 'Sync is already processing');
    }

    // Validate config
    const maxPlaces = config.maxPlaces || MAX_PLACES_PER_SYNC;

    // Create sync log
    const { data: syncLog, error: createError } = await supabaseAdmin
      .from('sync_logs')
      .insert({
        sync_type: 'google_places',
        triggered_by: 'admin', // Will be updated based on context
        status: 'processing',
        config_snapshot: config,
      })
      .select()
      .single();

    if (createError || !syncLog) {
      logger.error('Failed to create sync log', { error: createError });
      throw new GooglePlacesError('GP_001', 'Failed to create sync log', createError);
    }

    // Set sync processing state
    this.currentSyncId = syncLog.id;
    this.isSyncRunning = true;

    // Start sync in background
    this.executeSync(syncLog.id, config).catch((error) => {
      logger.error('Sync execution failed', { syncLogId: syncLog.id, error });
    });

    return syncLog as SyncLog;
  }

  /**
   * Execute sync operation (main logic)
   */
  private async executeSync(syncLogId: string, config: SyncConfig): Promise<void> {
    const startTime = Date.now();
    let apiRequests = 0;
    let placesFound = 0;
    let placesUpdated = 0;
    let photosDownloaded = 0;
    let reviewsFetched = 0;

    try {
      logger.info('Starting Google Places sync', { syncLogId, config });

      // Phase 1: Text Search
      logger.info('Phase 1: Text Search', { syncLogId });
      const placeIds = await this.textSearchPhase(config, syncLogId);
      placesFound = placeIds.size;
      apiRequests += placeIds.size * 2; // Approximate

      // Check limits
      if (apiRequests >= MAX_REQUESTS_PER_SYNC) {
        throw new Error('Request limit exceeded');
      }

      // Phase 2: Fetch Place Details
      logger.info('Phase 2: Fetch Place Details', { syncLogId, placeCount: placeIds.size });
      const { placesUpdated: updated, requests: detailRequests } = await this.fetchDetailsPhase(
        Array.from(placeIds),
        syncLogId
      );
      placesUpdated = updated;
      apiRequests += detailRequests;

      // Phase 3: Download Photos (if enabled)
      if (config.downloadPhotos !== false) {
        logger.info('Phase 3: Download Photos', { syncLogId });
        const { downloaded, requests: photoRequests } = await this.downloadPhotosPhase(syncLogId);
        photosDownloaded = downloaded;
        apiRequests += photoRequests;
      }

      // Phase 4: Fetch Reviews (if enabled)
      if (config.fetchReviews !== false) {
        logger.info('Phase 4: Fetch Reviews', { syncLogId });
        const { fetched, requests: reviewRequests } = await this.fetchReviewsPhase(syncLogId);
        reviewsFetched = fetched;
        apiRequests += reviewRequests;
      }

      // Calculate cost
      const estimatedCost = this.estimateCost(apiRequests);

      // Check cost limit
      if (estimatedCost > MAX_COST_PER_SYNC) {
        logger.warn('Sync cost exceeds limit', { estimatedCost, maxCost: MAX_COST_PER_SYNC });
      }

      // Update sync log as completed
      const duration = Math.floor((Date.now() - startTime) / 1000);
      await supabaseAdmin
        .from('sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_seconds: duration,
          places_found: placesFound,
          places_updated: placesUpdated,
          photos_downloaded: photosDownloaded,
          reviews_fetched: reviewsFetched,
          api_requests_made: apiRequests,
          estimated_cost_usd: estimatedCost,
        })
        .eq('id', syncLogId);

      logger.info('Google Places sync completed', {
        syncLogId,
        duration,
        placesFound,
        placesUpdated,
        photosDownloaded,
        reviewsFetched,
        apiRequests,
        estimatedCost,
      });

    } catch (error) {
      // Update sync log as failed
      const duration = Math.floor((Date.now() - startTime) / 1000);
      await supabaseAdmin
        .from('sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          duration_seconds: duration,
          api_requests_made: apiRequests,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_details: error,
        })
        .eq('id', syncLogId);

      logger.error('Google Places sync failed', { syncLogId, error });
      throw error;
    } finally {
      // Reset sync processing state
      this.isSyncRunning = false;
      this.currentSyncId = null;
    }
  }

  /**
   * Phase 1: Text Search - Search for camping sites by province
   */
  private async textSearchPhase(
    config: SyncConfig,
    syncLogId: string
  ): Promise<Set<string>> {
    const placeIds = new Set<string>();

    // Get provinces to search
    const { data: provinces } = await supabaseAdmin
      .from('provinces')
      .select('id, name_en, slug, latitude, longitude');

    if (!provinces) {
      return placeIds;
    }

    // Search by province (English and Thai)
    for (const province of provinces) {
      // English search
      const enQuery = `camping ${province.name_en}`;
      const enResults = await this.textSearch(enQuery, 'en', syncLogId);
      enResults.forEach(result => placeIds.add(result.place_id));

      // Small delay to avoid rate limiting
      await this.delay(100);

      // Thai search
      const thQuery = `ลานกางเต็นท์ ${province.name_en}`;
      const thResults = await this.textSearch(thQuery, 'th', syncLogId);
      thResults.forEach(result => placeIds.add(result.place_id));

      // Small delay to avoid rate limiting
      await this.delay(100);

      // Check if we've reached the limit
      if (placeIds.size >= (config.maxPlaces || MAX_PLACES_PER_SYNC)) {
        logger.info('Reached max places limit', { count: placeIds.size });
        break;
      }
    }

    return placeIds;
  }

  /**
   * Text Search API call
   */
  private async textSearch(
    query: string,
    language: 'en' | 'th',
    syncLogId: string
  ): Promise<Array<{ place_id: string; name: string }>> {
    try {
      if (!API_KEY) {
        logger.error('API_KEY not set - cannot perform text search', { query });
        return [];
      }

      const url = `${GOOGLE_PLACES_API_BASE}/place/textsearch/json`;
      const response = await axios.get(url, {
        params: {
          query,
          language,
          key: API_KEY,
        },
        timeout: 10000,
      });

      const { status, results } = response.data;

      if (status !== 'OK') {
        logger.warn('Text search returned non-OK status', { status, query, error_message: response.data.error_message });
        return [];
      }

      return (results || []).map((r: any) => ({
        place_id: r.place_id,
        name: r.name,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as any;
        logger.error('Text search API error', {
          query,
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message,
        });
        if (error.response?.status === 429) {
          await this.delay(2000); // Wait 2 seconds
        }
        return [];
      }
      logger.error('Text search failed', { query, error });
      return [];
    }
  }

  /**
   * Phase 2: Fetch Place Details
   */
  private async fetchDetailsPhase(
    placeIds: string[],
    syncLogId: string
  ): Promise<{ placesUpdated: number; requests: number }> {
    let updated = 0;
    let requests = 0;

    for (const placeId of placeIds) {
      try {
        const url = `${GOOGLE_PLACES_API_BASE}/place/details/json`;
        const response = await axios.get(url, {
          params: {
            place_id,
            fields: 'place_id,name,formatted_address,geometry,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,price_level,photos,reviews,types,business_status,opening_hours,plus_code,url',
            key: API_KEY,
          },
          timeout: 10000,
        });

        requests++;

        const { status, result } = response.data;

        if (status === 'OK' && result) {
          // Save or update raw data
          const { error: upsertError } = await supabaseAdmin
            .from('google_places_raw')
            .upsert({
              place_id: result.place_id,
              place_hash: this.generatePlaceHash(result.name, result.formatted_address),
              raw_data: result,
              data_fetched_at: new Date().toISOString(),
              sync_status: 'pending',
              has_photos: (result.photos?.length || 0) > 0,
              photo_count: result.photos?.length || 0,
              has_reviews: (result.reviews?.length || 0) > 0,
              review_count: result.reviews?.length || 0,
              rating: result.rating,
            }, {
            onConflict: 'place_id',
            ignoreDuplicates: false,
          });

          if (!upsertError) {
            updated++;
          }
        }

        // Small delay to avoid rate limiting
        await this.delay(50);

      } catch (error) {
        logger.error('Failed to fetch place details', { placeId, error });
      }
    }

    return { placesUpdated: updated, requests };
  }

  /**
   * Phase 3: Download Photos
   */
  private async downloadPhotosPhase(syncLogId: string): Promise<{ downloaded: number; requests: number }> {
    // Get all places with photos that haven't been downloaded
    const { data: places } = await supabaseAdmin
      .from('google_places_raw')
      .select('place_id, raw_data')
      .eq('has_photos', true)
      .limit(1000);

    if (!places) {
      return { downloaded: 0, requests: 0 };
    }

    let downloaded = 0;
    let requests = 0;

    for (const place of places) {
      const photos = place.raw_data?.photos || [];
      const placeId = place.place_id;

      for (const photo of photos.slice(0, 3)) { // Max 3 photos per place
        try {
          // Save photo record
          await supabaseAdmin
            .from('google_places_photos')
            .insert({
              google_place_id: placeId,
              photo_reference: photo.photo_reference,
              width: photo.width,
              height: photo.height,
              download_status: 'pending',
            });

          downloaded++;
          requests++;
        } catch (error) {
          logger.error('Failed to save photo record', { placeId, photo, error });
        }
      }
    }

    return { downloaded, requests };
  }

  /**
   * Phase 4: Fetch Reviews
   */
  private async fetchReviewsPhase(syncLogId: string): Promise<{ fetched: number; requests: number }> {
    // Get all places with reviews that haven't been fetched
    const { data: places } = await supabaseAdmin
      .from('google_places_raw')
      .select('place_id, raw_data')
      .eq('has_reviews', true)
      .is('review_count', 0, '>')
      .limit(1000);

    if (!places) {
      return { fetched: 0, requests: 0 };
    }

    let fetched = 0;
    let requests = 0;

    for (const place of places) {
      const reviews = place.raw_data?.reviews || [];
      const placeId = place.place_id;

      for (const review of reviews) {
        try {
          // Save review record
          await supabaseAdmin
            .from('google_places_reviews')
            .insert({
              google_place_id: placeId,
              raw_data: review,
              author_name: review.author_name,
              author_profile_url: review.author_url,
              rating: review.rating,
              text_content: review.text,
              relative_time_description: review.relative_time_description,
              reviewed_at: new Date(review.time * 1000).toISOString(),
            });

          fetched++;
        } catch (error) {
          logger.error('Failed to save review record', { placeId, review, error });
        }
      }

      requests++;
    }

    return { fetched, requests };
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus | null {
    if (!this.isSyncRunning || !this.currentSyncId) {
      return null;
    }

    return {
      id: this.currentSyncId,
      status: 'processing',
      progress: {
        current: 0,
        total: 100,
        phase: 'processing',
      },
      statistics: {
        placesFound: 0,
        placesUpdated: 0,
        photosDownloaded: 0,
        reviewsFetched: 0,
        apiRequestsMade: 0,
        estimatedCostUsd: 0,
      },
    };
  }

  /**
   * Cancel processing sync
   */
  async cancelSync(syncLogId: string): Promise<void> {
    if (this.currentSyncId !== syncLogId) {
      throw new Error('Sync log ID does not match current sync');
    }

    // Update sync log as failed
    await supabaseAdmin
      .from('sync_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: 'Cancelled by admin',
      })
      .eq('id', syncLogId);

    // Reset sync processing state
    this.isSyncRunning = false;
    this.currentSyncId = null;

    logger.info('Sync cancelled', { syncLogId });
  }

  /**
   * Estimate API cost based on request count
   */
  private estimateCost(requests: number): number {
    // Rough estimate: 70% details, 20% text search, 10% photos
    const details = Math.floor(requests * 0.7);
    const searches = Math.floor(requests * 0.2);
    const photos = Math.floor(requests * 0.1);

    return (
      details * PRICING.placeDetails +
      searches * PRICING.textSearch +
      photos * PRICING.placePhoto
    );
  }

  /**
   * Generate place hash for deduplication
   */
  private generatePlaceHash(name: string, address: string): string {
    const crypto = require('crypto');
    const data = `${name.toLowerCase().trim()}|${address.toLowerCase().trim()}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export default GooglePlacesSyncService.getInstance();
