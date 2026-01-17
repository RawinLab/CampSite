import { Card } from '@/components/ui/card';
import { BecomeOwnerContent } from './BecomeOwnerContent';

// Force dynamic rendering to avoid SSG with Supabase client
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'สมัครเป็นเจ้าของแคมป์ไซต์ | Camping Thailand',
  description: 'สมัครเป็นเจ้าของแคมป์ไซต์เพื่อลงประกาศแคมป์ของคุณ',
};

export default function BecomeOwnerPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-lg p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-green-600">Camping Thailand</h1>
          <p className="mt-2 text-gray-600">สมัครเป็นเจ้าของแคมป์ไซต์</p>
        </div>

        <div className="mb-6 rounded-md bg-green-50 p-4">
          <h2 className="font-semibold text-green-800">สิทธิประโยชน์ของเจ้าของแคมป์ไซต์</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-green-700">
            <li>เพิ่มและจัดการแคมป์ไซต์ของคุณ</li>
            <li>ตอบกลับรีวิวจากลูกค้า</li>
            <li>รับการสอบถามจากลูกค้าโดยตรง</li>
            <li>ดูสถิติและรายงานการเข้าชม</li>
          </ul>
        </div>

        <BecomeOwnerContent />
      </Card>
    </div>
  );
}
