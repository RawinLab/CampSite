'use client';

import { useState } from 'react';
import { TypeFilter } from './TypeFilter';
import { PriceFilter } from './PriceFilter';
import { AmenitiesFilter } from './AmenitiesFilter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SEARCH_DEFAULTS } from '@campsite/shared';

interface FilterSidebarProps {
  selectedTypes: string[];
  minPrice: number;
  maxPrice: number;
  selectedAmenities: string[];
  onTypesChange: (types: string[]) => void;
  onPriceChange: (min: number, max: number) => void;
  onAmenitiesChange: (amenities: string[]) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export function FilterSidebar({
  selectedTypes,
  minPrice,
  maxPrice,
  selectedAmenities,
  onTypesChange,
  onPriceChange,
  onAmenitiesChange,
  onClearAll,
  hasActiveFilters,
  className,
}: FilterSidebarProps) {
  return (
    <aside className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">ตัวกรอง</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-green-600 hover:text-green-700"
          >
            ล้างทั้งหมด
          </Button>
        )}
      </div>

      {/* Type Filter */}
      <TypeFilter selectedTypes={selectedTypes} onChange={onTypesChange} />

      {/* Divider */}
      <hr className="border-gray-200" />

      {/* Price Filter */}
      <PriceFilter
        minPrice={minPrice}
        maxPrice={maxPrice}
        onChange={onPriceChange}
      />

      {/* Divider */}
      <hr className="border-gray-200" />

      {/* Amenities Filter */}
      <AmenitiesFilter
        selectedAmenities={selectedAmenities}
        onChange={onAmenitiesChange}
      />
    </aside>
  );
}

/**
 * Mobile Filter Modal
 */
interface MobileFilterModalProps extends FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFilterModal({
  isOpen,
  onClose,
  ...filterProps
}: MobileFilterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">ตัวกรอง</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="ปิด"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 130px)' }}>
          <FilterSidebar {...filterProps} />
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-white px-4 py-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={filterProps.onClearAll}
              disabled={!filterProps.hasActiveFilters}
            >
              ล้างทั้งหมด
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={onClose}
            >
              ดูผลลัพธ์
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterSidebar;
