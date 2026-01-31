import { Metadata } from 'next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignupForm } from '@/components/auth/SignupForm';

// Force dynamic rendering to avoid SSG with Supabase client
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'สมัครสมาชิก | Camping Thailand',
  description: 'สมัครสมาชิกเพื่อค้นหาและรีวิวแคมป์ไซต์ทั่วประเทศไทย',
};

export default function SignupPage() {
  return (
    <AuthLayout
      title="สมัครสมาชิก"
      subtitle="สร้างบัญชีเพื่อเริ่มต้นค้นหาแคมป์ไซต์ทั่วไทย"
    >
      <SignupForm />
    </AuthLayout>
  );
}
