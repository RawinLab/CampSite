'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PRICE_CONSTANTS } from '@campsite/shared';

interface PriceFilterProps {
  minPrice: number;
  maxPrice: number;
  onChange: (min: number, max: number) => void;
  className?: string;
}

export function PriceFilter({ minPrice, maxPrice, onChange, className }: PriceFilterProps) {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  // Sync local state with props
  useEffect(() => {
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
  }, [minPrice, maxPrice]);

  // Format price for display
  const formatPrice = (value: number) => {
    return `${PRICE_CONSTANTS.CURRENCY}${value.toLocaleString()}`;
  };

  // Debounced onChange
  const handleMinChange = useCallback((value: number) => {
    const newMin = Math.min(value, localMax);
    setLocalMin(newMin);
  }, [localMax]);

  const handleMaxChange = useCallback((value: number) => {
    const newMax = Math.max(value, localMin);
    setLocalMax(newMax);
  }, [localMin]);

  // Apply changes on mouse/touch end
  const handleChangeEnd = useCallback(() => {
    onChange(localMin, localMax);
  }, [localMin, localMax, onChange]);

  // Calculate position percentages for the track
  const minPercent = ((localMin - PRICE_CONSTANTS.MIN) / (PRICE_CONSTANTS.MAX - PRICE_CONSTANTS.MIN)) * 100;
  const maxPercent = ((localMax - PRICE_CONSTANTS.MIN) / (PRICE_CONSTANTS.MAX - PRICE_CONSTANTS.MIN)) * 100;

  const handleReset = () => {
    setLocalMin(PRICE_CONSTANTS.DEFAULT_MIN);
    setLocalMax(PRICE_CONSTANTS.DEFAULT_MAX);
    onChange(PRICE_CONSTANTS.DEFAULT_MIN, PRICE_CONSTANTS.DEFAULT_MAX);
  };

  const isDefault = localMin === PRICE_CONSTANTS.DEFAULT_MIN && localMax === PRICE_CONSTANTS.DEFAULT_MAX;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">ช่วงราคา</h3>
        {!isDefault && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-green-600 hover:text-green-700"
          >
            รีเซ็ต
          </button>
        )}
      </div>

      {/* Price display */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{formatPrice(localMin)}</span>
        <span className="text-gray-400">-</span>
        <span className="font-medium text-gray-700">{formatPrice(localMax)}</span>
      </div>

      {/* Dual range slider */}
      <div className="relative h-6 pt-2">
        {/* Track background */}
        <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-gray-200" />

        {/* Active track */}
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-green-500"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min slider */}
        <input
          type="range"
          min={PRICE_CONSTANTS.MIN}
          max={PRICE_CONSTANTS.MAX}
          step={PRICE_CONSTANTS.STEP}
          value={localMin}
          onChange={(e) => handleMinChange(parseInt(e.target.value, 10))}
          onMouseUp={handleChangeEnd}
          onTouchEnd={handleChangeEnd}
          className="pointer-events-none absolute top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-green-500 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md"
          aria-label="ราคาต่ำสุด"
        />

        {/* Max slider */}
        <input
          type="range"
          min={PRICE_CONSTANTS.MIN}
          max={PRICE_CONSTANTS.MAX}
          step={PRICE_CONSTANTS.STEP}
          value={localMax}
          onChange={(e) => handleMaxChange(parseInt(e.target.value, 10))}
          onMouseUp={handleChangeEnd}
          onTouchEnd={handleChangeEnd}
          className="pointer-events-none absolute top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-green-500 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md"
          aria-label="ราคาสูงสุด"
        />
      </div>

      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'ต่ำกว่า ฿500', min: 0, max: 500 },
          { label: '฿500-1,000', min: 500, max: 1000 },
          { label: '฿1,000-2,000', min: 1000, max: 2000 },
          { label: 'มากกว่า ฿2,000', min: 2000, max: 10000 },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setLocalMin(preset.min);
              setLocalMax(preset.max);
              onChange(preset.min, preset.max);
            }}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              localMin === preset.min && localMax === preset.max
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PriceFilter;
