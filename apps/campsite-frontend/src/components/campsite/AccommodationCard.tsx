'use client';

import { Users, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { AccommodationType } from '@campsite/shared';
import { formatPrice, formatCapacity } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface AccommodationCardProps {
  accommodation: AccommodationType;
  bookingUrl?: string | null;
}

export function AccommodationCard({ accommodation, bookingUrl }: AccommodationCardProps) {
  const hasWeekendPrice =
    accommodation.price_weekend !== null &&
    accommodation.price_weekend !== accommodation.price_per_night;

  const handleBookClick = () => {
    if (bookingUrl) {
      window.open(bookingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Map amenity slugs to display names
  const getAmenityLabel = (slug: string): string => {
    const labels: Record<string, string> = {
      wifi: 'WiFi',
      ac: 'Air Conditioning',
      'hot-water': 'Hot Water',
      'private-bathroom': 'Private Bathroom',
      electricity: 'Electricity',
      bedding: 'Bedding Provided',
      towels: 'Towels',
      tv: 'TV',
      minibar: 'Minibar',
      coffee: 'Coffee/Tea',
    };
    return labels[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Card className="flex flex-col h-full rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{accommodation.name}</CardTitle>
        {accommodation.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {accommodation.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Capacity */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>Capacity: {formatCapacity(accommodation.capacity)}</span>
        </div>

        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-green">
              {formatPrice(accommodation.price_per_night)}
            </span>
            <span className="text-sm text-muted-foreground">/ night</span>
          </div>
          {hasWeekendPrice && (
            <div className="text-sm text-muted-foreground">
              Weekend: <span className="font-medium">{formatPrice(accommodation.price_weekend!)}</span>
            </div>
          )}
        </div>

        {/* Included Amenities */}
        {accommodation.amenities_included && accommodation.amenities_included.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Included:</p>
            <div className="flex flex-wrap gap-1">
              {accommodation.amenities_included.slice(0, 5).map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-brand-green/10 text-brand-green"
                >
                  <Check className="w-3 h-3" />
                  {getAmenityLabel(amenity)}
                </span>
              ))}
              {accommodation.amenities_included.length > 5 && (
                <span className="text-xs text-muted-foreground px-2 py-1">
                  +{accommodation.amenities_included.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          className={cn(
            'w-full rounded-xl transition-all duration-300',
            bookingUrl ? 'bg-brand-green hover:bg-forest-700' : ''
          )}
          onClick={handleBookClick}
          disabled={!bookingUrl}
          variant={bookingUrl ? 'default' : 'outline'}
        >
          {bookingUrl ? (
            <>
              จองเลย
              <ExternalLink className="w-4 h-4 ml-2" />
            </>
          ) : (
            'ติดต่อเพื่อจอง'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
