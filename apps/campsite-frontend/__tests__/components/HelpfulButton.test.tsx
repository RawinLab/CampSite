import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpfulButton } from '@/components/reviews/HelpfulButton';

describe('HelpfulButton', () => {
  const defaultProps = {
    reviewId: 'review-123',
    helpfulCount: 5,
    userVoted: false,
    isAuthenticated: true,
  };

  describe('Rendering', () => {
    it('renders helpful count', () => {
      render(<HelpfulButton {...defaultProps} />);

      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    it('renders "Helpful" label', () => {
      render(<HelpfulButton {...defaultProps} />);

      expect(screen.getByText('Helpful')).toBeInTheDocument();
    });

    it('does not render count when helpfulCount is 0', () => {
      render(<HelpfulButton {...defaultProps} helpfulCount={0} />);

      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
      expect(screen.getByText('Helpful')).toBeInTheDocument();
    });

    it('renders with voted state visually', () => {
      render(<HelpfulButton {...defaultProps} userVoted={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-green-600');
    });

    it('renders with non-voted state visually', () => {
      render(<HelpfulButton {...defaultProps} userVoted={false} />);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('bg-green-600');
    });
  });

  describe('User Interactions', () => {
    it('increments count optimistically on click', async () => {
      const user = userEvent.setup();
      const mockOnVote = jest.fn().mockResolvedValue(undefined);

      render(<HelpfulButton {...defaultProps} onVote={mockOnVote} />);

      const button = screen.getByRole('button');

      await user.click(button);

      // Should update immediately (optimistic)
      expect(screen.getByText('(6)')).toBeInTheDocument();
      expect(button).toHaveClass('bg-green-600');
    });

    it('decrements count when clicking again (toggle)', async () => {
      const user = userEvent.setup();
      const mockOnVote = jest.fn().mockResolvedValue(undefined);

      render(
        <HelpfulButton
          {...defaultProps}
          userVoted={true}
          helpfulCount={5}
          onVote={mockOnVote}
        />
      );

      const button = screen.getByRole('button');

      await user.click(button);

      // Should decrement immediately (optimistic)
      expect(screen.getByText('(4)')).toBeInTheDocument();
      expect(button).not.toHaveClass('bg-green-600');
    });

    it('calls onVote callback with reviewId', async () => {
      const user = userEvent.setup();
      const mockOnVote = jest.fn().mockResolvedValue(undefined);

      render(<HelpfulButton {...defaultProps} onVote={mockOnVote} />);

      const button = screen.getByRole('button');

      await user.click(button);

      await waitFor(() => {
        expect(mockOnVote).toHaveBeenCalledWith('review-123');
      });
    });

    it('does not call onVote if not authenticated', async () => {
      const user = userEvent.setup();
      const mockOnVote = jest.fn();

      render(
        <HelpfulButton
          {...defaultProps}
          isAuthenticated={false}
          onVote={mockOnVote}
        />
      );

      const button = screen.getByRole('button');

      await user.click(button);

      expect(mockOnVote).not.toHaveBeenCalled();
      // Count should not change
      expect(screen.getByText('(5)')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('is not disabled when not logged in (allows click for feedback)', async () => {
      const user = userEvent.setup();
      render(<HelpfulButton {...defaultProps} isAuthenticated={false} />);

      const button = screen.getByRole('button');

      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute('title', 'Login to vote');
    });

    it('shows disabled state during loading', async () => {
      const user = userEvent.setup();
      const mockOnVote = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );

      render(<HelpfulButton {...defaultProps} onVote={mockOnVote} />);

      const button = screen.getByRole('button');

      await user.click(button);

      // Should be disabled while loading
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('re-enables button after vote completes', async () => {
      const user = userEvent.setup();
      const mockOnVote = jest.fn().mockResolvedValue(undefined);

      render(<HelpfulButton {...defaultProps} onVote={mockOnVote} />);

      const button = screen.getByRole('button');

      await user.click(button);

      await waitFor(() => {
        expect(mockOnVote).toHaveBeenCalled();
      });

      // Should be enabled again after completion
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('reverts count on API error', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Use a delayed rejection to allow observing optimistic update
      let rejectFn: (error: Error) => void;
      const mockOnVote = jest.fn().mockImplementation(
        () =>
          new Promise<void>((_, reject) => {
            rejectFn = reject;
          })
      );

      render(<HelpfulButton {...defaultProps} helpfulCount={5} onVote={mockOnVote} />);

      const button = screen.getByRole('button');

      // Initial state
      expect(screen.getByText('(5)')).toBeInTheDocument();

      await user.click(button);

      // Should show optimistic update first
      await waitFor(() => {
        expect(screen.getByText('(6)')).toBeInTheDocument();
      });

      // Now trigger the rejection
      rejectFn!(new Error('Network error'));

      // Should revert after error
      await waitFor(() => {
        expect(screen.getByText('(5)')).toBeInTheDocument();
      });

      // Should revert voted state
      expect(button).not.toHaveClass('bg-green-600');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to toggle helpful vote:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('reverts voted state on API error when toggling off', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Use a delayed rejection to allow observing optimistic update
      let rejectFn: (error: Error) => void;
      const mockOnVote = jest.fn().mockImplementation(
        () =>
          new Promise<void>((_, reject) => {
            rejectFn = reject;
          })
      );

      render(
        <HelpfulButton
          {...defaultProps}
          helpfulCount={5}
          userVoted={true}
          onVote={mockOnVote}
        />
      );

      const button = screen.getByRole('button');

      // Initial state - voted
      expect(screen.getByText('(5)')).toBeInTheDocument();
      expect(button).toHaveClass('bg-green-600');

      await user.click(button);

      // Should show optimistic update first (decrement)
      await waitFor(() => {
        expect(screen.getByText('(4)')).toBeInTheDocument();
      });
      expect(button).not.toHaveClass('bg-green-600');

      // Now trigger the rejection
      rejectFn!(new Error('Network error'));

      // Should revert after error
      await waitFor(() => {
        expect(screen.getByText('(5)')).toBeInTheDocument();
      });

      // Should revert to voted state
      await waitFor(() => {
        expect(button).toHaveClass('bg-green-600');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Props Synchronization', () => {
    it('updates count when props change', () => {
      const { rerender } = render(<HelpfulButton {...defaultProps} helpfulCount={5} />);

      expect(screen.getByText('(5)')).toBeInTheDocument();

      rerender(<HelpfulButton {...defaultProps} helpfulCount={10} />);

      expect(screen.getByText('(10)')).toBeInTheDocument();
    });

    it('updates voted state when props change', () => {
      const { rerender } = render(
        <HelpfulButton {...defaultProps} userVoted={false} />
      );

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('bg-green-600');

      rerender(<HelpfulButton {...defaultProps} userVoted={true} />);

      expect(button).toHaveClass('bg-green-600');
    });
  });

  describe('Accessibility', () => {
    it('has proper title when authenticated and not voted', () => {
      render(<HelpfulButton {...defaultProps} userVoted={false} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Mark as helpful');
    });

    it('has proper title when authenticated and voted', () => {
      render(<HelpfulButton {...defaultProps} userVoted={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Remove helpful vote');
    });

    it('has proper title when not authenticated', () => {
      render(<HelpfulButton {...defaultProps} isAuthenticated={false} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Login to vote');
    });
  });

  describe('Edge Cases', () => {
    it('prevents multiple clicks while loading', async () => {
      const user = userEvent.setup();
      const mockOnVote = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );

      render(<HelpfulButton {...defaultProps} onVote={mockOnVote} />);

      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should only call once
      expect(mockOnVote).toHaveBeenCalledTimes(1);
    });

    it('handles missing onVote callback gracefully', async () => {
      const user = userEvent.setup();

      render(<HelpfulButton {...defaultProps} />);

      const button = screen.getByRole('button');

      // Should not throw error
      await user.click(button);

      // Should still update optimistically
      expect(screen.getByText('(6)')).toBeInTheDocument();
      expect(button).toHaveClass('bg-green-600');
    });
  });
});
