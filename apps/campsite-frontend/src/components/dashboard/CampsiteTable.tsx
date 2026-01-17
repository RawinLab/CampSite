'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StarRating } from '@/components/ui/StarRating';
import { Eye, MessageSquare, MoreVertical, Edit, Trash2, ExternalLink } from 'lucide-react';
import type { OwnerCampsiteSummary } from '@campsite/shared';
import { cn } from '@/lib/utils';

interface CampsiteTableProps {
  campsites: OwnerCampsiteSummary[];
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending Approval', variant: 'secondary' },
  approved: { label: 'Active', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

export function CampsiteTable({ campsites, onDelete, compact = false }: CampsiteTableProps) {
  if (campsites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ExternalLink className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No campsites yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first campsite to start receiving bookings
        </p>
        <Button asChild>
          <Link href="/dashboard/campsites/new">Create Campsite</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {campsites.map((campsite) => (
        <Card key={campsite.id} className="overflow-hidden">
          <CardContent className={cn('p-0', compact ? 'p-3' : 'p-4')}>
            <div className="flex items-center gap-4">
              {/* Thumbnail */}
              <div className={cn('relative bg-muted rounded-lg overflow-hidden flex-shrink-0', compact ? 'w-16 h-12' : 'w-24 h-16')}>
                {campsite.thumbnail_url ? (
                  <Image
                    src={campsite.thumbnail_url}
                    alt={campsite.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/dashboard/campsites/${campsite.id}`}
                    className="font-semibold hover:underline truncate"
                  >
                    {campsite.name}
                  </Link>
                  <Badge variant={STATUS_LABELS[campsite.status]?.variant || 'outline'}>
                    {STATUS_LABELS[campsite.status]?.label || campsite.status}
                  </Badge>
                </div>

                {!compact && (
                  <>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {campsite.review_count > 0 && (
                        <div className="flex items-center gap-1">
                          <StarRating rating={campsite.average_rating} size="sm" />
                          <span>({campsite.review_count})</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{campsite.views_this_month} views this month</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{campsite.inquiries_this_month} inquiries</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/campsites/${campsite.id}`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  {campsite.status === 'approved' && (
                    <DropdownMenuItem asChild>
                      <Link href={`/campsites/${campsite.id}`} target="_blank">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Public Page
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(campsite.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
