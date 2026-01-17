'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RejectDialog } from './RejectDialog';
import {
  User,
  Building2,
  Phone,
  Calendar,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OwnerRequest {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string;
  contact_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason?: string;
  user_full_name: string;
  user_avatar_url: string | null;
}

interface OwnerRequestCardProps {
  request: OwnerRequest;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function OwnerRequestCard({
  request,
  onApprove,
  onReject,
  isLoading = false,
}: OwnerRequestCardProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await onApprove(request.id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reason: string) => {
    setActionLoading('reject');
    try {
      await onReject(request.id, reason);
      setRejectDialogOpen(false);
    } finally {
      setActionLoading(null);
    }
  };

  const submittedDate = new Date(request.created_at);
  const timeAgo = formatDistanceToNow(submittedDate, { addSuffix: true });

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                {request.user_avatar_url ? (
                  <img
                    src={request.user_avatar_url}
                    alt={request.user_full_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {request.user_full_name}
                </h3>
                <p className="text-sm text-gray-500">
                  Requested {timeAgo}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              Pending
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Business Name */}
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">{request.business_name}</p>
              <p className="text-sm text-gray-500">Business Name</p>
            </div>
          </div>

          {/* Business Description */}
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-700 line-clamp-3">
                {request.business_description}
              </p>
              <p className="mt-1 text-xs text-gray-500">Business Description</p>
            </div>
          </div>

          {/* Contact Phone */}
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-gray-900">{request.contact_phone}</p>
              <p className="text-sm text-gray-500">Contact Phone</p>
            </div>
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
        title="Reject Owner Request"
        description="Are you sure you want to reject this owner request? The user will be notified."
        itemName={request.business_name}
        onConfirm={handleReject}
        isLoading={actionLoading === 'reject'}
      />
    </>
  );
}
