import { Metadata } from 'next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

// Force dynamic rendering to avoid SSG with Supabase client
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'รีเซ็ตรหัสผ่าน | Camping Thailand',
  description: 'ตั้งรหัสผ่านใหม่สำหรับบัญชี Camping Thailand',
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="ตั้งรหัสผ่านใหม่"
      subtitle="กรอกรหัสผ่านใหม่ของคุณ"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
