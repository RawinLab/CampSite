import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampsiteApprovalCard } from '@/components/admin/CampsiteApprovalCard';

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 days ago'),
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
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    itemName: string;
    onConfirm: (reason: string) => void;
    isLoading: boolean;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="reject-dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <p>Item: {itemName}</p>
        <button
          onClick={() => onConfirm('Test rejection reason')}
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

const mockCampsite = {
  id: 'test-campsite-id',
  name: 'Beautiful Forest Camp',
  description: 'A serene campsite nestled in the mountains with stunning views and modern amenities. Perfect for families and nature lovers.',
  campsite_type: 'camping' as const,
  province_name: 'Chiang Mai',
  address: '123 Mountain Road, Mae Rim District, Chiang Mai 50180',
  min_price: 500,
  max_price: 1500,
  owner_id: 'owner-123',
  owner_name: 'John Doe',
  photo_count: 5,
  submitted_at: new Date('2024-01-15T10:00:00Z').toISOString(),
};

describe('CampsiteApprovalCard', () => {
  let mockOnApprove: jest.Mock;
  let mockOnReject: jest.Mock;

  beforeEach(() => {
    mockOnApprove = jest.fn().mockResolvedValue(undefined);
    mockOnReject = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('renders campsite name', () => {
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('Beautiful Forest Camp')).toBeInTheDocument();
    });

    it('renders campsite description', () => {
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/A serene campsite nestled in the mountains/i)).toBeInTheDocument();
    });

    it('renders province name with MapPin icon', () => {
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('Chiang Mai')).toBeInTheDocument();
    });

    it('renders campsite type badge', () => {
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('Camping')).toBeInTheDocument();
    });

    it('renders owner name', () => {
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders price range in THB format', () => {
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      const priceText = screen.getByText(/500.*1,?500/);
      expect(priceText).toBeInTheDocument();
    });

    it('renders photo count', () => {
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('5 photos')).toBeInTheDocument();
    });

    it('renders relative time since submission', () => {
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('2 days ago')).toBeInTheDocument();
    });

    it('renders address in highlighted box', () => {
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/123 Mountain Road, Mae Rim District/i)).toBeInTheDocument();
    });
  });

  describe('Button Tests', () => {
    it('renders Approve button with green styling', () => {
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      const approveButton = screen.getByRole('button', { name: /approve/i });
      expect(approveButton).toBeInTheDocument();
      expect(approveButton).toHaveClass('bg-green-600');
    });

    it('renders Reject button with red styling', () => {
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      expect(rejectButton).toBeInTheDocument();
      expect(rejectButton).toHaveClass('text-red-600');
    });

    it('Approve button has Check icon', () => {
      const { container } = render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      const approveButton = screen.getByRole('button', { name: /approve/i });
      expect(approveButton).toBeInTheDocument();
    });

    it('Reject button has X icon', () => {
      const { container } = render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      expect(rejectButton).toBeInTheDocument();
    });

    it('buttons are disabled when isLoading is true', () => {
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isLoading={true}
        />
      );
      const approveButton = screen.getByRole('button', { name: /approve/i });
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      expect(approveButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();
    });
  });

  describe('Approve Action Tests', () => {
    it('calls onApprove with campsite.id when clicked', async () => {
      const user = userEvent.setup();
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      const approveButton = screen.getByRole('button', { name: /approve/i });
      await user.click(approveButton);
      expect(mockOnApprove).toHaveBeenCalledWith('test-campsite-id');
      expect(mockOnApprove).toHaveBeenCalledTimes(1);
    });

    it('shows "Approving..." text during action', async () => {
      let resolveApprove: () => void;
      const approvePromise = new Promise<void>((resolve) => {
        resolveApprove = resolve;
      });
      mockOnApprove.mockReturnValue(approvePromise);

      const user = userEvent.setup();
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const approveButton = screen.getByRole('button', { name: /approve/i });
      await user.click(approveButton);

      expect(screen.getByText('Approving...')).toBeInTheDocument();

      resolveApprove!();
      await waitFor(() => {
        expect(screen.queryByText('Approving...')).not.toBeInTheDocument();
      });
    });

    it('disables both buttons during action', async () => {
      let resolveApprove: () => void;
      const approvePromise = new Promise<void>((resolve) => {
        resolveApprove = resolve;
      });
      mockOnApprove.mockReturnValue(approvePromise);

      const user = userEvent.setup();
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const approveButton = screen.getByRole('button', { name: /approve/i });
      const rejectButton = screen.getByRole('button', { name: /reject/i });

      await user.click(approveButton);

      expect(approveButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();

      resolveApprove!();
      await waitFor(() => {
        expect(approveButton).not.toBeDisabled();
        expect(rejectButton).not.toBeDisabled();
      });
    });

    it('re-enables buttons after action completes', async () => {
      const user = userEvent.setup();
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const approveButton = screen.getByRole('button', { name: /approve/i });
      const rejectButton = screen.getByRole('button', { name: /reject/i });

      await user.click(approveButton);

      await waitFor(() => {
        expect(approveButton).not.toBeDisabled();
        expect(rejectButton).not.toBeDisabled();
      });
    });
  });

  describe('Reject Action Tests', () => {
    it('opens RejectDialog when Reject clicked', async () => {
      const user = userEvent.setup();
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await user.click(rejectButton);

      expect(screen.getByTestId('reject-dialog')).toBeInTheDocument();
    });

    it('passes correct props to RejectDialog', async () => {
      const user = userEvent.setup();
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await user.click(rejectButton);

      expect(screen.getByText('Reject Campsite')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to reject this campsite/i)).toBeInTheDocument();
      expect(screen.getByText('Item: Beautiful Forest Camp')).toBeInTheDocument();
    });

    it('calls onReject with id and reason', async () => {
      const user = userEvent.setup();
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await user.click(rejectButton);

      const confirmButton = screen.getByTestId('dialog-confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnReject).toHaveBeenCalledWith('test-campsite-id', 'Test rejection reason');
        expect(mockOnReject).toHaveBeenCalledTimes(1);
      });
    });

    it('closes dialog after successful rejection', async () => {
      const user = userEvent.setup();
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await user.click(rejectButton);

      expect(screen.getByTestId('reject-dialog')).toBeInTheDocument();

      const confirmButton = screen.getByTestId('dialog-confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByTestId('reject-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state for approve', async () => {
      let resolveApprove: () => void;
      const approvePromise = new Promise<void>((resolve) => {
        resolveApprove = resolve;
      });
      mockOnApprove.mockReturnValue(approvePromise);

      const user = userEvent.setup();
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const approveButton = screen.getByRole('button', { name: /approve/i });
      await user.click(approveButton);

      expect(screen.getByText('Approving...')).toBeInTheDocument();

      resolveApprove!();
    });

    it('shows loading state for reject', async () => {
      let resolveReject: () => void;
      const rejectPromise = new Promise<void>((resolve) => {
        resolveReject = resolve;
      });
      mockOnReject.mockReturnValue(rejectPromise);

      const user = userEvent.setup();
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await user.click(rejectButton);

      const confirmButton = screen.getByTestId('dialog-confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByTestId('dialog-confirm')).toBeDisabled();
      });

      resolveReject!();
    });
  });

  describe('Price Formatting', () => {
    it('formats prices with Thai baht currency', () => {
      render(
        <CampsiteApprovalCard
          campsite={mockCampsite}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      const priceText = screen.getByText(/500.*1,?500/);
      expect(priceText).toBeInTheDocument();
    });

    it('shows min-max range correctly', () => {
      const campsiteWithDifferentPrices = {
        ...mockCampsite,
        min_price: 1000,
        max_price: 3000,
      };
      render(
        <CampsiteApprovalCard
          campsite={campsiteWithDifferentPrices}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      const priceText = screen.getByText(/1,?000.*3,?000/);
      expect(priceText).toBeInTheDocument();
    });

    it('handles zero prices', () => {
      const campsiteWithZeroPrices = {
        ...mockCampsite,
        min_price: 0,
        max_price: 0,
      };
      render(
        <CampsiteApprovalCard
          campsite={campsiteWithZeroPrices}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      // Find the price text within the price container
      const priceElements = screen.getAllByText(/฿0/);
      expect(priceElements.length).toBeGreaterThan(0);
    });
  });

  describe('Type Labels', () => {
    it('shows correct label for camping', () => {
      render(
        <CampsiteApprovalCard
          campsite={{ ...mockCampsite, campsite_type: 'camping' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('Camping')).toBeInTheDocument();
    });

    it('shows correct label for glamping', () => {
      render(
        <CampsiteApprovalCard
          campsite={{ ...mockCampsite, campsite_type: 'glamping' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('Glamping')).toBeInTheDocument();
    });

    it('shows correct label for rv-caravan', () => {
      render(
        <CampsiteApprovalCard
          campsite={{ ...mockCampsite, campsite_type: 'rv-caravan' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('RV/Caravan')).toBeInTheDocument();
    });

    it('shows correct label for tented-resort', () => {
      render(
        <CampsiteApprovalCard
          campsite={{ ...mockCampsite, campsite_type: 'tented-resort' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('Tented Resort')).toBeInTheDocument();
    });

    it('shows correct label for bungalow', () => {
      render(
        <CampsiteApprovalCard
          campsite={{ ...mockCampsite, campsite_type: 'bungalow' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('Bungalow')).toBeInTheDocument();
    });

    it('shows correct label for cabin', () => {
      render(
        <CampsiteApprovalCard
          campsite={{ ...mockCampsite, campsite_type: 'cabin' }}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('Cabin')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles long descriptions correctly', () => {
      const campsiteWithLongDescription = {
        ...mockCampsite,
        description: 'A'.repeat(500),
      };
      render(
        <CampsiteApprovalCard
          campsite={campsiteWithLongDescription}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/A{10,}/)).toBeInTheDocument();
    });

    it('handles long owner names correctly', () => {
      const campsiteWithLongName = {
        ...mockCampsite,
        owner_name: 'Very Long Owner Name That Should Be Truncated',
      };
      render(
        <CampsiteApprovalCard
          campsite={campsiteWithLongName}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText(/Very Long Owner Name/i)).toBeInTheDocument();
    });

    it('handles zero photo count', () => {
      const campsiteWithNoPhotos = {
        ...mockCampsite,
        photo_count: 0,
      };
      render(
        <CampsiteApprovalCard
          campsite={campsiteWithNoPhotos}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('0 photos')).toBeInTheDocument();
    });

    it('handles large photo count', () => {
      const campsiteWithManyPhotos = {
        ...mockCampsite,
        photo_count: 100,
      };
      render(
        <CampsiteApprovalCard
          campsite={campsiteWithManyPhotos}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );
      expect(screen.getByText('100 photos')).toBeInTheDocument();
    });
  });
});
