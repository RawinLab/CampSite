'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotosManager } from '@/components/dashboard/PhotosManager';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, Save, Loader2, ExternalLink } from 'lucide-react';
import type { CampsitePhotoResponse } from '@campsite/shared';

interface Campsite {
  id: string;
  name: string;
  description: string;
  status: string;
  province_id: number;
  address: string;
  latitude: number;
  longitude: number;
  campsite_type_id: number;
  check_in_time: string;
  check_out_time: string;
  min_price: number;
  max_price: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  booking_url: string | null;
  province: { id: number; name_th: string; name_en: string };
  campsite_type: { id: number; name_th: string; name_en: string };
  campsite_photos: CampsitePhotoResponse[];
  campsite_amenities: { amenity_id: number; amenities: { id: number; name_th: string; name_en: string; icon: string } }[];
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: 'Pending Approval', variant: 'secondary' },
  approved: { label: 'Active', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

export default function EditCampsitePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const campsiteId = params.id as string;

  const [campsite, setCampsite] = useState<Campsite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Campsite>>({});

  useEffect(() => {
    async function fetchCampsite() {
      try {
        const response = await fetch(`/api/dashboard/campsites/${campsiteId}`);
        if (response.ok) {
          const { data } = await response.json();
          setCampsite(data);
          setFormData(data);
        } else {
          toast({
            title: 'Error',
            description: 'Campsite not found',
            variant: 'destructive',
          });
          router.push('/dashboard/campsites');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load campsite',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchCampsite();
  }, [campsiteId, router, toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/dashboard/campsites/${campsiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          check_in_time: formData.check_in_time,
          check_out_time: formData.check_out_time,
          min_price: formData.min_price,
          max_price: formData.max_price,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          booking_url: formData.booking_url,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Campsite updated successfully',
        });
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update campsite',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!campsite) {
    return null;
  }

  const statusConfig = STATUS_LABELS[campsite.status] || STATUS_LABELS.pending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/campsites">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{campsite.name}</h1>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {campsite.province.name_en} - {campsite.campsite_type.name_en}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campsite.status === 'approved' && (
            <Button asChild variant="outline">
              <Link href={`/campsites/${campsiteId}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public
              </Link>
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your campsite details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="check_in_time">Check-in Time</Label>
                  <Input
                    id="check_in_time"
                    type="time"
                    value={formData.check_in_time || ''}
                    onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check_out_time">Check-out Time</Label>
                  <Input
                    id="check_out_time"
                    type="time"
                    value={formData.check_out_time || ''}
                    onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_price">Min Price (THB)</Label>
                  <Input
                    id="min_price"
                    type="number"
                    value={formData.min_price || ''}
                    onChange={(e) => setFormData({ ...formData, min_price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_price">Max Price (THB)</Label>
                  <Input
                    id="max_price"
                    type="number"
                    value={formData.max_price || ''}
                    onChange={(e) => setFormData({ ...formData, max_price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking_url">Booking URL</Label>
                <Input
                  id="booking_url"
                  type="url"
                  value={formData.booking_url || ''}
                  onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <PhotosManager
            campsiteId={campsiteId}
            photos={campsite.campsite_photos}
          />
        </TabsContent>

        <TabsContent value="amenities">
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
              <CardDescription>
                Manage available amenities at your campsite
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {campsite.campsite_amenities.map((ca) => (
                  <div
                    key={ca.amenity_id}
                    className="flex items-center gap-2 p-3 bg-muted rounded-lg"
                  >
                    <span>{ca.amenities.icon}</span>
                    <span className="text-sm">{ca.amenities.name_en}</span>
                  </div>
                ))}
              </div>
              {campsite.campsite_amenities.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No amenities added yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
