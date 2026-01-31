'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProvinceAutocomplete } from './ProvinceAutocomplete';
import { cn } from '@/lib/utils';
import type { ProvinceSuggestion } from '@campsite/shared';

interface SearchBarProps {
  query?: string;
  province?: ProvinceSuggestion | null;
  onQueryChange: (query: string) => void;
  onProvinceChange: (province: ProvinceSuggestion | null) => void;
  onSearch?: () => void;
  className?: string;
}

export function SearchBar({
  query = '',
  province = null,
  onQueryChange,
  onProvinceChange,
  onSearch,
  className,
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(query);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalQuery(e.target.value);
    },
    []
  );

  const handleSearch = useCallback(() => {
    onQueryChange(localQuery);
    onSearch?.();
  }, [localQuery, onQueryChange, onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClear = useCallback(() => {
    setLocalQuery('');
    onQueryChange('');
    onProvinceChange(null);
  }, [onQueryChange, onProvinceChange]);

  const hasValue = localQuery || province;

  return (
    <div className={cn('flex flex-col gap-3 rounded-2xl bg-white p-2 shadow-sm transition-shadow duration-200 focus-within:shadow-md sm:flex-row sm:gap-2', className)}>
      {/* Text Search */}
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-5 w-5 text-brand-green"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <Input
          type="text"
          value={localQuery}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder="ค้นหาชื่อแคมป์ปิ้ง..."
          className="pl-10"
          aria-label="ค้นหาแคมป์ปิ้ง"
        />
      </div>

      {/* Province Autocomplete */}
      <div className="w-full sm:w-64">
        <ProvinceAutocomplete
          value={province}
          onChange={onProvinceChange}
          placeholder="เลือกจังหวัด"
        />
      </div>

      {/* Search Button */}
      <Button
        type="button"
        onClick={handleSearch}
        className="rounded-xl bg-brand-green hover:bg-forest-700"
      >
        <svg
          className="mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        ค้นหา
      </Button>

      {/* Clear Button */}
      {hasValue && (
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          className="sm:hidden"
        >
          ล้าง
        </Button>
      )}
    </div>
  );
}

export default SearchBar;
