'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  COMPARISON_ROWS,
  COMPARISON_AMENITIES,
  hasAmenity,
} from '@/lib/constants/comparisonRows';
import type { CampsiteDetail } from '@campsite/shared';

interface ComparisonTableProps {
  campsites: CampsiteDetail[];
}

export function ComparisonTable({ campsites }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Header with campsite images and names */}
        <thead>
          <tr>
            <th className="min-w-[150px] bg-gray-50 p-4 text-left"></th>
            {campsites.map((campsite) => (
              <th
                key={campsite.id}
                className="min-w-[250px] bg-gray-50 p-4 text-center"
              >
                <div className="space-y-3">
                  {/* Campsite image */}
                  <div className="relative mx-auto h-32 w-48 overflow-hidden rounded-lg">
                    {campsite.photos?.[0]?.url ? (
                      <Image
                        src={campsite.photos[0].url}
                        alt={campsite.name}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-200">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  {/* Campsite name */}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {campsite.name}
                  </h3>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* Basic info rows */}
          {COMPARISON_ROWS.map(({ key, label, render }) => (
            <tr key={key} className="border-t border-gray-200">
              <td className="bg-gray-50 p-4 font-medium text-gray-700">
                {label}
              </td>
              {campsites.map((campsite) => (
                <td key={campsite.id} className="p-4 text-center">
                  {render(campsite)}
                </td>
              ))}
            </tr>
          ))}

          {/* Amenities section header */}
          <tr className="border-t border-gray-200">
            <td
              colSpan={campsites.length + 1}
              className="bg-gray-100 p-4 font-semibold text-gray-800"
            >
              Amenities
            </td>
          </tr>

          {/* Amenity rows */}
          {COMPARISON_AMENITIES.map(({ slug, name }) => (
            <tr key={slug} className="border-t border-gray-200">
              <td className="bg-gray-50 p-4 font-medium text-gray-700">
                {name}
              </td>
              {campsites.map((campsite) => {
                const has = hasAmenity(campsite, slug);
                return (
                  <td key={campsite.id} className="p-4 text-center">
                    {has ? (
                      <Check className="mx-auto h-5 w-5 text-green-500" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-gray-300" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Actions row */}
          <tr className="border-t border-gray-200">
            <td className="bg-gray-50 p-4"></td>
            {campsites.map((campsite) => (
              <td key={campsite.id} className="p-4 text-center">
                <Button asChild className="w-full max-w-[200px]">
                  <Link href={`/campsites/${campsite.id}`}>
                    View Details
                  </Link>
                </Button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ComparisonTable;
