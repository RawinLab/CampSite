import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { CampsiteDetail } from '@campsite/shared';
import { CampsiteDetailContent } from './CampsiteDetailContent';
import {
  CampsiteSchema,
  BreadcrumbSchema,
  generateCampsiteBreadcrumbs,
} from '@/components/seo';
import {
  generateDescription,
  generateCampsiteKeywords,
  SITE_CONFIG,
} from '@/lib/seo/utils';
import { getCampsiteCanonicalUrl } from '@/lib/seo/canonical';

import { API_BASE_URL } from '@/lib/api/config';

interface Props {
  params: { id: string };
}

// Fetch campsite data
async function getCampsite(id: string): Promise<CampsiteDetail | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/campsites/${id}`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching campsite:', error);
    return null;
  }
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campsite = await getCampsite(params.id);

  if (!campsite) {
    return {
      title: 'ไม่พบแคมป์ไซต์',
      description: 'ไม่พบแคมป์ไซต์ที่คุณกำลังค้นหา กรุณาลองค้นหาใหม่อีกครั้ง',
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const description = campsite.description
    ? generateDescription(campsite.description, 160)
    : `${campsite.name} - ที่พักแคมป์ปิ้งใน${campsite.province.name_th} เช็คอิน: ${campsite.check_in_time} เช็คเอาท์: ${campsite.check_out_time} ราคาเริ่มต้น ฿${campsite.min_price.toLocaleString()}`;

  const primaryPhoto = campsite.photos.find((p) => p.is_primary) || campsite.photos[0];
  const canonicalUrl = getCampsiteCanonicalUrl(params.id);
  const keywords = generateCampsiteKeywords(campsite);

  return {
    title: campsite.name,
    description,
    keywords,
    openGraph: {
      title: campsite.name,
      description,
      type: 'website',
      locale: 'th_TH',
      siteName: SITE_CONFIG.siteName,
      url: canonicalUrl,
      images: primaryPhoto
        ? [
            {
              url: primaryPhoto.url,
              width: 1200,
              height: 630,
              alt: primaryPhoto.alt_text || campsite.name,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: campsite.name,
      description,
      images: primaryPhoto ? [primaryPhoto.url] : [],
      site: SITE_CONFIG.twitterHandle,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      // Additional meta tags for rich results
      'og:price:amount': campsite.min_price.toString(),
      'og:price:currency': 'THB',
    },
  };
}

export default async function CampsiteDetailPage({ params }: Props) {
  const campsite = await getCampsite(params.id);

  if (!campsite) {
    notFound();
  }

  // Generate breadcrumb data
  const breadcrumbItems = generateCampsiteBreadcrumbs({
    name: campsite.name,
    id: campsite.id,
    province: {
      name_th: campsite.province.name_th,
      slug: campsite.province.slug,
    },
  });

  return (
    <>
      {/* JSON-LD Structured Data */}
      <CampsiteSchema campsite={campsite} />
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* Page Content */}
      <CampsiteDetailContent campsite={campsite} />
    </>
  );
}
