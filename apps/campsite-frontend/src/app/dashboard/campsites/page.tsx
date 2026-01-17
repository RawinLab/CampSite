'use client';

// Force dynamic rendering for pages using useSearchParams
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CampsiteTable } from '@/components/dashboard/CampsiteTable';
import { CampsiteListSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { Pagination } from '@/components/search/Pagination';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { OwnerCampsiteSummary } from '@campsite/shared';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
];

export default function CampsitesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [campsites, setCampsites] = useState<OwnerCampsiteSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const status = searchParams.get('status') || 'all';
  const page = Number(searchParams.get('page')) || 1;
  const limit = 10;

  useEffect(() => {
    async function fetchCampsites() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          status,
          page: String(page),
          limit: String(limit),
        });

        const response = await fetch(`/api/dashboard/campsites?${params}`);
        if (response.ok) {
          const data = await response.json();
          setCampsites(data.data || []);
          setTotal(data.pagination?.total || 0);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load campsites',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchCampsites();
  }, [status, page, toast]);

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', newStatus);
    params.set('page', '1');
    router.push(`/dashboard/campsites?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/dashboard/campsites?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campsite?')) return;

    try {
      const response = await fetch(`/api/dashboard/campsites/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCampsites((prev) => prev.filter((c) => c.id !== id));
        setTotal((prev) => prev - 1);
        toast({
          title: 'Success',
          description: 'Campsite deleted successfully',
        });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete campsite',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <CampsiteListSkeleton />;
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campsites ({total})</h1>
        <Button asChild>
          <Link href="/dashboard/campsites/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Campsite
          </Link>
        </Button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={status === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Campsite list */}
      <CampsiteTable campsites={campsites} onDelete={handleDelete} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
