# Plan: Reviews System (Module 5)

## Module Information
- **Module:** 5
- **Name:** Reviews System
- **Priority:** HIGH
- **Sprint:** 2-3
- **Story Points:** 15 (US-009: 7 + US-010: 8)
- **Dependencies:** Module 1 (Authentication), Module 4 (Campsite Detail)
- **Related Clarifications:** Q11 (Auto-approve, report to remove)

---

## Overview

Implement review system with:
- View reviews with ratings breakdown
- Submit reviews (authenticated users only)
- **Auto-approve reviews** - reviews show immediately (Q11)
- Report-based moderation - users can report, admin can hide
- Helpful voting system

---

## Features

### 5.1 View Reviews & Ratings (US-009)
**Priority:** HIGH

**Review Summary Display:**
```typescript
interface ReviewSummary {
  average: number;              // e.g., 4.5
  count: number;                // e.g., 24
  distribution: {
    rating: number;             // 1-5
    count: number;
    percentage: number;
  }[];
  breakdown: {
    cleanliness: number;
    staff: number;
    facilities: number;
    value: number;
  };
}
```

**Frontend Components:**
```
src/components/reviews/
├── ReviewsSection.tsx          # Main reviews section
├── ReviewSummary.tsx           # Overall rating + breakdown
├── RatingBreakdown.tsx         # Bar chart for distribution
├── ReviewList.tsx              # List of reviews
├── ReviewCard.tsx              # Individual review
├── ReviewPhotos.tsx            # Photos in review
├── HelpfulButton.tsx           # Upvote button
├── ReviewFilters.tsx           # Sort + filter controls
├── ReportReviewDialog.tsx      # Report modal
└── WriteReviewForm.tsx         # Submit review form
```

**Review Card Display:**
```typescript
// src/components/reviews/ReviewCard.tsx
interface ReviewCardProps {
  review: {
    id: string;
    rating_overall: number;
    rating_cleanliness: number | null;
    rating_staff: number | null;
    rating_facilities: number | null;
    rating_value: number | null;
    reviewer_type: ReviewerType;
    title: string | null;
    content: string;
    helpful_count: number;
    visited_at: string | null;
    created_at: string;
    user: {
      full_name: string;
      avatar_url: string | null;
    };
    photos: { url: string }[];
  };
  currentUserId?: string;
  hasVoted?: boolean;
}

export function ReviewCard({ review, currentUserId, hasVoted }: ReviewCardProps) {
  return (
    <Card className="p-6">
      {/* Header: User info + Rating */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={review.user.avatar_url || undefined} />
            <AvatarFallback>{review.user.full_name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{review.user.full_name}</div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Badge variant="outline">{REVIEWER_TYPE_LABELS[review.reviewer_type]}</Badge>
              <span>{formatRelativeTime(review.created_at)}</span>
            </div>
          </div>
        </div>
        <StarRating value={review.rating_overall} />
      </div>

      {/* Review Content */}
      {review.title && <h4 className="font-semibold mt-4">{review.title}</h4>}
      <p className="mt-2 text-gray-700">{review.content}</p>

      {/* Photos */}
      {review.photos.length > 0 && (
        <div className="flex gap-2 mt-4">
          {review.photos.map((photo, i) => (
            <Image
              key={i}
              src={photo.url}
              alt=""
              width={80}
              height={80}
              className="rounded object-cover"
            />
          ))}
        </div>
      )}

      {/* Actions: Helpful + Report */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <HelpfulButton
          reviewId={review.id}
          count={review.helpful_count}
          hasVoted={hasVoted}
          disabled={!currentUserId}
        />
        {currentUserId && currentUserId !== review.user_id && (
          <ReportButton reviewId={review.id} />
        )}
      </div>
    </Card>
  );
}
```

**Sort & Filter Options:**
```typescript
const SORT_OPTIONS = [
  { value: 'newest', label: 'ล่าสุด' },
  { value: 'helpful', label: 'มีประโยชน์ที่สุด' },
  { value: 'rating_high', label: 'คะแนนสูง-ต่ำ' },
  { value: 'rating_low', label: 'คะแนนต่ำ-สูง' },
];

const REVIEWER_TYPE_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'family', label: 'ครอบครัว' },
  { value: 'couple', label: 'คู่รัก' },
  { value: 'solo', label: 'เดินทางคนเดียว' },
  { value: 'group', label: 'กลุ่มเพื่อน' },
];
```

### 5.2 Submit Review (US-010)
**Priority:** HIGH

**Review Form:**
```typescript
// src/components/reviews/WriteReviewForm.tsx
interface ReviewFormData {
  rating_overall: number;        // 1-5, required
  rating_cleanliness?: number;   // 1-5, optional
  rating_staff?: number;         // 1-5, optional
  rating_facilities?: number;    // 1-5, optional
  rating_value?: number;         // 1-5, optional
  reviewer_type: ReviewerType;   // required
  title?: string;                // max 100 chars
  content: string;               // 20-500 chars, required
  visited_at?: string;           // date
  photos?: File[];               // max 5, max 5MB each
}

export function WriteReviewForm({ campsiteId, onSuccess }: WriteReviewFormProps) {
  const { user, profile } = useAuth();
  const [ratings, setRatings] = useState<Partial<ReviewFormData>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      content: '',
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      // Upload photos first
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const url = await uploadReviewPhoto(photo);
        photoUrls.push(url);
      }

      // Submit review
      await createReview({
        campsite_id: campsiteId,
        ...data,
        photos: photoUrls,
      });

      toast.success('รีวิวของคุณถูกเผยแพร่แล้ว');
      onSuccess?.();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card className="p-6 text-center">
        <p className="mb-4">กรุณาเข้าสู่ระบบเพื่อเขียนรีวิว</p>
        <Button asChild>
          <Link href="/auth/login">เข้าสู่ระบบ</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Overall Rating */}
        <FormField
          control={form.control}
          name="rating_overall"
          render={({ field }) => (
            <FormItem>
              <FormLabel>คะแนนรวม *</FormLabel>
              <StarRatingInput
                value={field.value}
                onChange={field.onChange}
                size="lg"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sub-ratings (optional) */}
        <div className="grid grid-cols-2 gap-4">
          {['cleanliness', 'staff', 'facilities', 'value'].map((key) => (
            <FormField
              key={key}
              control={form.control}
              name={`rating_${key}` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{RATING_LABELS[key]}</FormLabel>
                  <StarRatingInput value={field.value} onChange={field.onChange} />
                </FormItem>
              )}
            />
          ))}
        </div>

        {/* Reviewer Type */}
        <FormField
          control={form.control}
          name="reviewer_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ประเภทการเดินทาง *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  {REVIEWER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>หัวข้อรีวิว</FormLabel>
              <Input {...field} maxLength={100} placeholder="สรุปประสบการณ์ของคุณ" />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>รีวิว * (20-500 ตัวอักษร)</FormLabel>
              <Textarea
                {...field}
                minLength={20}
                maxLength={500}
                rows={4}
                placeholder="เล่าประสบการณ์ของคุณ..."
              />
              <div className="text-sm text-gray-500 text-right">
                {field.value?.length || 0}/500
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Photos */}
        <FormItem>
          <FormLabel>รูปภาพ (สูงสุด 5 รูป)</FormLabel>
          <PhotoUploader
            photos={photos}
            onChange={setPhotos}
            maxPhotos={5}
            maxSize={5 * 1024 * 1024}
          />
        </FormItem>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
        </Button>
      </form>
    </Form>
  );
}
```

### 5.3 Auto-Approve & Report System (Q11)
**Priority:** CRITICAL

**Key Points from Q11:**
- Reviews show immediately after submission (no pending status)
- Users can report inappropriate reviews
- Admin can hide reported reviews
- Hidden reviews excluded from rating calculation

**Database Schema (already in DATABASE-SCHEMA.md):**
```sql
-- Reviews table uses report-based moderation
CREATE TABLE reviews (
    -- ... other fields
    is_reported BOOLEAN DEFAULT FALSE,
    report_count INT DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    -- No status column!
);
```

**Report Flow:**
```typescript
// POST /api/reviews/:id/report
interface ReportReviewDto {
  reason: 'spam' | 'inappropriate' | 'fake' | 'other';
  details?: string;
}

// Backend handler
async function reportReview(reviewId: string, userId: string, reason: string) {
  await supabase.rpc('report_review', {
    p_review_id: reviewId,
    p_reporter_id: userId,
    p_reason: reason,
  });

  // Optionally notify admin if report_count exceeds threshold
}

// Database function
CREATE OR REPLACE FUNCTION report_review(
  p_review_id UUID,
  p_reporter_id UUID,
  p_reason TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update review report status
  UPDATE reviews
  SET
    is_reported = TRUE,
    report_count = report_count + 1
  WHERE id = p_review_id;

  -- Log the report
  INSERT INTO review_reports (review_id, reporter_id, reason, created_at)
  VALUES (p_review_id, p_reporter_id, p_reason, NOW());
END;
$$ LANGUAGE plpgsql;
```

**Admin Moderation (in Admin Dashboard):**
```typescript
// GET /api/admin/reviews/reported
// Returns reviews where is_reported = true

// PATCH /api/admin/reviews/:id/hide
// Sets is_hidden = true

// PATCH /api/admin/reviews/:id/unhide
// Sets is_hidden = false
```

### 5.4 Helpful Voting
**Priority:** MEDIUM

**Vote Handler:**
```typescript
// src/components/reviews/HelpfulButton.tsx
export function HelpfulButton({ reviewId, count, hasVoted, disabled }: HelpfulButtonProps) {
  const [optimisticCount, setOptimisticCount] = useState(count);
  const [optimisticVoted, setOptimisticVoted] = useState(hasVoted);

  const handleClick = async () => {
    if (disabled) return;

    // Optimistic update
    setOptimisticVoted(!optimisticVoted);
    setOptimisticCount(optimisticVoted ? optimisticCount - 1 : optimisticCount + 1);

    try {
      if (optimisticVoted) {
        await removeHelpfulVote(reviewId);
      } else {
        await addHelpfulVote(reviewId);
      }
    } catch (error) {
      // Revert on error
      setOptimisticVoted(hasVoted);
      setOptimisticCount(count);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className={cn(optimisticVoted && 'text-primary')}
    >
      <ThumbsUp className="h-4 w-4 mr-1" />
      มีประโยชน์ ({optimisticCount})
    </Button>
  );
}
```

---

## Technical Design

### API Endpoints

```typescript
// GET /api/campsites/:id/reviews
interface ReviewsQuery {
  sort?: 'newest' | 'helpful' | 'rating_high' | 'rating_low';
  reviewer_type?: ReviewerType;
  page?: number;
  limit?: number;  // default 5
}

interface ReviewsResponse {
  reviews: Review[];
  pagination: Pagination;
}

// POST /api/campsites/:id/reviews (authenticated)
// Creates review - auto-approved

// POST /api/reviews/:id/helpful (authenticated)
// Toggle helpful vote

// POST /api/reviews/:id/report (authenticated)
// Report review

// DELETE /api/reviews/:id (review owner only)
// Delete own review
```

### Zod Schemas

```typescript
// packages/shared/src/schemas/review.ts
export const createReviewSchema = z.object({
  rating_overall: z.number().int().min(1).max(5),
  rating_cleanliness: z.number().int().min(1).max(5).optional(),
  rating_staff: z.number().int().min(1).max(5).optional(),
  rating_facilities: z.number().int().min(1).max(5).optional(),
  rating_value: z.number().int().min(1).max(5).optional(),
  reviewer_type: z.enum(['family', 'couple', 'solo', 'group']),
  title: z.string().max(100).optional(),
  content: z.string().min(20, 'รีวิวต้องมีอย่างน้อย 20 ตัวอักษร').max(500),
  visited_at: z.string().optional(),
});

export const reportReviewSchema = z.object({
  reason: z.enum(['spam', 'inappropriate', 'fake', 'other']),
  details: z.string().max(500).optional(),
});
```

### Rating Calculation Trigger (from DATABASE-SCHEMA.md)

```sql
-- Recalculate on INSERT or UPDATE of is_hidden
CREATE OR REPLACE FUNCTION update_campsite_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE campsites SET
        rating_average = (
            SELECT ROUND(AVG(rating_overall)::numeric, 1)
            FROM reviews
            WHERE campsite_id = NEW.campsite_id AND is_hidden = FALSE
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE campsite_id = NEW.campsite_id AND is_hidden = FALSE
        ),
        updated_at = NOW()
    WHERE id = NEW.campsite_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_change
    AFTER INSERT OR UPDATE OF is_hidden ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_campsite_rating();
```

---

## Test Cases

### Unit Tests
- [ ] Review form schema validates correctly
- [ ] Rating validation 1-5 only
- [ ] Content length validation (20-500)
- [ ] Photo validation (max 5, max 5MB)
- [ ] Review summary calculation accurate

### Integration Tests
- [ ] Review created and visible immediately (auto-approve)
- [ ] Hidden reviews excluded from display
- [ ] Hidden reviews excluded from rating
- [ ] Helpful vote increments count
- [ ] Report increments report_count
- [ ] Duplicate review prevented (unique constraint)

### E2E Tests (Playwright)
- [ ] User can view reviews list
- [ ] Sort options work correctly
- [ ] Filter by reviewer type works
- [ ] Pagination loads more reviews
- [ ] Logged-in user can submit review
- [ ] Non-logged-in user sees login prompt
- [ ] Review form validates input
- [ ] Photo upload works
- [ ] Helpful button toggles
- [ ] Report dialog works

---

## Definition of Done

- [ ] Reviews display with all information
- [ ] Rating breakdown accurate
- [ ] Sort and filter functional
- [ ] Review submission auto-approved (Q11)
- [ ] Report system functional
- [ ] Helpful voting works
- [ ] Photo upload optimized
- [ ] Mobile form responsive
- [ ] Rating recalculation trigger works
- [ ] Unit tests >80% coverage
- [ ] E2E tests passing

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Review summary component | 2 hours |
| Review list + card | 3 hours |
| Sort & filter controls | 2 hours |
| Review form | 4 hours |
| Photo upload | 3 hours |
| Helpful voting | 2 hours |
| Report system | 3 hours |
| API endpoints | 3 hours |
| Testing | 4 hours |
| **Total** | **~26 hours (3-4 days)** |
