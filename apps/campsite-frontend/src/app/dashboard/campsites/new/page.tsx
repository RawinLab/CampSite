'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BasicInfoStep } from '@/components/dashboard/campsite-wizard/BasicInfoStep';
import { LocationStep } from '@/components/dashboard/campsite-wizard/LocationStep';
import { PhotosStep } from '@/components/dashboard/campsite-wizard/PhotosStep';
import { AmenitiesStep } from '@/components/dashboard/campsite-wizard/AmenitiesStep';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateCampsiteInput } from '@campsite/shared';

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Name, description, type' },
  { id: 2, title: 'Location', description: 'Address, province, coordinates' },
  { id: 3, title: 'Photos', description: 'Upload campsite images' },
  { id: 4, title: 'Amenities', description: 'Select available facilities' },
];

export default function NewCampsitePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateCampsiteInput>>({
    check_in_time: '14:00',
    check_out_time: '12:00',
    amenity_ids: [],
  });
  const [tempPhotos, setTempPhotos] = useState<File[]>([]);

  const updateFormData = (data: Partial<CreateCampsiteInput>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Create campsite
      const response = await fetch('/api/dashboard/campsites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create campsite');
      }

      const { data: campsite } = await response.json();

      // Upload photos if any
      // Note: In a real implementation, photos would be uploaded to Supabase Storage
      // and then the URLs would be sent to the API

      toast({
        title: 'Success!',
        description: 'Your campsite has been created and is pending admin approval.',
      });

      router.push(`/dashboard/campsites/${campsite.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create campsite',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/campsites">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Campsite</h1>
          <p className="text-muted-foreground">
            Add your campsite to Camping Thailand platform
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, index) => (
          <div key={s.id} className="flex items-center">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium',
                step > s.id
                  ? 'bg-primary border-primary text-primary-foreground'
                  : step === s.id
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
              )}
            >
              {step > s.id ? <Check className="h-5 w-5" /> : s.id}
            </div>
            <div className="ml-3 hidden sm:block">
              <p
                className={cn(
                  'text-sm font-medium',
                  step === s.id ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {s.title}
              </p>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-12 h-0.5 mx-4',
                  step > s.id ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step - 1].title}</CardTitle>
          <CardDescription>{STEPS[step - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <BasicInfoStep
              data={formData}
              onChange={updateFormData}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <LocationStep
              data={formData}
              onChange={updateFormData}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <PhotosStep
              photos={tempPhotos}
              onChange={setTempPhotos}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <AmenitiesStep
              data={formData}
              onChange={updateFormData}
              onBack={() => setStep(3)}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>

      {/* Note about approval */}
      <p className="text-sm text-muted-foreground text-center">
        Note: New campsites require admin approval before being visible to the public.
      </p>
    </div>
  );
}
