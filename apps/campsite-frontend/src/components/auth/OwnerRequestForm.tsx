'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ownerRequestSchema,
  type OwnerRequestInput,
} from '@campsite/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { submitOwnerRequest, hasPendingOwnerRequest } from '@/lib/api/auth';

interface OwnerRequestFormProps {
  onSuccess?: () => void;
}

export function OwnerRequestForm({ onSuccess }: OwnerRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingPending, setIsCheckingPending] = useState(true);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user, session, role } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OwnerRequestInput>({
    resolver: zodResolver(ownerRequestSchema),
    defaultValues: {
      business_name: '',
      business_description: '',
      contact_phone: '',
    },
  });

  // Check for existing pending request on mount
  useEffect(() => {
    async function checkPendingRequest() {
      if (!session?.access_token) {
        setIsCheckingPending(false);
        return;
      }

      try {
        const hasPending = await hasPendingOwnerRequest(session.access_token);
        setHasPendingRequest(hasPending);
      } catch (error) {
        console.error('Failed to check pending request:', error);
      } finally {
        setIsCheckingPending(false);
      }
    }

    checkPendingRequest();
  }, [session?.access_token]);

  const onSubmit = async (data: OwnerRequestInput) => {
    if (!user || !session?.access_token) {
      setErrorMessage('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (role === 'owner') {
      setErrorMessage('คุณเป็นเจ้าของแคมป์ไซต์อยู่แล้ว');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await submitOwnerRequest(session.access_token, data);

      setSuccessMessage(
        'ส่งคำขอสำเร็จแล้ว! เราจะตรวจสอบและแจ้งผลให้คุณทราบทางอีเมล'
      );
      setHasPendingRequest(true);
      onSuccess?.();
    } catch (error) {
      console.error('Owner request error:', error);
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';

      // Handle specific error messages
      if (message.includes('already have a pending')) {
        setErrorMessage('คุณมีคำขอที่รอการอนุมัติอยู่แล้ว');
        setHasPendingRequest(true);
      } else if (message.includes('already a campsite owner')) {
        setErrorMessage('คุณเป็นเจ้าของแคมป์ไซต์อยู่แล้ว');
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (role === 'owner') {
    return (
      <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
        คุณเป็นเจ้าของแคมป์ไซต์อยู่แล้ว สามารถเพิ่มแคมป์ไซต์ได้ที่หน้าแดชบอร์ด
      </div>
    );
  }

  if (role === 'admin') {
    return (
      <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
        คุณเป็นผู้ดูแลระบบ ไม่จำเป็นต้องสมัครเป็นเจ้าของแคมป์ไซต์
      </div>
    );
  }

  if (isCheckingPending) {
    return (
      <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">
        กำลังตรวจสอบสถานะคำขอ...
      </div>
    );
  }

  if (hasPendingRequest) {
    return (
      <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-700">
        คุณมีคำขอที่รอการอนุมัติอยู่แล้ว กรุณารอทีมงานตรวจสอบ
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-700">
        <strong>หมายเหตุ:</strong> หลังจากส่งคำขอ ทีมงานจะตรวจสอบข้อมูลและแจ้งผลให้ทราบภายใน 3-5 วันทำการ
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business_name">ชื่อธุรกิจ</Label>
          <Input
            id="business_name"
            type="text"
            placeholder="ชื่อแคมป์ไซต์หรือธุรกิจของคุณ"
            {...register('business_name')}
            disabled={isLoading}
          />
          {errors.business_name && (
            <p className="text-sm text-red-500">{errors.business_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_description">รายละเอียดธุรกิจ</Label>
          <textarea
            id="business_description"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="อธิบายเกี่ยวกับแคมป์ไซต์หรือธุรกิจของคุณ (อย่างน้อย 20 ตัวอักษร)"
            {...register('business_description')}
            disabled={isLoading}
          />
          {errors.business_description && (
            <p className="text-sm text-red-500">
              {errors.business_description.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone">เบอร์โทรศัพท์ติดต่อ</Label>
          <Input
            id="contact_phone"
            type="tel"
            placeholder="0812345678"
            {...register('contact_phone')}
            disabled={isLoading}
          />
          {errors.contact_phone && (
            <p className="text-sm text-red-500">{errors.contact_phone.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอเป็นเจ้าของแคมป์ไซต์'}
        </Button>
      </form>
    </div>
  );
}
