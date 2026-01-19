'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tent, Users, MessageSquareWarning, Star, FileText } from 'lucide-react';
import { getAccessToken } from '@/lib/auth/token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3091';

interface AdminStats {
  pending_campsites: number;
  pending_owner_requests: number;
  reported_reviews: number;
  total_campsites: number;
  total_users: number;
  total_reviews: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = getAccessToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  const actionCards = [
    {
      title: 'Pending Campsites',
      value: stats?.pending_campsites || 0,
      icon: Tent,
      href: '/admin/campsites/pending',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Awaiting approval',
    },
    {
      title: 'Owner Requests',
      value: stats?.pending_owner_requests || 0,
      icon: Users,
      href: '/admin/owner-requests',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Pending review',
    },
    {
      title: 'Reported Reviews',
      value: stats?.reported_reviews || 0,
      icon: MessageSquareWarning,
      href: '/admin/reviews/reported',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Needs moderation',
    },
  ];

  const overviewCards = [
    {
      title: 'Total Campsites',
      value: stats?.total_campsites || 0,
      icon: Tent,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Reviews',
      value: stats?.total_reviews || 0,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Manage campsites, owner requests, and review moderation
        </p>
      </div>

      {/* Action Required Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Action Required
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {card.title}
                    </CardTitle>
                    <div className={`rounded-lg p-2 ${card.bgColor}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {card.value}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Platform Overview Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Platform Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {overviewCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {card.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {card.value.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/campsites/pending">
            <Card className="cursor-pointer transition-colors hover:bg-gray-50">
              <CardContent className="flex items-center gap-3 p-4">
                <Tent className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium">Review Campsites</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/owner-requests">
            <Card className="cursor-pointer transition-colors hover:bg-gray-50">
              <CardContent className="flex items-center gap-3 p-4">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium">Review Owners</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/reviews/reported">
            <Card className="cursor-pointer transition-colors hover:bg-gray-50">
              <CardContent className="flex items-center gap-3 p-4">
                <MessageSquareWarning className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium">Moderate Reviews</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/">
            <Card className="cursor-pointer transition-colors hover:bg-gray-50">
              <CardContent className="flex items-center gap-3 p-4">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium">View Site</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
