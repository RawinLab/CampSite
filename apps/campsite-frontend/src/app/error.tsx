'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Custom Error Page (500)
 * Displayed when a runtime error occurs
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to error reporting service
    console.error('Application error:', error);

    // Future: Send to error tracking service (e.g., Sentry)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error);
    // }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white px-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-8 pb-8 text-center">
          {/* Warning Icon */}
          <div className="mb-6">
            <svg
              className="w-24 h-24 mx-auto text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          {/* Error Code */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            เกิดข้อผิดพลาด
          </h1>

          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            ขออภัย เกิดปัญหาบางอย่าง
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            เกิดข้อผิดพลาดขณะโหลดหน้านี้ ทีมงานได้รับแจ้งปัญหานี้แล้ว
            กรุณาลองใหม่อีกครั้ง หรือกลับไปหน้าหลัก
          </p>

          {/* Error Details (Development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
              <p className="text-sm font-medium text-red-800 mb-1">Error Details:</p>
              <p className="text-sm text-red-700 font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="bg-green-600 hover:bg-green-700"
            >
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
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              ลองใหม่อีกครั้ง
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/')}
            >
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
          </div>

          {/* Contact Support */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              ปัญหายังไม่ได้รับการแก้ไข?{' '}
              <a
                href="mailto:support@campingthailand.com"
                className="text-green-600 hover:text-green-700 underline"
              >
                ติดต่อฝ่ายสนับสนุน
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
