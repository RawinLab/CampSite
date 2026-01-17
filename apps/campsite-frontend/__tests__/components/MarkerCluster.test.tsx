import { renderHook } from '@testing-library/react';
import { MarkerCluster } from '@/components/map/MarkerCluster';
import type { MapCampsite } from '@campsite/shared';
import L from 'leaflet';

// Mock leaflet and react-leaflet
const createMockMarker = () => ({
  bindPopup: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
});

const createMockMarkerClusterGroup = () => ({
  addLayer: jest.fn(),
  clearLayers: jest.fn(),
  getChildCount: jest.fn(),
});

let mockMarkerClusterGroup: ReturnType<typeof createMockMarkerClusterGroup>;

jest.mock('leaflet', () => ({
  marker: jest.fn(() => createMockMarker()),
  divIcon: jest.fn((options) => ({ options })),
  point: jest.fn((x, y) => ({ x, y })),
  markerClusterGroup: jest.fn((config) => {
    mockMarkerClusterGroup = createMockMarkerClusterGroup();
    return mockMarkerClusterGroup;
  }),
  MarkerClusterGroup: jest.fn(),
}));

jest.mock('react-leaflet', () => ({
  useMap: jest.fn(),
}));

jest.mock('leaflet.markercluster', () => ({}));

jest.mock('@/lib/constants/mapTheme', () => ({
  MARKER_COLORS: {
    camping: '#22c55e',
    glamping: '#8b5cf6',
    'tented-resort': '#f97316',
    bungalow: '#3b82f6',
    cabin: '#854d0e',
    'rv-caravan': '#0891b2',
  },
  MARKER_ICONS: {
    camping: '⛺',
    glamping: '🏕️',
    'tented-resort': '🏖️',
    bungalow: '🏠',
    cabin: '🏡',
    'rv-caravan': '🚐',
  },
  CLUSTER_CONFIG: {
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: 15,
  },
}));

jest.mock('@/components/map/MapInfoWindow', () => ({
  generatePopupHTML: jest.fn((campsite) => `<div>Popup for ${campsite.name}</div>`),
}));

import { useMap } from 'react-leaflet';
import { generatePopupHTML } from '@/components/map/MapInfoWindow';

describe('MarkerCluster', () => {
  const mockMap = {
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
  };

  const mockCampsites: MapCampsite[] = [
    {
      id: 'camp-001',
      name: 'Mountain View Camping',
      campsite_type: 'camping',
      latitude: 18.7883,
      longitude: 98.9853,
      province_name_en: 'Chiang Mai',
      min_price: 500,
      average_rating: 4.5,
      review_count: 120,
      primary_photo_url: 'https://example.com/photo1.jpg',
    },
    {
      id: 'camp-002',
      name: 'Luxury Glamping Resort',
      campsite_type: 'glamping',
      latitude: 18.7900,
      longitude: 98.9870,
      province_name_en: 'Chiang Mai',
      min_price: 2000,
      average_rating: 4.8,
      review_count: 85,
      primary_photo_url: 'https://example.com/photo2.jpg',
    },
    {
      id: 'camp-003',
      name: 'Beachside Bungalow',
      campsite_type: 'bungalow',
      latitude: 7.8804,
      longitude: 98.3923,
      province_name_en: 'Phuket',
      min_price: 1500,
      average_rating: 4.2,
      review_count: 65,
      primary_photo_url: 'https://example.com/photo3.jpg',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useMap as jest.Mock).mockReturnValue(mockMap);
  });

  describe('Component Rendering', () => {
    it('renders without errors', () => {
      const { result } = renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      expect(result.error).toBeUndefined();
    });

    it('returns null (no direct render)', () => {
      const { result } = renderHook(() => {
        return MarkerCluster({ campsites: mockCampsites });
      });

      expect(result.current).toBeNull();
    });

    it('creates marker cluster group on mount', () => {
      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      expect(L.markerClusterGroup).toHaveBeenCalled();
    });

    it('adds cluster group to map', () => {
      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      expect(mockMap.addLayer).toHaveBeenCalled();
    });
  });

  describe('Cluster Configuration', () => {
    it('configures cluster with correct settings', () => {
      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      expect(L.markerClusterGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          disableClusteringAtZoom: 15,
        })
      );
    });

    it('includes iconCreateFunction in configuration', () => {
      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      const config = (L.markerClusterGroup as jest.Mock).mock.calls[0][0];
      expect(config.iconCreateFunction).toBeDefined();
      expect(typeof config.iconCreateFunction).toBe('function');
    });

    it('configures cluster to zoom to bounds on click', () => {
      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      const config = (L.markerClusterGroup as jest.Mock).mock.calls[0][0];
      expect(config.zoomToBoundsOnClick).toBe(true);
    });

    it('configures cluster to spiderfy on max zoom', () => {
      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      const config = (L.markerClusterGroup as jest.Mock).mock.calls[0][0];
      expect(config.spiderfyOnMaxZoom).toBe(true);
    });
  });

  describe('Cluster Icon Creation', () => {
    it('creates small cluster icon for less than 10 markers', () => {
      const mockCluster = {
        getChildCount: jest.fn().mockReturnValue(5),
      };

      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      const config = (L.markerClusterGroup as jest.Mock).mock.calls[0][0];
      const icon = config.iconCreateFunction(mockCluster);

      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<div><span>5</span></div>',
          className: 'marker-cluster marker-cluster-small',
        })
      );
    });

    it('creates medium cluster icon for 10-99 markers', () => {
      const mockCluster = {
        getChildCount: jest.fn().mockReturnValue(50),
      };

      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      const config = (L.markerClusterGroup as jest.Mock).mock.calls[0][0];
      config.iconCreateFunction(mockCluster);

      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<div><span>50</span></div>',
          className: 'marker-cluster marker-cluster-medium',
        })
      );
    });

    it('creates large cluster icon for 100+ markers', () => {
      const mockCluster = {
        getChildCount: jest.fn().mockReturnValue(150),
      };

      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      const config = (L.markerClusterGroup as jest.Mock).mock.calls[0][0];
      config.iconCreateFunction(mockCluster);

      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<div><span>150</span></div>',
          className: 'marker-cluster marker-cluster-large',
        })
      );
    });

    it('sets correct icon size for cluster', () => {
      const mockCluster = {
        getChildCount: jest.fn().mockReturnValue(25),
      };

      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      const config = (L.markerClusterGroup as jest.Mock).mock.calls[0][0];
      config.iconCreateFunction(mockCluster);

      expect(L.point).toHaveBeenCalledWith(46, 46);
      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          iconSize: { x: 46, y: 46 },
        })
      );
    });

    it('displays correct count in cluster icon', () => {
      const mockCluster = {
        getChildCount: jest.fn().mockReturnValue(75),
      };

      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      const config = (L.markerClusterGroup as jest.Mock).mock.calls[0][0];
      config.iconCreateFunction(mockCluster);

      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          html: '<div><span>75</span></div>',
        })
      );
    });
  });

  describe('Marker Creation and Grouping', () => {
    it('creates marker for each campsite', () => {
      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      expect(L.marker).toHaveBeenCalledTimes(3);
    });

    it('creates markers with correct coordinates', () => {
      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      expect(L.marker).toHaveBeenCalledWith([18.7883, 98.9853], expect.any(Object));
      expect(L.marker).toHaveBeenCalledWith([18.7900, 98.9870], expect.any(Object));
      expect(L.marker).toHaveBeenCalledWith([7.8804, 98.3923], expect.any(Object));
    });

    it('adds all markers to cluster group', () => {
      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      expect(mockMarkerClusterGroup.addLayer).toHaveBeenCalledTimes(3);
    });

    it('groups nearby markers (Chiang Mai campsites)', () => {
      const nearbyCampsites = mockCampsites.filter(
        (c) => c.province_name_en === 'Chiang Mai'
      );

      renderHook(() => {
        MarkerCluster({ campsites: nearbyCampsites });
      });

      expect(L.marker).toHaveBeenCalledTimes(2);
      expect(L.marker).toHaveBeenCalledWith([18.7883, 98.9853], expect.any(Object));
      expect(L.marker).toHaveBeenCalledWith([18.7900, 98.9870], expect.any(Object));
    });

    it('handles empty campsites array', () => {
      renderHook(() => {
        MarkerCluster({ campsites: [] });
      });

      expect(L.marker).not.toHaveBeenCalled();
    });

    it('handles single campsite', () => {
      renderHook(() => {
        MarkerCluster({ campsites: [mockCampsites[0]] });
      });

      expect(L.marker).toHaveBeenCalledTimes(1);
    });
  });

  describe('Marker Icons and Styling', () => {
    it('creates custom marker icon with correct type color', () => {
      renderHook(() => {
        MarkerCluster({ campsites: [mockCampsites[0]] });
      });

      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          className: 'custom-marker',
          html: expect.stringContaining('background-color:#22c55e'),
        })
      );
    });

    it('creates marker icon with correct campsite type emoji', () => {
      renderHook(() => {
        MarkerCluster({ campsites: [mockCampsites[0]] });
      });

      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('⛺'),
        })
      );
    });

    it('applies correct CSS class for campsite type', () => {
      renderHook(() => {
        MarkerCluster({ campsites: [mockCampsites[1]] });
      });

      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('campsite-marker--glamping'),
        })
      );
    });

    it('sets correct icon size and anchors', () => {
      renderHook(() => {
        MarkerCluster({ campsites: [mockCampsites[0]] });
      });

      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        })
      );
    });

    it('creates different colored markers for different types', () => {
      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      const divIconCalls = (L.divIcon as jest.Mock).mock.calls;
      const markerCalls = divIconCalls.filter((call) => call[0].className === 'custom-marker');

      expect(markerCalls[0][0].html).toContain('#22c55e'); // camping - green
      expect(markerCalls[1][0].html).toContain('#8b5cf6'); // glamping - purple
      expect(markerCalls[2][0].html).toContain('#3b82f6'); // bungalow - blue
    });
  });

  describe('Popup Binding', () => {
    it('binds popup to each marker', () => {
      renderHook(() => {
        MarkerCluster({ campsites: [mockCampsites[0]] });
      });

      const mockMarker = (L.marker as jest.Mock).mock.results[0].value;
      expect(mockMarker.bindPopup).toHaveBeenCalled();
    });

    it('generates popup HTML for each campsite', () => {
      renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      expect(generatePopupHTML).toHaveBeenCalledTimes(3);
      expect(generatePopupHTML).toHaveBeenCalledWith(mockCampsites[0]);
      expect(generatePopupHTML).toHaveBeenCalledWith(mockCampsites[1]);
      expect(generatePopupHTML).toHaveBeenCalledWith(mockCampsites[2]);
    });

    it('configures popup with correct dimensions', () => {
      renderHook(() => {
        MarkerCluster({ campsites: [mockCampsites[0]] });
      });

      const mockMarker = (L.marker as jest.Mock).mock.results[0].value;
      expect(mockMarker.bindPopup).toHaveBeenCalledWith(
        expect.any(String),
        {
          maxWidth: 320,
          minWidth: 280,
        }
      );
    });
  });

  describe('Click Handlers', () => {
    it('attaches click handler when onMarkerClick provided', () => {
      const onMarkerClick = jest.fn();

      renderHook(() => {
        MarkerCluster({ campsites: [mockCampsites[0]], onMarkerClick });
      });

      const mockMarker = (L.marker as jest.Mock).mock.results[0].value;
      expect(mockMarker.on).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('does not attach click handler when onMarkerClick not provided', () => {
      renderHook(() => {
        MarkerCluster({ campsites: [mockCampsites[0]] });
      });

      const mockMarker = (L.marker as jest.Mock).mock.results[0].value;
      expect(mockMarker.on).not.toHaveBeenCalled();
    });

    it('calls onMarkerClick with correct campsite on marker click', () => {
      const onMarkerClick = jest.fn();

      renderHook(() => {
        MarkerCluster({ campsites: [mockCampsites[0]], onMarkerClick });
      });

      const mockMarker = (L.marker as jest.Mock).mock.results[0].value;
      const clickHandler = mockMarker.on.mock.calls[0][1];
      clickHandler();

      expect(onMarkerClick).toHaveBeenCalledWith(mockCampsites[0]);
    });
  });

  describe('Marker Updates', () => {
    it('clears existing markers when campsites change', () => {
      const { rerender } = renderHook(
        ({ campsites }) => {
          MarkerCluster({ campsites });
        },
        { initialProps: { campsites: mockCampsites } }
      );

      rerender({ campsites: [mockCampsites[0]] });

      expect(mockMarkerClusterGroup.clearLayers).toHaveBeenCalled();
    });

    it('recreates markers when campsites prop changes', () => {
      const { rerender } = renderHook(
        ({ campsites }) => {
          MarkerCluster({ campsites });
        },
        { initialProps: { campsites: mockCampsites } }
      );

      jest.clearAllMocks();

      rerender({ campsites: [mockCampsites[0]] });

      expect(L.marker).toHaveBeenCalledTimes(1);
    });

    it('handles adding new campsites', () => {
      const { rerender } = renderHook(
        ({ campsites }) => {
          MarkerCluster({ campsites });
        },
        { initialProps: { campsites: [mockCampsites[0]] } }
      );

      jest.clearAllMocks();

      rerender({ campsites: mockCampsites });

      expect(L.marker).toHaveBeenCalledTimes(3);
    });

    it('handles removing campsites', () => {
      const { rerender } = renderHook(
        ({ campsites }) => {
          MarkerCluster({ campsites });
        },
        { initialProps: { campsites: mockCampsites } }
      );

      jest.clearAllMocks();

      rerender({ campsites: [] });

      expect(L.marker).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup and Unmount', () => {
    it('clears layers on cleanup', () => {
      const { unmount } = renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      unmount();

      expect(mockMarkerClusterGroup.clearLayers).toHaveBeenCalled();
    });

    it('removes cluster group from map on unmount', () => {
      const { unmount } = renderHook(() => {
        MarkerCluster({ campsites: mockCampsites });
      });

      unmount();

      expect(mockMap.removeLayer).toHaveBeenCalledWith(mockMarkerClusterGroup);
    });

    it('does not throw when unmounting with no cluster group', () => {
      const { unmount } = renderHook(() => {
        MarkerCluster({ campsites: [] });
      });

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles campsites with missing coordinates gracefully', () => {
      const invalidCampsite = {
        ...mockCampsites[0],
        latitude: 0,
        longitude: 0,
      };

      renderHook(() => {
        MarkerCluster({ campsites: [invalidCampsite] });
      });

      expect(L.marker).toHaveBeenCalledWith([0, 0], expect.any(Object));
    });

    it('handles negative coordinates correctly', () => {
      const negativeCampsite = {
        ...mockCampsites[0],
        latitude: -18.7883,
        longitude: -98.9853,
      };

      renderHook(() => {
        MarkerCluster({ campsites: [negativeCampsite] });
      });

      expect(L.marker).toHaveBeenCalledWith([-18.7883, -98.9853], expect.any(Object));
    });

    it('handles very large number of campsites', () => {
      const manyCampsites = Array.from({ length: 1000 }, (_, i) => ({
        ...mockCampsites[0],
        id: `camp-${i}`,
        name: `Campsite ${i}`,
        latitude: 18.7883 + i * 0.01,
        longitude: 98.9853 + i * 0.01,
      }));

      renderHook(() => {
        MarkerCluster({ campsites: manyCampsites });
      });

      expect(L.marker).toHaveBeenCalledTimes(1000);
    });

    it('handles rapid campsite updates', () => {
      const { rerender } = renderHook(
        ({ campsites }) => {
          MarkerCluster({ campsites });
        },
        { initialProps: { campsites: mockCampsites } }
      );

      for (let i = 0; i < 10; i++) {
        rerender({ campsites: mockCampsites.slice(0, i % 3) });
      }

      expect(L.marker).toHaveBeenCalled();
    });

    it('maintains cluster group reference across updates', () => {
      const { rerender } = renderHook(
        ({ campsites }) => {
          MarkerCluster({ campsites });
        },
        { initialProps: { campsites: mockCampsites } }
      );

      const initialCallCount = (L.markerClusterGroup as jest.Mock).mock.calls.length;

      rerender({ campsites: [mockCampsites[0]] });
      rerender({ campsites: mockCampsites });

      expect((L.markerClusterGroup as jest.Mock).mock.calls.length).toBe(initialCallCount);
    });
  });
});
