import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRatingInput } from '@/components/ui/StarRatingInput';

describe('StarRatingInput Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering behavior', () => {
    it('renders 5 stars by default', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} />);
      const stars = screen.getAllByRole('radio');
      expect(stars).toHaveLength(5);
    });

    it('renders custom number of stars when maxRating is provided', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} maxRating={10} />);
      const stars = screen.getAllByRole('radio');
      expect(stars).toHaveLength(10);
    });

    it('renders label when provided', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} label="Your Rating" />);
      expect(screen.getByText('Your Rating')).toBeInTheDocument();
    });

    it('renders required indicator when required is true', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} label="Rating" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('*')).toHaveClass('text-red-500');
    });

    it('renders with radiogroup role', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} label="Test Rating" />);
      expect(screen.getByRole('radiogroup', { name: 'Test Rating' })).toBeInTheDocument();
    });

    it('uses default aria-label when no label is provided', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} />);
      expect(screen.getByRole('radiogroup', { name: 'Rating' })).toBeInTheDocument();
    });
  });

  describe('Star interaction', () => {
    it('calls onChange with new value when star is clicked', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} />);
      const thirdStar = screen.getByRole('radio', { name: '3 stars' });

      fireEvent.click(thirdStar);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(3);
    });

    it('sets rating value correctly when different stars are clicked', () => {
      const { rerender } = render(<StarRatingInput value={0} onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('radio', { name: '1 star' }));
      expect(mockOnChange).toHaveBeenCalledWith(1);

      rerender(<StarRatingInput value={1} onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));
      expect(mockOnChange).toHaveBeenCalledWith(5);
    });

    it('toggles off rating when clicking the same star twice', () => {
      const { rerender } = render(<StarRatingInput value={0} onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('radio', { name: '3 stars' }));
      expect(mockOnChange).toHaveBeenCalledWith(3);

      rerender(<StarRatingInput value={3} onChange={mockOnChange} />);
      mockOnChange.mockClear();

      fireEvent.click(screen.getByRole('radio', { name: '3 stars' }));
      expect(mockOnChange).toHaveBeenCalledWith(0);
    });

    it('does not call onChange when disabled', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} disabled />);
      const firstStar = screen.getByRole('radio', { name: '1 star' });

      fireEvent.click(firstStar);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Hover preview', () => {
    it('shows preview when hovering over stars', () => {
      const { container } = render(<StarRatingInput value={0} onChange={mockOnChange} />);
      const thirdStar = screen.getByRole('radio', { name: '3 stars' });

      fireEvent.mouseEnter(thirdStar);

      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(3);
    });

    it('resets preview when mouse leaves star container', () => {
      const { container } = render(<StarRatingInput value={2} onChange={mockOnChange} />);
      const fourthStar = screen.getByRole('radio', { name: '4 stars' });
      const starContainer = screen.getByRole('radiogroup');

      fireEvent.mouseEnter(fourthStar);
      let filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(4);

      fireEvent.mouseLeave(starContainer);
      filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(2); // Back to value
    });

    it('does not show hover preview when disabled', () => {
      const { container } = render(<StarRatingInput value={0} onChange={mockOnChange} disabled />);
      const thirdStar = screen.getByRole('radio', { name: '3 stars' });

      fireEvent.mouseEnter(thirdStar);

      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(0);
    });
  });

  describe('Current value highlighting', () => {
    it('highlights stars up to current value', () => {
      const { container } = render(<StarRatingInput value={3} onChange={mockOnChange} />);

      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(3);
    });

    it('highlights all stars when value equals maxRating', () => {
      const { container } = render(<StarRatingInput value={5} onChange={mockOnChange} />);

      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(5);
    });

    it('does not highlight any stars when value is 0', () => {
      const { container } = render(<StarRatingInput value={0} onChange={mockOnChange} />);

      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(0);
    });

    it('displays current rating text when value is greater than 0', () => {
      render(<StarRatingInput value={3} onChange={mockOnChange} />);

      expect(screen.getByText('3 out of 5')).toBeInTheDocument();
    });

    it('does not display rating text when value is 0', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} />);

      expect(screen.queryByText(/out of/)).not.toBeInTheDocument();
    });
  });

  describe('Different sizes', () => {
    it('renders small size stars correctly', () => {
      const { container } = render(<StarRatingInput value={0} onChange={mockOnChange} size="sm" />);
      const stars = container.querySelectorAll('.w-6.h-6');
      expect(stars.length).toBeGreaterThan(0);
    });

    it('renders medium size stars correctly (default)', () => {
      const { container } = render(<StarRatingInput value={0} onChange={mockOnChange} size="md" />);
      const stars = container.querySelectorAll('.w-8.h-8');
      expect(stars.length).toBeGreaterThan(0);
    });

    it('renders large size stars correctly', () => {
      const { container } = render(<StarRatingInput value={0} onChange={mockOnChange} size="lg" />);
      const stars = container.querySelectorAll('.w-10.h-10');
      expect(stars.length).toBeGreaterThan(0);
    });
  });

  describe('Disabled state', () => {
    it('applies disabled styling to all stars', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} disabled />);
      const stars = screen.getAllByRole('radio');

      stars.forEach((star) => {
        expect(star).toBeDisabled();
        expect(star).toHaveClass('cursor-not-allowed');
        expect(star).toHaveClass('opacity-50');
      });
    });

    it('does not trigger onChange when disabled star is clicked', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} disabled />);

      fireEvent.click(screen.getByRole('radio', { name: '3 stars' }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not show hover effect when disabled', () => {
      const { container } = render(<StarRatingInput value={0} onChange={mockOnChange} disabled />);

      fireEvent.mouseEnter(screen.getByRole('radio', { name: '3 stars' }));

      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for each star', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} />);

      expect(screen.getByRole('radio', { name: '1 star' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: '2 stars' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: '3 stars' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: '4 stars' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: '5 stars' })).toBeInTheDocument();
    });

    it('marks selected star with aria-checked="true"', () => {
      render(<StarRatingInput value={3} onChange={mockOnChange} />);

      const selectedStar = screen.getByRole('radio', { name: '3 stars' });
      expect(selectedStar).toHaveAttribute('aria-checked', 'true');
    });

    it('marks unselected stars with aria-checked="false"', () => {
      render(<StarRatingInput value={3} onChange={mockOnChange} />);

      const unselectedStar = screen.getByRole('radio', { name: '5 stars' });
      expect(unselectedStar).toHaveAttribute('aria-checked', 'false');
    });

    it('has proper role attributes', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} label="Rating" />);

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      const stars = screen.getAllByRole('radio');
      expect(stars).toHaveLength(5);
    });

    it('supports focus ring for keyboard navigation', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} />);
      const firstStar = screen.getByRole('radio', { name: '1 star' });

      expect(firstStar).toHaveClass('focus:outline-none');
      expect(firstStar).toHaveClass('focus:ring-2');
      expect(firstStar).toHaveClass('focus:ring-primary');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to container', () => {
      const { container } = render(
        <StarRatingInput value={0} onChange={mockOnChange} className="custom-test-class" />
      );

      expect(container.firstChild).toHaveClass('custom-test-class');
    });
  });

  describe('Edge cases', () => {
    it('handles value greater than maxRating gracefully', () => {
      const { container } = render(<StarRatingInput value={10} onChange={mockOnChange} maxRating={5} />);

      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(5); // All stars filled
    });

    it('handles negative value gracefully', () => {
      const { container } = render(<StarRatingInput value={-1} onChange={mockOnChange} />);

      const filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(0); // No stars filled
    });

    it('handles maxRating of 1', () => {
      render(<StarRatingInput value={0} onChange={mockOnChange} maxRating={1} />);
      const stars = screen.getAllByRole('radio');
      expect(stars).toHaveLength(1);
      expect(screen.getByRole('radio', { name: '1 star' })).toBeInTheDocument();
    });

    it('handles maxRating of 10', () => {
      render(<StarRatingInput value={7} onChange={mockOnChange} maxRating={10} />);
      const stars = screen.getAllByRole('radio');
      expect(stars).toHaveLength(10);
      expect(screen.getByText('7 out of 10')).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    it('handles rapid clicking correctly', () => {
      const { rerender } = render(<StarRatingInput value={0} onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('radio', { name: '1 star' }));
      rerender(<StarRatingInput value={1} onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('radio', { name: '3 stars' }));
      rerender(<StarRatingInput value={3} onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));

      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 1);
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 3);
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 5);
    });

    it('handles hover and click in sequence', () => {
      const { container } = render(<StarRatingInput value={0} onChange={mockOnChange} />);
      const fourthStar = screen.getByRole('radio', { name: '4 stars' });

      fireEvent.mouseEnter(fourthStar);
      let filledStars = container.querySelectorAll('.fill-yellow-400');
      expect(filledStars).toHaveLength(4);

      fireEvent.click(fourthStar);
      expect(mockOnChange).toHaveBeenCalledWith(4);
    });
  });
});
