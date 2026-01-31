'use client';

import Link from 'next/link';
import { Tent } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left panel - decorative */}
      <div className="relative hidden items-center justify-center overflow-hidden bg-brand-green lg:flex">
        {/* Decorative circles */}
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -right-16 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute left-1/4 top-1/4 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute bottom-1/3 right-1/4 h-24 w-24 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          {/* Nature SVG illustration */}
          <svg
            className="mb-10 h-64 w-64"
            viewBox="0 0 256 256"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Moon */}
            <circle cx="200" cy="48" r="20" stroke="white" strokeWidth="2" fill="none" />
            <circle cx="210" cy="42" r="16" fill="#2D5A3D" />

            {/* Stars */}
            <circle cx="60" cy="40" r="2" fill="white" />
            <circle cx="100" cy="25" r="1.5" fill="white" />
            <circle cx="150" cy="50" r="2" fill="white" />
            <circle cx="40" cy="70" r="1.5" fill="white" />
            <circle cx="170" cy="30" r="1" fill="white" />
            <circle cx="120" cy="60" r="1.5" fill="white" />

            {/* Left tree */}
            <line x1="55" y1="200" x2="55" y2="130" stroke="white" strokeWidth="2" />
            <polygon points="55,90 30,160 80,160" stroke="white" strokeWidth="2" fill="none" />
            <polygon points="55,110 35,155 75,155" stroke="white" strokeWidth="2" fill="none" />

            {/* Right tree */}
            <line x1="200" y1="200" x2="200" y2="140" stroke="white" strokeWidth="2" />
            <polygon points="200,100 175,170 225,170" stroke="white" strokeWidth="2" fill="none" />
            <polygon points="200,120 180,165 220,165" stroke="white" strokeWidth="2" fill="none" />

            {/* Tent */}
            <polygon points="128,100 70,200 186,200" stroke="white" strokeWidth="2.5" fill="none" />
            <line x1="128" y1="100" x2="128" y2="200" stroke="white" strokeWidth="1.5" />
            {/* Tent opening */}
            <polygon points="128,200 115,165 141,165" stroke="white" strokeWidth="1.5" fill="none" />
            {/* Tent flag */}
            <line x1="128" y1="100" x2="142" y2="108" stroke="white" strokeWidth="1.5" />

            {/* Ground line */}
            <line x1="20" y1="200" x2="236" y2="200" stroke="white" strokeWidth="2" strokeLinecap="round" />

            {/* Small bushes */}
            <ellipse cx="95" cy="198" rx="12" ry="6" stroke="white" strokeWidth="1.5" fill="none" />
            <ellipse cx="165" cy="198" rx="10" ry="5" stroke="white" strokeWidth="1.5" fill="none" />
          </svg>

          <p
            className="max-w-sm text-xl font-medium leading-relaxed text-white"
            style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}
          >
            ค้นหาประสบการณ์แคมป์ปิ้งที่ดีที่สุดในประเทศไทย
          </p>
          <p className="mt-3 text-sm text-white/60">
            Discover the best camping experiences in Thailand
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-col items-center justify-center bg-brand-bg px-6 py-12 lg:bg-white">
        <div className="w-full max-w-md">
          {/* Brand logo */}
          <div className="mb-10 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-brand-green">
              <Tent className="h-7 w-7" />
              <span
                className="text-xl font-bold"
                style={{ fontFamily: 'var(--font-outfit), sans-serif' }}
              >
                Camping Thailand
              </span>
            </Link>
          </div>

          {/* Title and subtitle */}
          <div className="mb-8 text-center">
            <h1
              className="text-2xl font-bold text-brand-text"
              style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}
            >
              {title}
            </h1>
            <p
              className="mt-2 text-sm text-muted-foreground"
              style={{ fontFamily: 'var(--font-noto-sans-thai), sans-serif' }}
            >
              {subtitle}
            </p>
          </div>

          {/* Form content */}
          {children}
        </div>
      </div>
    </div>
  );
}
