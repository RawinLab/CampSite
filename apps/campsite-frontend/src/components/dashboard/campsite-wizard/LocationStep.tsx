'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Locate, Loader2 } from 'lucide-react';
import type { CreateCampsiteInput } from '@campsite/shared';

interface LocationStepProps {
  data: Partial<CreateCampsiteInput>;
  onChange: (data: Partial<CreateCampsiteInput>) => void;
  onBack: () => void;
  onNext: () => void;
}

interface Province {
  id: number;
  name_th: string;
  name_en: string;
  region: string;
}

export function LocationStep({ data, onChange, onBack, onNext }: LocationStepProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchProvinces() {
      try {
        const response = await fetch('/api/provinces');
        if (response.ok) {
          const result = await response.json();
          setProvinces(result.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch provinces:', error);
      }
    }
    fetchProvinces();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors({ location: 'Geolocation is not supported by your browser' });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        setErrors({ location: 'Unable to get your location' });
        setIsLoadingLocation(false);
      }
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.province_id) {
      newErrors.province_id = 'Please select a province';
    }
    if (!data.address || data.address.length < 10) {
      newErrors.address = 'Address must be at least 10 characters';
    }
    if (!data.latitude || data.latitude < -90 || data.latitude > 90) {
      newErrors.latitude = 'Please enter a valid latitude';
    }
    if (!data.longitude || data.longitude < -180 || data.longitude > 180) {
      newErrors.longitude = 'Please enter a valid longitude';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  // Group provinces by region
  const groupedProvinces = provinces.reduce(
    (acc, province) => {
      const region = province.region || 'Other';
      if (!acc[region]) acc[region] = [];
      acc[region].push(province);
      return acc;
    },
    {} as Record<string, Province[]>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="province">Province *</Label>
        <Select
          value={data.province_id?.toString() || ''}
          onValueChange={(value) => onChange({ province_id: Number(value) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a province" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {Object.entries(groupedProvinces).map(([region, regionProvinces]) => (
              <div key={region}>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  {region}
                </div>
                {regionProvinces.map((province) => (
                  <SelectItem key={province.id} value={province.id.toString()}>
                    {province.name_en} ({province.name_th})
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        {errors.province_id && (
          <p className="text-sm text-destructive">{errors.province_id}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Full Address *</Label>
        <Textarea
          id="address"
          value={data.address || ''}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="Enter the full address including street, district, etc."
          rows={3}
        />
        {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>GPS Coordinates *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Locate className="h-4 w-4 mr-2" />
            )}
            Get Current Location
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={data.latitude || ''}
              onChange={(e) => onChange({ latitude: Number(e.target.value) })}
              placeholder="e.g., 18.7883"
            />
            {errors.latitude && (
              <p className="text-sm text-destructive">{errors.latitude}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={data.longitude || ''}
              onChange={(e) => onChange({ longitude: Number(e.target.value) })}
              placeholder="e.g., 98.9853"
            />
            {errors.longitude && (
              <p className="text-sm text-destructive">{errors.longitude}</p>
            )}
          </div>
        </div>

        {errors.location && (
          <p className="text-sm text-destructive">{errors.location}</p>
        )}

        {data.latitude && data.longitude && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span>
                Location: {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
              </span>
            </div>
            <a
              href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline mt-1 inline-block"
            >
              View on Google Maps
            </a>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Next: Photos</Button>
      </div>
    </div>
  );
}
