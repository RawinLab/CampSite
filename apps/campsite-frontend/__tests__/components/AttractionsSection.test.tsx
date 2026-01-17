import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AttractionsSection } from '@/components/campsite/AttractionsSection';
import type { NearbyAttraction } from '@campsite/shared';

// Mock fetch globally
global.fetch = jest.fn();

describe('AttractionsSection', () => {
  const mockCampsiteId = 'test-campsite-123';
  const mockCampsiteLocation = { lat: 13.7563, lng: 100.5018 };

  const mockAttractions: NearbyAttraction[] = [
    {
      id: '1',
      name: 'Doi Suthep',
      category: 'hiking',
      latitude: 18.8047,
      longitude: 98.9216,
      distance_km: 5.2,
      difficulty: 'moderate',
      description: 'Beautiful mountain trail with scenic views',
    },
    {
      id: '2',
      name: 'Mae Ya Waterfall',
      category: 'waterfall',
      latitude: 18.5402,
      longitude: 98.5291,
      distance_km: 12.8,
      description: 'Stunning waterfall in the national park',
    },
    {
      id: '3',
      name: 'Wat Phra That',
      category: 'temple',
      latitude: 18.8000,
      longitude: 98.9300,
      distance_km: 8.5,
      difficulty: 'easy',
      description: 'Ancient temple with golden pagoda',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ attractions: mockAttractions }),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Section Title and Distance', () => {
    it('renders section title "Nearby Attractions"', async () => {
      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Nearby Attractions')).toBeInTheDocument();
      });
    });

    it('displays maximum distance in kilometers', async () => {
      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
          maxDistanceKm={25}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Within 25 km')).toBeInTheDocument();
      });
    });

    it('uses default maxDistanceKm of 20 when not provided', async () => {
      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Within 20 km')).toBeInTheDocument();
      });
    });
  });

  describe('Attraction Cards Display', () => {
    it('displays all attraction cards', async () => {
      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Doi Suthep')).toBeInTheDocument();
        expect(screen.getByText('Mae Ya Waterfall')).toBeInTheDocument();
        expect(screen.getByText('Wat Phra That')).toBeInTheDocument();
      });
    });

    it('displays attraction descriptions', async () => {
      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Beautiful mountain trail with scenic views')).toBeInTheDocument();
        expect(screen.getByText('Stunning waterfall in the national park')).toBeInTheDocument();
        expect(screen.getByText('Ancient temple with golden pagoda')).toBeInTheDocument();
      });
    });
  });

  describe('Distance Display', () => {
    it('shows distance in kilometers with one decimal place', async () => {
      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('5.2 km away')).toBeInTheDocument();
        expect(screen.getByText('12.8 km away')).toBeInTheDocument();
        expect(screen.getByText('8.5 km away')).toBeInTheDocument();
      });
    });
  });

  describe('Difficulty Level Display', () => {
    it('shows difficulty level for hiking trails', async () => {
      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Moderate')).toBeInTheDocument();
        expect(screen.getByText('Easy')).toBeInTheDocument();
      });
    });

    it('does not show difficulty badge when not provided', async () => {
      const attractionsWithoutDifficulty: NearbyAttraction[] = [
        {
          id: '1',
          name: 'Mae Ya Waterfall',
          category: 'waterfall',
          latitude: 18.5402,
          longitude: 98.5291,
          distance_km: 12.8,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ attractions: attractionsWithoutDifficulty }),
      });

      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Mae Ya Waterfall')).toBeInTheDocument();
      });

      expect(screen.queryByText('Easy')).not.toBeInTheDocument();
      expect(screen.queryByText('Moderate')).not.toBeInTheDocument();
      expect(screen.queryByText('Hard')).not.toBeInTheDocument();
    });
  });

  describe('Google Maps Directions Link', () => {
    it('renders directions link with coordinates', async () => {
      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        const directionLinks = screen.getAllByText('Directions');
        expect(directionLinks).toHaveLength(3);
      });

      const firstDirectionLink = screen.getAllByText('Directions')[0].closest('a');
      expect(firstDirectionLink).toHaveAttribute('href');
      expect(firstDirectionLink?.getAttribute('href')).toContain('google.com/maps');
      expect(firstDirectionLink).toHaveAttribute('target', '_blank');
      expect(firstDirectionLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('includes correct aria-label for accessibility', async () => {
      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Get directions to Doi Suthep')).toBeInTheDocument();
        expect(screen.getByLabelText('Get directions to Mae Ya Waterfall')).toBeInTheDocument();
        expect(screen.getByLabelText('Get directions to Wat Phra That')).toBeInTheDocument();
      });
    });

    it('does not render directions link when coordinates are missing', async () => {
      const attractionsWithoutCoordinates: NearbyAttraction[] = [
        {
          id: '1',
          name: 'Unknown Location',
          category: 'other',
          distance_km: 10.0,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ attractions: attractionsWithoutCoordinates }),
      });

      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Unknown Location')).toBeInTheDocument();
      });

      expect(screen.queryByText('Directions')).not.toBeInTheDocument();
    });
  });

  describe('Empty Attractions Array', () => {
    it('handles empty attractions array by not rendering section', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ attractions: [] }),
      });

      const { container } = render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('does not show "Nearby Attractions" title when empty', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ attractions: [] }),
      });

      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Nearby Attractions')).not.toBeInTheDocument();
      });
    });
  });

  describe('Categories Display', () => {
    it('displays category labels correctly', async () => {
      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Hiking Trail')).toBeInTheDocument();
        expect(screen.getByText('Waterfall')).toBeInTheDocument();
        expect(screen.getByText('Temple')).toBeInTheDocument();
      });
    });

    it('displays category filter buttons when multiple categories exist', async () => {
      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /All \(3\)/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Hiking Trail \(1\)/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Waterfall \(1\)/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Temple \(1\)/ })).toBeInTheDocument();
      });
    });

    it('does not display category filters when only one category exists', async () => {
      const singleCategoryAttractions: NearbyAttraction[] = [
        {
          id: '1',
          name: 'Waterfall 1',
          category: 'waterfall',
          latitude: 18.5402,
          longitude: 98.5291,
          distance_km: 5.0,
        },
        {
          id: '2',
          name: 'Waterfall 2',
          category: 'waterfall',
          latitude: 18.5500,
          longitude: 98.5300,
          distance_km: 6.0,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ attractions: singleCategoryAttractions }),
      });

      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Waterfall 1')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /All/ })).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton while fetching', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      // Should show loading skeletons (3 skeleton cards)
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('displays error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch attractions')).toBeInTheDocument();
      });
    });

    it('displays error message when network error occurs', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('calls API with correct campsite ID and parameters', async () => {
      render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
          maxDistanceKm={15}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/campsites/${mockCampsiteId}/attractions`)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('max_distance_km=15')
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=20')
        );
      });
    });
  });

  describe('Custom className', () => {
    it('applies custom className to section', async () => {
      const { container } = render(
        <AttractionsSection
          campsiteId={mockCampsiteId}
          campsiteLocation={mockCampsiteLocation}
          className="custom-test-class"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Nearby Attractions')).toBeInTheDocument();
      });

      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-test-class');
    });
  });
});
