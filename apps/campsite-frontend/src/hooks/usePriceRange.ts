'use client';

import { useState, useCallback } from 'react';
import { PRICE_CONSTANTS } from '@campsite/shared';

interface UsePriceRangeOptions {
  defaultMin?: number;
  defaultMax?: number;
  min?: number;
  max?: number;
  step?: number;
}

interface UsePriceRangeReturn {
  minPrice: number;
  maxPrice: number;
  setMinPrice: (value: number) => void;
  setMaxPrice: (value: number) => void;
  setPriceRange: (min: number, max: number) => void;
  reset: () => void;
  isDefault: boolean;
}

/**
 * Custom hook for managing price range filter state
 * Ensures min <= max constraint is always maintained
 */
export function usePriceRange(options: UsePriceRangeOptions = {}): UsePriceRangeReturn {
  const {
    defaultMin = PRICE_CONSTANTS.DEFAULT_MIN,
    defaultMax = PRICE_CONSTANTS.DEFAULT_MAX,
    min = PRICE_CONSTANTS.MIN,
    max = PRICE_CONSTANTS.MAX,
  } = options;

  const [minPrice, setMinPriceState] = useState(defaultMin);
  const [maxPrice, setMaxPriceState] = useState(defaultMax);

  const setMinPrice = useCallback(
    (value: number) => {
      const clampedValue = Math.max(min, Math.min(value, max));
      setMinPriceState((prev) => {
        // Ensure min <= max
        if (clampedValue > maxPrice) {
          setMaxPriceState(clampedValue);
        }
        return clampedValue;
      });
    },
    [min, max, maxPrice]
  );

  const setMaxPrice = useCallback(
    (value: number) => {
      const clampedValue = Math.max(min, Math.min(value, max));
      setMaxPriceState((prev) => {
        // Ensure min <= max
        if (clampedValue < minPrice) {
          setMinPriceState(clampedValue);
        }
        return clampedValue;
      });
    },
    [min, max, minPrice]
  );

  const setPriceRange = useCallback(
    (newMin: number, newMax: number) => {
      const clampedMin = Math.max(min, Math.min(newMin, max));
      const clampedMax = Math.max(min, Math.min(newMax, max));

      if (clampedMin <= clampedMax) {
        setMinPriceState(clampedMin);
        setMaxPriceState(clampedMax);
      } else {
        // Swap if invalid
        setMinPriceState(clampedMax);
        setMaxPriceState(clampedMin);
      }
    },
    [min, max]
  );

  const reset = useCallback(() => {
    setMinPriceState(defaultMin);
    setMaxPriceState(defaultMax);
  }, [defaultMin, defaultMax]);

  const isDefault = minPrice === defaultMin && maxPrice === defaultMax;

  return {
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
    setPriceRange,
    reset,
    isDefault,
  };
}
