'use client';

import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { MapCampsite, CampsiteType } from '@campsite/shared';
import { MARKER_COLORS, MARKER_ICONS } from '@/lib/constants/mapTheme';
import { generatePopupHTML } from './MapInfoWindow';

interface MapMarkerProps {
  campsite: MapCampsite;
  onClick?: (campsite: MapCampsite) => void;
}

/**
 * Create a custom marker icon for a campsite type
 */
function createMarkerIcon(type: CampsiteType): L.DivIcon {
  const color = MARKER_COLORS[type];
  const icon = MARKER_ICONS[type];

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="campsite-marker campsite-marker--${type}" style="background-color:${color};">
        <span style="font-size:14px;">${icon}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

/**
 * Map marker component for individual campsites
 */
export function MapMarker({ campsite, onClick }: MapMarkerProps) {
  const icon = useMemo(
    () => createMarkerIcon(campsite.campsite_type),
    [campsite.campsite_type]
  );

  const popupContent = useMemo(
    () => generatePopupHTML(campsite),
    [campsite]
  );

  const handleClick = () => {
    if (onClick) {
      onClick(campsite);
    }
  };

  return (
    <Marker
      position={[campsite.latitude, campsite.longitude]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
      }}
    >
      <Popup maxWidth={320} minWidth={280}>
        <div dangerouslySetInnerHTML={{ __html: popupContent }} />
      </Popup>
    </Marker>
  );
}

/**
 * Export marker icon creator for use in cluster
 */
export { createMarkerIcon };
