'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Amenity } from '@campsite/shared';

interface AmenitiesSectionProps {
  amenities: Amenity[];
}

const INITIAL_DISPLAY_COUNT = 8;

// Map icon names to Lucide icons
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, keyof typeof LucideIcons> = {
    wifi: 'Wifi',
    zap: 'Zap',
    snowflake: 'Snowflake',
    droplet: 'Droplet',
    bath: 'Bath',
    utensils: 'Utensils',
    'chef-hat': 'ChefHat',
    car: 'Car',
    parking: 'ParkingCircle',
    pool: 'Waves',
    fire: 'Flame',
    tent: 'Tent',
    mountain: 'Mountain',
    tree: 'TreeDeciduous',
    sun: 'Sun',
    moon: 'Moon',
    coffee: 'Coffee',
    beer: 'Beer',
    store: 'Store',
    'first-aid': 'Cross',
    dog: 'Dog',
    camera: 'Camera',
    music: 'Music',
    tv: 'Tv',
    signal: 'Signal',
    plug: 'Plug',
    fan: 'Fan',
    bed: 'Bed',
    shower: 'ShowerHead',
    toilet: 'CircleDot',
  };

  const lucideIconName = iconMap[iconName.toLowerCase()] || 'Circle';
  const IconComponent = (LucideIcons as any)[lucideIconName];
  return IconComponent || LucideIcons.Circle;
};

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  const [showAll, setShowAll] = useState(false);

  if (!amenities || amenities.length === 0) {
    return null;
  }

  const displayedAmenities = showAll ? amenities : amenities.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = amenities.length > INITIAL_DISPLAY_COUNT;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          Facilities & Amenities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amenities Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayedAmenities.map((amenity) => {
            const IconComponent = getIconComponent(amenity.icon);
            return (
              <div
                key={amenity.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-full bg-primary/10">
                  <IconComponent className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{amenity.name_th}</p>
                  <p className="text-xs text-muted-foreground truncate">{amenity.name_en}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show More/Less Button */}
        {hasMore && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                Show less <ChevronUp className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Show all {amenities.length} amenities <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
