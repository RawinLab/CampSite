'use client';

// Force dynamic rendering for pages using useSearchParams
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { InquiryCard } from '@/components/dashboard/InquiryCard';
import { InquiryListSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { Pagination } from '@/components/search/Pagination';
import { useToast } from '@/components/ui/use-toast';
import type { InquiryWithCampsite } from '@campsite/shared';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function InquiriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [inquiries, setInquiries] = useState<InquiryWithCampsite[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const status = searchParams.get('status') || 'all';
  const page = Number(searchParams.get('page')) || 1;
  const limit = 20;

  useEffect(() => {
    async function fetchInquiries() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          status,
          page: String(page),
          limit: String(limit),
        });

        const response = await fetch(`/api/dashboard/inquiries?${params}`);
        if (response.ok) {
          const data = await response.json();
          setInquiries(data.data || []);
          setTotal(data.pagination?.total || 0);
          setUnreadCount(data.unread_count || 0);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load inquiries',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchInquiries();
  }, [status, page, toast]);

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', newStatus);
    params.set('page', '1');
    router.push(`/dashboard/inquiries?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/dashboard/inquiries?${params.toString()}`);
  };

  if (isLoading) {
    return <InquiryListSkeleton />;
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Inquiries</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <p className="text-muted-foreground">{total} total</p>
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

      {/* Inquiry list */}
      {inquiries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No inquiries found</p>
          {status !== 'all' && (
            <p className="text-sm mt-2">
              Try changing the filter or check back later
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <InquiryCard key={inquiry.id} inquiry={inquiry} />
          ))}
        </div>
      )}

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
