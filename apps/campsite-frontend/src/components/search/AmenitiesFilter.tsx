'use client';

import { useState } from 'react';
import { useAmenities } from '@/hooks/useCampsites';
import { AmenityIcon } from '@/components/ui/AmenityIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Amenity } from '@campsite/shared';

interface AmenitiesFilterProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
  className?: string;
}

// Category labels in Thai
const categoryLabels: Record<string, string> = {
  basic: 'สิ่งอำนวยความสะดวกพื้นฐาน',
  comfort: 'ความสะดวกสบาย',
  food: 'อาหารและเครื่องดื่ม',
  recreation: 'กิจกรรมและนันทนาการ',
  services: 'บริการ',
  safety: 'ความปลอดภัย',
  pets: 'สัตว์เลี้ยง',
};

export function AmenitiesFilter({
  selectedAmenities,
  onChange,
  className,
}: AmenitiesFilterProps) {
  const { amenities, isLoading, error } = useAmenities(true) as {
    amenities: Record<string, Amenity[]>;
    isLoading: boolean;
    error: string | null;
  };
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['basic']);

  const handleToggle = (slug: string) => {
    if (selectedAmenities.includes(slug)) {
      onChange(selectedAmenities.filter((a) => a !== slug));
    } else {
      onChange([...selectedAmenities, slug]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-sm text-red-500', className)}>
        ไม่สามารถโหลดสิ่งอำนวยความสะดวกได้
      </div>
    );
  }

  const categories = Object.keys(amenities || {});

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">สิ่งอำนวยความสะดวก</h3>
        {selectedAmenities.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-green-600 hover:text-green-700"
          >
            ล้างทั้งหมด ({selectedAmenities.length})
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        เลือกหลายรายการจะแสดงเฉพาะที่พักที่มีครบทุกรายการ
      </p>

      <div className="space-y-2">
        {categories.map((category) => {
          const categoryAmenities = amenities[category] || [];
          const isExpanded = expandedCategories.includes(category);
          const selectedInCategory = categoryAmenities.filter((a) =>
            selectedAmenities.includes(a.slug)
          ).length;

          return (
            <div key={category} className="rounded-lg border border-gray-200">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-700">
                  {categoryLabels[category] || category}
                  {selectedInCategory > 0 && (
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      {selectedInCategory}
                    </span>
                  )}
                </span>
                <svg
                  className={cn(
                    'h-4 w-4 text-gray-400 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Amenity Items */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-3 py-2">
                  <div className="grid grid-cols-1 gap-1">
                    {categoryAmenities.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity.slug);
                      return (
                        <label
                          key={amenity.slug}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
                            isSelected
                              ? 'bg-green-50 text-green-700'
                              : 'hover:bg-gray-50'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggle(amenity.slug)}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <AmenityIcon icon={amenity.icon} size="sm" />
                          <span className="text-sm">{amenity.name_th}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AmenitiesFilter;
