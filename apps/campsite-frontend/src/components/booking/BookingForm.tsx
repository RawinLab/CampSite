'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

interface BookingFormProps {
  campsiteId: string;
  campsiteName: string;
  basePrice: number;
}

import { API_BASE_URL as API_URL } from '@/lib/api/config';

export function BookingForm({ campsiteId, campsiteName, basePrice }: BookingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guestsCount: 2,
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    specialRequests: '',
  });

  const calculateNights = () => {
    if (!formData.checkInDate || !formData.checkOutDate) return 0;
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    return basePrice * nights * formData.guestsCount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          campsiteId,
          checkInDate: formData.checkInDate,
          checkOutDate: formData.checkOutDate,
          guestsCount: formData.guestsCount,
          guestInfo: {
            name: formData.guestName,
            phone: formData.guestPhone,
            email: formData.guestEmail,
          },
          specialRequests: formData.specialRequests,
          accommodations: [], // TODO: Add accommodation selection
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'จองสำเร็จ!',
          description: 'การจองของคุณถูกสร้างเรียบร้อยแล้ว',
        });
        router.push(`/bookings/${data.data.id}`);
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: data.message || 'ไม่สามารถสร้างการจองได้',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const nights = calculateNights();
  const total = calculateTotal();

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>จองเลย</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="checkIn">เช็คอิน</Label>
              <Input
                id="checkIn"
                type="date"
                value={formData.checkInDate}
                onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <Label htmlFor="checkOut">เช็คเอาท์</Label>
              <Input
                id="checkOut"
                type="date"
                value={formData.checkOutDate}
                onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          {/* Guests */}
          <div>
            <Label>จำนวนผู้เข้าพัก</Label>
            <div className="flex items-center gap-3 mt-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFormData({ ...formData, guestsCount: Math.max(1, formData.guestsCount - 1) })}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{formData.guestsCount}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFormData({ ...formData, guestsCount: formData.guestsCount + 1 })}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Guest Info */}
          <div className="space-y-3">
            <Input
              placeholder="ชื่อ-นามสกุล"
              value={formData.guestName}
              onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
              required
            />
            <Input
              type="tel"
              placeholder="เบอร์โทรศัพท์"
              value={formData.guestPhone}
              onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
              required
            />
            <Input
              type="email"
              placeholder="อีเมล"
              value={formData.guestEmail}
              onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
              required
            />
          </div>

          {/* Special Requests */}
          <div>
            <Label htmlFor="requests">คำขอพิเศษ (ถ้ามี)</Label>
            <textarea
              id="requests"
              className="w-full mt-1 p-3 border rounded-lg text-sm"
              rows={3}
              placeholder="เช่น ต้องการเตียงเสริม, มาถึงดึก ฯลฯ"
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
            />
          </div>

          {/* Price Summary */}
          {nights > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    ฿{basePrice.toLocaleString()} x {nights} คืน
                  </span>
                  <span>฿{(basePrice * nights).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>ยอดรวม</span>
                  <span className="text-[#2D5A3D]">฿{total.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-[#2D5A3D] hover:bg-[#1e3d29] h-12 text-lg"
            disabled={loading || nights <= 0}
          >
            {loading ? 'กำลังจอง...' : 'จองเลย'}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            ยังไม่มีการเรียกเก็บเงินในขณะนี้
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
