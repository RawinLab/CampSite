import { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';

// Force dynamic rendering to avoid SSG with Supabase client
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | Camping Thailand',
  description: 'เข้าสู่ระบบเพื่อค้นหาและรีวิวแคมป์ไซต์ทั่วประเทศไทย',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-green-600">Camping Thailand</h1>
          <p className="mt-2 text-gray-600">เข้าสู่ระบบ</p>
        </div>
        <LoginForm />
      </Card>
    </div>
  );
}
