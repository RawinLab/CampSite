import { Metadata } from 'next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

// Force dynamic rendering to avoid SSG with Supabase client
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | Camping Thailand',
  description: 'เข้าสู่ระบบเพื่อค้นหาและรีวิวแคมป์ไซต์ทั่วประเทศไทย',
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="เข้าสู่ระบบ"
      subtitle="เข้าสู่ระบบเพื่อจัดการแคมป์ไซต์และรายการโปรดของคุณ"
    >
      <LoginForm />
    </AuthLayout>
  );
}
