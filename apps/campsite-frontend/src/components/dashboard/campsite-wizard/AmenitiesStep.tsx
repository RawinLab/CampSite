'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { CreateCampsiteInput } from '@campsite/shared';

interface AmenitiesStepProps {
  data: Partial<CreateCampsiteInput>;
  onChange: (data: Partial<CreateCampsiteInput>) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

interface Amenity {
  id: number;
  name_th: string;
  name_en: string;
  slug: string;
  icon: string;
  category: string;
}

export function AmenitiesStep({
  data,
  onChange,
  onBack,
  onSubmit,
  isSubmitting,
}: AmenitiesStepProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAmenities() {
      try {
        const response = await fetch('/api/amenities');
        if (response.ok) {
          const result = await response.json();
          setAmenities(result.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch amenities:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAmenities();
  }, []);

  const selectedIds = data.amenity_ids || [];

  const toggleAmenity = (id: number) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onChange({ amenity_ids: newIds });
  };

  // Group amenities by category
  const groupedAmenities = amenities.reduce(
    (acc, amenity) => {
      const category = amenity.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(amenity);
      return acc;
    },
    {} as Record<string, Amenity[]>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select all amenities available at your campsite. This helps travelers find what they
        need.
      </p>

      {Object.entries(groupedAmenities).map(([category, categoryAmenities]) => (
        <div key={category} className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            {category}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categoryAmenities.map((amenity) => (
              <div
                key={amenity.id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                onClick={() => toggleAmenity(amenity.id)}
              >
                <Checkbox
                  id={`amenity-${amenity.id}`}
                  checked={selectedIds.includes(amenity.id)}
                  onCheckedChange={() => toggleAmenity(amenity.id)}
                />
                <Label
                  htmlFor={`amenity-${amenity.id}`}
                  className="flex-1 cursor-pointer text-sm"
                >
                  <span className="mr-2">{amenity.icon}</span>
                  {amenity.name_en}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}

      {amenities.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No amenities available. You can add them later.
        </p>
      )}

      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground mb-4">
          {selectedIds.length} amenities selected
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Campsite'
          )}
        </Button>
      </div>
    </div>
  );
}
