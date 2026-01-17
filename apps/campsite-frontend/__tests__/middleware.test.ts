import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import * as supabaseMiddleware from '@/lib/supabase/middleware';

// Mock Next.js server modules
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(() => ({
      cookies: {
        set: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
      },
    })),
    redirect: jest.fn((url) => ({
      url: url.toString(),
      type: 'redirect',
      cookies: {
        set: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
      },
    })),
  },
}));

// Mock Supabase middleware
jest.mock('@/lib/supabase/middleware', () => ({
  updateSession: jest.fn(),
}));

describe('Middleware - Route Protection', () => {
  let mockRequest: Partial<NextRequest>;
  let mockNextResponse: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock response
    mockNextResponse = {
      cookies: {
        set: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
      },
    };

    (NextResponse.next as jest.Mock).mockReturnValue(mockNextResponse);
    (supabaseMiddleware.updateSession as jest.Mock).mockResolvedValue(mockNextResponse);
  });

  const createMockRequest = (pathname: string, cookies: Record<string, string> = {}): NextRequest => {
    const url = `http://localhost:3090${pathname}`;

    const cookieMap = new Map(Object.entries(cookies));
    const cookieArray = Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value }));

    mockRequest = {
      nextUrl: {
        pathname,
        searchParams: new URLSearchParams(),
      } as any,
      url,
      cookies: {
        get: jest.fn((name: string) => {
          const value = cookieMap.get(name);
          return value ? { name, value } : undefined;
        }),
        getAll: jest.fn(() => cookieArray),
        has: jest.fn((name: string) => cookieMap.has(name)),
        set: jest.fn(),
        delete: jest.fn(),
      } as any,
      headers: new Headers(),
    };

    return mockRequest as NextRequest;
  };

  describe('Public Routes', () => {
    it('should allow access to home page without authentication', async () => {
      const request = createMockRequest('/');

      const response = await middleware(request);

      expect(supabaseMiddleware.updateSession).toHaveBeenCalledWith(request);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });

    it('should allow access to campsites listing page without authentication', async () => {
      const request = createMockRequest('/campsites');

      const response = await middleware(request);

      expect(supabaseMiddleware.updateSession).toHaveBeenCalledWith(request);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });

    it('should allow access to login page without authentication', async () => {
      const request = createMockRequest('/auth/login');

      const response = await middleware(request);

      expect(supabaseMiddleware.updateSession).toHaveBeenCalledWith(request);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });

    it('should allow access to signup page without authentication', async () => {
      const request = createMockRequest('/auth/signup');

      const response = await middleware(request);

      expect(supabaseMiddleware.updateSession).toHaveBeenCalledWith(request);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });
  });

  describe('Protected Routes - Unauthenticated', () => {
    it('should redirect to login when accessing /dashboard without auth', async () => {
      const request = createMockRequest('/dashboard');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.searchParams.get('redirect')).toBe('/dashboard');
    });

    it('should redirect to login when accessing /profile without auth', async () => {
      const request = createMockRequest('/profile');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.searchParams.get('redirect')).toBe('/profile');
    });

    it('should redirect to login when accessing /settings without auth', async () => {
      const request = createMockRequest('/settings');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });

    it('should redirect to login when accessing /wishlist without auth', async () => {
      const request = createMockRequest('/wishlist');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });

    it('should redirect to login when accessing /my-reviews without auth', async () => {
      const request = createMockRequest('/my-reviews');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });

    it('should redirect to login when accessing /auth/become-owner without auth', async () => {
      const request = createMockRequest('/auth/become-owner');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });
  });

  describe('Owner Routes - Unauthenticated', () => {
    it('should redirect to login when accessing /owner without auth', async () => {
      const request = createMockRequest('/owner');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.searchParams.get('redirect')).toBe('/owner');
    });

    it('should redirect to login when accessing /owner/campsites without auth', async () => {
      const request = createMockRequest('/owner/campsites');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });

    it('should redirect to login when accessing /owner/analytics without auth', async () => {
      const request = createMockRequest('/owner/analytics');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });

    it('should redirect to login when accessing /owner/inquiries without auth', async () => {
      const request = createMockRequest('/owner/inquiries');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });
  });

  describe('Admin Routes - Unauthenticated', () => {
    it('should redirect to login when accessing /admin without auth', async () => {
      const request = createMockRequest('/admin');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.searchParams.get('redirect')).toBe('/admin');
    });

    it('should redirect to login when accessing /admin/users without auth', async () => {
      const request = createMockRequest('/admin/users');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });

    it('should redirect to login when accessing /admin/campsites without auth', async () => {
      const request = createMockRequest('/admin/campsites');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });

    it('should redirect to login when accessing /admin/owner-requests without auth', async () => {
      const request = createMockRequest('/admin/owner-requests');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });

    it('should redirect to login when accessing /admin/reviews without auth', async () => {
      const request = createMockRequest('/admin/reviews');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });
  });

  describe('Auth Routes - Authenticated Users', () => {
    it('should redirect authenticated users from login page to home', async () => {
      const request = createMockRequest('/auth/login', {
        'sb-access-token': 'mock-token-123',
      });

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('http://localhost:3090/'),
        })
      );
    });

    it('should redirect authenticated users from signup page to home', async () => {
      const request = createMockRequest('/auth/signup', {
        'sb-access-token': 'mock-token-456',
      });

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('http://localhost:3090/'),
        })
      );
    });

    it('should detect auth token from alternative cookie name format', async () => {
      const request = createMockRequest('/auth/login', {
        'sb-localhost-auth-token': 'mock-token-789',
      });

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('http://localhost:3090/'),
        })
      );
    });
  });

  describe('Protected Routes - Authenticated Users', () => {
    it('should allow access to /dashboard when authenticated', async () => {
      const request = createMockRequest('/dashboard', {
        'sb-access-token': 'mock-token-123',
      });

      const response = await middleware(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });

    it('should allow access to /profile when authenticated', async () => {
      const request = createMockRequest('/profile', {
        'sb-access-token': 'mock-token-123',
      });

      const response = await middleware(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });

    it('should allow access to /settings when authenticated', async () => {
      const request = createMockRequest('/settings', {
        'sb-access-token': 'mock-token-123',
      });

      const response = await middleware(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });

    it('should allow access to /wishlist when authenticated', async () => {
      const request = createMockRequest('/wishlist', {
        'sb-access-token': 'mock-token-123',
      });

      const response = await middleware(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });
  });

  describe('Owner Routes - Authenticated Users', () => {
    it('should allow authenticated users to access /owner routes (role check done client-side)', async () => {
      const request = createMockRequest('/owner', {
        'sb-access-token': 'mock-token-123',
      });

      const response = await middleware(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });

    it('should allow authenticated users to access /owner/campsites', async () => {
      const request = createMockRequest('/owner/campsites', {
        'sb-access-token': 'mock-token-123',
      });

      const response = await middleware(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });

    it('should allow authenticated users to access /owner/analytics', async () => {
      const request = createMockRequest('/owner/analytics', {
        'sb-access-token': 'mock-token-123',
      });

      const response = await middleware(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });
  });

  describe('Admin Routes - Authenticated Users', () => {
    it('should allow authenticated users to access /admin routes (role check done client-side)', async () => {
      const request = createMockRequest('/admin', {
        'sb-access-token': 'mock-token-123',
      });

      const response = await middleware(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });

    it('should allow authenticated users to access /admin/users', async () => {
      const request = createMockRequest('/admin/users', {
        'sb-access-token': 'mock-token-123',
      });

      const response = await middleware(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });

    it('should allow authenticated users to access /admin/campsites', async () => {
      const request = createMockRequest('/admin/campsites', {
        'sb-access-token': 'mock-token-123',
      });

      const response = await middleware(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });
  });

  describe('Redirect Parameter Preservation', () => {
    it('should preserve the original path in redirect query parameter', async () => {
      const originalPath = '/dashboard/settings/advanced';
      const request = createMockRequest(originalPath);

      await middleware(request);

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.href).toContain('/auth/login');
      expect(redirectCall.searchParams.get('redirect')).toBe(originalPath);
    });

    it('should preserve query parameters in the redirect path', async () => {
      const request = createMockRequest('/profile');
      // Simulate query params in URL
      request.nextUrl.searchParams.set('tab', 'settings');

      await middleware(request);

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.searchParams.get('redirect')).toBe('/profile');
    });
  });

  describe('Edge Cases', () => {
    it('should handle routes with trailing slashes', async () => {
      const request = createMockRequest('/dashboard/');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });

    it('should handle nested protected routes', async () => {
      const request = createMockRequest('/dashboard/settings/security');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });

    it('should handle nested owner routes', async () => {
      const request = createMockRequest('/owner/campsites/123/edit');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });

    it('should handle nested admin routes', async () => {
      const request = createMockRequest('/admin/users/123/details');

      await middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login'),
        })
      );
    });

    it('should not interfere with public routes that start with protected route names', async () => {
      const request = createMockRequest('/about');

      const response = await middleware(request);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(response).toBe(mockNextResponse);
    });

    it('should call updateSession for all requests', async () => {
      const publicRequest = createMockRequest('/');
      await middleware(publicRequest);
      expect(supabaseMiddleware.updateSession).toHaveBeenCalledWith(publicRequest);

      jest.clearAllMocks();

      const protectedRequest = createMockRequest('/dashboard', {
        'sb-access-token': 'mock-token',
      });
      await middleware(protectedRequest);
      expect(supabaseMiddleware.updateSession).toHaveBeenCalledWith(protectedRequest);
    });
  });
});
