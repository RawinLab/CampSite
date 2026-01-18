// Mock dependencies BEFORE importing the service
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../../src/utils/logger', () => mockLogger);

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

describe('TypeClassifierService', () => {
  let typeClassifierService: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Set API key for Gemini
    process.env.GEMINI_API_KEY = 'test-gemini-key';

    // Reset module to get fresh instance
    jest.resetModules();
    const module = await import('../../../src/services/google-places/type-classifier.service');
    typeClassifierService = module.default;
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('classifyType', () => {
    it('classifies as Camping with keyword match', async () => {
      const placeData = {
        name: 'Sunset Camping Ground',
        formatted_address: '123 Mountain Road',
        types: ['campground'],
        price_level: 1,
        rating: 4.5,
        photos: [{ photo_reference: 'photo1' }],
        user_ratings_total: 150,
      };

      const result = await typeClassifierService.classifyType(placeData);

      expect(result.typeId).toBe(1);
      expect(result.typeName).toBe('Camping');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('classifies as Glamping with keyword match', async () => {

      const placeData = {
        name: 'Luxury Glamping Resort',
        formatted_address: '456 Forest Road',
        types: ['lodging'],
        price_level: 3,
        rating: 4.8,
        photos: [{ photo_reference: 'photo1' }],
        user_ratings_total: 200,
      };

      const result = await typeClassifierService.classifyType(placeData);

      expect(result.typeId).toBe(2);
      expect(result.typeName).toBe('Glamping');
      expect(result.confidence).toBe(0.95);
    });

    it('classifies as Tented Resort with keyword match', async () => {

      const placeData = {
        name: 'Mountain Resort',
        formatted_address: '789 Hill Road',
        types: ['resort'],
        price_level: 3,
        rating: 4.6,
        photos: [],
        user_ratings_total: 100,
      };

      const result = await typeClassifierService.classifyType(placeData);

      expect(result.typeId).toBe(3);
      expect(result.typeName).toBe('Tented Resort');
      expect(result.confidence).toBe(0.9);
    });

    it('classifies as Bungalow with keyword match', async () => {

      const placeData = {
        name: 'Beachside Bungalow',
        formatted_address: '321 Beach Road',
        types: ['lodging'],
        price_level: 2,
        rating: 4.3,
        photos: [],
        user_ratings_total: 80,
      };

      const result = await typeClassifierService.classifyType(placeData);

      expect(result.typeId).toBe(4);
      expect(result.typeName).toBe('Bungalow');
      expect(result.confidence).toBe(0.95);
    });

    it('uses AI classification when keyword confidence is low', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{"typeId": 2, "typeName": "Glamping", "confidence": 0.85}',
        },
      });

      const placeData = {
        name: 'Unknown Type Place',
        formatted_address: '555 Unknown Road',
        types: ['point_of_interest'],
        price_level: 2,
        rating: 4.0,
        photos: [],
        user_ratings_total: 50,
      };

      const result = await typeClassifierService.classifyType(placeData);

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result.typeId).toBe(2);
      expect(result.typeName).toBe('Glamping');
      expect(result.confidence).toBe(0.85);
    });

    it('falls back to keyword classification when AI fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('AI Error'));

      const placeData = {
        name: 'Test Camp',
        formatted_address: '123 Test Road',
        types: ['point_of_interest'],
        price_level: 1,
        rating: 3.5,
        photos: [],
        user_ratings_total: 20,
      };

      const result = await typeClassifierService.classifyType(placeData);

      expect(mockLogger.warn).toHaveBeenCalled();
      expect(result.typeId).toBe(1); // Default to Camping
      expect(result.confidence).toBeLessThanOrEqual(0.5);
    });

    it('classifies with Thai keywords', async () => {

      const placeData = {
        name: 'ลานกางเต็นท์ทะเลสาบ',
        formatted_address: 'จังหวัดเชียงใหม่',
        types: ['campground'],
        price_level: 1,
        rating: 4.2,
        photos: [],
        user_ratings_total: 75,
      };

      const result = await typeClassifierService.classifyType(placeData);

      expect(result.typeId).toBe(1);
      expect(result.typeName).toBe('Camping');
      expect(result.confidence).toBe(0.95);
    });

    it('uses price level to differentiate glamping from camping', async () => {

      const placeData = {
        name: 'Luxury Campground',
        formatted_address: 'Premium Location',
        types: ['campground'],
        price_level: 4, // High price suggests glamping
        rating: 4.9,
        photos: [],
        user_ratings_total: 300,
      };

      const result = await typeClassifierService.classifyType(placeData);

      expect(result.typeId).toBe(2); // Should be Glamping due to high price
      expect(result.typeName).toBe('Glamping');
    });
  });
});
