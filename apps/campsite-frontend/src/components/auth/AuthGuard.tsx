'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@campsite/shared';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requiredRole,
  redirectTo = '/auth/login',
  fallback,
}: AuthGuardProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      const currentPath = window.location.pathname;
      router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check role requirement
    if (requiredRole) {
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

      if (!allowedRoles.includes(role)) {
        // Redirect to unauthorized page or home
        router.push('/unauthorized');
      }
    }
  }, [user, role, loading, requiredRole, redirectTo, router]);

  // Show loading state
  if (loading) {
    return fallback || <AuthGuardSkeleton />;
  }

  // Not authenticated
  if (!user) {
    return fallback || <AuthGuardSkeleton />;
  }

  // Check role
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(role)) {
      return fallback || <AuthGuardSkeleton />;
    }
  }

  return <>{children}</>;
}

function AuthGuardSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl space-y-4 p-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="grid grid-cols-3 gap-4 pt-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

// Higher-order component for role-based access
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: { requiredRole?: UserRole | UserRole[]; redirectTo?: string }
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard requiredRole={options?.requiredRole} redirectTo={options?.redirectTo}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}
