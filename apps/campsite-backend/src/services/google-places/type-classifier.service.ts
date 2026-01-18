/**
 * Type Classifier Service
 * Uses Google Gemini AI to classify Google Places data into campsite types
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import logger from '../../utils/logger';
import type { GooglePlaceDetails } from '@campsite/shared';

class TypeClassifierService {
  private static instance: TypeClassifierService;
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  private constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      logger.info('Gemini AI initialized for type classification');
    } else {
      logger.warn('GEMINI_API_KEY or GOOGLE_AI_API_KEY not set - AI classification disabled, using keyword-based only');
    }
  }

  static getInstance(): TypeClassifierService {
    if (!TypeClassifierService.instance) {
      TypeClassifierService.instance = new TypeClassifierService();
    }
    return TypeClassifierService.instance;
  }

  /**
   * Classify campsite type from Google Places data
   * Returns type_id: 1=Camping, 2=Glamping, 3=Tented Resort, 4=Bungalow
   */
  async classifyType(placeData: GooglePlaceDetails): Promise<{
    typeId: number;
    typeName: string;
    confidence: number;
  }> {
    try {
      // Extract features from Google Places data
      const features = this.extractFeatures(placeData);

      // Use keyword-based classification as primary method
      const result = this.keywordBasedClassification(placeData, features);

      // If confidence is low and Gemini is available, try AI classification
      if (result.confidence < 0.7 && this.model) {
        logger.info('Low confidence from keyword classification, trying Gemini AI', {
          placeName: placeData.name,
          keywordConfidence: result.confidence,
        });

        try {
          const aiResult = await this.aiClassification(placeData, features);
          if (aiResult.confidence > result.confidence) {
            return aiResult;
          }
        } catch (aiError) {
          logger.warn('Gemini AI classification failed, falling back to keyword result', {
            placeName: placeData.name,
            error: aiError,
          });
          // Fall through to return keyword result
        }
      }

      return result;
    } catch (error) {
      logger.error('Type classification failed', { placeName: placeData.name, error });
      // Return default camping type
      return {
        typeId: 1,
        typeName: 'Camping',
        confidence: 0.5,
      };
    }
  }

  /**
   * Extract features from Google Places data
   */
  private extractFeatures(placeData: GooglePlaceDetails): Record<string, any> {
    return {
      name: placeData.name,
      types: placeData.types || [],
      priceLevel: placeData.price_level,
      rating: placeData.rating,
      hasPhotos: (placeData.photos?.length || 0) > 0,
      reviewCount: placeData.user_ratings_total || 0,
    };
  }

  /**
   * Keyword-based classification (fast, no API cost)
   */
  private keywordBasedClassification(
    placeData: GooglePlaceDetails,
    features: Record<string, any>
  ): { typeId: number; typeName: string; confidence: number } {
    const name = placeData.name.toLowerCase();
    const types = placeData.types || [];

    // Check for explicit type indicators
    if (name.includes('glamping') || types.includes('glamping_site')) {
      return { typeId: 2, typeName: 'Glamping', confidence: 0.95 };
    }

    if (name.includes('bungalow') || name.includes('บังกะโล')) {
      return { typeId: 4, typeName: 'Bungalow', confidence: 0.95 };
    }

    if (name.includes('resort') || name.includes('รีสอร์ท')) {
      return { typeId: 3, typeName: 'Tented Resort', confidence: 0.9 };
    }

    if (name.includes('camping') || name.includes('แคมป์ปิ้ง') || name.includes('ลานกางเต็นท์')) {
      return { typeId: 1, typeName: 'Camping', confidence: 0.95 };
    }

    // Check types array
    if (types.includes('campground')) {
      // High price level suggests glamping
      if (features.priceLevel && features.priceLevel >= 3) {
        return { typeId: 2, typeName: 'Glamping', confidence: 0.7 };
      }
      return { typeId: 1, typeName: 'Camping', confidence: 0.85 };
    }

    if (types.includes('lodging') || types.includes('inn')) {
      if (features.priceLevel && features.priceLevel >= 3) {
        return { typeId: 2, typeName: 'Glamping', confidence: 0.6 };
      }
      return { typeId: 1, typeName: 'Camping', confidence: 0.6 };
    }

    // Default to Camping with low confidence
    return { typeId: 1, typeName: 'Camping', confidence: 0.5 };
  }

  /**
   * AI-based classification using Google Gemini (optional, requires API key)
   */
  private async aiClassification(
    placeData: GooglePlaceDetails,
    features: Record<string, any>
  ): Promise<{ typeId: number; typeName: string; confidence: number }> {
    if (!this.model) {
      throw new Error('Gemini AI model not initialized');
    }

    try {
      const prompt = this.buildClassificationPrompt(placeData, features);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      return this.parseAIResponse(content);
    } catch (error) {
      logger.error('Gemini AI classification failed', { placeName: placeData.name, error });
      throw error;
    }
  }

  /**
   * Build classification prompt for Gemini
   */
  private buildClassificationPrompt(
    placeData: GooglePlaceDetails,
    features: Record<string, any>
  ): string {
    return `Analyze this camping site and classify it:

Name: ${placeData.name}
Address: ${placeData.formatted_address}
Types: ${placeData.types?.join(', ') || 'N/A'}
Price Level: ${placeData.price_level || 'N/A'} (0-4 scale)
Rating: ${placeData.rating || 'N/A'} (1-5)
Review Count: ${placeData.user_ratings_total || 0}

Available Types:
1. Camping - Basic camping sites, tents, minimal facilities
2. Glamping - Luxury camping with comfort amenities, AC, proper beds
3. Tented Resort - Resort-style accommodation in tents, full facilities
4. Bungalow - Permanent structures, cabins, cottages

Respond with ONLY the type ID (1-4), type name, and confidence score (0-1) in this format:
{"typeId": 1, "typeName": "Camping", "confidence": 0.9}`;
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(content: string): { typeId: number; typeName: string; confidence: number } {
    try {
      const jsonMatch = content.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          typeId: parsed.typeId || 1,
          typeName: parsed.typeName || 'Camping',
          confidence: parsed.confidence || 0.5,
        };
      }
    } catch (error) {
      logger.error('Failed to parse Gemini AI response', { content, error });
    }

    // Default fallback
    return { typeId: 1, typeName: 'Camping', confidence: 0.5 };
  }
}

export default TypeClassifierService.getInstance();
