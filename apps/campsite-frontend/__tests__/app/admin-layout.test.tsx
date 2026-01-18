import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminLayout from '@/app/admin/layout';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
}));

// Mock AdminSidebar
jest.mock('@/components/admin/AdminSidebar', () => ({
  AdminSidebar: jest.fn(({ pendingCampsites, pendingOwnerRequests, reportedReviews }) => (
    <div data-testid="admin-sidebar">
      <span data-testid="pending-campsites">{pendingCampsites}</span>
      <span data-testid="pending-owner-requests">{pendingOwnerRequests}</span>
      <span data-testid="reported-reviews">{reportedReviews}</span>
    </div>
  )),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AdminLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication State Tests', () => {
    it('shows loading state when authLoading is true', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        loading: true,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('shows "Access Denied" when user is not logged in', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('shows "Access Denied" when user role is "user"', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'user@test.com' },
        role: 'user',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('shows "Access Denied" when user role is "owner"', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'owner-123', email: 'owner@test.com' },
        role: 'owner',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('renders content when user role is "admin"', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 5,
            pending_owner_requests: 3,
            reported_reviews: 2,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Redirect Tests', () => {
    it('calls router.push with login URL when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(mockPush).toHaveBeenCalledWith('/auth/login?redirect=/admin');
    });

    it('calls router.push with redirect param when user is not admin', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'user@test.com' },
        role: 'user',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(mockPush).toHaveBeenCalledWith('/auth/login?redirect=/admin');
    });

    it('calls router.push when user role is owner', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'owner-123', email: 'owner@test.com' },
        role: 'owner',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(mockPush).toHaveBeenCalledWith('/auth/login?redirect=/admin');
    });

    it('does not redirect when user is admin', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 0,
            pending_owner_requests: 0,
            reported_reviews: 0,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not redirect during loading state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        loading: true,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Stats Fetching Tests', () => {
    it('fetches /api/admin/stats when user is admin', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 5,
            pending_owner_requests: 3,
            reported_reviews: 2,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/stats', {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
      });
    });

    it('does not fetch stats when not admin', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'user@test.com' },
        role: 'user',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not fetch stats when user is null', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not fetch stats during loading state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        loading: true,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/stats', {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
      });

      // Component should still render despite error
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('handles non-ok response gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/stats', {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
      });

      // Component should still render despite error
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });

    it('passes stats to AdminSidebar component', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 7,
            pending_owner_requests: 4,
            reported_reviews: 3,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      await waitFor(() => {
        expect(screen.getByTestId('pending-campsites')).toHaveTextContent('7');
        expect(screen.getByTestId('pending-owner-requests')).toHaveTextContent('4');
        expect(screen.getByTestId('reported-reviews')).toHaveTextContent('3');
      });
    });
  });

  describe('Sidebar Integration Tests', () => {
    it('renders AdminSidebar component', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 0,
            pending_owner_requests: 0,
            reported_reviews: 0,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });

    it('passes pendingCampsites to sidebar', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 10,
            pending_owner_requests: 0,
            reported_reviews: 0,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      await waitFor(() => {
        expect(screen.getByTestId('pending-campsites')).toHaveTextContent('10');
      });
    });

    it('passes pendingOwnerRequests to sidebar', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 0,
            pending_owner_requests: 8,
            reported_reviews: 0,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      await waitFor(() => {
        expect(screen.getByTestId('pending-owner-requests')).toHaveTextContent('8');
      });
    });

    it('passes reportedReviews to sidebar', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 0,
            pending_owner_requests: 0,
            reported_reviews: 6,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      await waitFor(() => {
        expect(screen.getByTestId('reported-reviews')).toHaveTextContent('6');
      });
    });

    it('passes all stats correctly to sidebar', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 12,
            pending_owner_requests: 9,
            reported_reviews: 15,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      render(<AdminLayout><div>Test Content</div></AdminLayout>);

      await waitFor(() => {
        expect(screen.getByTestId('pending-campsites')).toHaveTextContent('12');
        expect(screen.getByTestId('pending-owner-requests')).toHaveTextContent('9');
        expect(screen.getByTestId('reported-reviews')).toHaveTextContent('15');
      });
    });
  });

  describe('Children Rendering Tests', () => {
    it('renders children content when admin', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 0,
            pending_owner_requests: 0,
            reported_reviews: 0,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      render(<AdminLayout><div data-testid="child-content">Admin Dashboard</div></AdminLayout>);

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('does not render children when loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        loading: true,
      });

      render(<AdminLayout><div data-testid="child-content">Admin Dashboard</div></AdminLayout>);

      expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not render children when not admin', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123', email: 'user@test.com' },
        role: 'user',
        loading: false,
      });

      render(<AdminLayout><div data-testid="child-content">Admin Dashboard</div></AdminLayout>);

      expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('does not render children when user is null', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        loading: false,
      });

      render(<AdminLayout><div data-testid="child-content">Admin Dashboard</div></AdminLayout>);

      expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('renders multiple children elements when admin', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 0,
            pending_owner_requests: 0,
            reported_reviews: 0,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      render(
        <AdminLayout>
          <div data-testid="header">Header</div>
          <div data-testid="content">Content</div>
          <div data-testid="footer">Footer</div>
        </AdminLayout>
      );

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Layout Structure Tests', () => {
    it('has correct layout structure with sidebar and main', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 0,
            pending_owner_requests: 0,
            reported_reviews: 0,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      const { container } = render(<AdminLayout><div>Content</div></AdminLayout>);

      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('main element contains children content', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 0,
            pending_owner_requests: 0,
            reported_reviews: 0,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      const { container } = render(<AdminLayout><div data-testid="test-child">Test</div></AdminLayout>);

      const main = container.querySelector('main');
      expect(main).toContainElement(screen.getByTestId('test-child'));
    });

    it('renders sidebar before main content', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            pending_campsites: 0,
            pending_owner_requests: 0,
            reported_reviews: 0,
          },
        }),
      });

      mockUseAuth.mockReturnValue({
        user: { id: 'admin-123', email: 'admin@test.com' },
        role: 'admin',
        loading: false,
      });

      const { container } = render(<AdminLayout><div>Content</div></AdminLayout>);

      const sidebar = screen.getByTestId('admin-sidebar');
      const main = container.querySelector('main');

      expect(sidebar).toBeInTheDocument();
      expect(main).toBeInTheDocument();
    });
  });
});
