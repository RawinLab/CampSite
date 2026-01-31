'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard, 
  ArrowLeft, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { Booking, BookingStatus } from '@campsite/shared';

import { API_BASE_URL as API_URL } from '@/lib/api/config';

const statusLabels: Record<BookingStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'รอการยืนยัน', color: 'bg-amber-100 text-amber-700', icon: Clock },
  confirmed: { label: 'ยืนยันแล้ว', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-700', icon: XCircle },
  completed: { label: 'เสร็จสิ้น', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`${API_URL}/api/bookings/${id}`, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.success) {
        setBooking(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกการจองนี้?')) return;

    setCancelling(true);
    try {
      const response = await fetch(`${API_URL}/api/bookings/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: 'ยกเลิกโดยผู้ใช้' }),
      });
      
      const data = await response.json();
      if (data.success) {
        setBooking(data.data);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('ไม่สามารถยกเลิกการจองได้');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <p className="text-red-500 mb-4">{error || 'ไม่พบการจอง'}</p>
          <Link href="/bookings">
            <Button variant="outline">กลับไปหน้าการจอง</Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = statusLabels[booking.status];
  const StatusIcon = status.icon;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link href="/bookings">
        <Button variant="ghost" className="mb-6 -ml-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปหน้าการจอง
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">รายละเอียดการจอง</h1>
          <p className="text-gray-500">รหัสการจอง: {booking.id.slice(0, 8)}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.color}`}>
          <StatusIcon className="h-5 w-5" />
          <span className="font-medium">{status.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campsite Info */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลแคมป์ไซต์</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                {booking.campsiteThumbnail && (
                  <img
                    src={booking.campsiteThumbnail}
                    alt={booking.campsiteName}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h2 className="text-xl font-semibold mb-1">{booking.campsiteName}</h2>
                  <Link href={`/campsites/${booking.campsiteId}`}>
                    <Button variant="link" className="p-0 h-auto text-[#2D5A3D]">
                      ดูรายละเอียดแคมป์ไซต์
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Guests */}
          <Card>
            <CardHeader>
              <CardTitle>วันเข้าพักและจำนวนผู้เข้าพัก</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2D5A3D]/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-[#2D5A3D]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">เช็คอิน</p>
                    <p className="font-medium">{formatDate(booking.checkInDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2D5A3D]/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-[#2D5A3D]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">เช็คเอาท์</p>
                    <p className="font-medium">{formatDate(booking.checkOutDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2D5A3D]/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#2D5A3D]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">จำนวนผู้เข้าพัก</p>
                    <p className="font-medium">{booking.guestsCount} คน</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Info */}
          {booking.guestInfo && (
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลผู้เข้าพัก</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><span className="text-gray-500">ชื่อ:</span> {booking.guestInfo.name}</p>
                  <p><span className="text-gray-500">เบอร์โทร:</span> {booking.guestInfo.phone}</p>
                  <p><span className="text-gray-500">อีเมล:</span> {booking.guestInfo.email}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special Requests */}
          {booking.specialRequests && (
            <Card>
              <CardHeader>
                <CardTitle>คำขอพิเศษ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{booking.specialRequests}</p>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Info */}
          {booking.status === 'cancelled' && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">ข้อมูลการยกเลิก</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">
                  <span className="font-medium">ยกเลิกเมื่อ:</span> {booking.cancelledAt && formatDateTime(booking.cancelledAt)}
                </p>
                {booking.cancellationReason && (
                  <p className="text-red-700 mt-1">
                    <span className="font-medium">เหตุผล:</span> {booking.cancellationReason}
                  </p>
                )}
                {booking.refundAmount && booking.refundAmount > 0 && (
                  <p className="text-red-700 mt-1">
                    <span className="font-medium">จำนวนเงินคืน:</span> ฿{booking.refundAmount.toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Summary */}
          <Card>
            <CardHeader>
              <CardTitle>สรุปราคา</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">ราคาห้องพัก</span>
                  <span>฿{booking.totalPrice.toLocaleString()}</span>
                </div>
                {booking.serviceFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ค่าบริการ</span>
                    <span>฿{booking.serviceFee.toLocaleString()}</span>
                  </div>
                )}
                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>ส่วนลด</span>
                    <span>-฿{booking.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>ยอดรวม</span>
                  <span className="text-[#2D5A3D]">
                    ฿{(booking.totalPrice + booking.serviceFee - booking.discountAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    สถานะการชำระ: {' '}
                    <span className={booking.paymentStatus === 'paid' ? 'text-green-600 font-medium' : 'text-amber-600'}>
                      {booking.paymentStatus === 'paid' ? 'ชำระแล้ว' : 'รอการชำระ'}
                    </span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {booking.status === 'pending' && (
            <Card>
              <CardContent className="p-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'กำลังยกเลิก...' : 'ยกเลิกการจอง'}
                </Button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  ยกเลิกฟรีภายใน 7 วันก่อนเข้าพัก
                </p>
              </CardContent>
            </Card>
          )}

          {booking.paymentStatus === 'unpaid' && booking.status !== 'cancelled' && (
            <Button className="w-full bg-[#2D5A3D] hover:bg-[#1e3d29]">
              <CreditCard className="h-4 w-4 mr-2" />
              ชำระเงิน
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
