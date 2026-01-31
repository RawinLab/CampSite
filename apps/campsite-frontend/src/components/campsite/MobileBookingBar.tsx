'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CampsiteDetail } from '@campsite/shared';
import { formatPriceRange } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface MobileBookingBarProps {
  campsite: CampsiteDetail;
  onInquiry?: () => void;
}

export function MobileBookingBar({ campsite, onInquiry }: MobileBookingBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const heroHeight = 400; // Approximate hero section height

      // Show bar after scrolling past hero
      if (currentScrollY > heroHeight) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleBookingClick = () => {
    if (campsite.booking_url) {
      window.open(campsite.booking_url, '_blank', 'noopener,noreferrer');
    }
  };

  const hasBookingUrl = !!campsite.booking_url;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'bg-white rounded-t-3xl shadow-2xl border-t',
        'transform transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Price */}
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">Price per night</p>
            <p className="font-bold text-lg truncate text-brand-green">
              {formatPriceRange(campsite.min_price, campsite.max_price)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={onInquiry}
              aria-label="Send inquiry"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>

            {hasBookingUrl ? (
              <Button className="bg-brand-coral hover:bg-[#c96a52] rounded-xl transition-all duration-300" onClick={handleBookingClick}>
                จองเลย
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button variant="secondary" className="rounded-xl transition-all duration-300" onClick={onInquiry}>
                ติดต่อ
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </div>
  );
}
