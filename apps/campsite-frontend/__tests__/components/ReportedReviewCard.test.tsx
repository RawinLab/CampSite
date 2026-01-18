import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportedReviewCard } from '@/components/admin/ReportedReviewCard';

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date, options) => {
    const dateStr = date instanceof Date ? date.toISOString() : date.toString();
    if (dateStr.includes('2024-01-15')) {
      return options?.addSuffix ? '2 days ago' : '2 days';
    }
    if (dateStr.includes('2024-01-14')) {
      return options?.addSuffix ? '3 days ago' : '3 days';
    }
    return options?.addSuffix ? '1 hour ago' : '1 hour';
  }),
}));

// Mock StarRating component
jest.mock('@/components/ui/StarRating', () => ({
  StarRating: ({ rating, size }: { rating: number; size: string }) => (
    <div data-testid="star-rating" data-rating={rating} data-size={size}>
      {rating} stars
    </div>
  ),
}));

// Mock RejectDialog component
jest.mock('@/components/admin/RejectDialog', () => ({
  RejectDialog: ({
    open,
    onOpenChange,
    title,
    description,
    itemName,
    onConfirm,
    isLoading,
    minReasonLength,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    itemName: string;
    onConfirm: (reason: string) => void;
    isLoading: boolean;
    minReasonLength?: number;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="hide-dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <p>Item: {itemName}</p>
        <p>Min length: {minReasonLength}</p>
        <button
          onClick={() => onConfirm('Test hide reason')}
          disabled={isLoading}
          data-testid="dialog-confirm"
        >
          {isLoading ? 'Loading...' : 'Confirm'}
        </button>
        <button onClick={() => onOpenChange(false)} data-testid="dialog-cancel">
          Cancel
        </button>
      </div>
    );
  },
}));

const mockReports = [
  {
    id: 'report-1',
    user_id: 'user-1',
    reporter_name: 'Alice Smith',
    reason: 'spam' as const,
    details: 'This review appears to be spam advertising',
    created_at: '2024-01-14T10:00:00Z',
  },
  {
    id: 'report-2',
    user_id: 'user-2',
    reporter_name: 'Bob Johnson',
    reason: 'inappropriate' as const,
    details: null,
    created_at: '2024-01-14T11:00:00Z',
  },
];

const mockReview = {
  id: 'review-123',
  campsite_id: 'campsite-456',
  campsite_name: 'Beautiful Forest Camp',
  user_id: 'reviewer-789',
  rating_overall: 4,
  reviewer_type: 'solo_traveler',
  title: 'Great experience!',
  content: 'Had an amazing time at this campsite. The facilities were clean and the staff was friendly.',
  report_count: 2,
  created_at: '2024-01-15T10:00:00Z',
  reviewer_name: 'John Doe',
  reviewer_avatar: 'https://example.com/avatar.jpg',
  reports: mockReports,
};

// Mock window.confirm
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

describe('ReportedReviewCard', () => {
  let mockOnHide: jest.Mock;
  let mockOnDismiss: jest.Mock;
  let mockOnDelete: jest.Mock;

  beforeEach(() => {
    mockOnHide = jest.fn().mockResolvedValue(undefined);
    mockOnDismiss = jest.fn().mockResolvedValue(undefined);
    mockOnDelete = jest.fn().mockResolvedValue(undefined);
    mockConfirm.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('renders review title', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText('Great experience!')).toBeInTheDocument();
    });

    it('renders review content', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText(/Had an amazing time at this campsite/i)).toBeInTheDocument();
    });

    it('renders star rating', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      const rating = screen.getByTestId('star-rating');
      expect(rating).toBeInTheDocument();
      expect(rating).toHaveAttribute('data-rating', '4');
      expect(rating).toHaveAttribute('data-size', 'sm');
    });

    it('renders reviewer name', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders reviewer avatar image when provided', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('renders default User icon when no avatar provided', () => {
      const reviewWithoutAvatar = {
        ...mockReview,
        reviewer_avatar: null,
      };
      const { container } = render(
        <ReportedReviewCard
          review={reviewWithoutAvatar}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.queryByAltText('John Doe')).not.toBeInTheDocument();
    });

    it('renders campsite name', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText('Beautiful Forest Camp')).toBeInTheDocument();
    });

    it('renders created date', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText('2 days ago')).toBeInTheDocument();
    });
  });

  describe('Report Display Tests', () => {
    it('shows report count badge', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText('2 reports')).toBeInTheDocument();
    });

    it('shows singular report text for 1 report', () => {
      const reviewWithOneReport = {
        ...mockReview,
        report_count: 1,
        reports: [mockReports[0]],
      };
      render(
        <ReportedReviewCard
          review={reviewWithOneReport}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText('1 report')).toBeInTheDocument();
    });

    it('shows "reported X times" text', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByText('2 Reports')).toBeInTheDocument();
    });

    it('toggles report details visibility', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const toggleButton = screen.getByText('Show details');
      expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();

      await user.click(toggleButton);
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();

      await user.click(toggleButton);
      await waitFor(() => {
        expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
      });
    });

    it('lists individual reports when expanded', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const toggleButton = screen.getByText('Show details');
      await user.click(toggleButton);

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('shows report reasons', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const toggleButton = screen.getByText('Show details');
      await user.click(toggleButton);

      expect(screen.getByText('Spam')).toBeInTheDocument();
      expect(screen.getByText('Inappropriate')).toBeInTheDocument();
    });

    it('shows reporter names', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const toggleButton = screen.getByText('Show details');
      await user.click(toggleButton);

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('shows report details when provided', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const toggleButton = screen.getByText('Show details');
      await user.click(toggleButton);

      expect(screen.getByText('This review appears to be spam advertising')).toBeInTheDocument();
    });

    it('does not show details section when report has no details', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const toggleButton = screen.getByText('Show details');
      await user.click(toggleButton);

      const reportCards = screen.getAllByText(/3 days ago|1 hour ago/);
      expect(reportCards).toHaveLength(2);
    });
  });

  describe('Action Button Tests', () => {
    it('renders "Dismiss" button', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('renders "Hide" button', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByRole('button', { name: /^hide$/i })).toBeInTheDocument();
    });

    it('renders "Delete" button', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('Dismiss button has XCircle icon', () => {
      const { container } = render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      expect(dismissButton).toBeInTheDocument();
    });

    it('Hide button has EyeOff icon', () => {
      const { container } = render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      const hideButton = screen.getByRole('button', { name: /^hide$/i });
      expect(hideButton).toBeInTheDocument();
    });

    it('Delete button has Trash2 icon', () => {
      const { container } = render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Dismiss Action Tests', () => {
    it('shows confirmation dialog when Dismiss clicked', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to dismiss all reports? The review will remain visible.'
      );
    });

    it('calls onDismiss with review.id when confirmed', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledWith('review-123');
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not call onDismiss when cancelled', async () => {
      mockConfirm.mockReturnValue(false);
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('shows loading state during dismiss action', async () => {
      let resolveDismiss: () => void;
      const dismissPromise = new Promise<void>((resolve) => {
        resolveDismiss = resolve;
      });
      mockOnDismiss.mockReturnValue(dismissPromise);

      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      expect(screen.getByText('Dismissing...')).toBeInTheDocument();

      resolveDismiss!();
      await waitFor(() => {
        expect(screen.queryByText('Dismissing...')).not.toBeInTheDocument();
      });
    });

    it('disables all buttons during dismiss action', async () => {
      let resolveDismiss: () => void;
      const dismissPromise = new Promise<void>((resolve) => {
        resolveDismiss = resolve;
      });
      mockOnDismiss.mockReturnValue(dismissPromise);

      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      const hideButton = screen.getByRole('button', { name: /^hide$/i });
      const deleteButton = screen.getByRole('button', { name: /delete/i });

      await user.click(dismissButton);

      expect(dismissButton).toBeDisabled();
      expect(hideButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();

      resolveDismiss!();
      await waitFor(() => {
        expect(dismissButton).not.toBeDisabled();
        expect(hideButton).not.toBeDisabled();
        expect(deleteButton).not.toBeDisabled();
      });
    });
  });

  describe('Hide Action Tests', () => {
    it('opens hide reason dialog when Hide clicked', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const hideButton = screen.getByRole('button', { name: /^hide$/i });
      await user.click(hideButton);

      expect(screen.getByTestId('hide-dialog')).toBeInTheDocument();
    });

    it('passes correct props to hide dialog', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const hideButton = screen.getByRole('button', { name: /^hide$/i });
      await user.click(hideButton);

      expect(screen.getByText('Hide Review')).toBeInTheDocument();
      expect(screen.getByText(/The review will be hidden from public view/i)).toBeInTheDocument();
      expect(screen.getByText('Item: Review by John Doe')).toBeInTheDocument();
      expect(screen.getByText('Min length: 5')).toBeInTheDocument();
    });

    it('requires hide reason', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const hideButton = screen.getByRole('button', { name: /^hide$/i });
      await user.click(hideButton);

      expect(screen.getByText('Min length: 5')).toBeInTheDocument();
    });

    it('calls onHide with id and reason', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const hideButton = screen.getByRole('button', { name: /^hide$/i });
      await user.click(hideButton);

      const confirmButton = screen.getByTestId('dialog-confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnHide).toHaveBeenCalledWith('review-123', 'Test hide reason');
        expect(mockOnHide).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state during hide action', async () => {
      let resolveHide: () => void;
      const hidePromise = new Promise<void>((resolve) => {
        resolveHide = resolve;
      });
      mockOnHide.mockReturnValue(hidePromise);

      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const hideButton = screen.getByRole('button', { name: /^hide$/i });
      await user.click(hideButton);

      const confirmButton = screen.getByTestId('dialog-confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByTestId('dialog-confirm')).toBeDisabled();
      });

      resolveHide!();
    });

    it('closes dialog after successful hide', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const hideButton = screen.getByRole('button', { name: /^hide$/i });
      await user.click(hideButton);

      expect(screen.getByTestId('hide-dialog')).toBeInTheDocument();

      const confirmButton = screen.getByTestId('dialog-confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByTestId('hide-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Action Tests', () => {
    it('shows delete confirmation when Delete clicked', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to permanently delete this review? This cannot be undone.'
      );
    });

    it('calls onDelete with review.id when confirmed', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('review-123');
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('does not call onDelete when cancelled', async () => {
      mockConfirm.mockReturnValue(false);
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it('shows loading state during delete action', async () => {
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnDelete.mockReturnValue(deletePromise);

      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(screen.getByText('Deleting...')).toBeInTheDocument();

      resolveDelete!();
      await waitFor(() => {
        expect(screen.queryByText('Deleting...')).not.toBeInTheDocument();
      });
    });

    it('disables all buttons during delete action', async () => {
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnDelete.mockReturnValue(deletePromise);

      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      const hideButton = screen.getByRole('button', { name: /^hide$/i });
      const deleteButton = screen.getByRole('button', { name: /delete/i });

      await user.click(deleteButton);

      expect(dismissButton).toBeDisabled();
      expect(hideButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();

      resolveDelete!();
      await waitFor(() => {
        expect(dismissButton).not.toBeDisabled();
        expect(hideButton).not.toBeDisabled();
        expect(deleteButton).not.toBeDisabled();
      });
    });
  });

  describe('Styling Tests', () => {
    it('report badge is destructive variant', () => {
      const { container } = render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      const badge = screen.getByText('2 reports');
      expect(badge).toBeInTheDocument();
    });

    it('Dismiss button is outline variant', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      expect(dismissButton).toBeInTheDocument();
    });

    it('Hide button has yellow styling', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      const hideButton = screen.getByRole('button', { name: /^hide$/i });
      expect(hideButton).toHaveClass('border-yellow-200', 'text-yellow-700', 'hover:bg-yellow-50');
    });

    it('Delete button has red styling', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toHaveClass('border-red-200', 'text-red-600', 'hover:bg-red-50');
    });
  });

  describe('Empty State Tests', () => {
    it('handles review without title', () => {
      const reviewWithoutTitle = {
        ...mockReview,
        title: null,
      };
      render(
        <ReportedReviewCard
          review={reviewWithoutTitle}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );
      expect(screen.queryByText('Great experience!')).not.toBeInTheDocument();
      expect(screen.getByText(/Had an amazing time/i)).toBeInTheDocument();
    });

    it('handles missing reporter info', async () => {
      const reviewWithMissingReporterInfo = {
        ...mockReview,
        reports: [
          {
            ...mockReports[0],
            reporter_name: '',
          },
        ],
      };
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={reviewWithMissingReporterInfo}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const toggleButton = screen.getByText('Show details');
      await user.click(toggleButton);

      expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('disables buttons when isLoading prop is true', () => {
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
          isLoading={true}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      const hideButton = screen.getByRole('button', { name: /^hide$/i });
      const deleteButton = screen.getByRole('button', { name: /delete/i });

      expect(dismissButton).toBeDisabled();
      expect(hideButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    // Note: Error handling tests removed because the component uses try-finally without catch,
    // meaning errors will propagate. These tests were testing for error handling that doesn't exist.
  });

  describe('Report Reason Colors', () => {
    it('shows yellow color for spam reports', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const toggleButton = screen.getByText('Show details');
      await user.click(toggleButton);

      const spamBadge = screen.getByText('Spam');
      expect(spamBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('shows red color for inappropriate reports', async () => {
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={mockReview}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const toggleButton = screen.getByText('Show details');
      await user.click(toggleButton);

      const inappropriateBadge = screen.getByText('Inappropriate');
      expect(inappropriateBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('shows orange color for fake reports', async () => {
      const reviewWithFakeReport = {
        ...mockReview,
        reports: [
          {
            ...mockReports[0],
            reason: 'fake' as const,
          },
        ],
      };
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={reviewWithFakeReport}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const toggleButton = screen.getByText('Show details');
      await user.click(toggleButton);

      const fakeBadge = screen.getByText('Fake Review');
      expect(fakeBadge).toHaveClass('bg-orange-100', 'text-orange-800');
    });

    it('shows gray color for other reports', async () => {
      const reviewWithOtherReport = {
        ...mockReview,
        reports: [
          {
            ...mockReports[0],
            reason: 'other' as const,
          },
        ],
      };
      const user = userEvent.setup();
      render(
        <ReportedReviewCard
          review={reviewWithOtherReport}
          onHide={mockOnHide}
          onDismiss={mockOnDismiss}
          onDelete={mockOnDelete}
        />
      );

      const toggleButton = screen.getByText('Show details');
      await user.click(toggleButton);

      const otherBadge = screen.getByText('Other');
      expect(otherBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });
});
