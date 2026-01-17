'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RejectDialog } from './RejectDialog';
import {
  MapPin,
  Calendar,
  Tent,
  User,
  DollarSign,
  Check,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { CampsiteType } from '@campsite/shared';

interface PendingCampsite {
  id: string;
  name: string;
  description: string;
  campsite_type: CampsiteType;
  province_name: string;
  address: string;
  min_price: number;
  max_price: number;
  owner_id: string;
  owner_name: string;
  photo_count: number;
  submitted_at: string;
}

interface CampsiteApprovalCardProps {
  campsite: PendingCampsite;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

const campsiteTypeLabels: Record<CampsiteType, string> = {
  camping: 'Camping',
  glamping: 'Glamping',
  'tented-resort': 'Tented Resort',
  bungalow: 'Bungalow',
  cabin: 'Cabin',
  'rv-caravan': 'RV/Caravan',
};

export function CampsiteApprovalCard({
  campsite,
  onApprove,
  onReject,
  isLoading = false,
}: CampsiteApprovalCardProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await onApprove(campsite.id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reason: string) => {
    setActionLoading('reject');
    try {
      await onReject(campsite.id, reason);
      setRejectDialogOpen(false);
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const submittedDate = new Date(campsite.submitted_at);
  const timeAgo = formatDistanceToNow(submittedDate, { addSuffix: true });

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {campsite.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{campsite.province_name}</span>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {campsiteTypeLabels[campsite.campsite_type] || campsite.campsite_type}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          <p className="line-clamp-3 text-sm text-gray-600">
            {campsite.description}
          </p>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4 text-gray-400" />
              <span className="truncate">{campsite.owner_name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span>
                {formatPrice(campsite.min_price)} - {formatPrice(campsite.max_price)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <ImageIcon className="h-4 w-4 text-gray-400" />
              <span>{campsite.photo_count} photos</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span title={submittedDate.toLocaleString()}>{timeAgo}</span>
            </div>
          </div>

          {/* Address */}
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <span className="font-medium">Address:</span> {campsite.address}
          </div>
        </CardContent>

        <CardFooter className="gap-2 border-t bg-gray-50 pt-4">
          <Button
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setRejectDialogOpen(true)}
            disabled={isLoading || actionLoading !== null}
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleApprove}
            disabled={isLoading || actionLoading !== null}
          >
            {actionLoading === 'approve' ? (
              'Approving...'
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Approve
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        title="Reject Campsite"
        description="Are you sure you want to reject this campsite? The owner will be notified."
        itemName={campsite.name}
        onConfirm={handleReject}
        isLoading={actionLoading === 'reject'}
      />
    </>
  );
}
