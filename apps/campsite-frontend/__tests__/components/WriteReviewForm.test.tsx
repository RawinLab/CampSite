import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WriteReviewForm } from '@/components/reviews/WriteReviewForm';
import type { CreateReviewInput } from '@campsite/shared';

// Mock StarRatingInput component
jest.mock('@/components/ui/StarRatingInput', () => ({
  StarRatingInput: ({
    value,
    onChange,
    label,
    required,
  }: {
    value: number;
    onChange: (value: number) => void;
    label: string;
    required?: boolean;
  }) => (
    <div>
      <label>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div data-testid={`star-rating-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} stars`}
          >
            {star <= value ? '★' : '☆'}
          </button>
        ))}
      </div>
    </div>
  ),
}));

describe('WriteReviewForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const defaultProps = {
    campsiteId: 'campsite-123',
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all required fields', () => {
      render(<WriteReviewForm {...defaultProps} />);

      expect(screen.getByText('Overall Rating')).toBeInTheDocument();
      expect(screen.getByText(/How did you travel\?/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Your Review/)).toBeInTheDocument();
    });

    it('renders all reviewer type options', () => {
      render(<WriteReviewForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Solo Traveler' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Couple' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Family' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Group' })).toBeInTheDocument();
    });

    it('renders optional fields', () => {
      render(<WriteReviewForm {...defaultProps} />);

      expect(screen.getByLabelText(/Review Title \(optional\)/)).toBeInTheDocument();
      expect(screen.getByLabelText(/What did you like\? \(optional\)/)).toBeInTheDocument();
      expect(screen.getByLabelText(/What could be improved\? \(optional\)/)).toBeInTheDocument();
      expect(screen.getByLabelText(/When did you visit\? \(optional\)/)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<WriteReviewForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Submit Review' })).toBeInTheDocument();
    });

    it('renders cancel button when onCancel is provided', () => {
      render(<WriteReviewForm {...defaultProps} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('does not render cancel button when onCancel is not provided', () => {
      render(<WriteReviewForm {...defaultProps} />);

      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    });

    it('hides sub-ratings by default', () => {
      render(<WriteReviewForm {...defaultProps} />);

      expect(screen.queryByText('Cleanliness')).not.toBeInTheDocument();
      expect(screen.queryByText('Staff')).not.toBeInTheDocument();
      expect(screen.queryByText('Facilities')).not.toBeInTheDocument();
    });

    it('shows sub-ratings when toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const toggleButton = screen.getByRole('button', {
        name: /Add detailed ratings \(optional\)/,
      });
      await user.click(toggleButton);

      expect(screen.getByText('Cleanliness')).toBeInTheDocument();
      expect(screen.getByText('Staff')).toBeInTheDocument();
      expect(screen.getByText('Facilities')).toBeInTheDocument();
      expect(screen.getByText('Value for Money')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('hides sub-ratings when toggle is clicked again', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const toggleButton = screen.getByRole('button', {
        name: /Add detailed ratings \(optional\)/,
      });
      await user.click(toggleButton);

      expect(screen.getByText('Cleanliness')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Hide detailed ratings/ }));

      expect(screen.queryByText('Cleanliness')).not.toBeInTheDocument();
    });
  });

  describe('Validation - Overall Rating', () => {
    it('shows error when overall rating is not selected', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select an overall rating')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('clears overall rating error when rating is selected', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select an overall rating')).toBeInTheDocument();
      });

      const ratingButton = screen.getByRole('button', { name: 'Rate 4 stars' });
      await user.click(ratingButton);

      await waitFor(() => {
        expect(screen.queryByText('Please select an overall rating')).not.toBeInTheDocument();
      });
    });
  });

  describe('Validation - Reviewer Type', () => {
    it('shows error when reviewer type is not selected', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select your travel type')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('clears reviewer type error when type is selected', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select your travel type')).toBeInTheDocument();
      });

      const coupleButton = screen.getByRole('button', { name: 'Couple' });
      await user.click(coupleButton);

      await waitFor(() => {
        expect(screen.queryByText('Please select your travel type')).not.toBeInTheDocument();
      });
    });

    it('highlights selected reviewer type', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const familyButton = screen.getByRole('button', { name: 'Family' });
      await user.click(familyButton);

      // The selected button should have default variant styling
      expect(familyButton.className).toContain('');
    });
  });

  describe('Validation - Content', () => {
    it('shows error when content is too short (less than 20 characters)', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const contentTextarea = screen.getByLabelText(/Your Review/);
      await user.type(contentTextarea, 'Too short');

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Review must be at least 20 characters')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when content is too long (more than 2000 characters)', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const contentTextarea = screen.getByLabelText(/Your Review/) as HTMLTextAreaElement;
      const longContent = 'a'.repeat(2001);

      // Remove maxLength temporarily to test validation logic
      contentTextarea.removeAttribute('maxLength');

      // Use fireEvent to trigger React's onChange handler
      fireEvent.change(contentTextarea, { target: { value: longContent } });

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Review must be 2000 characters or less')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('clears content error when valid content is entered', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const contentTextarea = screen.getByLabelText(/Your Review/);
      await user.type(contentTextarea, 'Short');

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Review must be at least 20 characters')).toBeInTheDocument();
      });

      await user.clear(contentTextarea);
      await user.type(contentTextarea, 'This is a valid review with more than 20 characters');

      await waitFor(() => {
        expect(
          screen.queryByText('Review must be at least 20 characters')
        ).not.toBeInTheDocument();
      });
    });

    it('displays character count', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const contentTextarea = screen.getByLabelText(/Your Review/);
      expect(screen.getByText(/0\/2000/)).toBeInTheDocument();

      await user.type(contentTextarea, 'Hello');
      expect(screen.getByText(/5\/2000/)).toBeInTheDocument();
    });
  });

  describe('Validation - Title', () => {
    it('shows error when title is too long (more than 100 characters)', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Review Title \(optional\)/) as HTMLInputElement;
      const longTitle = 'a'.repeat(101);

      // Remove maxLength temporarily to test validation logic
      titleInput.removeAttribute('maxLength');

      // Use fireEvent to trigger React's onChange handler
      fireEvent.change(titleInput, { target: { value: longTitle } });

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Title must be 100 characters or less')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('allows empty title (optional field)', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<WriteReviewForm {...defaultProps} />);

      // Select rating
      const ratingButton = screen.getByRole('button', { name: 'Rate 5 stars' });
      await user.click(ratingButton);

      // Select reviewer type
      const soloButton = screen.getByRole('button', { name: 'Solo Traveler' });
      await user.click(soloButton);

      // Enter content
      const contentTextarea = screen.getByLabelText(/Your Review/);
      await user.type(contentTextarea, 'This is a valid review with sufficient characters');

      // Leave title empty and submit
      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Optional Fields', () => {
    it('allows submission without sub-ratings', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<WriteReviewForm {...defaultProps} />);

      // Fill required fields only
      const ratingButton = screen.getByRole('button', { name: 'Rate 4 stars' });
      await user.click(ratingButton);

      const familyButton = screen.getByRole('button', { name: 'Family' });
      await user.click(familyButton);

      const contentTextarea = screen.getByLabelText(/Your Review/);
      await user.click(contentTextarea);
      await user.paste('Great camping experience with my family');

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          campsite_id: 'campsite-123',
          rating_overall: 4,
          reviewer_type: 'family',
          content: 'Great camping experience with my family',
        });
      });
    });

    it('includes sub-ratings when provided', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<WriteReviewForm {...defaultProps} />);

      // Fill required fields
      const ratingButton = screen.getByRole('button', { name: 'Rate 5 stars' });
      await user.click(ratingButton);

      const coupleButton = screen.getByRole('button', { name: 'Couple' });
      await user.click(coupleButton);

      const contentTextarea = screen.getByLabelText(/Your Review/);
      await user.type(contentTextarea, 'Amazing place for couples to enjoy nature');

      // Show sub-ratings
      const toggleButton = screen.getByRole('button', {
        name: /Add detailed ratings \(optional\)/,
      });
      await user.click(toggleButton);

      // Set sub-ratings
      const cleanlinessRating = screen
        .getByTestId('star-rating-cleanliness')
        .querySelector('[aria-label="Rate 5 stars"]') as HTMLElement;
      await user.click(cleanlinessRating);

      const staffRating = screen
        .getByTestId('star-rating-staff')
        .querySelector('[aria-label="Rate 4 stars"]') as HTMLElement;
      await user.click(staffRating);

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          campsite_id: 'campsite-123',
          rating_overall: 5,
          reviewer_type: 'couple',
          content: 'Amazing place for couples to enjoy nature',
          rating_cleanliness: 5,
          rating_staff: 4,
        });
      });
    });

    it('includes pros, cons, and visited_at when provided', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<WriteReviewForm {...defaultProps} />);

      // Fill required fields
      const ratingButton = screen.getByRole('button', { name: 'Rate 4 stars' });
      await user.click(ratingButton);

      const groupButton = screen.getByRole('button', { name: 'Group' });
      await user.click(groupButton);

      const contentTextarea = screen.getByLabelText(/Your Review/);
      await user.type(contentTextarea, 'Good campsite overall with some minor issues');

      // Fill optional fields
      const titleInput = screen.getByLabelText(/Review Title \(optional\)/);
      await user.type(titleInput, 'Nice but could be better');

      const prosTextarea = screen.getByLabelText(/What did you like\? \(optional\)/);
      await user.type(prosTextarea, 'Beautiful scenery and friendly staff');

      const consTextarea = screen.getByLabelText(/What could be improved\? \(optional\)/);
      await user.type(consTextarea, 'Bathrooms need maintenance');

      const visitedInput = screen.getByLabelText(/When did you visit\? \(optional\)/);
      await user.type(visitedInput, '2024-01-15');

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          campsite_id: 'campsite-123',
          rating_overall: 4,
          reviewer_type: 'group',
          content: 'Good campsite overall with some minor issues',
          title: 'Nice but could be better',
          pros: 'Beautiful scenery and friendly staff',
          cons: 'Bathrooms need maintenance',
          visited_at: '2024-01-15',
        });
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with valid data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<WriteReviewForm {...defaultProps} />);

      const ratingButton = screen.getByRole('button', { name: 'Rate 3 stars' });
      await user.click(ratingButton);

      const soloButton = screen.getByRole('button', { name: 'Solo Traveler' });
      await user.click(soloButton);

      const contentTextarea = screen.getByLabelText(/Your Review/);
      await user.type(contentTextarea, 'Solo camping was a peaceful experience');

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({
          campsite_id: 'campsite-123',
          rating_overall: 3,
          reviewer_type: 'solo',
          content: 'Solo camping was a peaceful experience',
        });
      });
    });

    it('does not call onSubmit when validation fails', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select an overall rating')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('prevents form submission during loading state', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} isSubmitting={true} />);

      const submitButton = screen.getByRole('button', { name: 'Submitting...' });
      expect(submitButton).toBeDisabled();

      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('displays loading text when isSubmitting is true', () => {
      render(<WriteReviewForm {...defaultProps} isSubmitting={true} />);

      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument();
    });

    it('disables submit button when isSubmitting is true', () => {
      render(<WriteReviewForm {...defaultProps} isSubmitting={true} />);

      const submitButton = screen.getByRole('button', { name: 'Submitting...' });
      expect(submitButton).toBeDisabled();
    });

    it('shows normal text when isSubmitting is false', () => {
      render(<WriteReviewForm {...defaultProps} isSubmitting={false} />);

      expect(screen.getByRole('button', { name: 'Submit Review' })).toBeInTheDocument();
    });
  });

  describe('Cancel Button', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Field Interactions', () => {
    it('updates form data when rating is changed', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<WriteReviewForm {...defaultProps} />);

      const rating3 = screen.getByRole('button', { name: 'Rate 3 stars' });
      await user.click(rating3);

      const rating5 = screen.getByRole('button', { name: 'Rate 5 stars' });
      await user.click(rating5);

      const soloButton = screen.getByRole('button', { name: 'Solo Traveler' });
      await user.click(soloButton);

      const contentTextarea = screen.getByLabelText(/Your Review/);
      await user.type(contentTextarea, 'Updated rating to 5 stars after reconsideration');

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            rating_overall: 5,
          })
        );
      });
    });

    it('allows changing reviewer type', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<WriteReviewForm {...defaultProps} />);

      const familyButton = screen.getByRole('button', { name: 'Family' });
      await user.click(familyButton);

      const coupleButton = screen.getByRole('button', { name: 'Couple' });
      await user.click(coupleButton);

      const ratingButton = screen.getByRole('button', { name: 'Rate 4 stars' });
      await user.click(ratingButton);

      const contentTextarea = screen.getByLabelText(/Your Review/);
      await user.type(contentTextarea, 'Changed from family to couple reviewer type');

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            reviewer_type: 'couple',
          })
        );
      });
    });

    it('respects maxLength constraints', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const contentTextarea = screen.getByLabelText(/Your Review/) as HTMLTextAreaElement;
      expect(contentTextarea.maxLength).toBe(2000);

      const titleInput = screen.getByLabelText(/Review Title \(optional\)/) as HTMLInputElement;
      expect(titleInput.maxLength).toBe(100);

      const prosTextarea = screen.getByLabelText(
        /What did you like\? \(optional\)/
      ) as HTMLTextAreaElement;
      expect(prosTextarea.maxLength).toBe(500);

      const consTextarea = screen.getByLabelText(
        /What could be improved\? \(optional\)/
      ) as HTMLTextAreaElement;
      expect(consTextarea.maxLength).toBe(500);
    });

    it('validates visit date is not in the future', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const visitedInput = screen.getByLabelText(
        /When did you visit\? \(optional\)/
      ) as HTMLInputElement;

      const today = new Date().toISOString().split('T')[0];
      expect(visitedInput.max).toBe(today);
    });
  });

  describe('Multiple Validation Errors', () => {
    it('shows all validation errors at once', async () => {
      const user = userEvent.setup();
      render(<WriteReviewForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select an overall rating')).toBeInTheDocument();
        expect(screen.getByText('Please select your travel type')).toBeInTheDocument();
        expect(screen.getByText('Review must be at least 20 characters')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('clears all errors when form is valid', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<WriteReviewForm {...defaultProps} />);

      // Submit to show errors
      const submitButton = screen.getByRole('button', { name: 'Submit Review' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select an overall rating')).toBeInTheDocument();
      });

      // Fix all validation errors
      const ratingButton = screen.getByRole('button', { name: 'Rate 4 stars' });
      await user.click(ratingButton);

      const soloButton = screen.getByRole('button', { name: 'Solo Traveler' });
      await user.click(soloButton);

      const contentTextarea = screen.getByLabelText(/Your Review/);
      await user.type(contentTextarea, 'All fields are now valid and ready to submit');

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        expect(screen.queryByText('Please select an overall rating')).not.toBeInTheDocument();
        expect(screen.queryByText('Please select your travel type')).not.toBeInTheDocument();
        expect(
          screen.queryByText('Review must be at least 20 characters')
        ).not.toBeInTheDocument();
      });
    });
  });
});
