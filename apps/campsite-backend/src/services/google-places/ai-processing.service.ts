/**
 * AI Processing Service
 * Orchestrates AI processing for Google Places raw data
 * Combines deduplication, type classification, and province matching
 */

import { supabaseAdmin } from '../../lib/supabase';
import logger from '../../utils/logger';
import typeClassifierService from './type-classifier.service';
import deduplicationService from './deduplication.service';
import provinceMatcherService from './province-matcher.service';
import type { ImportCandidateStatus } from '@campsite/shared';

interface ProcessedPlace {
  rawPlaceId: string;
  placeId: string;
  name: string;
  address: string;
  confidenceScore: number;
  isDuplicate: boolean;
  duplicateOfCampsiteId?: string;
  suggestedProvinceId: number;
  suggestedTypeId: number;
  validationWarnings: string[];
  processedData: Record<string, unknown>;
}

class AIProcessingService {
  private static instance: AIProcessingService;
  private isProcessing = false;

  private constructor() {}

  static getInstance(): AIProcessingService {
    if (!AIProcessingService.instance) {
      AIProcessingService.instance = new AIProcessingService();
    }
    return AIProcessingService.instance;
  }

  /**
   * Process a single raw place through AI pipeline
   */
  async processPlace(rawPlaceId: string): Promise<ProcessedPlace | null> {
    try {
      // Get raw place data
      const { data: rawPlace, error: fetchError } = await supabaseAdmin
        .from('google_places_raw')
        .select('*')
        .eq('id', rawPlaceId)
        .single();

      if (fetchError || !rawPlace) {
        logger.error('Failed to fetch raw place for processing', {
          rawPlaceId,
          error: fetchError,
          errorMessage: fetchError?.message,
          errorDetails: fetchError?.details,
        });
        return null;
      }

      const placeData = rawPlace.raw_data as any;
      const placeId = rawPlace.place_id;

      logger.debug('Processing place', {
        rawPlaceId,
        placeId,
        placeName: placeData.name,
        hasLocation: !!placeData.geometry?.location,
      });

      // Step 1: Check for duplicates
      const duplicateDetection = await deduplicationService.detectDuplicate(
        placeData.name,
        placeData.formatted_address,
        placeData.formatted_phone_number,
        placeData.website,
        placeData.geometry?.location?.lat,
        placeData.geometry?.location?.lng
      );

      // Step 2: Classify campsite type
      const typeClassification = await typeClassifierService.classifyType(placeData);

      // Step 3: Match province
      let provinceId = 1; // Default to Bangkok
      if (placeData.geometry?.location) {
        const provinceMatch = await provinceMatcherService.matchByCoordinates(
          placeData.geometry.location.lat,
          placeData.geometry.location.lng
        );
        if (provinceMatch) {
          provinceId = provinceMatch.id;
        }
      }

      // Step 4: Calculate confidence score
      const confidenceScore = this.calculateConfidence(duplicateDetection, typeClassification);

      // Step 5: Generate validation warnings
      const validationWarnings = this.generateValidationWarnings(placeData, duplicateDetection);

      // Step 6: Build processed data
      const processedData: ProcessedPlace = {
        rawPlaceId: rawPlace.id,
        placeId: placeId,
        name: placeData.name,
        address: placeData.formatted_address,
        confidenceScore,
        isDuplicate: duplicateDetection.isDuplicate,
        duplicateOfCampsiteId: duplicateDetection.duplicateOfCampsiteId,
        suggestedProvinceId: provinceId,
        suggestedTypeId: typeClassification.typeId,
        validationWarnings,
        processedData: {
          rating: placeData.rating,
          userRatingsTotal: placeData.user_ratings_total,
          phone: placeData.formatted_phone_number,
          website: placeData.website,
          location: placeData.geometry?.location,
          types: placeData.types,
          businessStatus: placeData.business_status,
        },
      };

      logger.info('Place processed successfully', {
        rawPlaceId,
        placeName: placeData.name,
        confidenceScore,
        isDuplicate: duplicateDetection.isDuplicate,
      });

      return processedData;
    } catch (error: any) {
      logger.error('Failed to process place', {
        rawPlaceId,
        error: error?.message || error,
        stack: error?.stack,
        name: error?.name,
      });
      return null;
    }
  }

  /**
   * Process multiple raw places
   */
  async processPlaces(rawPlaceIds: string[]): Promise<{
    successful: number;
    failed: number;
    candidatesCreated: number;
  }> {
    if (this.isProcessing) {
      throw new Error('AI processing is already running');
    }

    this.isProcessing = true;

    let successful = 0;
    let failed = 0;
    let candidatesCreated = 0;

    try {
      logger.info('Starting AI processing', { placeCount: rawPlaceIds.length });

      for (const rawPlaceId of rawPlaceIds) {
        const processed = await this.processPlace(rawPlaceId);

        if (processed) {
          successful++;
          // Create or update import candidate
          const created = await this.createImportCandidate(processed);
          if (created) {
            candidatesCreated++;
          }
        } else {
          failed++;
        }

        // Small delay to avoid overwhelming the database
        await this.delay(100);
      }

      logger.info('AI processing completed', {
        total: rawPlaceIds.length,
        successful,
        failed,
        candidatesCreated,
      });

      return { successful, failed, candidatesCreated };
    } catch (error) {
      logger.error('AI processing failed', { error });
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Create or update import candidate
   */
  private async createImportCandidate(processed: ProcessedPlace): Promise<boolean> {
    try {
      // Check if candidate already exists
      const { data: existing } = await supabaseAdmin
        .from('google_places_import_candidates')
        .select('id')
        .eq('google_place_raw_id', processed.rawPlaceId)
        .single();

      const candidateData = {
        google_place_raw_id: processed.rawPlaceId,
        confidence_score: processed.confidenceScore,
        is_duplicate: processed.isDuplicate,
        duplicate_of_campsite_id: processed.duplicateOfCampsiteId,
        suggested_province_id: processed.suggestedProvinceId,
        suggested_type_id: processed.suggestedTypeId,
        processed_data: processed.processedData,
        validation_warnings: processed.validationWarnings,
        status: this.determineStatus(processed) as ImportCandidateStatus,
      };

      if (existing) {
        // Update existing candidate
        const { error: updateError } = await supabaseAdmin
          .from('google_places_import_candidates')
          .update(candidateData)
          .eq('id', existing.id);

        if (updateError) {
          logger.error('Failed to update import candidate', { error: updateError });
          return false;
        }
      } else {
        // Create new candidate
        const { error: insertError } = await supabaseAdmin
          .from('google_places_import_candidates')
          .insert(candidateData);

        if (insertError) {
          logger.error('Failed to create import candidate', { error: insertError });
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Failed to create import candidate', { error });
      return false;
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    duplicateDetection: { isDuplicate: boolean; similarityScore: number },
    typeClassification: { confidence: number }
  ): number {
    let confidence = typeClassification.confidence;

    // Adjust confidence based on duplicate detection
    if (duplicateDetection.isDuplicate) {
      confidence = Math.max(0.9, confidence); // High confidence if duplicate
    } else if (duplicateDetection.similarityScore > 0.5) {
      confidence = confidence * 0.8; // Lower confidence if similar to existing
    }

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Generate validation warnings
   */
  private generateValidationWarnings(
    placeData: any,
    duplicateDetection: { isDuplicate: boolean; similarCampsites?: any[] }
  ): string[] {
    const warnings: string[] = [];

    // Missing data warnings
    if (!placeData.formatted_phone_number) {
      warnings.push('Missing phone number');
    }
    if (!placeData.website) {
      warnings.push('Missing website');
    }
    if (!placeData.rating || placeData.rating < 3.0) {
      warnings.push('Low or missing rating');
    }

    // Duplicate warnings
    if (duplicateDetection.similarCampsites && duplicateDetection.similarCampsites.length > 0) {
      warnings.push(`${duplicateDetection.similarCampsites.length} similar campsite(s) found`);
    }

    return warnings;
  }

  /**
   * Determine candidate status based on processing results
   */
  private determineStatus(processed: ProcessedPlace): string {
    if (processed.isDuplicate) {
      return 'rejected';
    }
    if (processed.confidenceScore < 0.5) {
      return 'pending';
    }
    return 'pending';
  }

  /**
   * Check if processing is currently running
   */
  isProcessingActive(): boolean {
    return this.isProcessing;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default AIProcessingService.getInstance();
