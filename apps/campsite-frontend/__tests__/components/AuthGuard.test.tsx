import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AuthGuard, withAuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@campsite/shared';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock Skeleton component
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('AuthGuard Component', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Mock window.location.pathname
    delete (window as any).location;
    window.location = { pathname: '/dashboard' } as any;
  });

  describe('Loading State', () => {
    it('shows loading state while checking authentication', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        role: 'user',
        loading: true,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Should show skeleton loader (multiple skeleton elements)
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('shows custom fallback during loading when provided', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        role: 'user',
        loading: true,
      });

      render(
        <AuthGuard fallback={<div>Custom Loading...</div>}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated User', () => {
    it('redirects to login when user is not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        role: 'user',
        loading: false,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/auth/login?redirect=%2Fdashboard'
        );
      });
    });

    it('redirects to custom URL when user is not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        role: 'user',
        loading: false,
      });

      render(
        <AuthGuard redirectTo="/custom-login">
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/custom-login?redirect=%2Fdashboard'
        );
      });
    });

    it('shows skeleton instead of children for unauthenticated user', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        role: 'user',
        loading: false,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated User', () => {
    it('renders children when user is authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        role: 'user' as UserRole,
        loading: false,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not redirect when user is authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        role: 'user' as UserRole,
        loading: false,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Role-Based Access Control', () => {
    it('denies access if user lacks required role (single role)', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        role: 'user' as UserRole,
        loading: false,
      });

      render(
        <AuthGuard requiredRole="admin">
          <div>Admin Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized');
      });

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('allows access if user has required role (single role)', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'admin-1', email: 'admin@example.com' },
        role: 'admin' as UserRole,
        loading: false,
      });

      render(
        <AuthGuard requiredRole="admin">
          <div>Admin Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('denies access if user lacks any of the required roles (multiple roles)', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        role: 'user' as UserRole,
        loading: false,
      });

      render(
        <AuthGuard requiredRole={['admin', 'owner']}>
          <div>Admin/Owner Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized');
      });

      expect(screen.queryByText('Admin/Owner Content')).not.toBeInTheDocument();
    });

    it('allows access if user has one of the required roles (multiple roles)', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'owner-1', email: 'owner@example.com' },
        role: 'owner' as UserRole,
        loading: false,
      });

      render(
        <AuthGuard requiredRole={['admin', 'owner']}>
          <div>Admin/Owner Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Admin/Owner Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows fallback when role is denied', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        role: 'user' as UserRole,
        loading: false,
      });

      render(
        <AuthGuard requiredRole="admin" fallback={<div>Access Denied</div>}>
          <div>Admin Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('withAuthGuard HOC', () => {
    it('wraps component with AuthGuard', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        role: 'user' as UserRole,
        loading: false,
      });

      const TestComponent = ({ name }: { name: string }) => (
        <div>Hello {name}</div>
      );

      const GuardedComponent = withAuthGuard(TestComponent);

      render(<GuardedComponent name="World" />);

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('applies role requirements from HOC options', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        role: 'user' as UserRole,
        loading: false,
      });

      const TestComponent = () => <div>Admin Component</div>;

      const GuardedComponent = withAuthGuard(TestComponent, {
        requiredRole: 'admin',
      });

      render(<GuardedComponent />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized');
      });
    });

    it('uses custom redirect URL from HOC options', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        role: 'user',
        loading: false,
      });

      const TestComponent = () => <div>Protected Component</div>;

      const GuardedComponent = withAuthGuard(TestComponent, {
        redirectTo: '/custom-auth',
      });

      render(<GuardedComponent />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/custom-auth?redirect=%2Fdashboard'
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles transition from loading to authenticated', async () => {
      const { rerender } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Initially loading
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        role: 'user',
        loading: true,
      });

      rerender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);

      // Then authenticated
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        role: 'user' as UserRole,
        loading: false,
      });

      rerender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('encodes redirect URL with special characters', async () => {
      window.location = { pathname: '/dashboard?tab=settings&id=123' } as any;

      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        role: 'user',
        loading: false,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/auth/login?redirect=%2Fdashboard%3Ftab%3Dsettings%26id%3D123'
        );
      });
    });
  });
});
