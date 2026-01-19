'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { getAccessToken } from '@/lib/auth/token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3091';

interface AdminStats {
  pending_campsites: number;
  pending_owner_requests: number;
  reported_reviews: number;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!user || role !== 'admin')) {
      router.push('/auth/login?redirect=/admin');
    }
  }, [user, role, authLoading, router]);

  // Fetch admin stats for sidebar badges
  useEffect(() => {
    async function fetchStats() {
      if (!user || role !== 'admin') return;

      try {
        const token = getAccessToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setStatsLoading(false);
      }
    }

    if (user && role === 'admin') {
      fetchStats();
    }
  }, [user, role]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-12 w-12 rounded-full" />
          <Skeleton className="mx-auto h-4 w-32" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not admin (redirect will happen)
  if (!user || role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            You need admin privileges to access this area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        pendingCampsites={stats?.pending_campsites}
        pendingOwnerRequests={stats?.pending_owner_requests}
        reportedReviews={stats?.reported_reviews}
      />

      {/* Main content area */}
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
