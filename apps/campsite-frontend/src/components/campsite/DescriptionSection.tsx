'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, CalendarDays, Tent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CampsiteDetail } from '@campsite/shared';
import { formatTime, formatPriceRange } from '@/lib/utils/format';

interface DescriptionSectionProps {
  campsite: CampsiteDetail;
}

const COLLAPSED_LENGTH = 300;

export function DescriptionSection({ campsite }: DescriptionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const description = campsite.description || '';
  const shouldTruncate = description.length > COLLAPSED_LENGTH;
  const displayDescription =
    shouldTruncate && !isExpanded
      ? description.slice(0, COLLAPSED_LENGTH) + '...'
      : description;

  // Get campsite type label
  const getCampsiteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      camping: 'Camping',
      glamping: 'Glamping',
      'tented-resort': 'Tented Resort',
      bungalow: 'Bungalow',
    };
    return labels[type] || type;
  };

  return (
    <section className="space-y-6">
      {/* About Section */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-text font-bold">
            <Tent className="w-5 h-5 text-brand-green" />
            เกี่ยวกับ {campsite.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campsite Type Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-green/10 text-brand-green">
            {getCampsiteTypeLabel(campsite.campsite_type)}
          </div>

          {/* Description */}
          {description && (
            <div className="space-y-2">
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {displayDescription}
              </p>
              {shouldTruncate && (
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      แสดงน้อยลง <ChevronUp className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      อ่านเพิ่มเติม <ChevronDown className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Check-in/Check-out */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-brand-green/10">
                <Clock className="w-5 h-5 text-brand-green" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-in / Check-out</p>
                <p className="font-medium">
                  {formatTime(campsite.check_in_time)} - {formatTime(campsite.check_out_time)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Range */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-brand-green/10">
                <span className="text-brand-green font-bold">฿</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price per Night</p>
                <p className="font-medium">
                  {formatPriceRange(campsite.min_price, campsite.max_price)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stay Duration */}
        {(campsite as any).min_stay_nights || (campsite as any).max_stay_nights ? (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-brand-green/10">
                  <CalendarDays className="w-5 h-5 text-brand-green" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stay Duration</p>
                  <p className="font-medium">
                    {(campsite as any).min_stay_nights && `Min ${(campsite as any).min_stay_nights} night(s)`}
                    {(campsite as any).min_stay_nights && (campsite as any).max_stay_nights && ' - '}
                    {(campsite as any).max_stay_nights && `Max ${(campsite as any).max_stay_nights} night(s)`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
