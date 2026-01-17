# Plan: Wishlist & Compare (Module 7)

## Module Information
- **Module:** 7
- **Name:** Wishlist & Compare
- **Priority:** MEDIUM
- **Sprint:** 3
- **Story Points:** 11 (US-016: 5 + US-017: 6)
- **Dependencies:** Module 1 (Authentication), Module 3 (Search)
- **Related Clarifications:** None

---

## Overview

Implement wishlist functionality:
- Save/unsave campsites with heart icon
- View wishlist page
- Compare 2-3 campsites side-by-side
- Persistent across sessions

---

## Features

### 7.1 Save to Wishlist (US-016)
**Priority:** MEDIUM

**Heart Icon Behavior:**
- Outline (♡) = Not saved
- Filled (❤️) = Saved
- Animated transition on click
- Optimistic update

**Frontend Components:**
```
src/components/wishlist/
├── WishlistButton.tsx         # Heart icon button
├── WishlistPage.tsx           # /wishlist page
├── WishlistGrid.tsx           # Grid of saved camps
├── WishlistCard.tsx           # Card with remove option
├── WishlistEmpty.tsx          # Empty state
└── WishlistCounter.tsx        # Badge in header
```

**Wishlist Button:**
```typescript
// src/components/wishlist/WishlistButton.tsx
interface WishlistButtonProps {
  campsiteId: string;
  initialWishlisted?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function WishlistButton({
  campsiteId,
  initialWishlisted = false,
  size = 'md',
}: WishlistButtonProps) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Show login prompt
      toast({
        title: 'กรุณาเข้าสู่ระบบ',
        description: 'เข้าสู่ระบบเพื่อบันทึกแคมป์ไซต์ที่ชื่นชอบ',
        action: (
          <ToastAction altText="Login" asChild>
            <Link href="/auth/login">เข้าสู่ระบบ</Link>
          </ToastAction>
        ),
      });
      return;
    }

    setIsLoading(true);
    const newState = !isWishlisted;

    // Optimistic update
    setIsWishlisted(newState);

    try {
      if (newState) {
        await addToWishlist(campsiteId);
        toast.success('บันทึกแล้ว');
      } else {
        await removeFromWishlist(campsiteId);
        toast.success('นำออกจากรายการแล้ว');
      }
    } catch (error) {
      // Revert on error
      setIsWishlisted(!newState);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'rounded-full flex items-center justify-center transition-all',
        sizeClasses[size],
        isWishlisted ? 'bg-red-100' : 'bg-white/80 hover:bg-white'
      )}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={cn(
          'transition-all',
          size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
          isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600',
          isLoading && 'animate-pulse'
        )}
      />
    </button>
  );
}
```

### 7.2 Wishlist Page
**Priority:** MEDIUM

```typescript
// src/app/wishlist/page.tsx
'use client';

import { useWishlist } from '@/hooks/useWishlist';
import { WishlistGrid } from '@/components/wishlist/WishlistGrid';
import { WishlistEmpty } from '@/components/wishlist/WishlistEmpty';
import { WishlistCompareBar } from '@/components/wishlist/WishlistCompareBar';

export default function WishlistPage() {
  const { wishlist, isLoading, removeItem } = useWishlist();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (newSelected.size >= 3) {
        toast.warning('สามารถเปรียบเทียบได้สูงสุด 3 แคมป์ไซต์');
        return;
      }
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  if (isLoading) {
    return <WishlistSkeleton />;
  }

  if (wishlist.length === 0) {
    return <WishlistEmpty />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">รายการที่บันทึก ({wishlist.length})</h1>
        <SortSelect />
      </div>

      <WishlistGrid
        items={wishlist}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onRemove={removeItem}
      />

      {selectedIds.size >= 2 && (
        <WishlistCompareBar
          count={selectedIds.size}
          onCompare={() => {
            const ids = Array.from(selectedIds).join(',');
            router.push(`/compare?ids=${ids}`);
          }}
          onClear={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  );
}
```

### 7.3 Compare Campsites (US-017)
**Priority:** MEDIUM

**Comparison Table:**
```typescript
// src/app/compare/page.tsx
interface ComparePageProps {
  searchParams: { ids: string };
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const ids = searchParams.ids?.split(',').filter(Boolean) || [];

  if (ids.length < 2) {
    redirect('/wishlist');
  }

  if (ids.length > 3) {
    ids.splice(3);
  }

  const campsites = await fetchCampsitesForComparison(ids);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">เปรียบเทียบแคมป์ไซต์</h1>

      {/* Desktop: Table view */}
      <div className="hidden md:block overflow-x-auto">
        <ComparisonTable campsites={campsites} />
      </div>

      {/* Mobile: Card/Tab view */}
      <div className="md:hidden">
        <ComparisonCards campsites={campsites} />
      </div>
    </div>
  );
}
```

**Comparison Table Component:**
```typescript
// src/components/compare/ComparisonTable.tsx
const COMPARISON_ROWS = [
  { key: 'type', label: 'ประเภท', render: (c) => c.type.name_th },
  { key: 'province', label: 'จังหวัด', render: (c) => c.province.name_th },
  { key: 'price', label: 'ราคา', render: (c) => `฿${c.price_min.toLocaleString()} - ฿${c.price_max.toLocaleString()}` },
  { key: 'rating', label: 'คะแนน', render: (c) => `${c.rating_average.toFixed(1)} (${c.review_count} รีวิว)` },
  { key: 'checkin', label: 'เช็คอิน', render: (c) => c.check_in_time },
  { key: 'checkout', label: 'เช็คเอาท์', render: (c) => c.check_out_time },
];

const AMENITY_SLUGS = ['wifi', 'electricity', 'ac', 'hot-water', 'private-bathroom', 'restaurant', 'kitchen', 'parking'];

export function ComparisonTable({ campsites }: { campsites: CampsiteDetail[] }) {
  return (
    <table className="w-full border-collapse">
      {/* Header with campsite images and names */}
      <thead>
        <tr>
          <th className="p-4 bg-gray-50"></th>
          {campsites.map((c) => (
            <th key={c.id} className="p-4 bg-gray-50 min-w-[250px]">
              <div className="space-y-2">
                <Image
                  src={c.primary_photo || '/placeholder.jpg'}
                  alt={c.name}
                  width={200}
                  height={133}
                  className="rounded-lg object-cover mx-auto"
                />
                <h3 className="font-semibold">{c.name}</h3>
              </div>
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {/* Basic info rows */}
        {COMPARISON_ROWS.map(({ key, label, render }) => (
          <tr key={key} className="border-t">
            <td className="p-4 font-medium bg-gray-50">{label}</td>
            {campsites.map((c) => (
              <td key={c.id} className="p-4 text-center">
                {render(c)}
              </td>
            ))}
          </tr>
        ))}

        {/* Amenities rows */}
        <tr className="border-t">
          <td colSpan={campsites.length + 1} className="p-4 font-medium bg-gray-100">
            สิ่งอำนวยความสะดวก
          </td>
        </tr>
        {AMENITY_SLUGS.map((slug) => {
          const amenity = AMENITIES_MAP[slug];
          return (
            <tr key={slug} className="border-t">
              <td className="p-4 bg-gray-50">{amenity.name_th}</td>
              {campsites.map((c) => {
                const hasAmenity = c.amenities.some((a) => a.slug === slug);
                return (
                  <td key={c.id} className="p-4 text-center">
                    {hasAmenity ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}

        {/* Actions row */}
        <tr className="border-t">
          <td className="p-4 bg-gray-50"></td>
          {campsites.map((c) => (
            <td key={c.id} className="p-4 text-center">
              <Button asChild className="w-full">
                <Link href={`/campsites/${c.id}`}>ดูรายละเอียด</Link>
              </Button>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
```

**Mobile Comparison (Tab-based):**
```typescript
// src/components/compare/ComparisonCards.tsx
export function ComparisonCards({ campsites }: { campsites: CampsiteDetail[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCampsite = campsites[activeIndex];

  return (
    <div className="space-y-4">
      {/* Tab buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {campsites.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActiveIndex(i)}
            className={cn(
              'px-4 py-2 rounded-full whitespace-nowrap',
              i === activeIndex ? 'bg-primary text-white' : 'bg-gray-100'
            )}
          >
            {c.name.slice(0, 15)}...
          </button>
        ))}
      </div>

      {/* Active campsite card */}
      <Card className="p-6">
        <Image
          src={activeCampsite.primary_photo || '/placeholder.jpg'}
          alt={activeCampsite.name}
          width={400}
          height={266}
          className="rounded-lg object-cover w-full"
        />

        <h2 className="text-xl font-bold mt-4">{activeCampsite.name}</h2>

        <dl className="mt-4 space-y-3">
          {COMPARISON_ROWS.map(({ key, label, render }) => (
            <div key={key} className="flex justify-between">
              <dt className="text-gray-500">{label}</dt>
              <dd className="font-medium">{render(activeCampsite)}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6">
          <h3 className="font-medium mb-2">สิ่งอำนวยความสะดวก</h3>
          <div className="flex flex-wrap gap-2">
            {activeCampsite.amenities.map((a) => (
              <Badge key={a.slug} variant="secondary">
                {a.name_th}
              </Badge>
            ))}
          </div>
        </div>

        <Button asChild className="w-full mt-6">
          <Link href={`/campsites/${activeCampsite.id}`}>ดูรายละเอียด</Link>
        </Button>
      </Card>
    </div>
  );
}
```

---

## Technical Design

### API Endpoints

```typescript
// GET /api/wishlist
// Returns user's wishlist
interface WishlistResponse {
  items: {
    id: string;
    campsite_id: string;
    created_at: string;
    campsite: CampsiteCard;
  }[];
}

// POST /api/wishlist
// Add to wishlist
interface AddWishlistDto {
  campsite_id: string;
}

// DELETE /api/wishlist/:campsiteId
// Remove from wishlist

// GET /api/campsites/compare?ids=id1,id2,id3
// Get campsite details for comparison
interface CompareResponse {
  campsites: CampsiteDetail[];
}
```

### Wishlist Hook

```typescript
// src/hooks/useWishlist.ts
export function useWishlist() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch wishlist on mount
  useEffect(() => {
    if (!user) {
      setWishlist([]);
      setWishlistIds(new Set());
      setIsLoading(false);
      return;
    }

    fetchWishlist().then((items) => {
      setWishlist(items);
      setWishlistIds(new Set(items.map((i) => i.campsite_id)));
      setIsLoading(false);
    });
  }, [user]);

  const isInWishlist = (campsiteId: string) => wishlistIds.has(campsiteId);

  const addItem = async (campsiteId: string) => {
    await addToWishlist(campsiteId);
    setWishlistIds((prev) => new Set(prev).add(campsiteId));
    // Optionally refetch full list
  };

  const removeItem = async (campsiteId: string) => {
    await removeFromWishlist(campsiteId);
    setWishlistIds((prev) => {
      const next = new Set(prev);
      next.delete(campsiteId);
      return next;
    });
    setWishlist((prev) => prev.filter((i) => i.campsite_id !== campsiteId));
  };

  return {
    wishlist,
    wishlistIds,
    isLoading,
    isInWishlist,
    addItem,
    removeItem,
    count: wishlistIds.size,
  };
}
```

### Wishlist Counter in Header

```typescript
// src/components/layout/Header.tsx
export function Header() {
  const { count } = useWishlist();

  return (
    <header>
      {/* ... */}
      <Link href="/wishlist" className="relative">
        <Heart className="h-6 w-6" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </Link>
      {/* ... */}
    </header>
  );
}
```

---

## Test Cases

### Unit Tests
- [ ] Wishlist button toggles state
- [ ] Optimistic update works
- [ ] Max 3 comparison enforced
- [ ] Comparison table renders correctly

### Integration Tests
- [ ] Wishlist persists after refresh
- [ ] Adding/removing updates database
- [ ] Comparison fetches all data
- [ ] Non-logged-in user sees login prompt

### E2E Tests (Playwright)
- [ ] Heart icon animates on click
- [ ] Wishlist counter updates
- [ ] Wishlist page shows saved items
- [ ] Remove from wishlist works
- [ ] Compare selection works
- [ ] Compare page displays table
- [ ] Mobile compare uses tabs
- [ ] Share comparison URL works

---

## Definition of Done

- [ ] Heart icon on all campsite cards
- [ ] Wishlist syncs across pages
- [ ] Wishlist persists across sessions
- [ ] Wishlist page functional
- [ ] Compare selection (max 3)
- [ ] Comparison table displays correctly
- [ ] Mobile comparison readable
- [ ] Login prompt for non-authenticated
- [ ] Unit tests >80% coverage
- [ ] E2E tests passing

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Wishlist button | 2 hours |
| Wishlist API | 2 hours |
| Wishlist hook | 2 hours |
| Wishlist page | 3 hours |
| Compare selection | 2 hours |
| Comparison table | 4 hours |
| Mobile comparison | 2 hours |
| Header counter | 1 hour |
| Testing | 3 hours |
| **Total** | **~21 hours (3 days)** |
