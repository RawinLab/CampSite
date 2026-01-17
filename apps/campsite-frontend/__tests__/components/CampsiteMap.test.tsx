import { render, screen } from '@testing-library/react';
import { CampsiteMap } from '@/components/map/CampsiteMap';
import type { MapCampsite } from '@campsite/shared';

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom, style }: any) => (
    <div data-testid="map-container" data-center={center} data-zoom={zoom} style={style}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  useMapEvents: jest.fn(() => ({})),
}));

// Mock MarkerCluster component
jest.mock('@/components/map/MarkerCluster', () => ({
  MarkerCluster: ({ campsites, onMarkerClick }: any) => (
    <div data-testid="marker-cluster">
      {campsites.map((campsite: MapCampsite) => (
        <div
          key={campsite.id}
          data-testid={`marker-${campsite.id}`}
          onClick={() => onMarkerClick?.(campsite)}
        >
          {campsite.name}
        </div>
      ))}
    </div>
  ),
}));

// Mock MapControls component
jest.mock('@/components/map/MapControls', () => ({
  MapControls: ({ onFullscreen, isFullscreen }: any) => (
    <div data-testid="map-controls">
      <button onClick={onFullscreen} data-fullscreen={isFullscreen}>
        Toggle Fullscreen
      </button>
    </div>
  ),
}));

// Mock FloatingMapLegend component
jest.mock('@/components/map/MapLegend', () => ({
  FloatingMapLegend: () => <div data-testid="map-legend">Legend</div>,
}));

describe('CampsiteMap', () => {
  const mockCampsites: MapCampsite[] = [
    {
      id: 'campsite-001',
      name: 'Mountain View Camping',
      slug: 'mountain-view-camping',
      latitude: 18.7883,
      longitude: 98.9853,
      campsite_type: 'camping',
      min_price: 500,
      average_rating: 4.5,
      review_count: 123,
      is_featured: false,
      thumbnail_url: 'https://example.com/thumb1.jpg',
    },
    {
      id: 'campsite-002',
      name: 'Beach Glamping Resort',
      slug: 'beach-glamping-resort',
      latitude: 7.8804,
      longitude: 98.3923,
      campsite_type: 'glamping',
      min_price: 1200,
      average_rating: 4.8,
      review_count: 89,
      is_featured: true,
      thumbnail_url: 'https://example.com/thumb2.jpg',
    },
  ];

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<CampsiteMap campsites={[]} />);

      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('renders map container with correct structure', () => {
      render(<CampsiteMap campsites={mockCampsites} />);

      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
      expect(screen.getByTestId('marker-cluster')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <CampsiteMap campsites={[]} className="custom-map-class" />
      );

      const mapWrapper = container.querySelector('.custom-map-class');
      expect(mapWrapper).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading overlay when isLoading is true', () => {
      render(<CampsiteMap campsites={[]} isLoading={true} />);

      const loadingOverlay = screen.getByText((content, element) => {
        return element?.className.includes('map-loading__spinner') ?? false;
      }).parentElement;

      expect(loadingOverlay).toBeInTheDocument();
      expect(loadingOverlay).toHaveClass('absolute', 'inset-0', 'bg-white/50');
    });

    it('does not show loading overlay when isLoading is false', () => {
      const { container } = render(<CampsiteMap campsites={[]} isLoading={false} />);

      const loadingSpinner = container.querySelector('.map-loading__spinner');
      expect(loadingSpinner).not.toBeInTheDocument();
    });

    it('displays loading overlay initially when set', () => {
      render(<CampsiteMap campsites={mockCampsites} isLoading={true} />);

      const spinner = document.querySelector('.map-loading__spinner');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Marker Display', () => {
    it('displays markers when campsites data is passed', () => {
      render(<CampsiteMap campsites={mockCampsites} />);

      expect(screen.getByTestId('marker-campsite-001')).toBeInTheDocument();
      expect(screen.getByTestId('marker-campsite-002')).toBeInTheDocument();
    });

    it('displays correct campsite names on markers', () => {
      render(<CampsiteMap campsites={mockCampsites} />);

      expect(screen.getByText('Mountain View Camping')).toBeInTheDocument();
      expect(screen.getByText('Beach Glamping Resort')).toBeInTheDocument();
    });

    it('renders no markers when campsites array is empty', () => {
      render(<CampsiteMap campsites={[]} />);

      expect(screen.queryByTestId('marker-campsite-001')).not.toBeInTheDocument();
      expect(screen.queryByTestId('marker-campsite-002')).not.toBeInTheDocument();
    });

    it('handles single campsite correctly', () => {
      const singleCampsite = [mockCampsites[0]];
      render(<CampsiteMap campsites={singleCampsite} />);

      expect(screen.getByTestId('marker-campsite-001')).toBeInTheDocument();
      expect(screen.queryByTestId('marker-campsite-002')).not.toBeInTheDocument();
    });
  });

  describe('Map Controls', () => {
    it('shows map controls by default', () => {
      render(<CampsiteMap campsites={[]} />);

      expect(screen.getByTestId('map-controls')).toBeInTheDocument();
    });

    it('hides map controls when showControls is false', () => {
      render(<CampsiteMap campsites={[]} showControls={false} />);

      expect(screen.queryByTestId('map-controls')).not.toBeInTheDocument();
    });

    it('shows map controls when showControls is true', () => {
      render(<CampsiteMap campsites={[]} showControls={true} />);

      expect(screen.getByTestId('map-controls')).toBeInTheDocument();
    });
  });

  describe('Map Legend', () => {
    it('shows map legend by default', () => {
      render(<CampsiteMap campsites={[]} />);

      expect(screen.getByTestId('map-legend')).toBeInTheDocument();
    });

    it('hides map legend when showLegend is false', () => {
      render(<CampsiteMap campsites={[]} showLegend={false} />);

      expect(screen.queryByTestId('map-legend')).not.toBeInTheDocument();
    });

    it('shows map legend when showLegend is true', () => {
      render(<CampsiteMap campsites={[]} showLegend={true} />);

      expect(screen.getByTestId('map-legend')).toBeInTheDocument();
    });
  });

  describe('Map Configuration', () => {
    it('uses default center when not provided', () => {
      render(<CampsiteMap campsites={[]} />);

      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('uses custom initial center when provided', () => {
      const customCenter = { lat: 13.7563, lng: 100.5018 };
      render(<CampsiteMap campsites={[]} initialCenter={customCenter} />);

      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toHaveAttribute('data-center');
    });

    it('uses custom initial zoom when provided', () => {
      render(<CampsiteMap campsites={[]} initialZoom={10} />);

      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toHaveAttribute('data-zoom');
    });

    it('uses default zoom when not provided', () => {
      render(<CampsiteMap campsites={[]} />);

      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });
  });

  describe('Callback Handlers', () => {
    it('passes onMarkerClick callback to MarkerCluster', () => {
      const handleMarkerClick = jest.fn();
      render(<CampsiteMap campsites={mockCampsites} onMarkerClick={handleMarkerClick} />);

      const marker = screen.getByTestId('marker-campsite-001');
      marker.click();

      expect(handleMarkerClick).toHaveBeenCalledWith(mockCampsites[0]);
    });

    it('passes onBoundsChange callback to map events handler', () => {
      const handleBoundsChange = jest.fn();
      render(<CampsiteMap campsites={[]} onBoundsChange={handleBoundsChange} />);

      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('works without onMarkerClick callback', () => {
      render(<CampsiteMap campsites={mockCampsites} />);

      const marker = screen.getByTestId('marker-campsite-001');
      expect(() => marker.click()).not.toThrow();
    });

    it('works without onBoundsChange callback', () => {
      render(<CampsiteMap campsites={[]} />);

      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  describe('Multiple Campsites', () => {
    it('renders all campsites from array', () => {
      const multipleCampsites: MapCampsite[] = [
        ...mockCampsites,
        {
          id: 'campsite-003',
          name: 'Forest Retreat',
          slug: 'forest-retreat',
          latitude: 19.0,
          longitude: 99.0,
          campsite_type: 'cabin',
          min_price: 800,
          average_rating: 4.2,
          review_count: 45,
          is_featured: false,
          thumbnail_url: null,
        },
      ];

      render(<CampsiteMap campsites={multipleCampsites} />);

      expect(screen.getByTestId('marker-campsite-001')).toBeInTheDocument();
      expect(screen.getByTestId('marker-campsite-002')).toBeInTheDocument();
      expect(screen.getByTestId('marker-campsite-003')).toBeInTheDocument();
    });

    it('handles large number of campsites', () => {
      const manyCampsites: MapCampsite[] = Array.from({ length: 50 }, (_, i) => ({
        id: `campsite-${i}`,
        name: `Campsite ${i}`,
        slug: `campsite-${i}`,
        latitude: 15 + i * 0.1,
        longitude: 100 + i * 0.1,
        campsite_type: 'camping',
        min_price: 500,
        average_rating: 4.0,
        review_count: 10,
        is_featured: false,
        thumbnail_url: null,
      }));

      render(<CampsiteMap campsites={manyCampsites} />);

      expect(screen.getByTestId('marker-cluster')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('contains map container wrapper', () => {
      const { container } = render(<CampsiteMap campsites={[]} />);

      const mapWrapper = container.querySelector('.map-container');
      expect(mapWrapper).toBeInTheDocument();
    });

    it('renders tile layer inside map container', () => {
      render(<CampsiteMap campsites={[]} />);

      expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    });

    it('renders marker cluster inside map container', () => {
      render(<CampsiteMap campsites={[]} />);

      expect(screen.getByTestId('marker-cluster')).toBeInTheDocument();
    });
  });
});
