# Plan: Search & Discovery (Module 3)

## Module Information
- **Module:** 3
- **Name:** Search & Discovery
- **Priority:** CRITICAL
- **Sprint:** 1-2
- **Story Points:** 17 (US-001: 5 + US-002: 3 + US-003: 4 + US-004: 5)
- **Dependencies:** Module 0, Module 2
- **Related Clarifications:** Q7 (Simple text match), Q8 (Admin approval - only show approved)

---

## Overview

Implement comprehensive search and filtering system:
- Location search with province autocomplete
- Multi-select type filter
- Price range slider
- Amenities filter (AND logic)
- Only show `status = 'approved'` campsites (Q8)
- Simple text match search (Q7)

---

## Features

### 3.1 Search by Location (US-001)
**Priority:** CRITICAL

**Flow:**
1. User types in search field
2. Autocomplete shows matching provinces
3. User selects province
4. Results filter to that province
5. Map centers on province coordinates

**Frontend Components:**
```
src/components/search/
├── SearchBar.tsx              # Main search input
├── ProvinceAutocomplete.tsx   # Province suggestions
├── SearchResults.tsx          # Results container
├── CampsiteCard.tsx           # Result card
└── Pagination.tsx             # Page navigation
```

**API:**
```typescript
// GET /api/provinces/autocomplete?q=Chi
interface ProvinceAutocompleteResponse {
  provinces: {
    id: number;
    name_th: string;
    name_en: string;
    slug: string;
    latitude: number;
    longitude: number;
  }[];
}

// Search query includes province filter
// GET /api/search?province=chiang-mai
```

**SQL Query:**
```sql
-- Province autocomplete (simple text match - Q7)
SELECT id, name_th, name_en, slug, latitude, longitude
FROM provinces
WHERE name_th ILIKE $1 || '%'
   OR name_en ILIKE $1 || '%'
ORDER BY name_en
LIMIT 10;
```

### 3.2 Filter by Type (US-002)
**Priority:** CRITICAL

**Frontend Component:**
```typescript
// src/components/search/TypeFilter.tsx
interface TypeFilterProps {
  selected: string[];
  onChange: (types: string[]) => void;
}

const CAMPSITE_TYPES = [
  { slug: 'camping', name_th: 'แคมป์ปิ้ง', name_en: 'Camping', color: '#FF4444' },
  { slug: 'glamping', name_th: 'แกลมปิ้ง', name_en: 'Glamping', color: '#44FF44' },
  { slug: 'tented-resort', name_th: 'รีสอร์ทเต็นท์', name_en: 'Tented Resort', color: '#FF8844' },
  { slug: 'bungalow', name_th: 'บังกะโล', name_en: 'Bungalow', color: '#FFFF44' },
];
```

**URL State:**
```
/search?types=glamping,tented-resort
```

### 3.3 Filter by Price (US-003)
**Priority:** CRITICAL

**Frontend Component:**
```typescript
// src/components/search/PriceFilter.tsx
interface PriceFilterProps {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

// Use shadcn/ui Slider with dual handles
// Range: ฿0 - ฿10,000
// Default: Full range
```

**Validation:**
```typescript
// packages/shared/src/schemas/search.ts
export const priceFilterSchema = z.object({
  priceMin: z.coerce.number().min(0).default(0),
  priceMax: z.coerce.number().max(10000).default(10000),
}).refine((data) => data.priceMin <= data.priceMax, {
  message: 'Minimum price cannot exceed maximum',
});
```

### 3.4 Filter by Amenities (US-004)
**Priority:** CRITICAL

**Frontend Component:**
```typescript
// src/components/search/AmenitiesFilter.tsx
const AMENITIES = [
  { slug: 'wifi', name_th: 'WiFi', icon: 'wifi' },
  { slug: 'electricity', name_th: 'ไฟฟ้า', icon: 'zap' },
  { slug: 'ac', name_th: 'แอร์', icon: 'snowflake' },
  { slug: 'hot-water', name_th: 'น้ำอุ่น', icon: 'droplet' },
  { slug: 'private-bathroom', name_th: 'ห้องน้ำส่วนตัว', icon: 'bath' },
  { slug: 'restaurant', name_th: 'ร้านอาหาร', icon: 'utensils' },
  { slug: 'kitchen', name_th: 'ห้องครัว', icon: 'chef-hat' },
  { slug: 'parking', name_th: 'ที่จอดรถ', icon: 'car' },
];
```

**AND Logic:**
```sql
-- User selects WiFi + AC
-- Query finds campsites with BOTH
SELECT c.* FROM campsites c
WHERE c.status = 'approved'  -- Q8
  AND c.is_active = true
  AND EXISTS (
    SELECT 1 FROM campsite_amenities ca
    JOIN amenities a ON ca.amenity_id = a.id
    WHERE ca.campsite_id = c.id AND a.slug = 'wifi'
  )
  AND EXISTS (
    SELECT 1 FROM campsite_amenities ca
    JOIN amenities a ON ca.amenity_id = a.id
    WHERE ca.campsite_id = c.id AND a.slug = 'ac'
  );
```

### 3.5 Search Results Display
**Priority:** CRITICAL

**CampsiteCard Component:**
```typescript
// src/components/search/CampsiteCard.tsx
interface CampsiteCardProps {
  campsite: {
    id: string;
    name: string;
    description: string | null;
    price_min: number;
    price_max: number;
    rating_average: number;
    review_count: number;
    province: { name_th: string; slug: string };
    type: { name_th: string; slug: string; color_hex: string };
    primary_photo: string | null;
    amenities: string[];
  };
  isWishlisted?: boolean;
  onWishlistToggle?: () => void;
}
```

**Layout:**
- Desktop: 3-column grid
- Tablet: 2-column grid
- Mobile: 1-column list

**Sort Options:**
```typescript
const SORT_OPTIONS = [
  { value: 'rating', label: 'คะแนนสูงสุด' },      // Highest Rating
  { value: 'price_asc', label: 'ราคาต่ำ-สูง' },   // Price Low-High
  { value: 'price_desc', label: 'ราคาสูง-ต่ำ' },  // Price High-Low
  { value: 'newest', label: 'ใหม่ล่าสุด' },       // Newest
];
```

---

## Technical Design

### Search API Implementation

```typescript
// apps/campsite-backend/src/services/searchService.ts
import { supabaseAdmin } from '../utils/supabase';

interface SearchParams {
  q?: string;
  province?: string;
  types?: string[];
  priceMin?: number;
  priceMax?: number;
  amenities?: string[];
  sort: 'rating' | 'price_asc' | 'price_desc' | 'newest';
  page: number;
  limit: number;
}

export async function searchCampsites(params: SearchParams) {
  const { q, province, types, priceMin, priceMax, amenities, sort, page, limit } = params;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('campsites')
    .select(`
      id, name, description, price_min, price_max,
      rating_average, review_count,
      province:provinces(name_th, name_en, slug),
      type:campsite_types(name_th, name_en, slug, color_hex),
      photos:campsite_photos(url, is_primary),
      amenity_ids:campsite_amenities(amenity_id)
    `, { count: 'exact' })
    .eq('status', 'approved')  // Q8: Only approved
    .eq('is_active', true);

  // Text search (Q7: Simple text match)
  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  // Province filter
  if (province) {
    const { data: prov } = await supabaseAdmin
      .from('provinces')
      .select('id')
      .eq('slug', province)
      .single();
    if (prov) {
      query = query.eq('province_id', prov.id);
    }
  }

  // Type filter
  if (types && types.length > 0) {
    const { data: typeIds } = await supabaseAdmin
      .from('campsite_types')
      .select('id')
      .in('slug', types);
    if (typeIds) {
      query = query.in('type_id', typeIds.map(t => t.id));
    }
  }

  // Price filter
  if (priceMin !== undefined) {
    query = query.gte('price_min', priceMin);
  }
  if (priceMax !== undefined) {
    query = query.lte('price_max', priceMax);
  }

  // Sorting
  switch (sort) {
    case 'rating':
      query = query.order('rating_average', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('price_min', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_max', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) throw error;

  // Filter by amenities (AND logic) - post-query
  // Because Supabase doesn't support complex join conditions
  let filteredData = data;
  if (amenities && amenities.length > 0) {
    const { data: amenityIds } = await supabaseAdmin
      .from('amenities')
      .select('id')
      .in('slug', amenities);

    const requiredIds = new Set(amenityIds?.map(a => a.id) || []);

    filteredData = data?.filter(campsite => {
      const campsiteAmenityIds = new Set(campsite.amenity_ids?.map(a => a.amenity_id));
      return [...requiredIds].every(id => campsiteAmenityIds.has(id));
    });
  }

  return {
    data: filteredData,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}
```

### Frontend State Management

```typescript
// src/hooks/useSearch.ts
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

export function useSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    province: searchParams.get('province') || '',
    types: searchParams.get('types')?.split(',').filter(Boolean) || [],
    priceMin: Number(searchParams.get('priceMin')) || 0,
    priceMax: Number(searchParams.get('priceMax')) || 10000,
    amenities: searchParams.get('amenities')?.split(',').filter(Boolean) || [],
    sort: (searchParams.get('sort') as SortOption) || 'rating',
    page: Number(searchParams.get('page')) || 1,
  });

  // Update URL when filters change
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters, page: 1 };
    setFilters(updated);

    const params = new URLSearchParams();
    if (updated.q) params.set('q', updated.q);
    if (updated.province) params.set('province', updated.province);
    if (updated.types.length) params.set('types', updated.types.join(','));
    if (updated.priceMin > 0) params.set('priceMin', String(updated.priceMin));
    if (updated.priceMax < 10000) params.set('priceMax', String(updated.priceMax));
    if (updated.amenities.length) params.set('amenities', updated.amenities.join(','));
    if (updated.sort !== 'rating') params.set('sort', updated.sort);

    router.push(`/search?${params.toString()}`);
  }, [filters, router]);

  return { filters, updateFilters, setFilters };
}
```

### Search Page Component

```typescript
// src/app/search/page.tsx
'use client';

import { Suspense } from 'react';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterSidebar } from '@/components/search/FilterSidebar';
import { SearchResults } from '@/components/search/SearchResults';
import { MapToggle } from '@/components/search/MapToggle';
import { useSearch } from '@/hooks/useSearch';
import { useCampsites } from '@/hooks/useCampsites';
import { CampsiteCardSkeleton } from '@/components/skeletons/CampsiteCardSkeleton';

export default function SearchPage() {
  const { filters, updateFilters } = useSearch();
  const { data, isLoading } = useCampsites(filters);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search Header */}
      <div className="mb-6">
        <SearchBar
          value={filters.q}
          onSearch={(q) => updateFilters({ q })}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar (desktop) */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <FilterSidebar filters={filters} onChange={updateFilters} />
        </aside>

        {/* Results Area */}
        <main className="flex-1">
          {/* Results Header */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">
              พบ {data?.pagination.total || 0} แคมป์ไซต์
            </span>
            <div className="flex items-center gap-4">
              <SortSelect value={filters.sort} onChange={(sort) => updateFilters({ sort })} />
              <MapToggle />
            </div>
          </div>

          {/* Results Grid */}
          <Suspense fallback={<CampsiteCardSkeleton count={6} />}>
            {isLoading ? (
              <CampsiteCardSkeleton count={6} />
            ) : (
              <SearchResults data={data?.data || []} />
            )}
          </Suspense>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <Pagination
              current={filters.page}
              total={data.pagination.totalPages}
              onChange={(page) => updateFilters({ page })}
            />
          )}
        </main>
      </div>
    </div>
  );
}
```

---

## Test Cases

### Unit Tests
- [ ] Search query schema validates correctly
- [ ] Price filter validates min <= max
- [ ] Amenities filter applies AND logic
- [ ] Sort options map to correct queries

### Integration Tests
- [ ] Province autocomplete returns suggestions
- [ ] Search returns only approved campsites
- [ ] All filters combine correctly
- [ ] Pagination returns correct subset
- [ ] Empty results handled gracefully

### E2E Tests (Playwright)
- [ ] User can search by province name
- [ ] Autocomplete shows matching provinces
- [ ] Type filter updates results
- [ ] Price slider filters results
- [ ] Amenities filter applies AND logic
- [ ] Sort changes result order
- [ ] Pagination works
- [ ] URL reflects filter state
- [ ] Shared URL loads same filters
- [ ] Mobile filter modal works

---

## Definition of Done

- [ ] Autocomplete works for all 77 provinces
- [ ] Search returns results in <500ms
- [ ] All filters work independently
- [ ] All filters combine correctly
- [ ] Results update in real-time (<300ms)
- [ ] URL parameters reflect filters
- [ ] Clear filters button works
- [ ] Mobile responsive layout
- [ ] Skeleton screens during loading (Q17)
- [ ] Unit tests >80% coverage
- [ ] E2E tests passing

---

## Performance Considerations

1. **Debounce search input:** 300ms delay before API call
2. **Memoize filter computations:** Prevent unnecessary re-renders
3. **Virtualized list for mobile:** Handle large result sets
4. **Image lazy loading:** Load images as they scroll into view
5. **Cache province list:** Static data, cache indefinitely
6. **Database indexes:** Already created in DATABASE-SCHEMA.md

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Search API implementation | 4 hours |
| Province autocomplete | 2 hours |
| Type filter component | 2 hours |
| Price slider component | 2 hours |
| Amenities filter component | 2 hours |
| Search results grid | 3 hours |
| URL state sync | 2 hours |
| Sorting & pagination | 2 hours |
| Mobile responsive | 3 hours |
| Testing | 4 hours |
| **Total** | **~26 hours (3-4 days)** |
