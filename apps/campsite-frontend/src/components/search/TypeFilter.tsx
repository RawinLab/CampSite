'use client';

import { useCampsiteTypes } from '@/hooks/useCampsites';
import { TypeBadge } from '@/components/ui/TypeBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TypeFilterProps {
  selectedTypes: string[];
  onChange: (types: string[]) => void;
  className?: string;
}

export function TypeFilter({ selectedTypes, onChange, className }: TypeFilterProps) {
  const { types, isLoading, error } = useCampsiteTypes();

  const handleToggle = (slug: string) => {
    if (selectedTypes.includes(slug)) {
      onChange(selectedTypes.filter((t) => t !== slug));
    } else {
      onChange([...selectedTypes, slug]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-sm text-red-500', className)}>
        ไม่สามารถโหลดประเภทแคมป์ได้
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">ประเภทที่พัก</h3>
        {selectedTypes.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-green-600 hover:text-green-700"
          >
            ล้างทั้งหมด
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <TypeBadge
            key={type.slug}
            name={type.name_th}
            colorHex={type.color_hex}
            icon={type.icon}
            selected={selectedTypes.includes(type.slug)}
            onClick={() => handleToggle(type.slug)}
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}

export default TypeFilter;
