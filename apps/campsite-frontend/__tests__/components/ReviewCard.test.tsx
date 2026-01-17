import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import type { ReviewWithUser } from '@campsite/shared';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock child components
jest.mock('@/components/ui/StarRating', () => ({
  StarRating: ({ rating }: { rating: number }) => (
    <div data-testid="star-rating">Rating: {rating}</div>
  ),
}));

jest.mock('@/components/reviews/ReviewPhotos', () => ({
  ReviewPhotos: ({ photos }: { photos: { url: string }[] }) => (
    <div data-testid="review-photos">Photos: {photos.length}</div>
  ),
}));

jest.mock('@/components/reviews/HelpfulButton', () => ({
  HelpfulButton: ({
    helpfulCount,
    userVoted,
  }: {
    helpfulCount: number;
    userVoted?: boolean;
  }) => (
    <button data-testid="helpful-button">
      Helpful ({helpfulCount}) {userVoted ? '- Voted' : ''}
    </button>
  ),
}));

describe('ReviewCard', () => {
  const mockReview: ReviewWithUser = {
    id: 'review-001',
    campsite_id: 'campsite-001',
    user_id: 'user-001',
    rating_overall: 4.5,
    rating_cleanliness: 5,
    rating_staff: 4,
    rating_facilities: 4,
    rating_value: 5,
    rating_location: 4,
    reviewer_type: 'family',
    title: 'Great camping experience!',
    content: 'We had an amazing time at this campsite. The facilities were clean and well-maintained.',
    pros: 'Clean facilities, friendly staff',
    cons: 'A bit crowded on weekends',
    helpful_count: 12,
    is_reported: false,
    report_count: 0,
    is_hidden: false,
    hidden_reason: null,
    hidden_at: null,
    hidden_by: null,
    owner_response: null,
    owner_response_at: null,
    visited_at: '2024-01-15T00:00:00Z',
    created_at: '2024-01-20T10:30:00Z',
    updated_at: '2024-01-20T10:30:00Z',
    reviewer_name: 'John Doe',
    reviewer_avatar: 'https://example.com/avatar.jpg',
    photos: [
      { id: 'photo-1', review_id: 'review-001', url: 'https://example.com/photo1.jpg', sort_order: 0 },
      { id: 'photo-2', review_id: 'review-001', url: 'https://example.com/photo2.jpg', sort_order: 1 },
    ],
    user_helpful_vote: false,
  };

  describe('User Information Display', () => {
    it('renders user name', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders user avatar when provided', () => {
      render(<ReviewCard review={mockReview} />);

      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('renders fallback initial when avatar is not provided', () => {
      const reviewNoAvatar: ReviewWithUser = {
        ...mockReview,
        reviewer_avatar: null,
      };

      const { container } = render(<ReviewCard review={reviewNoAvatar} />);

      expect(screen.getByText('J')).toBeInTheDocument();
      expect(container.querySelector('.text-gray-500.text-lg.font-medium')).toBeInTheDocument();
    });

    it('renders empty name when reviewer name is empty', () => {
      const reviewNoName: ReviewWithUser = {
        ...mockReview,
        reviewer_name: '',
        reviewer_avatar: null,
      };

      render(<ReviewCard review={reviewNoName} />);

      // Should render fallback avatar initial "A" since name is empty
      const fallback = screen.getByText('A');
      expect(fallback).toBeInTheDocument();
    });
  });

  describe('Reviewer Type Badge', () => {
    it('renders reviewer type "Family" for family type', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('Family')).toBeInTheDocument();
    });

    it('renders reviewer type "Couple" for couple type', () => {
      const coupleReview: ReviewWithUser = {
        ...mockReview,
        reviewer_type: 'couple',
      };

      render(<ReviewCard review={coupleReview} />);

      expect(screen.getByText('Couple')).toBeInTheDocument();
    });

    it('renders reviewer type "Solo Traveler" for solo type', () => {
      const soloReview: ReviewWithUser = {
        ...mockReview,
        reviewer_type: 'solo',
      };

      render(<ReviewCard review={soloReview} />);

      expect(screen.getByText('Solo Traveler')).toBeInTheDocument();
    });

    it('renders reviewer type "Group" for group type', () => {
      const groupReview: ReviewWithUser = {
        ...mockReview,
        reviewer_type: 'group',
      };

      render(<ReviewCard review={groupReview} />);

      expect(screen.getByText('Group')).toBeInTheDocument();
    });
  });

  describe('Star Rating Display', () => {
    it('renders star rating component', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    });

    it('passes correct rating to StarRating component', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText(/Rating: 4.5/)).toBeInTheDocument();
    });

    it('renders different ratings correctly', () => {
      const lowRatingReview: ReviewWithUser = {
        ...mockReview,
        rating_overall: 2,
      };

      render(<ReviewCard review={lowRatingReview} />);

      expect(screen.getByText(/Rating: 2/)).toBeInTheDocument();
    });
  });

  describe('Review Title', () => {
    it('renders review title when present', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('Great camping experience!')).toBeInTheDocument();
    });

    it('does not render title section when title is null', () => {
      const reviewNoTitle: ReviewWithUser = {
        ...mockReview,
        title: null,
      };

      const { container } = render(<ReviewCard review={reviewNoTitle} />);

      expect(screen.queryByText('Great camping experience!')).not.toBeInTheDocument();
      const titleElement = container.querySelector('h4');
      expect(titleElement).not.toBeInTheDocument();
    });

    it('renders title with correct styling', () => {
      const { container } = render(<ReviewCard review={mockReview} />);

      const titleElement = container.querySelector('h4.font-medium.text-gray-900');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('Great camping experience!');
    });
  });

  describe('Review Content', () => {
    it('renders review content', () => {
      render(<ReviewCard review={mockReview} />);

      expect(
        screen.getByText('We had an amazing time at this campsite. The facilities were clean and well-maintained.')
      ).toBeInTheDocument();
    });

    it('preserves whitespace in content with whitespace-pre-wrap', () => {
      const multilineContent = 'Line 1\nLine 2\n\nLine 3';
      const reviewMultiline: ReviewWithUser = {
        ...mockReview,
        content: multilineContent,
      };

      const { container } = render(<ReviewCard review={reviewMultiline} />);

      const contentElement = container.querySelector('.whitespace-pre-wrap');
      expect(contentElement).toBeInTheDocument();
      // Check that whitespace-pre-wrap class is applied
      expect(contentElement?.className).toContain('whitespace-pre-wrap');
    });

    it('renders long content without truncation', () => {
      const longContent = 'This is a very long review. '.repeat(50);
      const reviewLongContent: ReviewWithUser = {
        ...mockReview,
        content: longContent,
      };

      const { container } = render(<ReviewCard review={reviewLongContent} />);

      const contentElement = container.querySelector('.whitespace-pre-wrap');
      expect(contentElement).toBeInTheDocument();
      expect(contentElement?.textContent).toBe(longContent);
    });
  });

  describe('Review Date', () => {
    it('renders review created date', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('Jan 20, 2024')).toBeInTheDocument();
    });

    it('formats different dates correctly', () => {
      const differentDateReview: ReviewWithUser = {
        ...mockReview,
        created_at: '2023-12-25T15:45:00Z',
      };

      render(<ReviewCard review={differentDateReview} />);

      expect(screen.getByText('Dec 25, 2023')).toBeInTheDocument();
    });
  });

  describe('Pros and Cons Display', () => {
    it('renders pros when provided', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('Clean facilities, friendly staff')).toBeInTheDocument();
    });

    it('renders cons when provided', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('A bit crowded on weekends')).toBeInTheDocument();
    });

    it('does not render pros/cons section when both are null', () => {
      const reviewNoProsConsReview: ReviewWithUser = {
        ...mockReview,
        pros: null,
        cons: null,
      };

      const { container } = render(<ReviewCard review={reviewNoProsConsReview} />);

      const prosConsGrid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2');
      expect(prosConsGrid).not.toBeInTheDocument();
    });

    it('renders only pros when cons is null', () => {
      const reviewOnlyPros: ReviewWithUser = {
        ...mockReview,
        cons: null,
      };

      render(<ReviewCard review={reviewOnlyPros} />);

      expect(screen.getByText('Clean facilities, friendly staff')).toBeInTheDocument();
      expect(screen.queryByText('A bit crowded on weekends')).not.toBeInTheDocument();
    });

    it('renders only cons when pros is null', () => {
      const reviewOnlyCons: ReviewWithUser = {
        ...mockReview,
        pros: null,
      };

      render(<ReviewCard review={reviewOnlyCons} />);

      expect(screen.queryByText('Clean facilities, friendly staff')).not.toBeInTheDocument();
      expect(screen.getByText('A bit crowded on weekends')).toBeInTheDocument();
    });

    it('displays pros with green checkmark icon', () => {
      const { container } = render(<ReviewCard review={mockReview} />);

      const greenCheckIcon = container.querySelector('.text-green-600 svg');
      expect(greenCheckIcon).toBeInTheDocument();
    });

    it('displays cons with red X icon', () => {
      const { container } = render(<ReviewCard review={mockReview} />);

      const redXIcon = container.querySelector('.text-red-500 svg');
      expect(redXIcon).toBeInTheDocument();
    });
  });

  describe('Review Photos', () => {
    it('renders photos when present', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByTestId('review-photos')).toBeInTheDocument();
      expect(screen.getByText('Photos: 2')).toBeInTheDocument();
    });

    it('does not render photos section when photos array is empty', () => {
      const reviewNoPhotos: ReviewWithUser = {
        ...mockReview,
        photos: [],
      };

      render(<ReviewCard review={reviewNoPhotos} />);

      expect(screen.queryByTestId('review-photos')).not.toBeInTheDocument();
    });

    it('renders multiple photos', () => {
      const reviewManyPhotos: ReviewWithUser = {
        ...mockReview,
        photos: [
          { id: 'photo-1', review_id: 'review-001', url: 'https://example.com/photo1.jpg', sort_order: 0 },
          { id: 'photo-2', review_id: 'review-001', url: 'https://example.com/photo2.jpg', sort_order: 1 },
          { id: 'photo-3', review_id: 'review-001', url: 'https://example.com/photo3.jpg', sort_order: 2 },
          { id: 'photo-4', review_id: 'review-001', url: 'https://example.com/photo4.jpg', sort_order: 3 },
        ],
      };

      render(<ReviewCard review={reviewManyPhotos} />);

      expect(screen.getByText('Photos: 4')).toBeInTheDocument();
    });
  });

  describe('Owner Response', () => {
    it('renders owner response when present', () => {
      const reviewWithResponse: ReviewWithUser = {
        ...mockReview,
        owner_response: 'Thank you for your feedback! We appreciate your visit.',
        owner_response_at: '2024-01-21T14:00:00Z',
      };

      render(<ReviewCard review={reviewWithResponse} />);

      expect(screen.getByText('Response from owner')).toBeInTheDocument();
      expect(screen.getByText('Thank you for your feedback! We appreciate your visit.')).toBeInTheDocument();
      expect(screen.getByText('Jan 21, 2024')).toBeInTheDocument();
    });

    it('does not render owner response section when not present', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.queryByText('Response from owner')).not.toBeInTheDocument();
    });

    it('renders owner response without date when date is null', () => {
      const reviewWithResponseNoDate: ReviewWithUser = {
        ...mockReview,
        owner_response: 'Thank you for your feedback!',
        owner_response_at: null,
      };

      const { container } = render(<ReviewCard review={reviewWithResponseNoDate} />);

      expect(screen.getByText('Response from owner')).toBeInTheDocument();
      expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
      // Check that the date element is not present
      const dateElement = container.querySelector('.text-xs.text-gray-500');
      expect(dateElement).not.toBeInTheDocument();
    });
  });

  describe('Helpful Button', () => {
    it('renders helpful button', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByTestId('helpful-button')).toBeInTheDocument();
    });

    it('displays helpful count', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText(/Helpful \(12\)/)).toBeInTheDocument();
    });

    it('passes user vote status to HelpfulButton', () => {
      const reviewVoted: ReviewWithUser = {
        ...mockReview,
        user_helpful_vote: true,
      };

      render(<ReviewCard review={reviewVoted} />);

      expect(screen.getByText(/- Voted/)).toBeInTheDocument();
    });

    it('passes authentication state to HelpfulButton', () => {
      render(<ReviewCard review={mockReview} isAuthenticated={true} />);

      expect(screen.getByTestId('helpful-button')).toBeInTheDocument();
    });

    it('passes onHelpfulVote handler to HelpfulButton', () => {
      const mockOnHelpfulVote = jest.fn();

      render(<ReviewCard review={mockReview} onHelpfulVote={mockOnHelpfulVote} />);

      expect(screen.getByTestId('helpful-button')).toBeInTheDocument();
    });
  });

  describe('Report Button', () => {
    it('renders report button when user is authenticated and not own review', () => {
      render(
        <ReviewCard
          review={mockReview}
          isAuthenticated={true}
          currentUserId="user-002"
          onReport={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /Report/i })).toBeInTheDocument();
    });

    it('does not render report button for own review', () => {
      render(
        <ReviewCard
          review={mockReview}
          isAuthenticated={true}
          currentUserId="user-001"
          onReport={jest.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: /Report/i })).not.toBeInTheDocument();
    });

    it('does not render report button when user is not authenticated', () => {
      render(
        <ReviewCard
          review={mockReview}
          isAuthenticated={false}
          currentUserId="user-002"
          onReport={jest.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: /Report/i })).not.toBeInTheDocument();
    });

    it('does not render report button when onReport is not provided', () => {
      render(<ReviewCard review={mockReview} isAuthenticated={true} currentUserId="user-002" />);

      expect(screen.queryByRole('button', { name: /Report/i })).not.toBeInTheDocument();
    });

    it('calls onReport handler when report button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnReport = jest.fn();

      render(
        <ReviewCard
          review={mockReview}
          isAuthenticated={true}
          currentUserId="user-002"
          onReport={mockOnReport}
        />
      );

      const reportButton = screen.getByRole('button', { name: /Report/i });
      await user.click(reportButton);

      expect(mockOnReport).toHaveBeenCalledTimes(1);
      expect(mockOnReport).toHaveBeenCalledWith('review-001');
    });

    it('applies correct styling to report button', () => {
      render(
        <ReviewCard
          review={mockReview}
          isAuthenticated={true}
          currentUserId="user-002"
          onReport={jest.fn()}
        />
      );

      const reportButton = screen.getByRole('button', { name: /Report/i });
      expect(reportButton).toHaveClass('text-xs', 'text-gray-500', 'hover:text-gray-700');
    });
  });

  describe('Missing Optional Fields', () => {
    it('handles review with all optional fields missing', () => {
      const minimalReview: ReviewWithUser = {
        id: 'review-002',
        campsite_id: 'campsite-001',
        user_id: 'user-003',
        rating_overall: 3,
        rating_cleanliness: null,
        rating_staff: null,
        rating_facilities: null,
        rating_value: null,
        rating_location: null,
        reviewer_type: 'solo',
        title: null,
        content: 'Simple review content',
        pros: null,
        cons: null,
        helpful_count: 0,
        is_reported: false,
        report_count: 0,
        is_hidden: false,
        hidden_reason: null,
        hidden_at: null,
        hidden_by: null,
        owner_response: null,
        owner_response_at: null,
        visited_at: null,
        created_at: '2024-01-22T10:00:00Z',
        updated_at: '2024-01-22T10:00:00Z',
        reviewer_name: 'Jane Smith',
        reviewer_avatar: null,
        photos: [],
        user_helpful_vote: undefined,
      };

      render(<ReviewCard review={minimalReview} />);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Simple review content')).toBeInTheDocument();
      expect(screen.getByText(/Rating: 3/)).toBeInTheDocument();
      expect(screen.queryByTestId('review-photos')).not.toBeInTheDocument();
      expect(screen.queryByText('Response from owner')).not.toBeInTheDocument();
    });

    it('handles undefined currentUserId gracefully', () => {
      render(<ReviewCard review={mockReview} isAuthenticated={true} onReport={jest.fn()} />);

      expect(screen.getByRole('button', { name: /Report/i })).toBeInTheDocument();
    });

    it('handles zero helpful count', () => {
      const reviewNoHelpful: ReviewWithUser = {
        ...mockReview,
        helpful_count: 0,
      };

      render(<ReviewCard review={reviewNoHelpful} />);

      expect(screen.getByText(/Helpful \(0\)/)).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className to the card', () => {
      const { container } = render(<ReviewCard review={mockReview} className="custom-class" />);

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('preserves default classes when custom className is provided', () => {
      const { container } = render(<ReviewCard review={mockReview} className="custom-class" />);

      const card = container.querySelector('.border-b.border-gray-200.pb-6.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Card Structure and Layout', () => {
    it('renders with correct border and padding classes', () => {
      const { container } = render(<ReviewCard review={mockReview} />);

      const card = container.querySelector('.border-b.border-gray-200.pb-6');
      expect(card).toBeInTheDocument();
    });

    it('displays avatar with correct size and shape', () => {
      const { container } = render(<ReviewCard review={mockReview} />);

      const avatarContainer = container.querySelector('.w-10.h-10.rounded-full');
      expect(avatarContainer).toBeInTheDocument();
    });

    it('maintains responsive grid for pros and cons', () => {
      const { container } = render(<ReviewCard review={mockReview} />);

      const grid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
    });
  });
});
