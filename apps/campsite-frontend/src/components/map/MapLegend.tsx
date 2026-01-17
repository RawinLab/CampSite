'use client';

import { MARKER_COLORS, TYPE_LABELS } from '@/lib/constants/mapTheme';
import type { CampsiteType } from '@campsite/shared';

interface MapLegendProps {
  className?: string;
}

const CAMPSITE_TYPES: CampsiteType[] = ['camping', 'glamping', 'tented-resort', 'bungalow'];

/**
 * Map legend showing marker colors by campsite type
 */
export function MapLegend({ className = '' }: MapLegendProps) {
  return (
    <div className={`map-legend ${className}`}>
      <div className="map-legend__title">Campsite Types</div>
      {CAMPSITE_TYPES.map((type) => (
        <div key={type} className="map-legend__item">
          <div
            className="map-legend__color"
            style={{ backgroundColor: MARKER_COLORS[type] }}
          />
          <span className="map-legend__label">{TYPE_LABELS[type]}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Floating legend that can be positioned absolutely
 */
export function FloatingMapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000]">
      <MapLegend />
    </div>
  );
}
