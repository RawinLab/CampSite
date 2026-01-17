'use client';

import dynamic from 'next/dynamic';
import type { MapCampsite, MapBounds } from '@campsite/shared';

// Dynamically import CampsiteMap with SSR disabled (Leaflet requires window)
const CampsiteMapDynamic = dynamic(
  () => import('./CampsiteMap').then((mod) => mod.CampsiteMap),
  {
    ssr: false,
    loading: () => <MapLoadingSkeleton />,
  }
);

interface MapContainerProps {
  campsites: MapCampsite[];
  onBoundsChange?: (bounds: MapBounds) => void;
  onMarkerClick?: (campsite: MapCampsite) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  showLegend?: boolean;
  showControls?: boolean;
  className?: string;
  isLoading?: boolean;
}

/**
 * Loading skeleton for map
 */
function MapLoadingSkeleton() {
  return (
    <div className="map-loading">
      <div className="map-loading__spinner" />
    </div>
  );
}

/**
 * SSR-safe map container wrapper
 * This component handles the dynamic import of Leaflet which requires window
 */
export function MapContainerWrapper({
  campsites,
  onBoundsChange,
  onMarkerClick,
  initialCenter,
  initialZoom,
  showLegend,
  showControls,
  className,
  isLoading,
}: MapContainerProps) {
  return (
    <CampsiteMapDynamic
      campsites={campsites}
      onBoundsChange={onBoundsChange}
      onMarkerClick={onMarkerClick}
      initialCenter={initialCenter}
      initialZoom={initialZoom}
      showLegend={showLegend}
      showControls={showControls}
      className={className}
      isLoading={isLoading}
    />
  );
}

// Export loading skeleton for external use
export { MapLoadingSkeleton };
