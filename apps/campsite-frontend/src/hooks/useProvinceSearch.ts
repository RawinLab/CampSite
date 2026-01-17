'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProvinceSuggestion } from '@campsite/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseProvinceSearchOptions {
  debounceMs?: number;
  minChars?: number;
  limit?: number;
}

interface UseProvinceSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  suggestions: ProvinceSuggestion[];
  isLoading: boolean;
  error: string | null;
  clearSuggestions: () => void;
}

/**
 * Custom hook for province autocomplete search with debouncing
 */
export function useProvinceSearch(options: UseProvinceSearchOptions = {}): UseProvinceSearchReturn {
  const { debounceMs = 300, minChars = 2, limit = 10 } = options;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProvinceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  useEffect(() => {
    // Don't search if query is too short
    if (query.length < minChars) {
      setSuggestions([]);
      return;
    }

    // Debounce the search
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/api/provinces/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch provinces');
        }

        const result = await response.json();
        setSuggestions(result.data?.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, minChars, limit]);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    clearSuggestions,
  };
}
