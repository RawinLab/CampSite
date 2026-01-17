import { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

// Force dynamic rendering to avoid SSG with Supabase client
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ลืมรหัสผ่าน | Camping Thailand',
  description: 'รีเซ็ตรหัสผ่านบัญชี Camping Thailand',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-green-600">Camping Thailand</h1>
          <p className="mt-2 text-gray-600">ลืมรหัสผ่าน</p>
        </div>
        <ForgotPasswordForm />
      </Card>
    </div>
  );
}
