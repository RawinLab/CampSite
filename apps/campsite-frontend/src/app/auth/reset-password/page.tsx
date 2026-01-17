import { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

// Force dynamic rendering to avoid SSG with Supabase client
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'รีเซ็ตรหัสผ่าน | Camping Thailand',
  description: 'ตั้งรหัสผ่านใหม่สำหรับบัญชี Camping Thailand',
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-green-600">Camping Thailand</h1>
          <p className="mt-2 text-gray-600">ตั้งรหัสผ่านใหม่</p>
        </div>
        <ResetPasswordForm />
      </Card>
    </div>
  );
}
