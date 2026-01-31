import { Metadata } from 'next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

// Force dynamic rendering to avoid SSG with Supabase client
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ลืมรหัสผ่าน | Camping Thailand',
  description: 'รีเซ็ตรหัสผ่านบัญชี Camping Thailand',
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="ลืมรหัสผ่าน"
      subtitle="กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
