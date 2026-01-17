import { render, screen } from '@testing-library/react';
import { ReviewSummary } from '@/components/reviews/ReviewSummary';
import type { ReviewSummary as ReviewSummaryType } from '@campsite/shared';

// Mock StarRating component
jest.mock('@/components/ui/StarRating', () => ({
  StarRating: ({ rating, size, className }: { rating: number; size?: string; className?: string }) => (
    <div data-testid="star-rating" data-rating={rating} data-size={size} className={className}>
      Star Rating: {rating}
    </div>
  ),
}));

describe('ReviewSummary Component', () => {
  const createMockSummary = (overrides?: Partial<ReviewSummaryType>): ReviewSummaryType => ({
    average_rating: 4.5,
    total_count: 100,
    rating_distribution: {
      1: 5,
      2: 5,
      3: 10,
      4: 30,
      5: 50,
    },
    rating_percentages: {
      1: 5,
      2: 5,
      3: 10,
      4: 30,
      5: 50,
    },
    category_averages: {
      cleanliness: 4.6,
      staff: 4.7,
      facilities: 4.3,
      value: 4.4,
      location: 4.8,
    },
    ...overrides,
  });

  describe('Rendering behavior', () => {
    it('renders average rating correctly', () => {
      const summary = createMockSummary({ average_rating: 4.5 });
      render(<ReviewSummary summary={summary} />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('renders review count with correct text', () => {
      const summary = createMockSummary({ total_count: 100 });
      render(<ReviewSummary summary={summary} />);

      expect(screen.getByText('100 reviews')).toBeInTheDocument();
    });

    it('renders StarRating component with correct rating', () => {
      const summary = createMockSummary({ average_rating: 4.5 });
      render(<ReviewSummary summary={summary} />);

      const starRating = screen.getByTestId('star-rating');
      expect(starRating).toBeInTheDocument();
      expect(starRating).toHaveAttribute('data-rating', '4.5');
      expect(starRating).toHaveAttribute('data-size', 'lg');
    });

    it('renders rating distribution for all star levels', () => {
      const summary = createMockSummary();
      const { container } = render(<ReviewSummary summary={summary} />);

      // Check for star labels (5, 4, 3, 2, 1)
      const starLabels = container.querySelectorAll('.w-3.text-sm.text-gray-600');
      expect(starLabels).toHaveLength(5);
      expect(starLabels[0]).toHaveTextContent('5');
      expect(starLabels[1]).toHaveTextContent('4');
      expect(starLabels[2]).toHaveTextContent('3');
      expect(starLabels[3]).toHaveTextContent('2');
      expect(starLabels[4]).toHaveTextContent('1');

      // Check for star counts
      const starCounts = container.querySelectorAll('.w-8.text-xs.text-gray-500');
      expect(starCounts).toHaveLength(5);
      expect(starCounts[0]).toHaveTextContent('50'); // 5-star count
      expect(starCounts[1]).toHaveTextContent('30'); // 4-star count
      expect(starCounts[2]).toHaveTextContent('10'); // 3-star count
      expect(starCounts[3]).toHaveTextContent('5');  // 2-star count
      expect(starCounts[4]).toHaveTextContent('5');  // 1-star count
    });

    it('renders progress bars with correct percentages', () => {
      const summary = createMockSummary();
      const { container } = render(<ReviewSummary summary={summary} />);

      // Find all progress bar inner elements
      const progressBars = container.querySelectorAll('.bg-yellow-400.rounded-full');
      expect(progressBars).toHaveLength(5);

      // Check widths (in order: 5-star, 4-star, 3-star, 2-star, 1-star)
      expect(progressBars[0]).toHaveStyle({ width: '50%' }); // 5-star: 50%
      expect(progressBars[1]).toHaveStyle({ width: '30%' }); // 4-star: 30%
      expect(progressBars[2]).toHaveStyle({ width: '10%' }); // 3-star: 10%
      expect(progressBars[3]).toHaveStyle({ width: '5%' });  // 2-star: 5%
      expect(progressBars[4]).toHaveStyle({ width: '5%' });  // 1-star: 5%
    });

    it('applies custom className', () => {
      const summary = createMockSummary();
      const { container } = render(<ReviewSummary summary={summary} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Single review handling', () => {
    it('renders singular "review" text for one review', () => {
      const summary = createMockSummary({
        total_count: 1,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
        rating_percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 100 },
      });
      render(<ReviewSummary summary={summary} />);

      expect(screen.getByText('1 review')).toBeInTheDocument();
      expect(screen.queryByText('1 reviews')).not.toBeInTheDocument();
    });

    it('displays 100% for single 5-star review', () => {
      const summary = createMockSummary({
        average_rating: 5.0,
        total_count: 1,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
        rating_percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 100 },
      });
      const { container } = render(<ReviewSummary summary={summary} />);

      expect(screen.getByText('5.0')).toBeInTheDocument();

      const progressBars = container.querySelectorAll('.bg-yellow-400.rounded-full');
      expect(progressBars[0]).toHaveStyle({ width: '100%' }); // 5-star: 100%
      expect(progressBars[1]).toHaveStyle({ width: '0%' });   // 4-star: 0%
    });
  });

  describe('Decimal ratings display', () => {
    it('displays one decimal place for ratings', () => {
      const testCases = [
        { rating: 4.5, expected: '4.5' },
        { rating: 4.0, expected: '4.0' },
        { rating: 3.7, expected: '3.7' },
        { rating: 4.99, expected: '5.0' },
        { rating: 2.13, expected: '2.1' },
      ];

      testCases.forEach(({ rating, expected }) => {
        const summary = createMockSummary({ average_rating: rating });
        const { unmount } = render(<ReviewSummary summary={summary} />);

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    it('correctly rounds decimal ratings', () => {
      const summary = createMockSummary({ average_rating: 4.456 });
      render(<ReviewSummary summary={summary} />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
    });
  });

  describe('Empty state handling', () => {
    it('handles zero reviews correctly', () => {
      const summary = createMockSummary({
        average_rating: 0,
        total_count: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 0: 0, 5: 0 },
        rating_percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
      render(<ReviewSummary summary={summary} />);

      expect(screen.getByText('0.0')).toBeInTheDocument();
      expect(screen.getByText('0 reviews')).toBeInTheDocument();
    });

    it('displays empty progress bars when no reviews exist', () => {
      const summary = createMockSummary({
        average_rating: 0,
        total_count: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        rating_percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
      const { container } = render(<ReviewSummary summary={summary} />);

      const progressBars = container.querySelectorAll('.bg-yellow-400.rounded-full');
      progressBars.forEach(bar => {
        expect(bar).toHaveStyle({ width: '0%' });
      });
    });

    it('shows zero counts for all star ratings when no reviews', () => {
      const summary = createMockSummary({
        average_rating: 0,
        total_count: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        rating_percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
      render(<ReviewSummary summary={summary} />);

      // Should have five "0" text elements for the counts
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Rating distribution display', () => {
    it('displays rating distribution in descending order (5 to 1)', () => {
      const summary = createMockSummary();
      const { container } = render(<ReviewSummary summary={summary} />);

      // Get all star labels
      const starLabels = Array.from(container.querySelectorAll('.w-3.text-sm'));
      const starNumbers = starLabels.map(label => label.textContent);

      expect(starNumbers).toEqual(['5', '4', '3', '2', '1']);
    });

    it('handles uneven distribution correctly', () => {
      const summary = createMockSummary({
        total_count: 200,
        rating_distribution: { 1: 2, 2: 8, 3: 30, 4: 60, 5: 100 },
        rating_percentages: { 1: 1, 2: 4, 3: 15, 4: 30, 5: 50 },
      });
      const { container } = render(<ReviewSummary summary={summary} />);

      const starCounts = container.querySelectorAll('.w-8.text-xs.text-gray-500');
      expect(starCounts[0]).toHaveTextContent('100'); // 5-star count
      expect(starCounts[1]).toHaveTextContent('60');  // 4-star count
      expect(starCounts[2]).toHaveTextContent('30');  // 3-star count
      expect(starCounts[3]).toHaveTextContent('8');   // 2-star count
      expect(starCounts[4]).toHaveTextContent('2');   // 1-star count
    });

    it('displays percentage bars proportionally', () => {
      const summary = createMockSummary({
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 100 },
        rating_percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 100 },
      });
      const { container } = render(<ReviewSummary summary={summary} />);

      const progressBars = container.querySelectorAll('.bg-yellow-400.rounded-full');
      expect(progressBars[0]).toHaveStyle({ width: '100%' }); // Only 5-star has reviews
      expect(progressBars[1]).toHaveStyle({ width: '0%' });
      expect(progressBars[2]).toHaveStyle({ width: '0%' });
      expect(progressBars[3]).toHaveStyle({ width: '0%' });
      expect(progressBars[4]).toHaveStyle({ width: '0%' });
    });
  });

  describe('Accessibility', () => {
    it('uses semantic HTML structure', () => {
      const summary = createMockSummary();
      const { container } = render(<ReviewSummary summary={summary} />);

      // Check for proper div structure
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('displays rating value as text for screen readers', () => {
      const summary = createMockSummary({ average_rating: 4.5 });
      render(<ReviewSummary summary={summary} />);

      const ratingText = screen.getByText('4.5');
      expect(ratingText).toBeInTheDocument();
      expect(ratingText.tagName).toBe('DIV');
    });

    it('provides review count as text', () => {
      const summary = createMockSummary({ total_count: 100 });
      render(<ReviewSummary summary={summary} />);

      const countText = screen.getByText('100 reviews');
      expect(countText).toBeInTheDocument();
    });

    it('uses SVG icons for star visualization', () => {
      const summary = createMockSummary();
      const { container } = render(<ReviewSummary summary={summary} />);

      // Check that star icons (SVG) are present
      const starIcons = container.querySelectorAll('svg');
      expect(starIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Layout and styling', () => {
    it('applies responsive flex layout classes', () => {
      const summary = createMockSummary();
      const { container } = render(<ReviewSummary summary={summary} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'flex-col', 'md:flex-row', 'gap-6', 'md:gap-10');
    });

    it('styles progress bar container correctly', () => {
      const summary = createMockSummary();
      const { container } = render(<ReviewSummary summary={summary} />);

      const progressContainers = container.querySelectorAll('.bg-gray-200.rounded-full');
      expect(progressContainers.length).toBeGreaterThan(0);

      progressContainers.forEach(container => {
        expect(container).toHaveClass('h-2', 'bg-gray-200', 'rounded-full', 'overflow-hidden');
      });
    });

    it('styles progress bar fill with yellow color', () => {
      const summary = createMockSummary();
      const { container } = render(<ReviewSummary summary={summary} />);

      const progressBars = container.querySelectorAll('.bg-yellow-400');
      expect(progressBars.length).toBeGreaterThan(0);

      progressBars.forEach(bar => {
        expect(bar).toHaveClass('bg-yellow-400', 'rounded-full');
      });
    });

    it('displays large rating number with correct styling', () => {
      const summary = createMockSummary({ average_rating: 4.5 });
      render(<ReviewSummary summary={summary} />);

      const ratingElement = screen.getByText('4.5');
      expect(ratingElement).toHaveClass('text-5xl', 'font-bold', 'text-gray-900');
    });
  });

  describe('Edge cases', () => {
    it('handles perfect 5.0 rating', () => {
      const summary = createMockSummary({
        average_rating: 5.0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 100 },
        rating_percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 100 },
      });
      render(<ReviewSummary summary={summary} />);

      expect(screen.getByText('5.0')).toBeInTheDocument();
    });

    it('handles very low rating (1.0)', () => {
      const summary = createMockSummary({
        average_rating: 1.0,
        rating_distribution: { 1: 100, 2: 0, 3: 0, 4: 0, 5: 0 },
        rating_percentages: { 1: 100, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
      render(<ReviewSummary summary={summary} />);

      expect(screen.getByText('1.0')).toBeInTheDocument();
    });

    it('handles large review counts', () => {
      const summary = createMockSummary({ total_count: 9999 });
      render(<ReviewSummary summary={summary} />);

      expect(screen.getByText('9999 reviews')).toBeInTheDocument();
    });

    it('handles fractional percentages correctly', () => {
      const summary = createMockSummary({
        total_count: 333,
        rating_distribution: { 1: 33, 2: 67, 3: 100, 4: 67, 5: 66 },
        rating_percentages: { 1: 9.91, 2: 20.12, 3: 30.03, 4: 20.12, 5: 19.82 },
      });
      const { container } = render(<ReviewSummary summary={summary} />);

      const progressBars = container.querySelectorAll('.bg-yellow-400.rounded-full');
      expect(progressBars).toHaveLength(5);

      // Check that fractional percentages are applied
      expect(progressBars[4]).toHaveStyle({ width: '9.91%' }); // 1-star
      expect(progressBars[0]).toHaveStyle({ width: '19.82%' }); // 5-star
    });
  });
});
