import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewFilters } from '@/components/reviews/ReviewFilters';
import type { ReviewSortBy, ReviewerType } from '@campsite/shared';

describe('ReviewFilters Component', () => {
  const mockOnSortChange = jest.fn();
  const mockOnReviewerTypeChange = jest.fn();

  beforeEach(() => {
    mockOnSortChange.mockClear();
    mockOnReviewerTypeChange.mockClear();
  });

  describe('Sort dropdown', () => {
    it('renders sort dropdown with label', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      expect(screen.getByLabelText('Sort by:')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Sort by:' })).toBeInTheDocument();
    });

    it('renders all sort options', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const select = screen.getByRole('combobox', { name: 'Sort by:' });
      const options = Array.from(select.querySelectorAll('option'));

      expect(options).toHaveLength(4);
      expect(options[0]).toHaveValue('newest');
      expect(options[0]).toHaveTextContent('Newest');
      expect(options[1]).toHaveValue('helpful');
      expect(options[1]).toHaveTextContent('Most Helpful');
      expect(options[2]).toHaveValue('rating_high');
      expect(options[2]).toHaveTextContent('Highest Rating');
      expect(options[3]).toHaveValue('rating_low');
      expect(options[3]).toHaveTextContent('Lowest Rating');
    });

    it('displays current sort selection', () => {
      render(
        <ReviewFilters
          sortBy="rating_high"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const select = screen.getByRole('combobox', { name: 'Sort by:' }) as HTMLSelectElement;
      expect(select.value).toBe('rating_high');
    });

    it('calls onSortChange when sort option changes', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const select = screen.getByRole('combobox', { name: 'Sort by:' });
      fireEvent.change(select, { target: { value: 'helpful' } });

      expect(mockOnSortChange).toHaveBeenCalledTimes(1);
      expect(mockOnSortChange).toHaveBeenCalledWith('helpful');
    });

    it('calls onSortChange with correct value for each option', () => {
      const { rerender } = render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const select = screen.getByRole('combobox', { name: 'Sort by:' });

      const sortOptions: ReviewSortBy[] = ['newest', 'helpful', 'rating_high', 'rating_low'];

      sortOptions.forEach((option) => {
        mockOnSortChange.mockClear();
        fireEvent.change(select, { target: { value: option } });
        expect(mockOnSortChange).toHaveBeenCalledWith(option);
      });
    });
  });

  describe('Reviewer type filter', () => {
    it('renders filter label and all type buttons', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      expect(screen.getByText('Filter:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'All Types' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Family' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Couple' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Solo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Group' })).toBeInTheDocument();
    });

    it('highlights "All Types" when no reviewer type selected', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          reviewerType={undefined}
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const allTypesButton = screen.getByRole('button', { name: 'All Types' });
      expect(allTypesButton).toHaveClass('bg-primary');
    });

    it('highlights selected reviewer type button', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          reviewerType="family"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const familyButton = screen.getByRole('button', { name: 'Family' });
      expect(familyButton).toHaveClass('bg-primary');

      const allTypesButton = screen.getByRole('button', { name: 'All Types' });
      expect(allTypesButton).not.toHaveClass('bg-primary');
    });

    it('calls onReviewerTypeChange with undefined when "All Types" clicked', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          reviewerType="family"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const allTypesButton = screen.getByRole('button', { name: 'All Types' });
      fireEvent.click(allTypesButton);

      expect(mockOnReviewerTypeChange).toHaveBeenCalledTimes(1);
      expect(mockOnReviewerTypeChange).toHaveBeenCalledWith(undefined);
    });

    it('calls onReviewerTypeChange with correct type when type button clicked', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const familyButton = screen.getByRole('button', { name: 'Family' });
      fireEvent.click(familyButton);

      expect(mockOnReviewerTypeChange).toHaveBeenCalledTimes(1);
      expect(mockOnReviewerTypeChange).toHaveBeenCalledWith('family');
    });

    it('calls onReviewerTypeChange for each reviewer type', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const reviewerTypes: Array<{ type: ReviewerType | undefined; label: string }> = [
        { type: 'family', label: 'Family' },
        { type: 'couple', label: 'Couple' },
        { type: 'solo', label: 'Solo' },
        { type: 'group', label: 'Group' },
      ];

      reviewerTypes.forEach(({ type, label }) => {
        mockOnReviewerTypeChange.mockClear();
        const button = screen.getByRole('button', { name: label });
        fireEvent.click(button);
        expect(mockOnReviewerTypeChange).toHaveBeenCalledWith(type);
      });
    });

    it('non-selected buttons have outline variant styling', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          reviewerType="family"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const coupleButton = screen.getByRole('button', { name: 'Couple' });
      const soloButton = screen.getByRole('button', { name: 'Solo' });

      expect(coupleButton).toHaveClass('border-input');
      expect(soloButton).toHaveClass('border-input');
    });
  });

  describe('Accessibility', () => {
    it('sort dropdown is keyboard accessible', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const select = screen.getByRole('combobox', { name: 'Sort by:' });

      select.focus();
      expect(select).toHaveFocus();

      fireEvent.keyDown(select, { key: 'ArrowDown' });
      fireEvent.change(select, { target: { value: 'helpful' } });

      expect(mockOnSortChange).toHaveBeenCalledWith('helpful');
    });

    it('filter buttons are keyboard accessible', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const familyButton = screen.getByRole('button', { name: 'Family' });

      familyButton.focus();
      expect(familyButton).toHaveFocus();

      fireEvent.click(familyButton);
      expect(mockOnReviewerTypeChange).toHaveBeenCalledWith('family');
    });

    it('sort dropdown has proper label association', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const label = screen.getByText('Sort by:');
      const select = screen.getByRole('combobox', { name: 'Sort by:' });

      expect(label).toHaveAttribute('for', 'sort-by');
      expect(select).toHaveAttribute('id', 'sort-by');
    });

    it('all filter buttons are keyboard navigable', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const buttons = [
        screen.getByRole('button', { name: 'All Types' }),
        screen.getByRole('button', { name: 'Family' }),
        screen.getByRole('button', { name: 'Couple' }),
        screen.getByRole('button', { name: 'Solo' }),
        screen.getByRole('button', { name: 'Group' }),
      ];

      buttons.forEach((button) => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });

    it('sort dropdown has focus ring styles', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const select = screen.getByRole('combobox', { name: 'Sort by:' });
      expect(select).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-1');
    });
  });

  describe('Layout and styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
          className="custom-test-class"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-test-class');
    });

    it('has responsive flex layout classes', () => {
      const { container } = render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'gap-3');
    });

    it('filter buttons have small size styling', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const familyButton = screen.getByRole('button', { name: 'Family' });
      expect(familyButton).toHaveClass('text-xs');
    });
  });

  describe('Current selection highlighting', () => {
    it('correctly highlights current sort option', () => {
      const { rerender } = render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      let select = screen.getByRole('combobox', { name: 'Sort by:' }) as HTMLSelectElement;
      expect(select.value).toBe('newest');

      rerender(
        <ReviewFilters
          sortBy="rating_high"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      select = screen.getByRole('combobox', { name: 'Sort by:' }) as HTMLSelectElement;
      expect(select.value).toBe('rating_high');
    });

    it('correctly highlights current reviewer type', () => {
      const { rerender } = render(
        <ReviewFilters
          sortBy="newest"
          reviewerType="family"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      let familyButton = screen.getByRole('button', { name: 'Family' });
      expect(familyButton).toHaveClass('bg-primary');

      rerender(
        <ReviewFilters
          sortBy="newest"
          reviewerType="solo"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      familyButton = screen.getByRole('button', { name: 'Family' });
      const soloButton = screen.getByRole('button', { name: 'Solo' });

      expect(familyButton).not.toHaveClass('bg-primary');
      expect(soloButton).toHaveClass('bg-primary');
    });

    it('highlights only one reviewer type at a time', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          reviewerType="couple"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const coupleButton = screen.getByRole('button', { name: 'Couple' });
      const familyButton = screen.getByRole('button', { name: 'Family' });
      const soloButton = screen.getByRole('button', { name: 'Solo' });
      const groupButton = screen.getByRole('button', { name: 'Group' });
      const allTypesButton = screen.getByRole('button', { name: 'All Types' });

      expect(coupleButton).toHaveClass('bg-primary');
      expect(familyButton).not.toHaveClass('bg-primary');
      expect(soloButton).not.toHaveClass('bg-primary');
      expect(groupButton).not.toHaveClass('bg-primary');
      expect(allTypesButton).not.toHaveClass('bg-primary');
    });
  });

  describe('Integration', () => {
    it('handles rapid sort changes', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const select = screen.getByRole('combobox', { name: 'Sort by:' });

      fireEvent.change(select, { target: { value: 'helpful' } });
      fireEvent.change(select, { target: { value: 'rating_high' } });
      fireEvent.change(select, { target: { value: 'rating_low' } });

      expect(mockOnSortChange).toHaveBeenCalledTimes(3);
      expect(mockOnSortChange).toHaveBeenNthCalledWith(1, 'helpful');
      expect(mockOnSortChange).toHaveBeenNthCalledWith(2, 'rating_high');
      expect(mockOnSortChange).toHaveBeenNthCalledWith(3, 'rating_low');
    });

    it('handles rapid reviewer type changes', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Family' }));
      fireEvent.click(screen.getByRole('button', { name: 'Solo' }));
      fireEvent.click(screen.getByRole('button', { name: 'All Types' }));

      expect(mockOnReviewerTypeChange).toHaveBeenCalledTimes(3);
      expect(mockOnReviewerTypeChange).toHaveBeenNthCalledWith(1, 'family');
      expect(mockOnReviewerTypeChange).toHaveBeenNthCalledWith(2, 'solo');
      expect(mockOnReviewerTypeChange).toHaveBeenNthCalledWith(3, undefined);
    });

    it('can change both sort and filter independently', () => {
      render(
        <ReviewFilters
          sortBy="newest"
          reviewerType="family"
          onSortChange={mockOnSortChange}
          onReviewerTypeChange={mockOnReviewerTypeChange}
        />
      );

      const select = screen.getByRole('combobox', { name: 'Sort by:' });
      fireEvent.change(select, { target: { value: 'helpful' } });

      const soloButton = screen.getByRole('button', { name: 'Solo' });
      fireEvent.click(soloButton);

      expect(mockOnSortChange).toHaveBeenCalledWith('helpful');
      expect(mockOnReviewerTypeChange).toHaveBeenCalledWith('solo');
    });
  });
});
