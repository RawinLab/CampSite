'use client';

import { ExternalLink, Star, Calendar, Users, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { CampsiteDetail } from '@campsite/shared';
import { formatPriceRange, formatRating, getRatingText } from '@/lib/utils/format';

import { API_BASE_URL } from '@/lib/api/config';

interface BookingSidebarProps {
  campsite: CampsiteDetail;
  onInquiry?: () => void;
}

// Track analytics event
async function trackBookingClick(campsiteId: string) {
  try {
    await fetch(`${API_BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        campsite_id: campsiteId,
        event_type: 'booking_click',
      }),
    });
  } catch {
    // Silently fail - analytics should not block user action
  }
}

export function BookingSidebar({ campsite, onInquiry }: BookingSidebarProps) {
  const hasBookingUrl = !!campsite.booking_url;
  const hasPhone = !!campsite.phone;

  const handleBookingClick = () => {
    if (campsite.booking_url) {
      // Track booking click event (Q13: Analytics)
      trackBookingClick(campsite.id);
      window.open(campsite.booking_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePhoneClick = () => {
    if (campsite.phone) {
      // Track phone click
      trackBookingClick(campsite.id);
    }
  };

  return (
    <Card className="sticky top-24 rounded-2xl shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-sm text-muted-foreground">ราคาต่อคืน</p>
            <p className="text-2xl font-bold text-brand-green">
              {formatPriceRange(campsite.min_price, campsite.max_price)}
            </p>
          </div>
          {campsite.review_count > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-semibold">{formatRating(campsite.average_rating)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {/* Rating Summary */}
        {campsite.review_count > 0 && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{getRatingText(campsite.average_rating)}</span>
              <span className="text-sm text-muted-foreground">
                {campsite.review_count} {campsite.review_count === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
        )}

        {/* Quick Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              Check-in: {campsite.check_in_time} | Check-out: {campsite.check_out_time}
            </span>
          </div>
          {campsite.accommodation_types.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                {campsite.accommodation_types.length} accommodation{' '}
                {campsite.accommodation_types.length === 1 ? 'type' : 'types'} available
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {hasBookingUrl ? (
          <Button
            className="w-full bg-brand-coral hover:bg-[#c96a52] rounded-xl h-12 text-base font-semibold transition-all duration-300"
            size="lg"
            onClick={handleBookingClick}
          >
            จองเลย
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        ) : hasPhone ? (
          <Button
            className="w-full bg-brand-coral hover:bg-[#c96a52] rounded-xl h-12 text-base font-semibold transition-all duration-300"
            size="lg"
            asChild
            onClick={handlePhoneClick}
          >
            <a href={`tel:${campsite.phone}`}>
              <Phone className="w-4 h-4 mr-2" />
              โทรจอง
            </a>
          </Button>
        ) : (
          <Button
            className="w-full rounded-xl h-12"
            size="lg"
            variant="outline"
            disabled
          >
            ไม่สามารถจองได้
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full border-brand-green text-brand-green hover:bg-brand-green/10 rounded-xl h-12 transition-all duration-300"
          onClick={onInquiry}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          ส่งข้อความสอบถาม
        </Button>
      </CardFooter>
    </Card>
  );
}
