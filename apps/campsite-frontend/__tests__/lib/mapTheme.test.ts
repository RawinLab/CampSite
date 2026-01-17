import {
  MARKER_COLORS,
  MARKER_CLASSES,
  TYPE_LABELS,
  THAILAND_CENTER,
  MAP_ZOOM,
  CLUSTER_CONFIG,
  MARKER_ICONS,
} from '@/lib/constants/mapTheme';

// CampsiteType literal values for testing
const CAMPSITE_TYPES = ['camping', 'glamping', 'tented-resort', 'bungalow', 'cabin', 'rv-caravan'] as const;

describe('mapTheme constants', () => {
  describe('MARKER_COLORS', () => {
    it('should have all campsite types', () => {
      const types = Object.keys(MARKER_COLORS);
      expect(types).toHaveLength(6);
      CAMPSITE_TYPES.forEach((type) => {
        expect(types).toContain(type);
      });
    });

    it('should have valid hex colors for each type', () => {
      const hexColorRegex = /^#[0-9a-f]{6}$/i;
      CAMPSITE_TYPES.forEach((type) => {
        expect(MARKER_COLORS[type]).toBeDefined();
        expect(MARKER_COLORS[type]).toMatch(hexColorRegex);
      });
    });

    it('should have distinct colors for different types', () => {
      const colors = Object.values(MARKER_COLORS);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });
  });

  describe('MARKER_CLASSES', () => {
    it('should have all campsite types', () => {
      const types = Object.keys(MARKER_CLASSES);
      expect(types).toHaveLength(6);
      CAMPSITE_TYPES.forEach((type) => {
        expect(types).toContain(type);
      });
    });

    it('should have valid CSS class names for each type', () => {
      CAMPSITE_TYPES.forEach((type) => {
        expect(MARKER_CLASSES[type]).toBeDefined();
        expect(MARKER_CLASSES[type]).toContain('campsite-marker--');
      });
    });
  });

  describe('TYPE_LABELS', () => {
    it('should have all campsite types', () => {
      const types = Object.keys(TYPE_LABELS);
      expect(types).toHaveLength(6);
      CAMPSITE_TYPES.forEach((type) => {
        expect(types).toContain(type);
      });
    });

    it('should have non-empty labels for each type', () => {
      CAMPSITE_TYPES.forEach((type) => {
        expect(TYPE_LABELS[type]).toBeDefined();
        expect(TYPE_LABELS[type].length).toBeGreaterThan(0);
      });
    });
  });

  describe('THAILAND_CENTER', () => {
    it('should have valid latitude for Thailand', () => {
      expect(THAILAND_CENTER.lat).toBeDefined();
      expect(typeof THAILAND_CENTER.lat).toBe('number');
      // Thailand latitude range: approximately 5.6 to 20.5
      expect(THAILAND_CENTER.lat).toBeGreaterThanOrEqual(5);
      expect(THAILAND_CENTER.lat).toBeLessThanOrEqual(21);
    });

    it('should have valid longitude for Thailand', () => {
      expect(THAILAND_CENTER.lng).toBeDefined();
      expect(typeof THAILAND_CENTER.lng).toBe('number');
      // Thailand longitude range: approximately 97.3 to 105.6
      expect(THAILAND_CENTER.lng).toBeGreaterThanOrEqual(97);
      expect(THAILAND_CENTER.lng).toBeLessThanOrEqual(106);
    });

    it('should be close to Bangkok coordinates', () => {
      // Bangkok is at approximately 13.7563°N, 100.5018°E
      expect(THAILAND_CENTER.lat).toBeCloseTo(13.7563, 1);
      expect(THAILAND_CENTER.lng).toBeCloseTo(100.5018, 1);
    });
  });

  describe('MAP_ZOOM', () => {
    it('should have default zoom in reasonable range', () => {
      expect(MAP_ZOOM.DEFAULT).toBeDefined();
      expect(typeof MAP_ZOOM.DEFAULT).toBe('number');
      // Reasonable zoom for country view: 5-8
      expect(MAP_ZOOM.DEFAULT).toBeGreaterThanOrEqual(5);
      expect(MAP_ZOOM.DEFAULT).toBeLessThanOrEqual(8);
    });

    it('should have province zoom in reasonable range', () => {
      expect(MAP_ZOOM.PROVINCE).toBeDefined();
      expect(typeof MAP_ZOOM.PROVINCE).toBe('number');
      // Reasonable zoom for province view: 8-11
      expect(MAP_ZOOM.PROVINCE).toBeGreaterThanOrEqual(8);
      expect(MAP_ZOOM.PROVINCE).toBeLessThanOrEqual(11);
    });

    it('should have campsite zoom in reasonable range', () => {
      expect(MAP_ZOOM.CAMPSITE).toBeDefined();
      expect(typeof MAP_ZOOM.CAMPSITE).toBe('number');
      // Reasonable zoom for campsite detail: 12-16
      expect(MAP_ZOOM.CAMPSITE).toBeGreaterThanOrEqual(12);
      expect(MAP_ZOOM.CAMPSITE).toBeLessThanOrEqual(16);
    });

    it('should have min and max zoom levels', () => {
      expect(MAP_ZOOM.MIN).toBeDefined();
      expect(MAP_ZOOM.MAX).toBeDefined();
      expect(MAP_ZOOM.MIN).toBeLessThan(MAP_ZOOM.MAX);
    });

    it('should have zoom levels in logical order', () => {
      expect(MAP_ZOOM.DEFAULT).toBeLessThan(MAP_ZOOM.PROVINCE);
      expect(MAP_ZOOM.PROVINCE).toBeLessThan(MAP_ZOOM.CAMPSITE);
      expect(MAP_ZOOM.MIN).toBeLessThanOrEqual(MAP_ZOOM.DEFAULT);
      expect(MAP_ZOOM.CAMPSITE).toBeLessThanOrEqual(MAP_ZOOM.MAX);
    });
  });

  describe('CLUSTER_CONFIG', () => {
    it('should have maxClusterRadius defined', () => {
      expect(CLUSTER_CONFIG.maxClusterRadius).toBeDefined();
      expect(typeof CLUSTER_CONFIG.maxClusterRadius).toBe('number');
      expect(CLUSTER_CONFIG.maxClusterRadius).toBeGreaterThan(0);
    });

    it('should have boolean flags defined', () => {
      expect(typeof CLUSTER_CONFIG.spiderfyOnMaxZoom).toBe('boolean');
      expect(typeof CLUSTER_CONFIG.showCoverageOnHover).toBe('boolean');
      expect(typeof CLUSTER_CONFIG.zoomToBoundsOnClick).toBe('boolean');
    });

    it('should have disableClusteringAtZoom defined', () => {
      expect(CLUSTER_CONFIG.disableClusteringAtZoom).toBeDefined();
      expect(typeof CLUSTER_CONFIG.disableClusteringAtZoom).toBe('number');
      expect(CLUSTER_CONFIG.disableClusteringAtZoom).toBeGreaterThan(0);
      expect(CLUSTER_CONFIG.disableClusteringAtZoom).toBeLessThanOrEqual(20);
    });
  });

  describe('MARKER_ICONS', () => {
    it('should have all campsite types', () => {
      const types = Object.keys(MARKER_ICONS);
      expect(types).toHaveLength(6);
      CAMPSITE_TYPES.forEach((type) => {
        expect(types).toContain(type);
      });
    });

    it('should have non-empty icons for each type', () => {
      CAMPSITE_TYPES.forEach((type) => {
        expect(MARKER_ICONS[type]).toBeDefined();
        expect(MARKER_ICONS[type].length).toBeGreaterThan(0);
      });
    });
  });
});
