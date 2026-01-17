import { render, screen } from '@testing-library/react';
import { AttractionCard } from '@/components/campsite/AttractionCard';
import type { NearbyAttraction } from '@campsite/shared';

describe('AttractionCard', () => {
  const mockAttraction: NearbyAttraction = {
    id: 'attr-001',
    campsite_id: 'campsite-001',
    name: 'Emerald Pool',
    description: 'Beautiful natural pool with crystal clear water',
    distance_km: 3.5,
    category: 'waterfall',
    difficulty: 'moderate',
    latitude: 7.9234,
    longitude: 99.2567,
    created_at: '2024-01-15T10:00:00Z',
  };

  const mockCampsiteLocation = {
    lat: 7.9100,
    lng: 99.2400,
  };

  describe('Attraction Name Display', () => {
    it('renders attraction name correctly', () => {
      render(<AttractionCard attraction={mockAttraction} />);

      expect(screen.getByText('Emerald Pool')).toBeInTheDocument();
    });

    it('displays name as h4 heading with correct styling', () => {
      const { container } = render(<AttractionCard attraction={mockAttraction} />);

      const heading = container.querySelector('h4.text-base.font-semibold.text-gray-900');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Emerald Pool');
    });

    it('truncates long attraction names', () => {
      const longNameAttraction: NearbyAttraction = {
        ...mockAttraction,
        name: 'Very Long Attraction Name That Should Be Truncated With Ellipsis',
      };

      const { container } = render(<AttractionCard attraction={longNameAttraction} />);

      const heading = container.querySelector('h4.truncate');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Distance Display', () => {
    it('displays distance correctly formatted to 1 decimal place', () => {
      render(<AttractionCard attraction={mockAttraction} />);

      expect(screen.getByText(/3.5 km away/)).toBeInTheDocument();
    });

    it('rounds distance to 1 decimal place', () => {
      const preciseDistanceAttraction: NearbyAttraction = {
        ...mockAttraction,
        distance_km: 2.456789,
      };

      render(<AttractionCard attraction={preciseDistanceAttraction} />);

      expect(screen.getByText(/2.5 km away/)).toBeInTheDocument();
    });

    it('displays distance less than 1 km correctly', () => {
      const nearbyAttraction: NearbyAttraction = {
        ...mockAttraction,
        distance_km: 0.5,
      };

      render(<AttractionCard attraction={nearbyAttraction} />);

      expect(screen.getByText(/0.5 km away/)).toBeInTheDocument();
    });

    it('displays distance with clock icon', () => {
      const { container } = render(<AttractionCard attraction={mockAttraction} />);

      // Find the distance section which contains the clock icon
      const distanceSection = screen.getByText(/km away/).parentElement;
      expect(distanceSection).toBeInTheDocument();

      // Check for clock icon SVG within the distance section
      const clockIcon = distanceSection?.querySelector('svg');
      expect(clockIcon).toBeInTheDocument();
      expect(clockIcon).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('Category Icon Display', () => {
    it('displays category icon for waterfall', () => {
      const { container } = render(<AttractionCard attraction={mockAttraction} />);

      const iconContainer = container.querySelector('.flex-shrink-0.w-10.h-10.rounded-full');
      expect(iconContainer).toBeInTheDocument();

      const categoryIcon = iconContainer?.querySelector('svg');
      expect(categoryIcon).toBeInTheDocument();
    });

    it('displays category icon with correct color for waterfall', () => {
      const { container } = render(<AttractionCard attraction={mockAttraction} />);

      const categoryIcon = container.querySelector('svg[stroke="#3b82f6"]');
      expect(categoryIcon).toBeInTheDocument();
    });

    it('displays category icon with correct color for hiking', () => {
      const hikingAttraction: NearbyAttraction = {
        ...mockAttraction,
        category: 'hiking',
      };

      const { container } = render(<AttractionCard attraction={hikingAttraction} />);

      const categoryIcon = container.querySelector('svg[stroke="#22c55e"]');
      expect(categoryIcon).toBeInTheDocument();
    });

    it('displays category icon with correct color for temple', () => {
      const templeAttraction: NearbyAttraction = {
        ...mockAttraction,
        category: 'temple',
      };

      const { container } = render(<AttractionCard attraction={templeAttraction} />);

      const categoryIcon = container.querySelector('svg[stroke="#f97316"]');
      expect(categoryIcon).toBeInTheDocument();
    });

    it('displays category icon with correct color for viewpoint', () => {
      const viewpointAttraction: NearbyAttraction = {
        ...mockAttraction,
        category: 'viewpoint',
      };

      const { container } = render(<AttractionCard attraction={viewpointAttraction} />);

      const categoryIcon = container.querySelector('svg[stroke="#8b5cf6"]');
      expect(categoryIcon).toBeInTheDocument();
    });

    it('displays fallback icon color for unknown category', () => {
      const unknownCategoryAttraction: NearbyAttraction = {
        ...mockAttraction,
        category: 'other',
      };

      const { container } = render(<AttractionCard attraction={unknownCategoryAttraction} />);

      const categoryIcon = container.querySelector('svg[stroke="#64748b"]');
      expect(categoryIcon).toBeInTheDocument();
    });

    it('displays category label badge', () => {
      render(<AttractionCard attraction={mockAttraction} />);

      expect(screen.getByText('Waterfall')).toBeInTheDocument();
    });

    it('displays correct category label for hiking', () => {
      const hikingAttraction: NearbyAttraction = {
        ...mockAttraction,
        category: 'hiking',
      };

      render(<AttractionCard attraction={hikingAttraction} />);

      expect(screen.getByText('Hiking Trail')).toBeInTheDocument();
    });
  });

  describe('Difficulty Badge Display', () => {
    it('displays difficulty badge when difficulty is provided', () => {
      render(<AttractionCard attraction={mockAttraction} />);

      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });

    it('displays easy difficulty badge with correct color classes', () => {
      const easyAttraction: NearbyAttraction = {
        ...mockAttraction,
        difficulty: 'easy',
      };

      const { container } = render(<AttractionCard attraction={easyAttraction} />);

      const badge = screen.getByText('Easy');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-green-50');
      expect(badge.className).toContain('text-green-700');
      expect(badge.className).toContain('border-green-200');
    });

    it('displays moderate difficulty badge with correct color classes', () => {
      const { container } = render(<AttractionCard attraction={mockAttraction} />);

      const badge = screen.getByText('Moderate');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-amber-50');
      expect(badge.className).toContain('text-amber-700');
      expect(badge.className).toContain('border-amber-200');
    });

    it('displays hard difficulty badge with correct color classes', () => {
      const hardAttraction: NearbyAttraction = {
        ...mockAttraction,
        difficulty: 'hard',
      };

      const { container } = render(<AttractionCard attraction={hardAttraction} />);

      const badge = screen.getByText('Hard');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-red-50');
      expect(badge.className).toContain('text-red-700');
      expect(badge.className).toContain('border-red-200');
    });

    it('does not display difficulty badge when difficulty is null', () => {
      const noDifficultyAttraction: NearbyAttraction = {
        ...mockAttraction,
        difficulty: null,
      };

      render(<AttractionCard attraction={noDifficultyAttraction} />);

      expect(screen.queryByText('Easy')).not.toBeInTheDocument();
      expect(screen.queryByText('Moderate')).not.toBeInTheDocument();
      expect(screen.queryByText('Hard')).not.toBeInTheDocument();
    });

    it('difficulty badge has small size styling', () => {
      const { container } = render(<AttractionCard attraction={mockAttraction} />);

      const badge = screen.getByText('Moderate');
      expect(badge.className).toContain('text-xs');
      expect(badge.className).toContain('font-medium');
      expect(badge.className).toContain('rounded-full');
    });
  });

  describe('Directions Button Display', () => {
    it('displays directions button when coordinates and campsite location are provided', () => {
      render(<AttractionCard attraction={mockAttraction} campsiteLocation={mockCampsiteLocation} />);

      const directionsButton = screen.getByRole('link', { name: /Get directions to Emerald Pool/i });
      expect(directionsButton).toBeInTheDocument();
    });

    it('directions button displays "Directions" text', () => {
      render(<AttractionCard attraction={mockAttraction} campsiteLocation={mockCampsiteLocation} />);

      expect(screen.getByText('Directions')).toBeInTheDocument();
    });

    it('directions button has navigation icon', () => {
      const { container } = render(
        <AttractionCard attraction={mockAttraction} campsiteLocation={mockCampsiteLocation} />
      );

      const navigationIcon = container.querySelector('polygon[points="3 11 22 2 13 21 11 13 3 11"]');
      expect(navigationIcon).toBeInTheDocument();
    });

    it('does not display directions button when latitude is null', () => {
      const noLatAttraction: NearbyAttraction = {
        ...mockAttraction,
        latitude: null,
      };

      render(<AttractionCard attraction={noLatAttraction} campsiteLocation={mockCampsiteLocation} />);

      expect(screen.queryByRole('link', { name: /Get directions/i })).not.toBeInTheDocument();
    });

    it('does not display directions button when longitude is null', () => {
      const noLngAttraction: NearbyAttraction = {
        ...mockAttraction,
        longitude: null,
      };

      render(<AttractionCard attraction={noLngAttraction} campsiteLocation={mockCampsiteLocation} />);

      expect(screen.queryByRole('link', { name: /Get directions/i })).not.toBeInTheDocument();
    });

    it('does not display directions button when campsite location is not provided', () => {
      render(<AttractionCard attraction={mockAttraction} />);

      expect(screen.queryByRole('link', { name: /Get directions/i })).not.toBeInTheDocument();
    });

    it('directions button opens in new tab with security attributes', () => {
      render(<AttractionCard attraction={mockAttraction} campsiteLocation={mockCampsiteLocation} />);

      const directionsButton = screen.getByRole('link', { name: /Get directions/i });
      expect(directionsButton).toHaveAttribute('target', '_blank');
      expect(directionsButton).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Directions URL Generation', () => {
    it('generates correct Google Maps directions URL', () => {
      render(<AttractionCard attraction={mockAttraction} campsiteLocation={mockCampsiteLocation} />);

      const directionsButton = screen.getByRole('link', { name: /Get directions/i });
      const href = directionsButton.getAttribute('href');

      expect(href).toContain('https://www.google.com/maps/dir/');
      expect(href).toContain('7.91,99.24'); // Origin coordinates
      expect(href).toContain('7.9234,99.2567'); // Destination coordinates
    });

    it('URL includes origin coordinates from campsite location', () => {
      render(<AttractionCard attraction={mockAttraction} campsiteLocation={mockCampsiteLocation} />);

      const directionsButton = screen.getByRole('link', { name: /Get directions/i });
      const href = directionsButton.getAttribute('href');

      expect(href).toContain('7.91');
      expect(href).toContain('99.24');
    });

    it('URL includes destination coordinates from attraction', () => {
      render(<AttractionCard attraction={mockAttraction} campsiteLocation={mockCampsiteLocation} />);

      const directionsButton = screen.getByRole('link', { name: /Get directions/i });
      const href = directionsButton.getAttribute('href');

      expect(href).toContain('7.9234');
      expect(href).toContain('99.2567');
    });

    it('generates URL with different coordinates', () => {
      const differentLocation = {
        lat: 13.7563,
        lng: 100.5018,
      };

      const differentAttraction: NearbyAttraction = {
        ...mockAttraction,
        latitude: 13.7000,
        longitude: 100.5500,
      };

      render(
        <AttractionCard attraction={differentAttraction} campsiteLocation={differentLocation} />
      );

      const directionsButton = screen.getByRole('link', { name: /Get directions/i });
      const href = directionsButton.getAttribute('href');

      expect(href).toContain('13.7563');
      expect(href).toContain('100.5018');
      expect(href).toContain('13.7');
      expect(href).toContain('100.55');
    });
  });

  describe('Description Display', () => {
    it('displays description when provided', () => {
      render(<AttractionCard attraction={mockAttraction} />);

      expect(screen.getByText('Beautiful natural pool with crystal clear water')).toBeInTheDocument();
    });

    it('does not display description when null', () => {
      const noDescriptionAttraction: NearbyAttraction = {
        ...mockAttraction,
        description: null,
      };

      const { container } = render(<AttractionCard attraction={noDescriptionAttraction} />);

      const description = container.querySelector('.line-clamp-2');
      expect(description).not.toBeInTheDocument();
    });

    it('truncates long descriptions with line-clamp-2', () => {
      const longDescription = 'This is a very long description that should be truncated. '.repeat(10);
      const longDescAttraction: NearbyAttraction = {
        ...mockAttraction,
        description: longDescription,
      };

      const { container } = render(<AttractionCard attraction={longDescAttraction} />);

      const description = container.querySelector('.line-clamp-2');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'text-gray-600');
    });
  });

  describe('Card Layout and Structure', () => {
    it('renders card with correct layout classes', () => {
      const { container } = render(<AttractionCard attraction={mockAttraction} />);

      const card = container.querySelector('.flex.items-start.gap-4.p-4');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-white', 'border', 'border-gray-200', 'rounded-lg');
    });

    it('has hover shadow effect', () => {
      const { container } = render(<AttractionCard attraction={mockAttraction} />);

      const card = container.querySelector('.hover\\:shadow-md');
      expect(card).toBeInTheDocument();
    });

    it('has transition effect for shadow', () => {
      const { container } = render(<AttractionCard attraction={mockAttraction} />);

      const card = container.querySelector('.transition-shadow');
      expect(card).toBeInTheDocument();
    });

    it('icon has rounded background with category color', () => {
      const { container } = render(<AttractionCard attraction={mockAttraction} />);

      const iconContainer = container.querySelector('.flex-shrink-0.w-10.h-10.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero distance correctly', () => {
      const zeroDistanceAttraction: NearbyAttraction = {
        ...mockAttraction,
        distance_km: 0,
      };

      render(<AttractionCard attraction={zeroDistanceAttraction} />);

      expect(screen.getByText(/0.0 km away/)).toBeInTheDocument();
    });

    it('handles very large distances correctly', () => {
      const farAttraction: NearbyAttraction = {
        ...mockAttraction,
        distance_km: 99.9,
      };

      render(<AttractionCard attraction={farAttraction} />);

      expect(screen.getByText(/99.9 km away/)).toBeInTheDocument();
    });

    it('handles all category types correctly', () => {
      const categories: Array<NearbyAttraction['category']> = [
        'hiking',
        'waterfall',
        'temple',
        'viewpoint',
        'lake',
        'cave',
        'market',
        'other',
      ];

      categories.forEach((category) => {
        const categoryAttraction: NearbyAttraction = {
          ...mockAttraction,
          category,
        };

        const { unmount } = render(<AttractionCard attraction={categoryAttraction} />);
        expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
        unmount();
      });
    });

    it('handles attractions with all optional fields missing', () => {
      const minimalAttraction: NearbyAttraction = {
        id: 'attr-002',
        campsite_id: 'campsite-002',
        name: 'Minimal Attraction',
        description: null,
        distance_km: 5.0,
        category: 'other',
        difficulty: null,
        latitude: null,
        longitude: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      render(<AttractionCard attraction={minimalAttraction} />);

      expect(screen.getByText('Minimal Attraction')).toBeInTheDocument();
      expect(screen.getByText(/5.0 km away/)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Get directions/i })).not.toBeInTheDocument();
    });
  });
});
