'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, ChevronRight, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Booking, BookingStatus } from '@campsite/shared';

import { API_BASE_URL as API_URL } from '@/lib/api/config';

const statusLabels: Record<BookingStatus, { label: string; color: string }> = {
  pending: { label: 'รอการยืนยัน', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'ยืนยันแล้ว', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-700' },
  completed: { label: 'เสร็จสิ้น', color: 'bg-blue-100 text-blue-700' },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">การจองของฉัน</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchBookings}>ลองใหม่</Button>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">การจองของฉัน</h1>
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">ยังไม่มีการจอง</h2>
          <p className="text-gray-500 mb-6">เริ่มต้นการท่องเที่ยวด้วยการจองแคมป์ไซต์กัน!</p>
          <Link href="/search">
            <Button className="bg-[#2D5A3D] hover:bg-[#1e3d29]">
              ค้นหาแคมป์ไซต์
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">การจองของฉัน</h1>
      
      <div className="space-y-4">
        {bookings.map((booking) => {
          const status = statusLabels[booking.status];
          return (
            <Link key={booking.id} href={`/bookings/${booking.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold">{booking.campsiteName}</h2>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{booking.guestsCount} คน</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{booking.nightsCount} คืน</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Action */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#2D5A3D]">
                          ฿{booking.totalPrice.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400">
                          {booking.paymentStatus === 'paid' ? 'ชำระแล้ว' : 'รอการชำระ'}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
