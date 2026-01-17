'use client';

import {
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  MapPin,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CampsiteDetail } from '@campsite/shared';
import { formatPhoneNumber } from '@/lib/utils/format';

interface ContactSectionProps {
  campsite: CampsiteDetail;
}

export function ContactSection({ campsite }: ContactSectionProps) {
  const hasContact = campsite.phone || campsite.email || campsite.website;
  const hasSocial = campsite.facebook_url || campsite.instagram_url;
  const hasLocation = campsite.latitude && campsite.longitude;

  if (!hasContact && !hasSocial && !hasLocation) {
    return null;
  }

  const getGoogleMapsUrl = () => {
    return `https://www.google.com/maps/search/?api=1&query=${campsite.latitude},${campsite.longitude}`;
  };

  const getDirectionsUrl = () => {
    return `https://www.google.com/maps/dir/?api=1&destination=${campsite.latitude},${campsite.longitude}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Details */}
        <div className="space-y-3">
          {campsite.phone && (
            <a
              href={`tel:${campsite.phone}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="p-2 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{formatPhoneNumber(campsite.phone)}</p>
              </div>
            </a>
          )}

          {campsite.email && (
            <a
              href={`mailto:${campsite.email}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="p-2 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{campsite.email}</p>
              </div>
            </a>
          )}

          {campsite.website && (
            <a
              href={campsite.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="p-2 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors">
                <Globe className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <p className="font-medium text-primary hover:underline">
                  {new URL(campsite.website).hostname}
                </p>
              </div>
            </a>
          )}
        </div>

        {/* Social Media */}
        {hasSocial && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-3">Social Media</p>
            <div className="flex gap-2">
              {campsite.facebook_url && (
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                >
                  <a
                    href={campsite.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-4 h-4 text-blue-600" />
                  </a>
                </Button>
              )}
              {campsite.instagram_url && (
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                >
                  <a
                    href={campsite.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4 text-pink-600" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Address and Map Links */}
        {campsite.address && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{campsite.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Map Actions */}
        {hasLocation && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              asChild
            >
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="w-4 h-4 mr-2" />
                View on Map
              </a>
            </Button>
            <Button
              variant="default"
              className="flex-1"
              asChild
            >
              <a
                href={getDirectionsUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
