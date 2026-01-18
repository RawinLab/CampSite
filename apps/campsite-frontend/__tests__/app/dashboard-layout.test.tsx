import { render, screen, waitFor } from '@testing-library/react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/layout';
import { createClient } from '@/lib/supabase/server';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
});

// Mock supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  LayoutDashboard: ({ className }: { className?: string }) => (
    <span data-testid="icon-layout-dashboard" className={className} />
  ),
  Tent: ({ className }: { className?: string }) => (
    <span data-testid="icon-tent" className={className} />
  ),
  MessageSquare: ({ className }: { className?: string }) => (
    <span data-testid="icon-message-square" className={className} />
  ),
  BarChart3: ({ className }: { className?: string }) => (
    <span data-testid="icon-bar-chart" className={className} />
  ),
  Settings: ({ className }: { className?: string }) => (
    <span data-testid="icon-settings" className={className} />
  ),
  LogOut: ({ className }: { className?: string }) => (
    <span data-testid="icon-logout" className={className} />
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <span data-testid="icon-chevron-right" className={className} />
  ),
}));

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, type, ...props }: any) => (
    <button
      data-variant={variant}
      data-size={size}
      type={type}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('DashboardLayout Component', () => {
  const mockRedirect = redirect as jest.Mock;
  const mockCreateClient = createClient as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('redirects to login when no session exists', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      try {
        await DashboardLayout({ children: <div>Test Content</div> });
      } catch (e) {
        // redirect throws an error in Next.js
      }

      expect(mockRedirect).toHaveBeenCalledWith('/auth/login?redirect=/dashboard');
    });

    it('redirects to home when user is not owner or admin', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'user-123', email: 'user@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'user',
            full_name: 'Regular User',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      try {
        await DashboardLayout({ children: <div>Test Content</div> });
      } catch (e) {
        // redirect throws an error in Next.js
      }

      expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('redirects when profile is null', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'user-123', email: 'user@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      try {
        await DashboardLayout({ children: <div>Test Content</div> });
      } catch (e) {
        // redirect throws an error in Next.js
      }

      expect(mockRedirect).toHaveBeenCalledWith('/');
    });
  });

  describe('Renders Layout for Authorized Users', () => {
    it('renders children correctly for owner users', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div data-testid="test-content">Protected Content</div>,
      });

      render(result);

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders children correctly for admin users', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'admin-123', email: 'admin@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'admin',
            full_name: 'Site Admin',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div data-testid="test-content">Admin Dashboard</div>,
      });

      render(result);

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  describe('Sidebar Navigation', () => {
    beforeEach(() => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);
    });

    it('shows sidebar navigation with all menu items', async () => {
      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      // Check for all navigation items (use getAllByText since items appear in both desktop and mobile nav)
      expect(screen.getAllByText('Overview').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Campsites').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Inquiries').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Analytics').length).toBeGreaterThanOrEqual(1);
    });

    it('navigation links have correct hrefs', async () => {
      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      const overviewLinks = screen.getAllByText('Overview');
      const campsitesLinks = screen.getAllByText('Campsites');
      const inquiriesLinks = screen.getAllByText('Inquiries');
      const analyticsLinks = screen.getAllByText('Analytics');

      // Find the desktop navigation link (first occurrence)
      expect(overviewLinks[0].closest('a')).toHaveAttribute('href', '/dashboard');
      expect(campsitesLinks[0].closest('a')).toHaveAttribute('href', '/dashboard/campsites');
      expect(inquiriesLinks[0].closest('a')).toHaveAttribute('href', '/dashboard/inquiries');
      expect(analyticsLinks[0].closest('a')).toHaveAttribute('href', '/dashboard/analytics');
    });

    it('displays navigation icons correctly', async () => {
      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      expect(screen.getAllByTestId('icon-layout-dashboard')).toHaveLength(2); // Desktop + mobile
      expect(screen.getAllByTestId('icon-tent')).toHaveLength(3); // Logo + desktop + mobile
      expect(screen.getAllByTestId('icon-message-square')).toHaveLength(2); // Desktop + mobile
      expect(screen.getAllByTestId('icon-bar-chart')).toHaveLength(2); // Desktop + mobile
    });
  });

  describe('Owner-Specific Navigation', () => {
    it('shows owner-specific navigation items for owner role', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      // Owner should see all navigation items
      expect(screen.getAllByText('Overview').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Campsites').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Inquiries').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Analytics').length).toBeGreaterThanOrEqual(1);
    });

    it('shows admin-specific navigation items for admin role', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'admin-123', email: 'admin@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'admin',
            full_name: 'Site Admin',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      // Admin should see all navigation items
      expect(screen.getAllByText('Overview').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Campsites').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Inquiries').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Analytics').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Mobile Responsive Navigation', () => {
    it('renders mobile bottom navigation', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      const { container } = render(result);

      // Check for mobile navigation container
      const mobileNav = container.querySelector('.fixed.bottom-0');
      expect(mobileNav).toBeInTheDocument();
      expect(mobileNav).toHaveClass('md:hidden');
    });

    it('desktop sidebar has correct responsive classes', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      const { container } = render(result);

      // Check for desktop sidebar
      const sidebar = container.querySelector('aside');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveClass('hidden', 'md:block');
    });

    it('mobile navigation includes all menu items', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      // Mobile navigation should have all items (verify by checking duplicates)
      const overviewLinks = screen.getAllByText('Overview');
      expect(overviewLinks.length).toBeGreaterThanOrEqual(2); // Desktop + mobile
    });
  });

  describe('User Profile Display', () => {
    it('displays user full name when available', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'John Doe',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays user email when full name is not available', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: null,
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      expect(screen.getByText('owner@example.com')).toBeInTheDocument();
    });

    it('displays user email when full name is empty string', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: '',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      expect(screen.getByText('owner@example.com')).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    it('renders logout button', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('logout button is within a form with correct action', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      const { container } = render(result);

      const form = container.querySelector('form[action="/auth/logout"]');
      expect(form).toBeInTheDocument();
      expect(form?.getAttribute('method')).toBe('post');
    });

    it('logout button has correct variant and size', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      const { container } = render(result);

      const logoutButton = screen.getByText('Logout').closest('button');
      expect(logoutButton).toHaveAttribute('data-variant', 'ghost');
      expect(logoutButton).toHaveAttribute('data-size', 'sm');
      expect(logoutButton).toHaveAttribute('type', 'submit');
    });

    it('logout button includes logout icon', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      expect(screen.getByTestId('icon-logout')).toBeInTheDocument();
    });
  });

  describe('Header and Branding', () => {
    it('renders site logo and name in header', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      expect(screen.getByText('Camping Thailand')).toBeInTheDocument();
    });

    it('header contains link to home page', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      const homeLink = screen.getByText('Camping Thailand').closest('a');
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('displays dashboard breadcrumb', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      render(result);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('icon-chevron-right')).toBeInTheDocument();
    });

    it('header is sticky with correct classes', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      const { container } = render(result);

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('sticky', 'top-0');
    });
  });

  describe('Layout Structure', () => {
    it('renders main content area with correct classes', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div data-testid="main-content">Test Content</div>,
      });

      const { container } = render(result);

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass('flex-1', 'min-w-0');
    });

    it('applies correct padding for mobile navigation', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      const { container } = render(result);

      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('pb-20', 'md:pb-0');
    });

    it('renders with correct background color', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await DashboardLayout({
        children: <div>Content</div>,
      });

      const { container } = render(result);

      const rootDiv = container.querySelector('.min-h-screen');
      expect(rootDiv).toHaveClass('bg-muted/30');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles session without user data', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: null,
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      // This will throw because session.user.id will fail when user is null
      // In a real scenario, this shouldn't happen as Supabase manages sessions properly
      await expect(async () => {
        await DashboardLayout({ children: <div>Content</div> });
      }).rejects.toThrow();
    });

    it('handles database query errors gracefully', async () => {
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      try {
        await DashboardLayout({ children: <div>Content</div> });
      } catch (e) {
        // redirect throws an error in Next.js
      }

      expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('correctly queries profile with user ID from session', async () => {
      const mockEq = jest.fn().mockReturnThis();
      const mockSupabase = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: 'owner-123', email: 'owner@example.com' },
              },
            },
          }),
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: mockEq,
        single: jest.fn().mockResolvedValue({
          data: {
            user_role: 'owner',
            full_name: 'Campsite Owner',
          },
        }),
      };
      mockCreateClient.mockResolvedValue(mockSupabase);

      await DashboardLayout({ children: <div>Content</div> });

      expect(mockEq).toHaveBeenCalledWith('id', 'owner-123');
    });
  });
});
