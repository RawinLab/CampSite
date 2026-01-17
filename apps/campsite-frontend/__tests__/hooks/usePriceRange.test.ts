import { renderHook, act } from '@testing-library/react';
import { usePriceRange } from '@/hooks/usePriceRange';
import { PRICE_CONSTANTS } from '@campsite/shared';

describe('usePriceRange', () => {
  describe('Initial State', () => {
    it('returns default values (0, 10000) initially', () => {
      const { result } = renderHook(() => usePriceRange());

      expect(result.current.minPrice).toBe(0);
      expect(result.current.maxPrice).toBe(10000);
      expect(result.current.isDefault).toBe(true);
    });

    it('returns custom default values when provided', () => {
      const { result } = renderHook(() =>
        usePriceRange({
          defaultMin: 100,
          defaultMax: 5000,
        })
      );

      expect(result.current.minPrice).toBe(100);
      expect(result.current.maxPrice).toBe(5000);
      expect(result.current.isDefault).toBe(true);
    });

    it('uses PRICE_CONSTANTS for boundaries', () => {
      const { result } = renderHook(() => usePriceRange());

      // Verify the hook respects the constants
      expect(PRICE_CONSTANTS.MIN).toBe(0);
      expect(PRICE_CONSTANTS.MAX).toBe(10000);
      expect(PRICE_CONSTANTS.DEFAULT_MIN).toBe(0);
      expect(PRICE_CONSTANTS.DEFAULT_MAX).toBe(10000);
    });
  });

  describe('setMinPrice', () => {
    it('updates minimum price', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setMinPrice(500);
      });

      expect(result.current.minPrice).toBe(500);
      expect(result.current.maxPrice).toBe(10000);
      expect(result.current.isDefault).toBe(false);
    });

    it('prevents min from exceeding max', () => {
      const { result } = renderHook(() => usePriceRange());

      // Set max to 3000
      act(() => {
        result.current.setMaxPrice(3000);
      });

      // Try to set min to 5000 (above max)
      act(() => {
        result.current.setMinPrice(5000);
      });

      // Both should now be 5000 (max adjusts to match min)
      expect(result.current.minPrice).toBe(5000);
      expect(result.current.maxPrice).toBe(5000);
    });

    it('validates price is non-negative', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setMinPrice(-100);
      });

      // Should clamp to minimum (0)
      expect(result.current.minPrice).toBe(0);
    });

    it('validates price is within 0-10000 range', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setMinPrice(15000);
      });

      // Should clamp to maximum (10000)
      expect(result.current.minPrice).toBe(10000);
      // Max should also be updated to match
      expect(result.current.maxPrice).toBe(10000);
    });

    it('clamps to custom min boundary when provided', () => {
      const { result } = renderHook(() =>
        usePriceRange({
          min: 100,
          max: 8000,
        })
      );

      act(() => {
        result.current.setMinPrice(50);
      });

      expect(result.current.minPrice).toBe(100);
    });

    it('clamps to custom max boundary when provided', () => {
      const { result } = renderHook(() =>
        usePriceRange({
          min: 100,
          max: 8000,
          defaultMin: 100,
          defaultMax: 8000,
        })
      );

      act(() => {
        result.current.setMinPrice(9000);
      });

      expect(result.current.minPrice).toBe(8000);
      expect(result.current.maxPrice).toBe(8000);
    });
  });

  describe('setMaxPrice', () => {
    it('updates maximum price', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setMaxPrice(5000);
      });

      expect(result.current.minPrice).toBe(0);
      expect(result.current.maxPrice).toBe(5000);
      expect(result.current.isDefault).toBe(false);
    });

    it('prevents max from going below min', () => {
      const { result } = renderHook(() => usePriceRange());

      // Set min to 3000
      act(() => {
        result.current.setMinPrice(3000);
      });

      // Try to set max to 1000 (below min)
      act(() => {
        result.current.setMaxPrice(1000);
      });

      // Both should now be 1000 (min adjusts to match max)
      expect(result.current.minPrice).toBe(1000);
      expect(result.current.maxPrice).toBe(1000);
    });

    it('validates price is non-negative', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setMaxPrice(-500);
      });

      // Should clamp to minimum (0)
      expect(result.current.maxPrice).toBe(0);
      expect(result.current.minPrice).toBe(0);
    });

    it('validates price is within 0-10000 range', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setMaxPrice(20000);
      });

      // Should clamp to maximum (10000)
      expect(result.current.maxPrice).toBe(10000);
    });

    it('clamps to custom boundaries when provided', () => {
      const { result } = renderHook(() =>
        usePriceRange({
          min: 200,
          max: 7000,
        })
      );

      act(() => {
        result.current.setMaxPrice(8500);
      });

      expect(result.current.maxPrice).toBe(7000);
    });
  });

  describe('setPriceRange', () => {
    it('sets both min and max prices simultaneously', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setPriceRange(1000, 5000);
      });

      expect(result.current.minPrice).toBe(1000);
      expect(result.current.maxPrice).toBe(5000);
      expect(result.current.isDefault).toBe(false);
    });

    it('swaps values if min > max', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setPriceRange(7000, 3000);
      });

      // Should swap so min <= max
      expect(result.current.minPrice).toBe(3000);
      expect(result.current.maxPrice).toBe(7000);
    });

    it('clamps both values to valid range', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setPriceRange(-100, 15000);
      });

      expect(result.current.minPrice).toBe(0);
      expect(result.current.maxPrice).toBe(10000);
    });

    it('handles equal min and max values', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setPriceRange(5000, 5000);
      });

      expect(result.current.minPrice).toBe(5000);
      expect(result.current.maxPrice).toBe(5000);
    });
  });

  describe('reset', () => {
    it('resets to default values', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setMinPrice(2000);
        result.current.setMaxPrice(8000);
      });

      expect(result.current.isDefault).toBe(false);

      act(() => {
        result.current.reset();
      });

      expect(result.current.minPrice).toBe(0);
      expect(result.current.maxPrice).toBe(10000);
      expect(result.current.isDefault).toBe(true);
    });

    it('resets to custom default values when provided', () => {
      const { result } = renderHook(() =>
        usePriceRange({
          defaultMin: 500,
          defaultMax: 7500,
        })
      );

      act(() => {
        result.current.setMinPrice(2000);
        result.current.setMaxPrice(6000);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.minPrice).toBe(500);
      expect(result.current.maxPrice).toBe(7500);
      expect(result.current.isDefault).toBe(true);
    });
  });

  describe('isDefault', () => {
    it('returns true when prices match defaults', () => {
      const { result } = renderHook(() => usePriceRange());

      expect(result.current.isDefault).toBe(true);
    });

    it('returns false when min price is changed', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setMinPrice(100);
      });

      expect(result.current.isDefault).toBe(false);
    });

    it('returns false when max price is changed', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setMaxPrice(9000);
      });

      expect(result.current.isDefault).toBe(false);
    });

    it('returns true after reset', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setMinPrice(1000);
        result.current.setMaxPrice(5000);
      });

      expect(result.current.isDefault).toBe(false);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isDefault).toBe(true);
    });

    it('works with custom default values', () => {
      const { result } = renderHook(() =>
        usePriceRange({
          defaultMin: 200,
          defaultMax: 8000,
        })
      );

      expect(result.current.isDefault).toBe(true);

      act(() => {
        result.current.setMinPrice(300);
      });

      expect(result.current.isDefault).toBe(false);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isDefault).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles boundary values correctly', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setPriceRange(0, 10000);
      });

      expect(result.current.minPrice).toBe(0);
      expect(result.current.maxPrice).toBe(10000);
    });

    it('handles multiple updates in sequence', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setMinPrice(1000);
      });

      act(() => {
        result.current.setMaxPrice(5000);
      });

      act(() => {
        result.current.setMinPrice(2000);
      });

      expect(result.current.minPrice).toBe(2000);
      expect(result.current.maxPrice).toBe(5000);
    });

    it('maintains constraint when setting min equal to max', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setMaxPrice(5000);
      });

      act(() => {
        result.current.setMinPrice(5000);
      });

      expect(result.current.minPrice).toBe(5000);
      expect(result.current.maxPrice).toBe(5000);
    });

    it('handles floating point values by clamping', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setMinPrice(1234.56);
      });

      act(() => {
        result.current.setMaxPrice(5678.91);
      });

      expect(result.current.minPrice).toBe(1234.56);
      expect(result.current.maxPrice).toBe(5678.91);
    });

    it('handles zero values correctly', () => {
      const { result } = renderHook(() => usePriceRange());

      act(() => {
        result.current.setPriceRange(0, 0);
      });

      expect(result.current.minPrice).toBe(0);
      expect(result.current.maxPrice).toBe(0);
    });
  });

  describe('Function Stability', () => {
    it('setter functions remain stable across renders', () => {
      const { result, rerender } = renderHook(() => usePriceRange());

      const firstSetMinPrice = result.current.setMinPrice;
      const firstSetMaxPrice = result.current.setMaxPrice;
      const firstSetPriceRange = result.current.setPriceRange;
      const firstReset = result.current.reset;

      rerender();

      expect(result.current.setMinPrice).toBe(firstSetMinPrice);
      expect(result.current.setMaxPrice).toBe(firstSetMaxPrice);
      expect(result.current.setPriceRange).toBe(firstSetPriceRange);
      expect(result.current.reset).toBe(firstReset);
    });
  });
});
