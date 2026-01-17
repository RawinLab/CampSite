'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { MapCampsite } from '@campsite/shared';
import { MARKER_COLORS, MARKER_ICONS, CLUSTER_CONFIG } from '@/lib/constants/mapTheme';
import { generatePopupHTML } from './MapInfoWindow';

interface MarkerClusterProps {
  campsites: MapCampsite[];
  onMarkerClick?: (campsite: MapCampsite) => void;
}

/**
 * Marker cluster component for grouping multiple markers
 */
export function MarkerCluster({ campsites, onMarkerClick }: MarkerClusterProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    // Create marker cluster group if it doesn't exist
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = L.markerClusterGroup({
        ...CLUSTER_CONFIG,
        iconCreateFunction: (cluster) => {
          const childCount = cluster.getChildCount();
          let className = 'marker-cluster marker-cluster-';

          if (childCount < 10) {
            className += 'small';
          } else if (childCount < 100) {
            className += 'medium';
          } else {
            className += 'large';
          }

          return L.divIcon({
            html: `<div><span>${childCount}</span></div>`,
            className,
            iconSize: L.point(46, 46),
          });
        },
      });

      map.addLayer(clusterGroupRef.current);
    }

    const clusterGroup = clusterGroupRef.current;

    // Clear existing markers
    clusterGroup.clearLayers();

    // Add markers for each campsite
    campsites.forEach((campsite) => {
      const color = MARKER_COLORS[campsite.campsite_type];
      const icon = MARKER_ICONS[campsite.campsite_type];

      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="campsite-marker campsite-marker--${campsite.campsite_type}" style="background-color:${color};">
            <span style="font-size:14px;">${icon}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([campsite.latitude, campsite.longitude], {
        icon: markerIcon,
      });

      // Add popup
      const popupContent = generatePopupHTML(campsite);
      marker.bindPopup(popupContent, {
        maxWidth: 320,
        minWidth: 280,
      });

      // Add click handler
      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(campsite));
      }

      clusterGroup.addLayer(marker);
    });

    // Cleanup function
    return () => {
      if (clusterGroupRef.current) {
        clusterGroupRef.current.clearLayers();
      }
    };
  }, [campsites, map, onMarkerClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clusterGroupRef.current && map) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, [map]);

  return null; // This component doesn't render anything directly
}
