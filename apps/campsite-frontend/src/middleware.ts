import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/auth/become-owner',
  '/wishlist',
  '/my-reviews',
];

// Routes that require owner role
const ownerRoutes = [
  '/owner',
  '/owner/campsites',
  '/owner/analytics',
  '/owner/inquiries',
];

// Routes that require admin role
const adminRoutes = [
  '/admin',
  '/admin/users',
  '/admin/campsites',
  '/admin/owner-requests',
  '/admin/reviews',
];

// Routes that should redirect authenticated users
const authRoutes = [
  '/auth/login',
  '/auth/signup',
];

export async function middleware(request: NextRequest) {
  // Update session and get response
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Check if route needs protection
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );
  const isOwnerRoute = ownerRoutes.some(route =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some(route =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Get user from session (checking cookie)
  // Check for our new API-based auth cookie first, then fall back to Supabase cookies
  const authCookie = request.cookies.get('campsite_access_token')?.value ||
    request.cookies.get('sb-access-token')?.value ||
    request.cookies.getAll().find(c => c.name.includes('auth-token'))?.value;

  const isAuthenticated = !!authCookie;

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect unauthenticated users to login
  if ((isProtectedRoute || isOwnerRoute || isAdminRoute) && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Note: Role-based checks (owner/admin) should be done on the page level
  // because we can't efficiently check the profile role in middleware
  // The AuthGuard component handles this on the client side

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
