'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InquiryReplyForm } from '@/components/dashboard/InquiryReplyForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { InquiryDetailResponse, InquiryStatus } from '@campsite/shared';

const STATUS_CONFIG: Record<InquiryStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'New', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'secondary' },
  resolved: { label: 'Resolved', variant: 'outline' },
  closed: { label: 'Closed', variant: 'outline' },
};

const INQUIRY_TYPE_LABELS: Record<string, string> = {
  booking: 'Booking Inquiry',
  general: 'General Question',
  complaint: 'Complaint',
  other: 'Other',
};

export default function InquiryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const inquiryId = params.id as string;

  const [inquiry, setInquiry] = useState<InquiryDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    async function fetchInquiry() {
      try {
        const response = await fetch(`/api/dashboard/inquiries/${inquiryId}`);
        if (response.ok) {
          const { data } = await response.json();
          setInquiry(data);
        } else {
          toast({
            title: 'Error',
            description: 'Inquiry not found',
            variant: 'destructive',
          });
          router.push('/dashboard/inquiries');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load inquiry',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchInquiry();
  }, [inquiryId, router, toast]);

  const updateStatus = async (newStatus: InquiryStatus) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/dashboard/inquiries/${inquiryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setInquiry((prev) => prev ? { ...prev, status: newStatus } : null);
        toast({
          title: 'Success',
          description: 'Status updated',
        });
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!inquiry) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[inquiry.status];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/inquiries">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Inquiry from {inquiry.guest_name}</h1>
          <p className="text-sm text-muted-foreground">
            {inquiry.campsite.name}
          </p>
        </div>
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      </div>

      {/* Inquiry info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {INQUIRY_TYPE_LABELS[inquiry.inquiry_type] || inquiry.inquiry_type}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(inquiry.created_at), {
                addSuffix: true,
                locale: th,
              })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Guest info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{inquiry.guest_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${inquiry.guest_email}`}
                className="text-sm text-primary hover:underline"
              >
                {inquiry.guest_email}
              </a>
            </div>
            {inquiry.guest_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${inquiry.guest_phone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {inquiry.guest_phone}
                </a>
              </div>
            )}
          </div>

          {/* Dates */}
          {inquiry.check_in_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(inquiry.check_in_date), 'PPP', { locale: th })}
                {inquiry.check_out_date && (
                  <> - {format(new Date(inquiry.check_out_date), 'PPP', { locale: th })}</>
                )}
              </span>
              {inquiry.guest_count && (
                <span className="text-muted-foreground">
                  ({inquiry.guest_count} guests)
                </span>
              )}
            </div>
          )}

          {/* Message */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="whitespace-pre-wrap">{inquiry.message}</p>
          </div>
        </CardContent>
      </Card>

      {/* Owner reply */}
      {inquiry.owner_reply ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Your Reply</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{inquiry.owner_reply}</p>
            {inquiry.replied_at && (
              <p className="text-sm text-muted-foreground mt-4">
                Sent {formatDistanceToNow(new Date(inquiry.replied_at), { addSuffix: true, locale: th })}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <InquiryReplyForm inquiryId={inquiryId} />
      )}

      {/* Status actions */}
      <div className="flex flex-wrap gap-2">
        {inquiry.status !== 'resolved' && (
          <Button
            variant="outline"
            onClick={() => updateStatus('resolved')}
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Mark as Resolved
          </Button>
        )}
        {inquiry.status !== 'closed' && (
          <Button
            variant="ghost"
            onClick={() => updateStatus('closed')}
            disabled={isUpdatingStatus}
          >
            <X className="h-4 w-4 mr-2" />
            Close Inquiry
          </Button>
        )}
        {inquiry.status === 'closed' && (
          <Button
            variant="outline"
            onClick={() => updateStatus('new')}
            disabled={isUpdatingStatus}
          >
            Reopen Inquiry
          </Button>
        )}
      </div>
    </div>
  );
}
