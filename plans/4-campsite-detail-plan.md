# Plan: Campsite Detail Page (Module 4)

## Module Information
- **Module:** 4
- **Name:** Campsite Detail Page
- **Priority:** CRITICAL
- **Sprint:** 2
- **Story Points:** 18 (US-006: 8 + US-007: 5 + US-008: 5)
- **Dependencies:** Module 2, Module 3
- **Related Clarifications:** Q3 (Supabase Storage Transform), Q17 (Skeleton screens)

---

## Overview

Implement comprehensive campsite detail page with:
- Hero section with gallery
- Full campsite information
- Amenities checklist
- Accommodation types and pricing
- Nearby attractions
- Contact section with booking CTA
- SEO optimization

---

## Features

### 4.1 Campsite Detail Page (US-006)
**Priority:** CRITICAL

**Page Structure:**
```
/campsites/[id]/page.tsx

┌────────────────────────────────────────────┐
│  Hero Section (Gallery + Name + Rating)    │
│  [← Gallery] [Name] [Rating] [Wishlist ♡]  │
├────────────────────────────────────────────┤
│  Sticky Header (Mobile: Name + Book Now)   │
├────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐  │
│ │  Main Content    │ │  Sidebar         │  │
│ │  - Description   │ │  - Booking Card  │  │
│ │  - Amenities     │ │  - Contact Info  │  │
│ │  - Accommodations│ │  - Share Buttons │  │
│ │  - Attractions   │ │                  │  │
│ │  - Reviews       │ │                  │  │
│ └──────────────────┘ └──────────────────┘  │
└────────────────────────────────────────────┘
```

**Frontend Components:**
```
src/app/campsites/[id]/
├── page.tsx              # Server component for data fetching
├── loading.tsx           # Skeleton loading state (Q17)
└── not-found.tsx         # 404 page

src/components/campsite/
├── HeroSection.tsx       # Gallery + header
├── CampsiteGallery.tsx   # Photo gallery (US-007)
├── GalleryLightbox.tsx   # Fullscreen modal
├── DescriptionSection.tsx
├── AmenitiesSection.tsx
├── AccommodationSection.tsx  # Pricing cards (US-008)
├── AttractionsSection.tsx
├── ContactSection.tsx
├── BookingSidebar.tsx
├── ShareButtons.tsx
└── StickyHeader.tsx      # Mobile sticky nav
```

**API Response:**
```typescript
// GET /api/campsites/:id
interface CampsiteDetailResponse {
  campsite: {
    id: string;
    name: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    phone: string | null;
    email: string | null;
    website: string | null;
    facebook_url: string | null;
    instagram_url: string | null;
    booking_url: string | null;
    check_in_time: string;
    check_out_time: string;
    min_stay_nights: number;
    max_stay_nights: number | null;
    price_min: number;
    price_max: number;
    rating_average: number;
    review_count: number;
    is_featured: boolean;
    is_verified: boolean;
    province: { name_th: string; name_en: string; slug: string };
    type: { name_th: string; name_en: string; color_hex: string };
    owner: { full_name: string; avatar_url: string | null } | null;
  };
  photos: {
    id: string;
    url: string;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
  }[];
  amenities: {
    id: number;
    name_th: string;
    name_en: string;
    slug: string;
    icon: string;
  }[];
  accommodations: {
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    price_per_night: number;
    price_weekend: number | null;
    amenities_included: string[];
    sort_order: number;
  }[];
  nearbyAttractions: {
    id: string;
    name: string;
    description: string | null;
    distance_km: number;
    category: string;
    difficulty: string | null;
    latitude: number | null;
    longitude: number | null;
  }[];
  reviewSummary: {
    average: number;
    count: number;
    distribution: { rating: number; count: number }[];
    breakdown: {
      cleanliness: number;
      staff: number;
      facilities: number;
      value: number;
    };
  };
}
```

### 4.2 Photo Gallery (US-007)
**Priority:** HIGH

**Gallery Features:**
- Main large image display
- Thumbnail strip (5-8 visible)
- Image counter (e.g., "3/12")
- Navigation arrows
- Lightbox modal on click
- Keyboard navigation (arrows)
- Touch swipe gestures (mobile)
- Lazy loading

**Image Transformation (Q3):**
```typescript
// Using Supabase Storage Transform
const getImageUrl = (path: string, options?: { width: number; height: number }) => {
  if (!options) {
    return supabase.storage.from('campsite-photos').getPublicUrl(path).data.publicUrl;
  }

  return supabase.storage
    .from('campsite-photos')
    .getPublicUrl(path, {
      transform: {
        width: options.width,
        height: options.height,
        resize: 'cover',
      },
    }).data.publicUrl;
};

// Usage
const thumbnailUrl = getImageUrl(photo.url, { width: 300, height: 200 });
const galleryUrl = getImageUrl(photo.url, { width: 800, height: 600 });
const fullUrl = getImageUrl(photo.url, { width: 1920, height: 1080 });
```

**Gallery Component:**
```typescript
// src/components/campsite/CampsiteGallery.tsx
interface GalleryProps {
  photos: Photo[];
}

export function CampsiteGallery({ photos }: GalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const currentPhoto = photos[currentIndex];
  const visibleThumbnails = photos.slice(0, 8);

  return (
    <div className="relative">
      {/* Main Image */}
      <div
        className="relative aspect-[16/9] cursor-pointer"
        onClick={() => setLightboxOpen(true)}
      >
        <Image
          src={getImageUrl(currentPhoto.url, { width: 1200, height: 675 })}
          alt={currentPhoto.alt_text || 'Campsite photo'}
          fill
          className="object-cover rounded-lg"
          priority
        />
        {/* Counter */}
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 mt-4 overflow-x-auto">
        {visibleThumbnails.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'w-20 h-14 rounded overflow-hidden flex-shrink-0',
              index === currentIndex && 'ring-2 ring-primary'
            )}
          >
            <Image
              src={getImageUrl(photo.url, { width: 160, height: 112 })}
              alt=""
              width={80}
              height={56}
              className="object-cover"
            />
          </button>
        ))}
        {photos.length > 8 && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="w-20 h-14 bg-gray-200 rounded flex items-center justify-center"
          >
            +{photos.length - 8}
          </button>
        )}
      </div>

      {/* Lightbox */}
      <GalleryLightbox
        open={lightboxOpen}
        photos={photos}
        initialIndex={currentIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setCurrentIndex}
      />
    </div>
  );
}
```

### 4.3 Accommodation Types & Pricing (US-008)
**Priority:** CRITICAL

**Pricing Display:**
```typescript
// src/components/campsite/AccommodationSection.tsx
interface AccommodationCardProps {
  accommodation: {
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    price_per_night: number;
    price_weekend: number | null;
    amenities_included: string[];
  };
  bookingUrl: string | null;
}

export function AccommodationCard({ accommodation, bookingUrl }: AccommodationCardProps) {
  const { name, description, capacity, price_per_night, price_weekend, amenities_included } = accommodation;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          {description && (
            <p className="text-gray-600 text-sm mt-1">{description}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            ฿{price_per_night.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">/ คืน</div>
          {price_weekend && price_weekend !== price_per_night && (
            <div className="text-sm text-orange-600">
              วันหยุด: ฿{price_weekend.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {capacity} คน
        </span>
      </div>

      {amenities_included.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {amenities_included.map((amenity) => (
            <Badge key={amenity} variant="secondary" className="text-xs">
              {amenity}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-6">
        {bookingUrl ? (
          <Button asChild className="w-full">
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
              จองเลย
            </a>
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            ไม่รับจองออนไลน์
          </Button>
        )}
      </div>
    </Card>
  );
}
```

### 4.4 Skeleton Loading (Q17)
**Priority:** HIGH

```typescript
// src/app/campsites/[id]/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function CampsiteLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero Skeleton */}
      <Skeleton className="w-full aspect-[16/9] rounded-lg" />

      {/* Thumbnails Skeleton */}
      <div className="flex gap-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-20 h-14 rounded" />
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid lg:grid-cols-[1fr_350px] gap-8 mt-8">
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
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
```

---

## Technical Design

### Server Component Data Fetching

```typescript
// src/app/campsites/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createServerSupabase();
  const { data: campsite } = await supabase
    .from('campsites')
    .select('name, description, province:provinces(name_th)')
    .eq('id', params.id)
    .single();

  if (!campsite) return {};

  return {
    title: `${campsite.name} | Camping Thailand`,
    description: campsite.description?.slice(0, 160),
    openGraph: {
      title: campsite.name,
      description: campsite.description || '',
      type: 'website',
    },
  };
}

export default async function CampsiteDetailPage({ params }: Props) {
  const supabase = createServerSupabase();

  const { data: campsite, error } = await supabase
    .from('campsites')
    .select(`
      *,
      province:provinces(*),
      type:campsite_types(*),
      owner:profiles(full_name, avatar_url),
      photos:campsite_photos(id, url, alt_text, is_primary, sort_order),
      amenities:campsite_amenities(amenity:amenities(*)),
      accommodations:accommodation_types(*),
      nearby_attractions(*)
    `)
    .eq('id', params.id)
    .eq('status', 'approved')
    .eq('is_active', true)
    .single();

  if (error || !campsite) {
    notFound();
  }

  // Fetch review summary
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating_overall, rating_cleanliness, rating_staff, rating_facilities, rating_value')
    .eq('campsite_id', params.id)
    .eq('is_hidden', false);

  const reviewSummary = calculateReviewSummary(reviews || []);

  return (
    <article>
      <HeroSection campsite={campsite} photos={campsite.photos} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-12">
            <DescriptionSection description={campsite.description} />
            <AmenitiesSection amenities={campsite.amenities.map(a => a.amenity)} />
            <AccommodationSection
              accommodations={campsite.accommodations}
              bookingUrl={campsite.booking_url}
            />
            <AttractionsSection attractions={campsite.nearby_attractions} />
            <ReviewsSection campsiteId={params.id} summary={reviewSummary} />
          </div>

          <aside className="hidden lg:block">
            <BookingSidebar
              campsite={campsite}
              isSticky
            />
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <MobileBookingBar campsite={campsite} />
    </article>
  );
}
```

### Amenities Section

```typescript
// src/components/campsite/AmenitiesSection.tsx
const ALL_AMENITIES = [
  { slug: 'wifi', name_th: 'WiFi', icon: Wifi },
  { slug: 'electricity', name_th: 'ไฟฟ้า', icon: Zap },
  { slug: 'ac', name_th: 'แอร์', icon: Snowflake },
  { slug: 'hot-water', name_th: 'น้ำอุ่น', icon: Droplet },
  { slug: 'private-bathroom', name_th: 'ห้องน้ำส่วนตัว', icon: Bath },
  { slug: 'restaurant', name_th: 'ร้านอาหาร', icon: Utensils },
  { slug: 'kitchen', name_th: 'ห้องครัว', icon: ChefHat },
  { slug: 'parking', name_th: 'ที่จอดรถ', icon: Car },
];

export function AmenitiesSection({ amenities }: { amenities: Amenity[] }) {
  const availableSlugs = new Set(amenities.map(a => a.slug));

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">สิ่งอำนวยความสะดวก</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ALL_AMENITIES.map(({ slug, name_th, icon: Icon }) => {
          const available = availableSlugs.has(slug);
          return (
            <div
              key={slug}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg',
                available ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-400'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{name_th}</span>
              {available ? (
                <Check className="h-4 w-4 ml-auto" />
              ) : (
                <X className="h-4 w-4 ml-auto" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

---

## Test Cases

### Unit Tests
- [ ] Gallery navigation works correctly
- [ ] Image URL transformation correct
- [ ] Price formatting correct
- [ ] Review summary calculation accurate
- [ ] Metadata generation correct

### Integration Tests
- [ ] Page fetches complete data
- [ ] Not found returned for invalid ID
- [ ] Not found returned for non-approved campsite
- [ ] All sections render with data
- [ ] Empty states handled

### E2E Tests (Playwright)
- [ ] Page loads within 1.5s
- [ ] Gallery navigation works
- [ ] Lightbox opens and closes
- [ ] Keyboard navigation in lightbox
- [ ] Touch swipe in lightbox (mobile)
- [ ] Accommodation cards display pricing
- [ ] Contact section functional
- [ ] Share buttons work
- [ ] External booking link opens new tab
- [ ] Mobile sticky header appears on scroll

---

## Definition of Done

- [ ] Page loads in <1.5s on 4G
- [ ] All sections render correctly
- [ ] Images lazy load as user scrolls
- [ ] Gallery lightbox functional
- [ ] Mobile layout single column
- [ ] Skeleton loading shows during fetch
- [ ] SEO metadata generated
- [ ] External links open in new tab
- [ ] Contact section visible
- [ ] Share functionality works
- [ ] Unit tests >80% coverage
- [ ] E2E tests passing

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Page structure & layout | 3 hours |
| Hero section | 2 hours |
| Photo gallery | 4 hours |
| Gallery lightbox | 3 hours |
| Amenities section | 1 hour |
| Accommodation section | 3 hours |
| Attractions section | 2 hours |
| Booking sidebar | 2 hours |
| Mobile sticky header | 2 hours |
| Skeleton loading | 2 hours |
| SEO metadata | 1 hour |
| Testing | 4 hours |
| **Total** | **~29 hours (4 days)** |
