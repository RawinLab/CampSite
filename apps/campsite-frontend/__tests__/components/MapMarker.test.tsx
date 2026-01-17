import { render } from '@testing-library/react';
import { MapMarker, createMarkerIcon } from '@/components/map/MapMarker';
import { MARKER_COLORS } from '@/lib/constants/mapTheme';
import type { MapCampsite } from '@campsite/shared';

// Mock Leaflet
jest.mock('leaflet', () => ({
  divIcon: jest.fn((options) => ({
    options,
    _iconUrl: null,
  })),
}));

// Mock react-leaflet
jest.mock('react-leaflet', () => ({
  Marker: ({ children, eventHandlers, icon }: any) => {
    return (
      <div
        data-testid="marker"
        onClick={eventHandlers?.click}
        data-icon={JSON.stringify(icon)}
      >
        {children}
      </div>
    );
  },
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
}));

// Mock MapInfoWindow
jest.mock('@/components/map/MapInfoWindow', () => ({
  generatePopupHTML: jest.fn((campsite) => `<div>${campsite.name}</div>`),
}));

describe('MapMarker Component', () => {
  const mockCampsite: MapCampsite = {
    id: '1',
    name: 'Test Campsite',
    campsite_type: 'camping',
    latitude: 13.7563,
    longitude: 100.5018,
    province: 'Bangkok',
    price_per_night: 500,
    average_rating: 4.5,
    total_reviews: 10,
  };

  describe('Marker color rendering by type', () => {
    it('renders marker with correct color for "camping" type', () => {
      const icon = createMarkerIcon('camping');
      expect(icon.options.html).toContain(MARKER_COLORS.camping);
      expect(icon.options.html).toContain('#22c55e');
      expect(icon.options.html).toContain('campsite-marker--camping');
    });

    it('renders marker with correct color for "glamping" type', () => {
      const icon = createMarkerIcon('glamping');
      expect(icon.options.html).toContain(MARKER_COLORS.glamping);
      expect(icon.options.html).toContain('#8b5cf6');
      expect(icon.options.html).toContain('campsite-marker--glamping');
    });

    it('renders marker with correct color for "tented-resort" type', () => {
      const icon = createMarkerIcon('tented-resort');
      expect(icon.options.html).toContain(MARKER_COLORS['tented-resort']);
      expect(icon.options.html).toContain('#f97316');
      expect(icon.options.html).toContain('campsite-marker--tented-resort');
    });

    it('renders marker with correct color for "bungalow" type', () => {
      const icon = createMarkerIcon('bungalow');
      expect(icon.options.html).toContain(MARKER_COLORS.bungalow);
      expect(icon.options.html).toContain('#3b82f6');
      expect(icon.options.html).toContain('campsite-marker--bungalow');
    });
  });

  describe('Marker icon properties', () => {
    it('creates marker icon with correct iconSize', () => {
      const icon = createMarkerIcon('camping');
      expect(icon.options.iconSize).toEqual([32, 32]);
    });

    it('creates marker icon with correct iconAnchor', () => {
      const icon = createMarkerIcon('camping');
      expect(icon.options.iconAnchor).toEqual([16, 32]);
    });

    it('creates marker icon with correct popupAnchor', () => {
      const icon = createMarkerIcon('camping');
      expect(icon.options.popupAnchor).toEqual([0, -32]);
    });

    it('creates marker icon with custom-marker className', () => {
      const icon = createMarkerIcon('camping');
      expect(icon.options.className).toBe('custom-marker');
    });

    it('includes emoji icon in marker HTML', () => {
      const icon = createMarkerIcon('camping');
      expect(icon.options.html).toContain('⛺');
    });
  });

  describe('MapMarker component rendering', () => {
    it('renders marker at correct position', () => {
      const { container } = render(
        <MapMarker campsite={mockCampsite} />
      );
      const marker = container.querySelector('[data-testid="marker"]');
      expect(marker).toBeInTheDocument();
    });

    it('renders popup with campsite information', () => {
      const { container } = render(
        <MapMarker campsite={mockCampsite} />
      );
      const popup = container.querySelector('[data-testid="popup"]');
      expect(popup).toBeInTheDocument();
      expect(popup?.textContent).toContain('Test Campsite');
    });

    it('uses correct icon for campsite type', () => {
      const { container } = render(
        <MapMarker campsite={mockCampsite} />
      );
      const marker = container.querySelector('[data-testid="marker"]');
      const iconData = marker?.getAttribute('data-icon');
      expect(iconData).toBeTruthy();
      if (iconData) {
        const icon = JSON.parse(iconData);
        expect(icon.options.html).toContain(MARKER_COLORS.camping);
      }
    });
  });

  describe('Marker click handler', () => {
    it('calls onClick handler when marker is clicked', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <MapMarker campsite={mockCampsite} onClick={handleClick} />
      );

      const marker = container.querySelector('[data-testid="marker"]');
      marker?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(mockCampsite);
    });

    it('does not throw error when onClick is not provided', () => {
      const { container } = render(
        <MapMarker campsite={mockCampsite} />
      );

      const marker = container.querySelector('[data-testid="marker"]');
      expect(() => {
        marker?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }).not.toThrow();
    });
  });

  describe('Different campsite types', () => {
    it('renders glamping campsite with purple marker', () => {
      const glampingCampsite = { ...mockCampsite, campsite_type: 'glamping' as const };
      const { container } = render(<MapMarker campsite={glampingCampsite} />);

      const marker = container.querySelector('[data-testid="marker"]');
      const iconData = marker?.getAttribute('data-icon');
      expect(iconData).toBeTruthy();
      if (iconData) {
        const icon = JSON.parse(iconData);
        expect(icon.options.html).toContain('#8b5cf6');
      }
    });

    it('renders tented-resort campsite with orange marker', () => {
      const tentedResortCampsite = { ...mockCampsite, campsite_type: 'tented-resort' as const };
      const { container } = render(<MapMarker campsite={tentedResortCampsite} />);

      const marker = container.querySelector('[data-testid="marker"]');
      const iconData = marker?.getAttribute('data-icon');
      expect(iconData).toBeTruthy();
      if (iconData) {
        const icon = JSON.parse(iconData);
        expect(icon.options.html).toContain('#f97316');
      }
    });

    it('renders bungalow campsite with blue marker', () => {
      const bungalowCampsite = { ...mockCampsite, campsite_type: 'bungalow' as const };
      const { container } = render(<MapMarker campsite={bungalowCampsite} />);

      const marker = container.querySelector('[data-testid="marker"]');
      const iconData = marker?.getAttribute('data-icon');
      expect(iconData).toBeTruthy();
      if (iconData) {
        const icon = JSON.parse(iconData);
        expect(icon.options.html).toContain('#3b82f6');
      }
    });
  });

  describe('Icon memoization', () => {
    it('memoizes icon based on campsite type', () => {
      const { rerender } = render(<MapMarker campsite={mockCampsite} />);
      const icon1 = createMarkerIcon(mockCampsite.campsite_type);

      // Rerender with same campsite type
      rerender(<MapMarker campsite={mockCampsite} />);
      const icon2 = createMarkerIcon(mockCampsite.campsite_type);

      expect(icon1.options.html).toBe(icon2.options.html);
    });

    it('creates new icon when campsite type changes', () => {
      const { rerender } = render(<MapMarker campsite={mockCampsite} />);
      const icon1 = createMarkerIcon('camping');

      const glampingCampsite = { ...mockCampsite, campsite_type: 'glamping' as const };
      rerender(<MapMarker campsite={glampingCampsite} />);
      const icon2 = createMarkerIcon('glamping');

      expect(icon1.options.html).not.toBe(icon2.options.html);
    });
  });
});
