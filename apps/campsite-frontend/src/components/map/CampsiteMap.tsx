'use client';

import { useEffect, useCallback, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';
import type { MapCampsite, MapBounds, MapFilters } from '@campsite/shared';
import { MarkerCluster } from './MarkerCluster';
import { MapControls } from './MapControls';
import { FloatingMapLegend } from './MapLegend';
import { THAILAND_CENTER, MAP_ZOOM, OSM_TILE_URL, OSM_ATTRIBUTION } from '@/lib/constants/mapTheme';

interface CampsiteMapProps {
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
 * Map events handler component
 */
function MapEventsHandler({
  onBoundsChange,
}: {
  onBoundsChange?: (bounds: MapBounds) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const bounds: LatLngBounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    },
    zoomend: () => {
      if (onBoundsChange) {
        const bounds: LatLngBounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    },
  });

  return null;
}

/**
 * Main campsite map component
 */
export function CampsiteMap({
  campsites,
  onBoundsChange,
  onMarkerClick,
  initialCenter = THAILAND_CENTER,
  initialZoom = MAP_ZOOM.DEFAULT,
  showLegend = true,
  showControls = true,
  className = '',
  isLoading = false,
}: CampsiteMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Handle escape key for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const containerClass = isFullscreen
    ? 'map-container map-container--fullscreen'
    : `map-container ${className}`;

  return (
    <div className={containerClass}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 z-[2000] flex items-center justify-center">
          <div className="map-loading__spinner" />
        </div>
      )}

      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={initialZoom}
        minZoom={MAP_ZOOM.MIN}
        maxZoom={MAP_ZOOM.MAX}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false} // We use custom controls
        attributionControl={true}
      >
        <TileLayer
          attribution={OSM_ATTRIBUTION}
          url={OSM_TILE_URL}
        />

        <MapEventsHandler onBoundsChange={onBoundsChange} />

        <MarkerCluster
          campsites={campsites}
          onMarkerClick={onMarkerClick}
        />

        {showControls && (
          <MapControls
            onFullscreen={handleFullscreen}
            isFullscreen={isFullscreen}
          />
        )}
      </MapContainer>

      {showLegend && <FloatingMapLegend />}
    </div>
  );
}
