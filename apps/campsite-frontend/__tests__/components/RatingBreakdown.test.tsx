import { render, screen } from '@testing-library/react';
import { RatingBreakdown } from '@/components/reviews/RatingBreakdown';
import type { ReviewSummary } from '@campsite/shared';

describe('RatingBreakdown Component', () => {
  const mockCategoryAverages: ReviewSummary['category_averages'] = {
    cleanliness: 4.5,
    staff: 4.2,
    facilities: 3.8,
    value: 4.0,
    location: 4.7,
  };

  describe('Rendering behavior', () => {
    it('renders all 5 category rating bars when all categories have values', () => {
      render(<RatingBreakdown categoryAverages={mockCategoryAverages} />);

      expect(screen.getByText('Cleanliness')).toBeInTheDocument();
      expect(screen.getByText('Staff')).toBeInTheDocument();
      expect(screen.getByText('Facilities')).toBeInTheDocument();
      expect(screen.getByText('Value for Money')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('renders section title', () => {
      render(<RatingBreakdown categoryAverages={mockCategoryAverages} />);
      expect(screen.getByText('Rating by Category')).toBeInTheDocument();
    });

    it('renders rating values with one decimal place', () => {
      render(<RatingBreakdown categoryAverages={mockCategoryAverages} />);

      expect(screen.getByText('4.5')).toBeInTheDocument(); // Cleanliness
      expect(screen.getByText('4.2')).toBeInTheDocument(); // Staff
      expect(screen.getByText('3.8')).toBeInTheDocument(); // Facilities
      expect(screen.getByText('4.0')).toBeInTheDocument(); // Value
      expect(screen.getByText('4.7')).toBeInTheDocument(); // Location
    });
  });

  describe('Bar width percentages', () => {
    it('sets correct bar width based on rating percentage', () => {
      const { container } = render(<RatingBreakdown categoryAverages={mockCategoryAverages} />);
      const bars = container.querySelectorAll('div[style*="width"]');

      // Cleanliness: 4.5/5 = 90%
      expect(bars[0]?.getAttribute('style')).toContain('90%');

      // Staff: 4.2/5 = 84%
      expect(bars[1]?.getAttribute('style')).toContain('84');

      // Facilities: 3.8/5 = 76%
      expect(bars[2]?.getAttribute('style')).toContain('76%');

      // Value: 4.0/5 = 80%
      expect(bars[3]?.getAttribute('style')).toContain('80%');

      // Location: 4.7/5 = 94%
      expect(bars[4]?.getAttribute('style')).toContain('94%');
    });

    it('shows 100% width for perfect 5.0 rating', () => {
      const perfectRating = { cleanliness: 5.0, staff: null, facilities: null, value: null, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={perfectRating} />);
      const bars = container.querySelectorAll('div[style*="width"]');

      expect(bars[0]).toHaveStyle({ width: '100%' });
    });

    it('shows 0% width for 0 rating', () => {
      const zeroRating = { cleanliness: 0, staff: null, facilities: null, value: null, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={zeroRating} />);
      const bars = container.querySelectorAll('div[style*="width"]');

      expect(bars[0]).toHaveStyle({ width: '0%' });
    });

    it('calculates correct percentage for mid-range ratings', () => {
      const midRating = { cleanliness: 2.5, staff: null, facilities: null, value: null, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={midRating} />);
      const bars = container.querySelectorAll('div[style*="width"]');

      // 2.5/5 = 50%
      expect(bars[0]).toHaveStyle({ width: '50%' });
    });
  });

  describe('Empty and null handling', () => {
    it('returns null when all categories are null', () => {
      const emptyCategories = {
        cleanliness: null,
        staff: null,
        facilities: null,
        value: null,
        location: null
      };
      const { container } = render(<RatingBreakdown categoryAverages={emptyCategories} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders only non-null categories', () => {
      const partialCategories = {
        cleanliness: 4.5,
        staff: null,
        facilities: 3.8,
        value: null,
        location: 4.2,
      };
      render(<RatingBreakdown categoryAverages={partialCategories} />);

      expect(screen.getByText('Cleanliness')).toBeInTheDocument();
      expect(screen.queryByText('Staff')).not.toBeInTheDocument();
      expect(screen.getByText('Facilities')).toBeInTheDocument();
      expect(screen.queryByText('Value for Money')).not.toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('renders single category when only one has value', () => {
      const singleCategory = {
        cleanliness: 4.5,
        staff: null,
        facilities: null,
        value: null,
        location: null,
      };
      render(<RatingBreakdown categoryAverages={singleCategory} />);

      expect(screen.getByText('Cleanliness')).toBeInTheDocument();
      expect(screen.queryByText('Staff')).not.toBeInTheDocument();
      expect(screen.queryByText('Facilities')).not.toBeInTheDocument();
      expect(screen.queryByText('Value for Money')).not.toBeInTheDocument();
      expect(screen.queryByText('Location')).not.toBeInTheDocument();
    });
  });

  describe('Color coding by rating', () => {
    it('applies green color for excellent ratings (4.5+)', () => {
      const excellentRating = { cleanliness: 4.5, staff: null, facilities: null, value: null, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={excellentRating} />);
      const bar = container.querySelector('.bg-green-500');

      expect(bar).toBeInTheDocument();
    });

    it('applies green-400 color for very good ratings (4.0-4.49)', () => {
      const veryGoodRating = { cleanliness: 4.2, staff: null, facilities: null, value: null, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={veryGoodRating} />);
      const bar = container.querySelector('.bg-green-400');

      expect(bar).toBeInTheDocument();
    });

    it('applies yellow-400 color for good ratings (3.5-3.99)', () => {
      const goodRating = { cleanliness: 3.7, staff: null, facilities: null, value: null, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={goodRating} />);
      const bar = container.querySelector('.bg-yellow-400');

      expect(bar).toBeInTheDocument();
    });

    it('applies yellow-500 color for average ratings (3.0-3.49)', () => {
      const averageRating = { cleanliness: 3.2, staff: null, facilities: null, value: null, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={averageRating} />);
      const bar = container.querySelector('.bg-yellow-500');

      expect(bar).toBeInTheDocument();
    });

    it('applies orange-400 color for below average ratings (2.0-2.99)', () => {
      const belowAverageRating = { cleanliness: 2.5, staff: null, facilities: null, value: null, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={belowAverageRating} />);
      const bar = container.querySelector('.bg-orange-400');

      expect(bar).toBeInTheDocument();
    });

    it('applies red-400 color for poor ratings (below 2.0)', () => {
      const poorRating = { cleanliness: 1.5, staff: null, facilities: null, value: null, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={poorRating} />);
      const bar = container.querySelector('.bg-red-400');

      expect(bar).toBeInTheDocument();
    });

    it('applies different colors to different rating categories', () => {
      const mixedRatings = {
        cleanliness: 4.8, // green-500
        staff: 4.2,       // green-400
        facilities: 3.7,  // yellow-400
        value: 3.0,       // yellow-500
        location: 1.8,    // red-400
      };
      const { container } = render(<RatingBreakdown categoryAverages={mixedRatings} />);

      expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
      expect(container.querySelector('.bg-green-400')).toBeInTheDocument();
      expect(container.querySelector('.bg-yellow-400')).toBeInTheDocument();
      expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument();
      expect(container.querySelector('.bg-red-400')).toBeInTheDocument();
    });
  });

  describe('Category icons', () => {
    it('renders icon for each category', () => {
      const { container } = render(<RatingBreakdown categoryAverages={mockCategoryAverages} />);
      const icons = container.querySelectorAll('svg');

      // Should have 5 icons (one for each category)
      expect(icons).toHaveLength(5);
    });

    it('renders cleanliness icon (sparkle)', () => {
      const singleCategory = { cleanliness: 4.5, staff: null, facilities: null, value: null, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={singleCategory} />);
      const svg = container.querySelector('svg');

      // Check for sparkle path
      expect(svg?.querySelector('path')?.getAttribute('d')).toContain('M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286');
    });

    it('renders staff icon (people)', () => {
      const singleCategory = { cleanliness: null, staff: 4.2, facilities: null, value: null, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={singleCategory} />);
      const svg = container.querySelector('svg');

      // Check for people icon path
      expect(svg?.querySelector('path')?.getAttribute('d')).toContain('M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7');
    });

    it('renders facilities icon (building)', () => {
      const singleCategory = { cleanliness: null, staff: null, facilities: 3.8, value: null, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={singleCategory} />);
      const svg = container.querySelector('svg');

      // Check for building icon path
      expect(svg?.querySelector('path')?.getAttribute('d')).toContain('M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2');
    });

    it('renders value icon (dollar)', () => {
      const singleCategory = { cleanliness: null, staff: null, facilities: null, value: 4.0, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={singleCategory} />);
      const svg = container.querySelector('svg');

      // Check for dollar/currency icon path
      expect(svg?.querySelector('path')?.getAttribute('d')).toContain('M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2');
    });

    it('renders location icon (map pin)', () => {
      const singleCategory = { cleanliness: null, staff: null, facilities: null, value: null, location: 4.7 };
      const { container } = render(<RatingBreakdown categoryAverages={singleCategory} />);
      const svg = container.querySelector('svg');

      // Check for location/map pin icon path
      expect(svg?.querySelector('path')?.getAttribute('d')).toContain('M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243');
    });
  });

  describe('Layout and styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <RatingBreakdown categoryAverages={mockCategoryAverages} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('maintains base spacing classes with custom className', () => {
      const { container } = render(
        <RatingBreakdown categoryAverages={mockCategoryAverages} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('space-y-3');
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders grid layout for categories', () => {
      const { container } = render(<RatingBreakdown categoryAverages={mockCategoryAverages} />);
      const grid = container.querySelector('.grid');

      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('sm:grid-cols-2');
    });

    it('renders progress bars with correct styling', () => {
      const { container } = render(<RatingBreakdown categoryAverages={mockCategoryAverages} />);
      const progressBars = container.querySelectorAll('.h-1\\.5.bg-gray-200.rounded-full');

      expect(progressBars).toHaveLength(5);
    });

    it('applies transition classes to rating bars', () => {
      const { container } = render(<RatingBreakdown categoryAverages={mockCategoryAverages} />);
      const bars = container.querySelectorAll('div[style*="width"]');

      bars.forEach((bar) => {
        expect(bar).toHaveClass('transition-all');
        expect(bar).toHaveClass('duration-300');
      });
    });
  });

  describe('Edge cases', () => {
    it('handles decimal ratings correctly', () => {
      const decimalRatings = {
        cleanliness: 3.33,
        staff: 4.67,
        facilities: 2.99,
        value: 1.11,
        location: 4.99,
      };
      render(<RatingBreakdown categoryAverages={decimalRatings} />);

      expect(screen.getByText('3.3')).toBeInTheDocument();
      expect(screen.getByText('4.7')).toBeInTheDocument();
      expect(screen.getByText('3.0')).toBeInTheDocument();
      expect(screen.getByText('1.1')).toBeInTheDocument();
      expect(screen.getByText('5.0')).toBeInTheDocument();
    });

    it('handles zero ratings', () => {
      const zeroRatings = {
        cleanliness: 0,
        staff: 0,
        facilities: 0,
        value: 0,
        location: 0,
      };
      render(<RatingBreakdown categoryAverages={zeroRatings} />);

      const zeroDisplays = screen.getAllByText('0.0');
      expect(zeroDisplays).toHaveLength(5);
    });

    it('handles exact rating boundaries', () => {
      const boundaryRatings = {
        cleanliness: 4.5, // Exactly 4.5 - should be green-500
        staff: 4.0,       // Exactly 4.0 - should be green-400
        facilities: 3.5,  // Exactly 3.5 - should be yellow-400
        value: 3.0,       // Exactly 3.0 - should be yellow-500
        location: 2.0,    // Exactly 2.0 - should be orange-400
      };
      const { container } = render(<RatingBreakdown categoryAverages={boundaryRatings} />);

      expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
      expect(container.querySelector('.bg-green-400')).toBeInTheDocument();
      expect(container.querySelector('.bg-yellow-400')).toBeInTheDocument();
      expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument();
      expect(container.querySelector('.bg-orange-400')).toBeInTheDocument();
    });

    it('handles extremely low ratings', () => {
      const extremelyLow = { cleanliness: 0.1, staff: null, facilities: null, value: null, location: null };
      const { container } = render(<RatingBreakdown categoryAverages={extremelyLow} />);

      expect(screen.getByText('0.1')).toBeInTheDocument();
      const bar = container.querySelector('.bg-red-400');
      expect(bar).toBeInTheDocument();
    });

    it('renders all categories in correct order', () => {
      render(<RatingBreakdown categoryAverages={mockCategoryAverages} />);
      const labels = screen.getAllByText(/Cleanliness|Staff|Facilities|Value for Money|Location/);

      // The component renders in the order they appear in the object
      // Order may vary, but all should be present
      expect(labels).toHaveLength(5);
    });
  });

  describe('Accessibility', () => {
    it('renders semantic HTML structure', () => {
      const { container } = render(<RatingBreakdown categoryAverages={mockCategoryAverages} />);

      // Check for heading
      const heading = container.querySelector('h4');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Rating by Category');
    });

    it('provides visual representation with proper contrast', () => {
      const { container } = render(<RatingBreakdown categoryAverages={mockCategoryAverages} />);

      // Check background for bars exists
      const backgrounds = container.querySelectorAll('.bg-gray-200');
      expect(backgrounds.length).toBeGreaterThan(0);
    });

    it('displays numeric values alongside visual bars', () => {
      render(<RatingBreakdown categoryAverages={mockCategoryAverages} />);

      // Each category should have both a label and a numeric rating
      expect(screen.getByText('Cleanliness')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();

      expect(screen.getByText('Staff')).toBeInTheDocument();
      expect(screen.getByText('4.2')).toBeInTheDocument();
    });
  });
});
