'use client';

import { useEffect, useState } from 'react';
import { Star, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Campsite {
  id: string;
  name: string;
  description: string;
  slug: string;
  campsite_type: string;
  province: {
    name_th: string;
  };
  min_price: number;
  max_price: number;
  average_rating: number;
  review_count: number;
  thumbnail_url: string | null;
  is_featured: boolean;
}

export function FeaturedCampsites() {
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3091/api/search?page=1&limit=4')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCampsites(data.data.data.slice(0, 4));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const typeLabels: Record<string, string> = {
    camping: 'แคมป์ปิ้ง',
    glamping: 'แกลมปิ้ง',
    bungalow: 'บังกะโล',
    'tented-resort': 'รีสอร์ทเต็นท์',
  };

  if (loading) {
    return (
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-[#2B2D42]">แคมป์ไซต์แนะนำ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 container mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-[#2B2D42]">แคมป์ไซต์แนะนำ</h2>
        <Link href="/search">
          <Button variant="outline" className="border-[#2D5A3D] text-[#2D5A3D] hover:bg-[#2D5A3D] hover:text-white">
            ดูทั้งหมด
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {campsites.map((campsite) => (
          <Link key={campsite.id} href={`/campsites/${campsite.slug}`}>
            <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={campsite.thumbnail_url || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600'}
                  alt={campsite.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-3 left-3 bg-[#E07A5F] text-white">
                  {typeLabels[campsite.campsite_type] || campsite.campsite_type}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 text-[#2B2D42] line-clamp-1">{campsite.name}</h3>
                <div className="flex items-center text-gray-500 text-sm mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {campsite.province.name_th}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-amber-500">
                    <Star className="h-4 w-4 fill-current mr-1" />
                    <span className="text-sm font-medium">{campsite.average_rating}</span>
                    <span className="text-gray-400 text-sm ml-1">({campsite.review_count})</span>
                  </div>
                  <div className="text-[#2D5A3D] font-bold">
                    ฿{campsite.min_price.toLocaleString()}
                    <span className="text-gray-400 text-sm font-normal">/คืน</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
