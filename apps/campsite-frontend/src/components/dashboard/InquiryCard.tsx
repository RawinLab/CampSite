'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Clock } from 'lucide-react';
import type { InquiryWithCampsite, InquiryStatus } from '@campsite/shared';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface InquiryCardProps {
  inquiry: InquiryWithCampsite;
  compact?: boolean;
}

const STATUS_CONFIG: Record<InquiryStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'New', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'secondary' },
  resolved: { label: 'Resolved', variant: 'outline' },
  closed: { label: 'Closed', variant: 'outline' },
};

const INQUIRY_TYPE_LABELS: Record<string, string> = {
  booking: 'Booking',
  general: 'General',
  complaint: 'Complaint',
  other: 'Other',
};

export function InquiryCard({ inquiry, compact = false }: InquiryCardProps) {
  const isUnread = !inquiry.read_at;
  const statusConfig = STATUS_CONFIG[inquiry.status];

  return (
    <Link href={`/dashboard/inquiries/${inquiry.id}`}>
      <Card
        className={cn(
          'hover:border-primary/50 transition-colors cursor-pointer',
          isUnread && 'border-primary bg-primary/5'
        )}
      >
        <CardContent className={cn('p-4', compact && 'p-3')}>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center',
                isUnread && 'bg-primary text-primary-foreground'
              )}
            >
              <User className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className={cn('font-semibold truncate', isUnread && 'text-primary')}>
                    {inquiry.guest_name}
                  </span>
                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>

              <p className="text-sm text-muted-foreground truncate mb-1">
                {inquiry.campsite.name} - {INQUIRY_TYPE_LABELS[inquiry.inquiry_type] || inquiry.inquiry_type}
              </p>

              {!compact && (
                <p className="text-sm line-clamp-2 text-muted-foreground mb-2">
                  {inquiry.message}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {inquiry.check_in_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(inquiry.check_in_date).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                      })}
                      {inquiry.check_out_date && (
                        <>
                          {' - '}
                          {new Date(inquiry.check_out_date).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(inquiry.created_at), {
                      addSuffix: true,
                      locale: th,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
