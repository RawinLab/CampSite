'use client';

import { cn } from '@/lib/utils';
import type { SortOption } from '@campsite/shared';

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'rating', label: 'คะแนนสูงสุด' },
  { value: 'price_asc', label: 'ราคาต่ำไปสูง' },
  { value: 'price_desc', label: 'ราคาสูงไปต่ำ' },
  { value: 'newest', label: 'ใหม่ล่าสุด' },
];

export function SortSelect({ value, onChange, className }: SortSelectProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label htmlFor="sort-select" className="text-sm text-gray-600">
        เรียงตาม:
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SortSelect;
