'use client';

import { MapPin, Navigation, Map, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CampsiteDetail } from '@campsite/shared';

interface LocationSectionProps {
  campsite: CampsiteDetail;
}

export function LocationSection({ campsite }: LocationSectionProps) {
  const hasLocation = campsite.latitude && campsite.longitude;

  if (!hasLocation) {
    return null;
  }

  const getGoogleMapsUrl = () => {
    return `https://www.google.com/maps/search/?api=1&query=${campsite.latitude},${campsite.longitude}`;
  };

  const getDirectionsUrl = () => {
    return `https://www.google.com/maps/dir/?api=1&destination=${campsite.latitude},${campsite.longitude}`;
  };

  // Google Maps embed URL (free, no API key required)
  const getMapEmbedUrl = () => {
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${campsite.longitude}!3d${campsite.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1sen!2sth!4v1600000000000!5m2!1sen!2sth`;
  };

  // Alternative: OpenStreetMap embed (truly free, no restrictions)
  const getOSMEmbedUrl = () => {
    const bbox = `${campsite.longitude - 0.01},${campsite.latitude - 0.01},${campsite.longitude + 0.01},${campsite.latitude + 0.01}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${campsite.latitude},${campsite.longitude}`;
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-brand-text">
          <MapPin className="w-5 h-5 text-brand-coral" />
          ตำแหน่งที่ตั้ง
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Embed */}
        <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border bg-muted">
          <iframe
            src={getOSMEmbedUrl()}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map showing location of ${campsite.name}`}
            className="absolute inset-0"
          />
        </div>

        {/* Location Details */}
        <div className="space-y-3">
          {/* Address */}
          {campsite.address && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-brand-coral/10 flex-shrink-0">
                <MapPin className="w-4 h-4 text-brand-coral" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{campsite.address}</p>
              </div>
            </div>
          )}

          {/* Province */}
          {campsite.province && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-brand-green/10 flex-shrink-0">
                <Globe2 className="w-4 h-4 text-brand-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Province</p>
                <p className="font-medium">
                  {campsite.province.name_th}
                  {campsite.province.name_en && (
                    <span className="text-muted-foreground ml-2">
                      ({campsite.province.name_en})
                    </span>
                  )}
                </p>
                {campsite.province.region && (
                  <p className="text-sm text-muted-foreground">
                    {campsite.province.region}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Coordinates */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-brand-green/10 flex-shrink-0">
              <Map className="w-4 h-4 text-brand-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">GPS Coordinates</p>
              <p className="font-medium font-mono text-sm">
                {campsite.latitude.toFixed(6)}, {campsite.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        {/* Map Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl border-brand-green text-brand-green hover:bg-brand-green/10 transition-all duration-300"
            asChild
          >
            <a
              href={getGoogleMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin className="w-4 h-4 mr-2" />
              ดูบนแผนที่
            </a>
          </Button>
          <Button
            variant="default"
            className="flex-1 bg-brand-green hover:bg-forest-700 rounded-xl transition-all duration-300"
            asChild
          >
            <a
              href={getDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="w-4 h-4 mr-2" />
              นำทาง
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
