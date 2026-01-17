import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import './globals.css';
import { generateBaseMetadata, SITE_CONFIG } from '@/lib/seo/utils';
import { OrganizationSchema } from '@/components/seo/OrganizationSchema';
import { WebVitals } from '@/components/analytics/WebVitals';

// Configure Noto Sans Thai font with next/font for optimal loading
const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans-thai',
  preload: true,
});

// Generate base metadata for all pages
export const metadata: Metadata = generateBaseMetadata({
  title: {
    default: 'Camping Thailand - ค้นหาแคมป์ไซต์ทั่วประเทศไทย',
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
});

// Configure viewport for mobile optimization
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <head>
        {/* Preconnect to important third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for Supabase */}
        <link rel="dns-prefetch" href="https://supabase.co" />
      </head>
      <body className={`${notoSansThai.className} antialiased`}>
        {/* Organization structured data for site-wide SEO */}
        <OrganizationSchema />

        {/* Core Web Vitals tracking */}
        <WebVitals />

        {children}
      </body>
    </html>
  );
}
