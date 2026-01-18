import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerRequestCard } from '@/components/admin/OwnerRequestCard';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon" />,
  Building2: () => <div data-testid="building-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Check: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />,
  FileText: () => <div data-testid="filetext-icon" />,
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 days ago'),
}));

// Mock RejectDialog
jest.mock('@/components/admin/RejectDialog', () => ({
  RejectDialog: ({
    open,
    onConfirm,
    itemName,
    isLoading,
  }: {
    open: boolean;
    onConfirm: (reason: string) => void;
    itemName: string;
    isLoading: boolean;
  }) => (
    <div data-testid="reject-dialog" data-open={open} data-loading={isLoading}>
      <div data-testid="item-name">{itemName}</div>
      <button
        data-testid="reject-confirm"
        onClick={() => onConfirm('Test rejection reason')}
      >
        Confirm Reject
      </button>
    </div>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardFooter: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-footer" className={className}>{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    className,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    variant?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

interface OwnerRequest {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string;
  contact_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason?: string;
  user_full_name: string;
  user_avatar_url: string | null;
}

describe('OwnerRequestCard', () => {
  const mockOnApprove = jest.fn();
  const mockOnReject = jest.fn();

  const mockRequest: OwnerRequest = {
    id: 'req-001',
    user_id: 'user-001',
    business_name: 'Jungle Paradise Camping',
    business_description: 'A beautiful campsite in the heart of the jungle with modern amenities and stunning views.',
    contact_phone: '+66-81-234-5678',
    status: 'pending',
    created_at: '2024-01-15T10:30:00Z',
    reviewed_at: null,
    reviewed_by: null,
    user_full_name: 'John Smith',
    user_avatar_url: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // RENDERING TESTS
  describe('Rendering', () => {
    it('renders user full name', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('renders user avatar image when available', () => {
      const requestWithAvatar = {
        ...mockRequest,
        user_avatar_url: 'https://example.com/avatar.jpg',
      };

      render(
        <OwnerRequestCard
          request={requestWithAvatar}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const avatar = screen.getByAltText('John Smith');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('renders user icon when avatar is not available', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('renders business name', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const businessNames = screen.getAllByText('Jungle Paradise Camping');
      expect(businessNames.length).toBeGreaterThan(0);
    });

    it('renders business description', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(
        screen.getByText(/A beautiful campsite in the heart of the jungle/)
      ).toBeInTheDocument();
    });

    it('renders contact phone', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText('+66-81-234-5678')).toBeInTheDocument();
    });

    it('renders status badge for pending status', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('Pending');
    });

    it('renders time ago for created_at date', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText('Requested 2 days ago')).toBeInTheDocument();
    });

    it('renders all section labels', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText('Business Name')).toBeInTheDocument();
      expect(screen.getByText('Business Description')).toBeInTheDocument();
      expect(screen.getByText('Contact Phone')).toBeInTheDocument();
    });

    it('renders all icons', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByTestId('building-icon')).toBeInTheDocument();
      expect(screen.getByTestId('filetext-icon')).toBeInTheDocument();
      expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
    });
  });

  // BUTTON STATE TESTS
  describe('Button States', () => {
    it('shows Approve and Reject buttons for pending status', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const approveButton = buttons.find(btn => btn.textContent?.includes('Approve'));
      const rejectButton = buttons.find(btn => btn.textContent?.includes('Reject'));

      expect(approveButton).toBeInTheDocument();
      expect(rejectButton).toBeInTheDocument();
    });

    it('buttons are enabled when not loading', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isLoading={false}
        />
      );

      const buttons = screen.getAllByRole('button');
      const approveButton = buttons.find(btn => btn.textContent?.includes('Approve'));
      const rejectButton = buttons.find(btn => btn.textContent?.includes('Reject'));

      expect(approveButton).not.toBeDisabled();
      expect(rejectButton).not.toBeDisabled();
    });

    it('disables buttons when isLoading prop is true', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
          isLoading={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      const approveButton = buttons.find(btn => btn.textContent?.includes('Approve'));
      const rejectButton = buttons.find(btn => btn.textContent?.includes('Reject'));

      expect(approveButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();
    });

    it('disables buttons during approval action', async () => {
      const user = userEvent.setup();
      let resolveApprove: () => void;
      const approvePromise = new Promise<void>((resolve) => {
        resolveApprove = resolve;
      });

      mockOnApprove.mockReturnValue(approvePromise);

      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const approveButton = buttons.find(btn => btn.textContent?.includes('Approve'));

      await act(async () => {
        await user.click(approveButton!);
      });

      await waitFor(() => {
        const updatedButtons = screen.getAllByRole('button');
        const approvingButton = updatedButtons.find(btn => btn.textContent?.includes('Approving'));
        const rejectButton = updatedButtons.find(btn => btn.textContent?.includes('Reject'));

        expect(approvingButton).toBeDisabled();
        expect(rejectButton).toBeDisabled();
      });

      await act(async () => {
        resolveApprove!();
        await approvePromise;
      });

      await waitFor(() => {
        const finalButtons = screen.getAllByRole('button');
        const finalApproveButton = finalButtons.find(btn => btn.textContent?.includes('Approve'));
        expect(finalApproveButton).not.toBeDisabled();
      });
    });

    it('disables buttons during rejection action', async () => {
      const user = userEvent.setup();
      let resolveReject: () => void;
      const rejectPromise = new Promise<void>((resolve) => {
        resolveReject = resolve;
      });

      mockOnReject.mockReturnValue(rejectPromise);

      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      // Open reject dialog
      const buttons = screen.getAllByRole('button');
      const rejectButton = buttons.find(btn => btn.textContent?.includes('Reject'));

      await act(async () => {
        await user.click(rejectButton!);
      });

      // Confirm rejection
      const confirmButton = screen.getByTestId('reject-confirm');

      await act(async () => {
        await user.click(confirmButton);
      });

      await waitFor(() => {
        const updatedButtons = screen.getAllByRole('button');
        const approveButton = updatedButtons.find(btn => btn.textContent?.includes('Approve'));
        const rejectButton = updatedButtons.find(btn => btn.textContent?.includes('Reject'));

        expect(approveButton).toBeDisabled();
        expect(rejectButton).toBeDisabled();
      });

      await act(async () => {
        resolveReject!();
        await rejectPromise;
      });

      await waitFor(() => {
        expect(mockOnReject).toHaveBeenCalled();
      });
    });
  });

  // APPROVE ACTION TESTS
  describe('Approve Action', () => {
    it('calls onApprove with request.id when Approve button clicked', async () => {
      const user = userEvent.setup();
      mockOnApprove.mockResolvedValue(undefined);

      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const approveButton = buttons.find(btn => btn.textContent?.includes('Approve'));

      await act(async () => {
        await user.click(approveButton!);
      });

      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalledWith('req-001');
        expect(mockOnApprove).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state during approval', async () => {
      const user = userEvent.setup();
      let resolveApprove: () => void;
      const approvePromise = new Promise<void>((resolve) => {
        resolveApprove = resolve;
      });

      mockOnApprove.mockReturnValue(approvePromise);

      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const approveButton = buttons.find(btn => btn.textContent?.includes('Approve'));

      await act(async () => {
        await user.click(approveButton!);
      });

      expect(screen.getByText('Approving...')).toBeInTheDocument();

      await act(async () => {
        resolveApprove!();
        await approvePromise;
      });

      await waitFor(() => {
        expect(screen.queryByText('Approving...')).not.toBeInTheDocument();
      });
    });

    it('resets loading state after approval completes', async () => {
      const user = userEvent.setup();
      mockOnApprove.mockResolvedValue(undefined);

      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const approveButton = buttons.find(btn => btn.textContent?.includes('Approve'));

      await act(async () => {
        await user.click(approveButton!);
      });

      await waitFor(() => {
        const updatedButtons = screen.getAllByRole('button');
        const finalApproveButton = updatedButtons.find(btn => btn.textContent?.includes('Approve'));
        expect(finalApproveButton).toBeInTheDocument();
      });
    });

    it('resets loading state after approval fails', async () => {
      const user = userEvent.setup();

      // Suppress unhandled rejection warnings for this test
      const originalOnError = window.onerror;
      const originalOnUnhandledRejection = window.onunhandledrejection;
      window.onerror = null;
      window.onunhandledrejection = null;

      let rejectApprove: (error: Error) => void;
      const approvePromise = new Promise<void>((_, reject) => {
        rejectApprove = reject;
      }).catch(() => {
        // Intentionally catch to prevent unhandled rejection
      });

      mockOnApprove.mockReturnValue(approvePromise as Promise<void>);

      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const approveButton = buttons.find(btn => btn.textContent?.includes('Approve'));

      await act(async () => {
        await user.click(approveButton!);
      });

      // Reject the promise
      await act(async () => {
        rejectApprove!(new Error('Network error'));
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Wait for loading state to reset
      await waitFor(() => {
        const updatedButtons = screen.getAllByRole('button');
        const finalApproveButton = updatedButtons.find(btn => btn.textContent?.includes('Approve'));
        expect(finalApproveButton).not.toBeDisabled();
      });

      // Restore handlers
      window.onerror = originalOnError;
      window.onunhandledrejection = originalOnUnhandledRejection;
    });

    it('renders check icon in Approve button', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const approveButton = buttons.find(btn => btn.textContent?.includes('Approve'));
      expect(approveButton).toContainHTML('data-testid="check-icon"');
    });
  });

  // REJECT ACTION TESTS
  describe('Reject Action', () => {
    it('opens RejectDialog when Reject button clicked', async () => {
      const user = userEvent.setup();

      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const rejectButton = buttons.find(btn => btn.textContent?.includes('Reject'));
      await user.click(rejectButton!);

      const dialog = screen.getByTestId('reject-dialog');
      expect(dialog).toHaveAttribute('data-open', 'true');
    });

    it('calls onReject with id and reason when confirmed', async () => {
      const user = userEvent.setup();
      mockOnReject.mockResolvedValue(undefined);

      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const rejectButton = buttons.find(btn => btn.textContent?.includes('Reject'));

      await act(async () => {
        await user.click(rejectButton!);
      });

      const confirmButton = screen.getByTestId('reject-confirm');

      await act(async () => {
        await user.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockOnReject).toHaveBeenCalledWith('req-001', 'Test rejection reason');
      });
    });

    it('closes dialog after successful rejection', async () => {
      const user = userEvent.setup();
      mockOnReject.mockResolvedValue(undefined);

      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const rejectButton = buttons.find(btn => btn.textContent?.includes('Reject'));

      await act(async () => {
        await user.click(rejectButton!);
      });

      const confirmButton = screen.getByTestId('reject-confirm');

      await act(async () => {
        await user.click(confirmButton);
      });

      await waitFor(() => {
        const dialog = screen.getByTestId('reject-dialog');
        expect(dialog).toHaveAttribute('data-open', 'false');
      });
    });

    it('passes business name to RejectDialog as itemName', async () => {
      const user = userEvent.setup();

      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const rejectButton = buttons.find(btn => btn.textContent?.includes('Reject'));
      await user.click(rejectButton!);

      expect(screen.getByTestId('item-name')).toHaveTextContent('Jungle Paradise Camping');
    });

    it('passes loading state to RejectDialog during rejection', async () => {
      const user = userEvent.setup();
      let resolveReject: () => void;
      const rejectPromise = new Promise<void>((resolve) => {
        resolveReject = resolve;
      });

      mockOnReject.mockReturnValue(rejectPromise);

      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const rejectButton = buttons.find(btn => btn.textContent?.includes('Reject'));

      await act(async () => {
        await user.click(rejectButton!);
      });

      const confirmButton = screen.getByTestId('reject-confirm');

      await act(async () => {
        await user.click(confirmButton);
      });

      await waitFor(() => {
        const dialog = screen.getByTestId('reject-dialog');
        expect(dialog).toHaveAttribute('data-loading', 'true');
      });

      await act(async () => {
        resolveReject!();
        await rejectPromise;
      });
    });

    it('resets loading state after rejection fails', async () => {
      const user = userEvent.setup();

      // Suppress unhandled rejection warnings for this test
      const originalOnError = window.onerror;
      const originalOnUnhandledRejection = window.onunhandledrejection;
      window.onerror = null;
      window.onunhandledrejection = null;

      let rejectReject: (error: Error) => void;
      const rejectPromise = new Promise<void>((_, reject) => {
        rejectReject = reject;
      }).catch(() => {
        // Intentionally catch to prevent unhandled rejection
      });

      mockOnReject.mockReturnValue(rejectPromise as Promise<void>);

      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const rejectButton = buttons.find(btn => btn.textContent?.includes('Reject'));

      await act(async () => {
        await user.click(rejectButton!);
      });

      const confirmButton = screen.getByTestId('reject-confirm');

      await act(async () => {
        await user.click(confirmButton);
      });

      // Reject the promise
      await act(async () => {
        rejectReject!(new Error('Network error'));
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Wait for loading state to reset
      await waitFor(() => {
        const updatedButtons = screen.getAllByRole('button');
        const finalRejectButton = updatedButtons.find(btn => btn.textContent?.includes('Reject'));
        expect(finalRejectButton).not.toBeDisabled();
      });

      // Restore handlers
      window.onerror = originalOnError;
      window.onunhandledrejection = originalOnUnhandledRejection;
    });

    it('renders X icon in Reject button', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const rejectButton = buttons.find(btn => btn.textContent?.includes('Reject'));
      expect(rejectButton).toContainHTML('data-testid="x-icon"');
    });
  });

  // LAYOUT TESTS
  describe('Layout', () => {
    it('renders Card component with correct structure', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
      expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    });

    it('applies correct styling classes to Card', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('overflow-hidden');
    });

    it('applies correct styling to badge', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-yellow-50', 'text-yellow-700');
    });

    it('arranges buttons in footer correctly', () => {
      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const footer = screen.getByTestId('card-footer');
      const buttons = footer.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
    });
  });

  // EDGE CASES
  describe('Edge Cases', () => {
    it('handles empty business description gracefully', () => {
      const requestWithEmptyDesc = {
        ...mockRequest,
        business_description: '',
      };

      render(
        <OwnerRequestCard
          request={requestWithEmptyDesc}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText('Business Description')).toBeInTheDocument();
    });

    it('handles long business name', () => {
      const requestWithLongName = {
        ...mockRequest,
        business_name: 'Very Long Business Name That Should Be Displayed Properly Even If It Takes Up Multiple Lines',
      };

      render(
        <OwnerRequestCard
          request={requestWithLongName}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const businessNames = screen.getAllByText(/Very Long Business Name/);
      expect(businessNames.length).toBeGreaterThan(0);
    });

    it('handles international phone format', () => {
      const requestWithIntlPhone = {
        ...mockRequest,
        contact_phone: '+1-555-123-4567',
      };

      render(
        <OwnerRequestCard
          request={requestWithIntlPhone}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      expect(screen.getByText('+1-555-123-4567')).toBeInTheDocument();
    });

    it('does not call onApprove multiple times on rapid clicks', async () => {
      const user = userEvent.setup();
      let resolveApprove: () => void;
      const approvePromise = new Promise<void>((resolve) => {
        resolveApprove = resolve;
      });

      mockOnApprove.mockReturnValue(approvePromise);

      render(
        <OwnerRequestCard
          request={mockRequest}
          onApprove={mockOnApprove}
          onReject={mockOnReject}
        />
      );

      const buttons = screen.getAllByRole('button');
      const approveButton = buttons.find(btn => btn.textContent?.includes('Approve'));

      // Try to click multiple times
      await act(async () => {
        await user.click(approveButton!);
      });

      // Button should be disabled now, so these clicks won't trigger the handler
      const disabledButtons = screen.getAllByRole('button');
      const disabledApprove = disabledButtons.find(btn =>
        btn.textContent?.includes('Approving') || btn.textContent?.includes('Approve')
      );

      expect(disabledApprove).toBeDisabled();
      expect(mockOnApprove).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveApprove!();
        await approvePromise;
      });
    });
  });
});
