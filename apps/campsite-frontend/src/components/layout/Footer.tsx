'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Tent,
  Mail,
  Phone,
  Facebook,
  Instagram,
  MapPin,
  ChevronRight,
} from 'lucide-react';

const quickLinks = [
  { label: 'หน้าแรก', href: '/' },
  { label: 'ค้นหาแคมป์ไซต์', href: '/search' },
  { label: 'จังหวัดยอดนิยม', href: '/provinces' },
  { label: 'เปรียบเทียบ', href: '/compare' },
];

const serviceLinks = [
  { label: 'สมัครเป็นเจ้าของแคมป์', href: '/register-owner' },
  { label: 'ลงทะเบียน', href: '/register' },
  { label: 'เข้าสู่ระบบ', href: '/login' },
  { label: 'ช่วยเหลือ', href: '/help' },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-1.5 text-gray-400 transition-colors hover:text-brand-coral"
      >
        <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        <span>{label}</span>
      </Link>
    </li>
  );
}

export function Footer() {
  const pathname = usePathname();

  // Hide footer on dashboard and admin routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="relative">
      {/* Organic wave SVG divider */}
      <div className="relative -mb-px w-full overflow-hidden leading-[0]">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="relative block h-[60px] w-full md:h-[80px] lg:h-[100px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,60 C180,100 360,20 540,50 C720,80 900,30 1080,55 C1200,70 1320,40 1440,60 L1440,120 L0,120 Z"
            fill="#2B2D42"
          />
        </svg>
      </div>

      {/* Footer content */}
      <div className="bg-[#2B2D42] pb-6 pt-8 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* 4-column grid */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {/* Column 1 - About */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-coral/20">
                  <Tent className="h-5 w-5 text-brand-coral" />
                </div>
                <span
                  className="text-xl font-semibold tracking-tight"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  Camping Thailand
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">
                แพลตฟอร์มค้นหาและจองแคมป์ไซต์ทั่วประเทศไทย
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4 shrink-0 text-brand-coral" />
                <span>ประเทศไทย</span>
              </div>
            </div>

            {/* Column 2 - Quick Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                ลิงก์ด่วน
              </h3>
              <ul className="space-y-2.5 text-sm">
                {quickLinks.map((link) => (
                  <FooterLink key={link.href} {...link} />
                ))}
              </ul>
            </div>

            {/* Column 3 - Services */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                บริการ
              </h3>
              <ul className="space-y-2.5 text-sm">
                {serviceLinks.map((link) => (
                  <FooterLink key={link.href} {...link} />
                ))}
              </ul>
            </div>

            {/* Column 4 - Contact */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                ติดต่อเรา
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="mailto:info@campingthailand.com"
                    className="flex items-center gap-2.5 text-gray-400 transition-colors hover:text-brand-coral"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>info@campingthailand.com</span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+6621234567"
                    className="flex items-center gap-2.5 text-gray-400 transition-colors hover:text-brand-coral"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>02-123-4567</span>
                  </a>
                </li>
              </ul>

              {/* Social icons */}
              <div className="mt-5 flex items-center gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gray-400 transition-colors hover:bg-brand-coral hover:text-white"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gray-400 transition-colors hover:bg-brand-coral hover:text-white"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 border-t border-white/10 pt-6">
            <div className="flex flex-col items-center justify-between gap-4 text-xs text-gray-400 sm:flex-row">
              <p>&copy; 2026 Camping Thailand สงวนลิขสิทธิ์</p>
              <div className="flex items-center gap-4">
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-brand-coral"
                >
                  นโยบายความเป็นส่วนตัว
                </Link>
                <span className="text-white/20">|</span>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-brand-coral"
                >
                  ข้อกำหนดการใช้งาน
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
