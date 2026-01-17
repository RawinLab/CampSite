# Plan: SEO & Performance (Module 11)

## Module Information
- **Module:** 11
- **Name:** SEO & Performance
- **Priority:** HIGH
- **Sprint:** 4
- **Story Points:** 12
- **Dependencies:** Module 4 (Campsite Detail)
- **Related Clarifications:** Q15 (Advanced SEO + AI Search), Q16 (Custom error pages), Q17 (Skeleton screens)

---

## Overview

Implement SEO optimization and performance features:
- Meta tags and Open Graph (Q15)
- JSON-LD structured data (Q15)
- Dynamic sitemap.xml
- robots.txt
- Custom error pages (Q16)
- Skeleton screens (Q17)
- Core Web Vitals optimization

---

## Features

### 11.1 Meta Tags & Open Graph (Q15)
**Priority:** HIGH

**Root Layout Metadata:**
```typescript
// src/app/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://camping-thailand.com'),
  title: {
    default: 'Camping Thailand - ค้นหาแคมป์ปิ้งและแกลมปิ้งทั่วไทย',
    template: '%s | Camping Thailand',
  },
  description: 'ค้นหาที่พักแคมป์ปิ้ง แกลมปิ้ง รีสอร์ทเต็นท์ทั่วประเทศไทย พร้อมรีวิวจากผู้ใช้จริง',
  keywords: ['camping', 'glamping', 'thailand', 'outdoor', 'tent', 'แคมป์ปิ้ง', 'แกลมปิ้ง'],
  authors: [{ name: 'Camping Thailand' }],
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    siteName: 'Camping Thailand',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Camping Thailand',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@campingthailand',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://camping-thailand.com',
  },
};
```

**Campsite Detail Metadata:**
```typescript
// src/app/campsites/[id]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campsite = await getCampsite(params.id);

  if (!campsite) {
    return {};
  }

  const title = `${campsite.name} - ${campsite.province.name_th}`;
  const description = campsite.description?.slice(0, 160) ||
    `ที่พักแคมป์ปิ้งใน${campsite.province.name_th} ราคาเริ่มต้น ฿${campsite.price_min.toLocaleString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://camping-thailand.com/campsites/${campsite.id}`,
      images: campsite.photos.slice(0, 4).map((photo) => ({
        url: photo.url,
        width: 1200,
        height: 630,
        alt: photo.alt_text || campsite.name,
      })),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [campsite.photos[0]?.url || '/og-image.jpg'],
    },
    alternates: {
      canonical: `https://camping-thailand.com/campsites/${campsite.id}`,
    },
  };
}
```

### 11.2 JSON-LD Structured Data (Q15)
**Priority:** HIGH

**Organization Schema:**
```typescript
// src/components/seo/OrganizationSchema.tsx
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Camping Thailand',
    url: 'https://camping-thailand.com',
    logo: 'https://camping-thailand.com/logo.png',
    sameAs: [
      'https://facebook.com/campingthailand',
      'https://instagram.com/campingthailand',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@camping-thailand.com',
      contactType: 'customer service',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

**LocalBusiness Schema (Campsite):**
```typescript
// src/components/seo/CampsiteSchema.tsx
interface CampsiteSchemaProps {
  campsite: CampsiteDetail;
}

export function CampsiteSchema({ campsite }: CampsiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': `https://camping-thailand.com/campsites/${campsite.id}`,
    name: campsite.name,
    description: campsite.description,
    url: `https://camping-thailand.com/campsites/${campsite.id}`,
    image: campsite.photos.map((p) => p.url),
    address: {
      '@type': 'PostalAddress',
      streetAddress: campsite.address,
      addressRegion: campsite.province.name_en,
      addressCountry: 'TH',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: campsite.latitude,
      longitude: campsite.longitude,
    },
    telephone: campsite.phone,
    email: campsite.email,
    priceRange: `฿${campsite.price_min} - ฿${campsite.price_max}`,
    checkinTime: campsite.check_in_time,
    checkoutTime: campsite.check_out_time,
    amenityFeature: campsite.amenities.map((a) => ({
      '@type': 'LocationFeatureSpecification',
      name: a.name_en,
      value: true,
    })),
    aggregateRating: campsite.review_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: campsite.rating_average,
      reviewCount: campsite.review_count,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

**BreadcrumbList Schema:**
```typescript
// src/components/seo/BreadcrumbSchema.tsx
interface BreadcrumbSchemaProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

**Review Schema:**
```typescript
// src/components/seo/ReviewSchema.tsx
export function ReviewSchema({ campsite, reviews }: ReviewSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: campsite.name,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: campsite.rating_average,
      reviewCount: campsite.review_count,
    },
    review: reviews.slice(0, 10).map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.user.full_name,
      },
      datePublished: review.created_at,
      reviewBody: review.content,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating_overall,
        bestRating: 5,
        worstRating: 1,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### 11.3 Sitemap & Robots
**Priority:** HIGH

**Dynamic Sitemap:**
```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerSupabase();

  // Get all approved campsites
  const { data: campsites } = await supabase
    .from('campsites')
    .select('id, updated_at')
    .eq('status', 'approved')
    .eq('is_active', true);

  // Get all provinces
  const { data: provinces } = await supabase
    .from('provinces')
    .select('slug');

  const baseUrl = 'https://camping-thailand.com';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  const campsitePages: MetadataRoute.Sitemap = (campsites || []).map((campsite) => ({
    url: `${baseUrl}/campsites/${campsite.id}`,
    lastModified: new Date(campsite.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const provincePages: MetadataRoute.Sitemap = (provinces || []).map((province) => ({
    url: `${baseUrl}/search?province=${province.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...campsitePages, ...provincePages];
}
```

**Robots.txt:**
```typescript
// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/auth/', '/api/'],
      },
    ],
    sitemap: 'https://camping-thailand.com/sitemap.xml',
  };
}
```

### 11.4 Custom Error Pages (Q16)
**Priority:** HIGH

**404 Page:**
```typescript
// src/app/not-found.tsx
export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <Tent className="h-24 w-24 text-gray-300 mb-6" />
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-xl text-gray-600 mb-6">ไม่พบหน้าที่คุณค้นหา</p>

      <div className="space-y-4 text-center">
        <p className="text-gray-500">ลองค้นหาแคมป์ไซต์ที่คุณต้องการ</p>
        <SearchBar />

        <div className="pt-4">
          <Button asChild>
            <Link href="/">กลับหน้าแรก</Link>
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-4">แคมป์ไซต์ยอดนิยม</h2>
        <PopularCampsites limit={4} />
      </div>
    </div>
  );
}
```

**500 Error Page:**
```typescript
// src/app/error.tsx
'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <AlertCircle className="h-24 w-24 text-red-400 mb-6" />
      <h1 className="text-4xl font-bold mb-2">เกิดข้อผิดพลาด</h1>
      <p className="text-xl text-gray-600 mb-6">ขออภัย เกิดข้อผิดพลาดบางอย่าง</p>

      <div className="space-x-4">
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4 mr-2" />
          ลองใหม่อีกครั้ง
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">กลับหน้าแรก</Link>
        </Button>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        หากปัญหายังคงอยู่ กรุณาติดต่อ support@camping-thailand.com
      </p>
    </div>
  );
}
```

**Maintenance Page:**
```typescript
// src/app/maintenance/page.tsx
export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <Wrench className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-bold mb-2">ระบบอยู่ระหว่างปรับปรุง</h1>
      <p className="text-xl text-gray-600 mb-6 text-center">
        เรากำลังปรับปรุงระบบเพื่อประสบการณ์ที่ดีขึ้น
        <br />
        กรุณากลับมาใหม่ในอีกไม่นาน
      </p>

      <div className="flex items-center gap-4 text-gray-500">
        <a href="https://facebook.com/campingthailand" target="_blank">
          <Facebook className="h-6 w-6" />
        </a>
        <a href="https://instagram.com/campingthailand" target="_blank">
          <Instagram className="h-6 w-6" />
        </a>
      </div>
    </div>
  );
}
```

### 11.5 Skeleton Screens (Q17)
**Priority:** HIGH

**Campsite Card Skeleton:**
```typescript
// src/components/skeletons/CampsiteCardSkeleton.tsx
export function CampsiteCardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          {/* Image */}
          <Skeleton className="aspect-[16/10] w-full" />

          <div className="p-4 space-y-3">
            {/* Title */}
            <Skeleton className="h-6 w-3/4" />

            {/* Location */}
            <Skeleton className="h-4 w-1/2" />

            {/* Price & Rating */}
            <div className="flex justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>

            {/* Amenities */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

**Detail Page Skeleton:**
```typescript
// src/app/campsites/[id]/loading.tsx
export default function CampsiteDetailLoading() {
  return (
    <div className="space-y-8">
      {/* Hero Skeleton */}
      <Skeleton className="w-full aspect-[16/9] rounded-lg" />

      {/* Thumbnails */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-20 h-14 rounded" />
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-8">
          {/* Title */}
          <div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/4 mt-2" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Amenities */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded" />
            ))}
          </div>

          {/* Accommodations */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
```

### 11.6 Performance Optimization
**Priority:** HIGH

**Image Optimization:**
```typescript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

**Font Optimization:**
```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'thai'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

**Core Web Vitals Monitoring:**
```typescript
// src/components/analytics/WebVitals.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics
    console.log(metric);

    // Track in Firebase Analytics
    window.gtag?.('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    });
  });

  return null;
}
```

---

## Technical Design

### Performance Targets

| Metric | Target |
|--------|--------|
| LCP | <2.5s |
| FID | <100ms |
| CLS | <0.1 |
| TTFB | <600ms |
| Page Load | <2s on 4G |
| Lighthouse | >90 |

### Caching Strategy

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};
```

---

## Test Cases

### Unit Tests
- [ ] Meta tags generated correctly
- [ ] JSON-LD schema valid
- [ ] Sitemap includes all pages
- [ ] Robots.txt correct

### Integration Tests
- [ ] Structured data validates
- [ ] Meta tags render in HTML
- [ ] Error pages display correctly

### E2E Tests (Playwright)
- [ ] 404 page displays for invalid routes
- [ ] Error page displays on server error
- [ ] Skeleton screens show during load
- [ ] Page load time <2s

### Performance Tests
- [ ] Lighthouse score >90
- [ ] Core Web Vitals pass
- [ ] Image optimization working

---

## Definition of Done

- [ ] Meta tags on all pages
- [ ] Open Graph tags functional
- [ ] JSON-LD schemas implemented (Q15)
- [ ] Dynamic sitemap generated
- [ ] robots.txt configured
- [ ] Custom 404 page (Q16)
- [ ] Custom 500 page (Q16)
- [ ] Skeleton screens (Q17)
- [ ] Core Web Vitals pass
- [ ] Lighthouse >90

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Meta tags setup | 2 hours |
| JSON-LD schemas | 4 hours |
| Sitemap & robots | 2 hours |
| Error pages | 3 hours |
| Skeleton screens | 3 hours |
| Performance optimization | 4 hours |
| Testing | 3 hours |
| **Total** | **~21 hours (3 days)** |
