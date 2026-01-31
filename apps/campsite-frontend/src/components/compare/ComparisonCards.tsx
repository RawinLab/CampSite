'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  COMPARISON_ROWS,
  COMPARISON_AMENITIES,
  hasAmenity,
} from '@/lib/constants/comparisonRows';
import { cn } from '@/lib/utils';
import type { CampsiteDetail } from '@campsite/shared';

interface ComparisonCardsProps {
  campsites: CampsiteDetail[];
}

export function ComparisonCards({ campsites }: ComparisonCardsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCampsite = campsites[activeIndex];

  if (!activeCampsite) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Tab buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {campsites.map((campsite, index) => (
          <button
            key={campsite.id}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300',
              'focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2',
              index === activeIndex
                ? 'bg-brand-green text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {campsite.name.length > 20
              ? `${campsite.name.slice(0, 20)}...`
              : campsite.name}
          </button>
        ))}
      </div>

      {/* Active campsite card */}
      <Card className="overflow-hidden rounded-2xl border-gray-100">
        {/* Image */}
        <div className="relative aspect-video w-full">
          {activeCampsite.photos?.[0]?.url ? (
            <Image
              src={activeCampsite.photos[0].url}
              alt={activeCampsite.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200">
              <span className="text-gray-400">ไม่มีรูปภาพ</span>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Name */}
          <h2 className="mb-4 text-xl font-bold text-brand-text">
            {activeCampsite.name}
          </h2>

          {/* Details list */}
          <dl className="space-y-3">
            {COMPARISON_ROWS.map(({ key, label, render }) => (
              <div
                key={key}
                className="flex items-center justify-between border-b border-gray-100 pb-2"
              >
                <dt className="text-brand-text/60">{label}</dt>
                <dd className="font-medium text-brand-text">
                  {render(activeCampsite)}
                </dd>
              </div>
            ))}
          </dl>

          {/* Amenities */}
          <div className="mt-6">
            <h3 className="mb-3 font-semibold text-brand-text">สิ่งอำนวยความสะดวก</h3>
            <div className="grid grid-cols-2 gap-2">
              {COMPARISON_AMENITIES.map(({ slug, name }) => {
                const has = hasAmenity(activeCampsite, slug);
                return (
                  <div
                    key={slug}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-300',
                      has ? 'bg-brand-green/10 text-brand-green' : 'bg-gray-50 text-gray-400'
                    )}
                  >
                    {has ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span>{name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* View details button */}
          <Button asChild className="mt-6 w-full bg-brand-green text-white rounded-xl hover:bg-forest-700 transition-all duration-300">
            <Link href={`/campsites/${activeCampsite.id}`}>
              ดูรายละเอียด
            </Link>
          </Button>
        </div>
      </Card>

      {/* Quick navigation dots */}
      <div className="flex justify-center gap-2">
        {campsites.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'h-2 w-2 rounded-full transition-all duration-300',
              index === activeIndex ? 'bg-brand-green' : 'bg-gray-300'
            )}
            aria-label={`View campsite ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default ComparisonCards;
