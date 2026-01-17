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
import type { CreateCampsiteInput } from '@campsite/shared';

interface BasicInfoStepProps {
  data: Partial<CreateCampsiteInput>;
  onChange: (data: Partial<CreateCampsiteInput>) => void;
  onNext: () => void;
}

interface CampsiteType {
  id: number;
  name_th: string;
  name_en: string;
  slug: string;
}

export function BasicInfoStep({ data, onChange, onNext }: BasicInfoStepProps) {
  const [campsiteTypes, setCampsiteTypes] = useState<CampsiteType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchTypes() {
      try {
        const response = await fetch('/api/campsite-types');
        if (response.ok) {
          const result = await response.json();
          setCampsiteTypes(result.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch campsite types:', error);
      }
    }
    fetchTypes();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.name || data.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    if (!data.description || data.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }
    if (!data.campsite_type_id) {
      newErrors.campsite_type_id = 'Please select a campsite type';
    }
    if (!data.check_in_time) {
      newErrors.check_in_time = 'Check-in time is required';
    }
    if (!data.check_out_time) {
      newErrors.check_out_time = 'Check-out time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Campsite Name *</Label>
        <Input
          id="name"
          value={data.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g., Doi Inthanon Mountain Camp"
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe your campsite, its unique features, and what makes it special..."
          rows={5}
        />
        <p className="text-sm text-muted-foreground">
          {(data.description || '').length}/5000 characters (minimum 50)
        </p>
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Campsite Type *</Label>
        <Select
          value={data.campsite_type_id?.toString() || ''}
          onValueChange={(value) => onChange({ campsite_type_id: Number(value) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            {campsiteTypes.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                {type.name_en} ({type.name_th})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.campsite_type_id && (
          <p className="text-sm text-destructive">{errors.campsite_type_id}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="check_in_time">Check-in Time *</Label>
          <Input
            id="check_in_time"
            type="time"
            value={data.check_in_time || '14:00'}
            onChange={(e) => onChange({ check_in_time: e.target.value })}
          />
          {errors.check_in_time && (
            <p className="text-sm text-destructive">{errors.check_in_time}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="check_out_time">Check-out Time *</Label>
          <Input
            id="check_out_time"
            type="time"
            value={data.check_out_time || '12:00'}
            onChange={(e) => onChange({ check_out_time: e.target.value })}
          />
          {errors.check_out_time && (
            <p className="text-sm text-destructive">{errors.check_out_time}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_price">Minimum Price (THB/night)</Label>
          <Input
            id="min_price"
            type="number"
            min={0}
            value={data.min_price || ''}
            onChange={(e) => onChange({ min_price: Number(e.target.value) })}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_price">Maximum Price (THB/night)</Label>
          <Input
            id="max_price"
            type="number"
            min={0}
            value={data.max_price || ''}
            onChange={(e) => onChange({ max_price: Number(e.target.value) })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={data.phone || ''}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="+66 XX XXX XXXX"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={data.email || ''}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="contact@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          value={data.website || ''}
          onChange={(e) => onChange({ website: e.target.value })}
          placeholder="https://example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="booking_url">Booking URL</Label>
        <Input
          id="booking_url"
          type="url"
          value={data.booking_url || ''}
          onChange={(e) => onChange({ booking_url: e.target.value })}
          placeholder="https://booking.example.com"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext}>Next: Location</Button>
      </div>
    </div>
  );
}
