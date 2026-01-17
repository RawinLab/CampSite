'use client';

import { useCallback } from 'react';

export type ViewMode = 'list' | 'map';

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
  listCount?: number;
}

/**
 * Toggle component for switching between list and map views
 */
export function ViewToggle({
  view,
  onViewChange,
  className = '',
  listCount,
}: ViewToggleProps) {
  const handleListClick = useCallback(() => {
    onViewChange('list');
  }, [onViewChange]);

  const handleMapClick = useCallback(() => {
    onViewChange('map');
  }, [onViewChange]);

  return (
    <div className={`view-toggle ${className}`}>
      <button
        type="button"
        onClick={handleListClick}
        className={`view-toggle__button ${view === 'list' ? 'view-toggle__button--active' : ''}`}
        aria-pressed={view === 'list'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        List
        {listCount !== undefined && view === 'list' && (
          <span className="ml-1 text-xs text-muted-foreground">({listCount})</span>
        )}
      </button>
      <button
        type="button"
        onClick={handleMapClick}
        className={`view-toggle__button ${view === 'map' ? 'view-toggle__button--active' : ''}`}
        aria-pressed={view === 'map'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
        Map
      </button>
    </div>
  );
}

/**
 * Hook for managing view state with localStorage persistence
 */
export function useViewToggle(defaultView: ViewMode = 'list') {
  const getInitialView = (): ViewMode => {
    if (typeof window === 'undefined') return defaultView;
    const saved = localStorage.getItem('campsite-view-preference');
    return (saved as ViewMode) || defaultView;
  };

  const saveView = (view: ViewMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('campsite-view-preference', view);
    }
  };

  return { getInitialView, saveView };
}
