'use client';

import { useState, useRef, useEffect } from 'react';
import { useProvinceSearch } from '@/hooks/useProvinceSearch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ProvinceSuggestion } from '@campsite/shared';

interface ProvinceAutocompleteProps {
  value?: ProvinceSuggestion | null;
  onChange: (province: ProvinceSuggestion | null) => void;
  placeholder?: string;
  className?: string;
}

export function ProvinceAutocomplete({
  value,
  onChange,
  placeholder = 'ค้นหาจังหวัด...',
  className,
}: ProvinceAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value?.name_th || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { query, setQuery, suggestions, isLoading, clearSuggestions } = useProvinceSearch({
    debounceMs: 300,
    minChars: 2,
    limit: 10,
  });

  // Update input value when external value changes
  useEffect(() => {
    if (value) {
      setInputValue(value.name_th);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setQuery(newValue);
    setIsOpen(true);

    // Clear selection if input is cleared
    if (!newValue && value) {
      onChange(null);
    }
  };

  const handleSelect = (province: ProvinceSuggestion) => {
    setInputValue(province.name_th);
    onChange(province);
    setIsOpen(false);
    clearSuggestions();
  };

  const handleClear = () => {
    setInputValue('');
    setQuery('');
    onChange(null);
    clearSuggestions();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-8"
          aria-label="ค้นหาจังหวัด"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="ล้าง"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (inputValue.length >= 2 || suggestions.length > 0) && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
          role="listbox"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500">กำลังค้นหา...</div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-60 overflow-auto py-1">
              {suggestions.map((province) => (
                <li
                  key={province.id}
                  onClick={() => handleSelect(province)}
                  className={cn(
                    'cursor-pointer px-4 py-2 text-sm hover:bg-gray-100',
                    value?.id === province.id && 'bg-green-50 text-green-700'
                  )}
                  role="option"
                  aria-selected={value?.id === province.id}
                >
                  <div className="font-medium">{province.name_th}</div>
                  <div className="text-xs text-gray-500">{province.name_en}</div>
                </li>
              ))}
            </ul>
          ) : inputValue.length >= 2 ? (
            <div className="px-4 py-3 text-sm text-gray-500">ไม่พบจังหวัด</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default ProvinceAutocomplete;
