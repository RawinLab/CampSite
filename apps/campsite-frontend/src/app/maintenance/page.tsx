import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'กำลังปรับปรุงระบบ',
  description: 'เว็บไซต์ Camping Thailand กำลังอยู่ระหว่างการปรับปรุง กรุณากลับมาใหม่ภายหลัง',
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Maintenance Page
 * Displayed when the site is under maintenance
 */
export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white px-4">
      <div className="max-w-lg w-full text-center">
        {/* Construction Icon */}
        <div className="mb-8">
          <svg
            className="w-32 h-32 mx-auto text-amber-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          กำลังปรับปรุงระบบ
        </h1>

        {/* Subtitle */}
        <h2 className="text-xl text-gray-600 mb-6">
          เรากำลังทำงานอย่างหนักเพื่อปรับปรุงเว็บไซต์ให้ดีขึ้น
        </h2>

        {/* Description */}
        <p className="text-gray-500 mb-8">
          ขออภัยในความไม่สะดวก เว็บไซต์กำลังอยู่ระหว่างการปรับปรุงและจะกลับมาให้บริการเร็วๆ นี้
          กรุณากลับมาตรวจสอบอีกครั้งภายหลัง
        </p>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full animate-pulse"
              style={{ width: '65%' }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">ความคืบหน้า: 65%</p>
        </div>

        {/* Expected Time */}
        <div className="bg-amber-100 rounded-lg p-4 mb-8">
          <p className="text-amber-800 text-sm">
            <span className="font-semibold">เวลาคาดว่าจะกลับมาให้บริการ:</span>
            <br />
            <span className="text-lg">กำลังดำเนินการ กรุณากลับมาตรวจสอบอีกครั้ง</span>
          </p>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <p className="text-gray-600">
            หากมีข้อสงสัยหรือต้องการความช่วยเหลือ:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@campingthailand.com"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              ติดต่อเรา
            </a>
            <a
              href="https://www.facebook.com/campingthailand"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </a>
          </div>
        </div>

        {/* Logo/Brand */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-400">
            Camping Thailand
          </p>
        </div>
      </div>
    </div>
  );
}
