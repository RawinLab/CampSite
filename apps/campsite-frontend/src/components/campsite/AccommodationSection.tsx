'use client';

import { Bed } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AccommodationType } from '@campsite/shared';
import { AccommodationCard } from './AccommodationCard';

interface AccommodationSectionProps {
  accommodations: AccommodationType[];
  bookingUrl?: string | null;
}

export function AccommodationSection({ accommodations, bookingUrl }: AccommodationSectionProps) {
  if (!accommodations || accommodations.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-brand-text">
          <Bed className="w-5 h-5 text-brand-green" />
          ที่พัก
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accommodations.map((accommodation) => (
            <AccommodationCard
              key={accommodation.id}
              accommodation={accommodation}
              bookingUrl={bookingUrl}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
