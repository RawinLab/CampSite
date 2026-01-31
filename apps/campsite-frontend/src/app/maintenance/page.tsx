import { Metadata } from 'next';
import { Tent, Wrench, Mail } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-background-warm px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Tent className="h-7 w-7 text-brand-green" />
          <span className="text-xl font-bold text-brand-text">Camping Thailand</span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">
          {/* Nature-themed Maintenance Illustration */}
          <div className="mb-8 relative inline-block">
            <div className="w-32 h-32 mx-auto rounded-full bg-brand-green/10 flex items-center justify-center">
              <div className="relative">
                <Tent className="w-16 h-16 text-brand-green" />
                <div className="absolute -bottom-1 -right-3 bg-white rounded-full p-1.5 shadow-md">
                  <Wrench className="w-6 h-6 text-brand-green" />
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
            กำลังปรับปรุงระบบ
          </h1>

          {/* Subtitle */}
          <h2 className="text-lg md:text-xl text-brand-text/70 mb-6">
            เรากำลังทำงานอย่างหนักเพื่อปรับปรุงเว็บไซต์ให้ดีขึ้น
          </h2>

          {/* Description */}
          <p className="text-brand-text/60 mb-8 leading-relaxed">
            ขออภัยในความไม่สะดวก เว็บไซต์กำลังอยู่ระหว่างการปรับปรุงและจะกลับมาให้บริการเร็วๆ นี้
            กรุณากลับมาตรวจสอบอีกครั้งภายหลัง
          </p>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-green to-brand-green/70 rounded-full animate-pulse"
                style={{ width: '65%' }}
              />
            </div>
            <p className="text-sm text-brand-text/50 mt-2">ความคืบหน้า: 65%</p>
          </div>

          {/* Expected Time */}
          <div className="bg-brand-green/10 border border-brand-green/20 rounded-2xl p-4 mb-8">
            <p className="text-brand-green text-sm">
              <span className="font-semibold">เวลาคาดว่าจะกลับมาให้บริการ:</span>
              <br />
              <span className="text-lg">กำลังดำเนินการ กรุณากลับมาตรวจสอบอีกครั้ง</span>
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <p className="text-brand-text/60">
              หากมีข้อสงสัยหรือต้องการความช่วยเหลือ:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@campingthailand.com"
                className="inline-flex items-center justify-center gap-2 px-6 h-12 bg-brand-green text-white rounded-xl hover:bg-forest-700 transition-all duration-300 font-medium"
              >
                <Mail className="w-5 h-5" />
                ติดต่อเรา
              </a>
              <a
                href="https://www.facebook.com/campingthailand"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 h-12 border border-brand-green text-brand-green rounded-xl hover:bg-brand-green/5 transition-all duration-300 font-medium"
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
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-brand-text/60">
            Camping Thailand
          </p>
        </div>
      </div>
    </div>
  );
}
