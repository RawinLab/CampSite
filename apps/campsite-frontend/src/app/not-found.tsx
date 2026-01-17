import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Custom 404 Page
 * Displayed when a page is not found
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white px-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-8 pb-8 text-center">
          {/* Tent Icon */}
          <div className="mb-6">
            <svg
              className="w-24 h-24 mx-auto text-green-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3.5 21L12 3l8.5 18" />
              <path d="M12 21V11" />
              <path d="M3.5 21h17" />
              <path d="M8 21v-4h8v4" />
            </svg>
          </div>

          {/* Error Code */}
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            ไม่พบหน้าที่คุณกำลังค้นหา
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-8">
            หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบไปแล้ว หรือไม่เคยมีอยู่
            ลองค้นหาแคมป์ไซต์ที่คุณต้องการด้านล่างนี้
          </p>

          {/* Search Box */}
          <div className="mb-6">
            <form action="/search" method="get" className="flex gap-2">
              <input
                type="text"
                name="q"
                placeholder="ค้นหาแคมป์ไซต์..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                ค้นหา
              </Button>
            </form>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                <svg
                  className="w-4 h-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                กลับหน้าหลัก
              </Button>
            </Link>
            <Link href="/search">
              <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                <svg
                  className="w-4 h-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                ค้นหาแคมป์ไซต์
              </Button>
            </Link>
          </div>

          {/* Popular Suggestions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">แคมป์ไซต์ยอดนิยม:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/search?type=camping"
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition"
              >
                แคมป์ปิ้ง
              </Link>
              <Link
                href="/search?type=glamping"
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition"
              >
                แกลมปิ้ง
              </Link>
              <Link
                href="/search?type=bungalow"
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition"
              >
                บังกะโล
              </Link>
              <Link
                href="/provinces/chiang-mai"
                className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition"
              >
                เชียงใหม่
              </Link>
              <Link
                href="/provinces/kanchanaburi"
                className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition"
              >
                กาญจนบุรี
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
