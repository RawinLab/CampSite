# Plan: Maps & Location (Module 6)

## Module Information
- **Module:** 6
- **Name:** Maps & Location
- **Priority:** HIGH
- **Sprint:** 3
- **Story Points:** 14 (US-011: 10 + US-012: 4)
- **Dependencies:** Module 3 (Search & Discovery)
- **Related Clarifications:** None (Leaflet + OpenStreetMap decided in SRS)

---

## Overview

Implement interactive map features:
- Map view with campsite markers
- Color-coded markers by type
- Marker clustering
- Info window popups
- Sync with search filters
- Nearby attractions with directions

---

## Features

### 6.1 Interactive Map View (US-011)
**Priority:** HIGH

**Map Features:**
- Display all campsites on Thailand map
- Color-coded markers by type
- Marker clustering when zoomed out
- Info window on marker click
- Sync with search filters
- Mobile touch gestures

**Frontend Components:**
```
src/components/map/
├── CampsiteMap.tsx           # Main map component
├── MapMarker.tsx             # Custom marker
├── MarkerCluster.tsx         # Cluster component
├── MapInfoWindow.tsx         # Popup content
├── MapControls.tsx           # Zoom, fullscreen
├── MapLegend.tsx             # Type color legend
└── MapToggle.tsx             # List/Map view toggle
```

**Map Implementation:**
```typescript
// src/components/map/CampsiteMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

interface CampsiteMapProps {
  campsites: CampsiteMarker[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (id: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  camping: '#FF4444',
  glamping: '#44FF44',
  'tented-resort': '#FF8844',
  bungalow: '#FFFF44',
};

const THAILAND_CENTER: [number, number] = [15.8700, 100.9925];
const DEFAULT_ZOOM = 6;

export function CampsiteMap({
  campsites,
  center = THAILAND_CENTER,
  zoom = DEFAULT_ZOOM,
  onMarkerClick,
}: CampsiteMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapRef.current = map;

    // Initialize marker cluster group
    clusterGroupRef.current = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="cluster-marker">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40),
        });
      },
    });

    map.addLayer(clusterGroupRef.current);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when campsites change
  useEffect(() => {
    if (!clusterGroupRef.current) return;

    clusterGroupRef.current.clearLayers();

    campsites.forEach((campsite) => {
      const color = TYPE_COLORS[campsite.type_slug] || '#666666';

      const icon = L.divIcon({
        html: `
          <div class="map-marker" style="background-color: ${color}">
            <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
          </div>
        `,
        className: 'custom-marker-icon',
        iconSize: L.point(30, 30),
        iconAnchor: L.point(15, 30),
      });

      const marker = L.marker([campsite.latitude, campsite.longitude], { icon });

      // Bind popup
      marker.bindPopup(`
        <div class="map-popup">
          <img src="${campsite.photo_url || '/placeholder.jpg'}" alt="" />
          <h3>${campsite.name}</h3>
          <div class="rating">★ ${campsite.rating_average.toFixed(1)} (${campsite.review_count})</div>
          <div class="price">฿${campsite.price_min.toLocaleString()} - ฿${campsite.price_max.toLocaleString()}</div>
          <a href="/campsites/${campsite.id}" class="view-btn">ดูรายละเอียด</a>
        </div>
      `);

      clusterGroupRef.current?.addLayer(marker);
    });
  }, [campsites]);

  // Update center when filter changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainerRef} className="w-full h-full rounded-lg" />
      <MapLegend />
    </div>
  );
}
```

**Map Styles:**
```css
/* src/styles/map.css */
.custom-marker-icon {
  background: transparent;
  border: none;
}

.map-marker {
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.map-marker svg {
  transform: rotate(45deg);
}

.custom-cluster-icon .cluster-marker {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.map-popup {
  min-width: 200px;
}

.map-popup img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.map-popup h3 {
  margin: 8px 0 4px;
  font-size: 14px;
  font-weight: 600;
}

.map-popup .rating {
  color: #f59e0b;
  font-size: 12px;
}

.map-popup .price {
  color: #16a34a;
  font-weight: 600;
  margin: 4px 0;
}

.map-popup .view-btn {
  display: block;
  text-align: center;
  padding: 6px;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  margin-top: 8px;
}
```

### 6.2 Map Legend
**Priority:** MEDIUM

```typescript
// src/components/map/MapLegend.tsx
const LEGEND_ITEMS = [
  { color: '#FF4444', label: 'แคมป์ปิ้ง' },
  { color: '#44FF44', label: 'แกลมปิ้ง' },
  { color: '#FF8844', label: 'รีสอร์ทเต็นท์' },
  { color: '#FFFF44', label: 'บังกะโล' },
];

export function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow p-3 z-[1000]">
      <h4 className="text-sm font-medium mb-2">ประเภท</h4>
      <div className="space-y-1">
        {LEGEND_ITEMS.map(({ color, label }) => (
          <div key={color} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6.3 List/Map View Toggle
**Priority:** HIGH

```typescript
// src/components/search/ViewToggle.tsx
interface ViewToggleProps {
  view: 'list' | 'map';
  onChange: (view: 'list' | 'map') => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex border rounded-lg overflow-hidden">
      <button
        onClick={() => onChange('list')}
        className={cn(
          'px-4 py-2 flex items-center gap-2',
          view === 'list' ? 'bg-primary text-white' : 'bg-white'
        )}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">รายการ</span>
      </button>
      <button
        onClick={() => onChange('map')}
        className={cn(
          'px-4 py-2 flex items-center gap-2',
          view === 'map' ? 'bg-primary text-white' : 'bg-white'
        )}
      >
        <Map className="h-4 w-4" />
        <span className="hidden sm:inline">แผนที่</span>
      </button>
    </div>
  );
}
```

### 6.4 Nearby Attractions (US-012)
**Priority:** MEDIUM

**Attractions List:**
```typescript
// src/components/campsite/AttractionsSection.tsx
interface AttractionCardProps {
  attraction: {
    id: string;
    name: string;
    description: string | null;
    distance_km: number;
    category: string;
    difficulty: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  campsiteCoords: { lat: number; lng: number };
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  hiking: Mountain,
  waterfall: Droplet,
  temple: Building,
  viewpoint: Eye,
  lake: Waves,
  cave: Circle,
  market: ShoppingBag,
  other: MapPin,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

export function AttractionCard({ attraction, campsiteCoords }: AttractionCardProps) {
  const Icon = CATEGORY_ICONS[attraction.category] || MapPin;

  const getDirectionsUrl = () => {
    if (attraction.latitude && attraction.longitude) {
      return `https://www.google.com/maps/dir/${campsiteCoords.lat},${campsiteCoords.lng}/${attraction.latitude},${attraction.longitude}`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(attraction.name)}`;
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{attraction.name}</h4>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <span>{attraction.distance_km} กม.</span>
            {attraction.difficulty && (
              <Badge className={DIFFICULTY_COLORS[attraction.difficulty]}>
                {DIFFICULTY_LABELS[attraction.difficulty]}
              </Badge>
            )}
          </div>
          {attraction.description && (
            <p className="text-sm text-gray-600 mt-2">{attraction.description}</p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={getDirectionsUrl()} target="_blank" rel="noopener noreferrer">
            <Navigation className="h-4 w-4 mr-1" />
            นำทาง
          </a>
        </Button>
      </div>
    </Card>
  );
}
```

---

## Technical Design

### Leaflet Setup

**Dependencies:**
```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "leaflet.markercluster": "^1.5.3"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "@types/leaflet.markercluster": "^1.5.4"
  }
}
```

**Dynamic Import (SSR-safe):**
```typescript
// src/components/map/MapContainer.tsx
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const CampsiteMap = dynamic(
  () => import('./CampsiteMap').then((mod) => mod.CampsiteMap),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-[400px] rounded-lg" />,
  }
);

export function MapContainer(props: CampsiteMapProps) {
  return <CampsiteMap {...props} />;
}
```

### API for Map Data

```typescript
// GET /api/campsites/map
// Returns minimal data for map markers (lighter payload)
interface MapCampsitesResponse {
  campsites: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    type_slug: string;
    price_min: number;
    price_max: number;
    rating_average: number;
    review_count: number;
    photo_url: string | null;
  }[];
}
```

---

## Test Cases

### Unit Tests
- [ ] Marker colors match types
- [ ] Cluster count calculated correctly
- [ ] Popup content renders correctly
- [ ] Directions URL generated correctly

### Integration Tests
- [ ] Map loads with Leaflet
- [ ] Markers display for all campsites
- [ ] Clustering works when zoomed out
- [ ] Info window shows on click
- [ ] Filter sync updates markers

### E2E Tests (Playwright)
- [ ] Map view toggle works
- [ ] Map loads within 3 seconds
- [ ] Markers are clickable
- [ ] Popup shows campsite info
- [ ] View Details link works
- [ ] Zoom controls functional
- [ ] Mobile pinch zoom works
- [ ] Legend displays
- [ ] Attractions directions opens Google Maps

---

## Definition of Done

- [ ] Map library integrated (Leaflet)
- [ ] Markers render for all campsites
- [ ] Color-coding by type works
- [ ] Clustering algorithm works
- [ ] Info window displays correctly
- [ ] Filter sync with list view
- [ ] Mobile touch controls work
- [ ] Performance smooth (<60ms render)
- [ ] Attractions section with directions
- [ ] Unit tests >80% coverage
- [ ] E2E tests passing

---

## Performance Considerations

1. **Lazy load map:** Use dynamic import, don't load on SSR
2. **Chunked loading:** Use `chunkedLoading: true` for marker cluster
3. **Lightweight marker data:** Separate API endpoint with minimal fields
4. **Throttle resize:** Debounce map resize events
5. **Tile caching:** Browser caches OpenStreetMap tiles

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Leaflet setup | 2 hours |
| Map component | 4 hours |
| Custom markers | 2 hours |
| Marker clustering | 2 hours |
| Info window popup | 2 hours |
| View toggle | 1 hour |
| Filter sync | 2 hours |
| Attractions section | 3 hours |
| Mobile optimization | 2 hours |
| Testing | 3 hours |
| **Total** | **~23 hours (3 days)** |
