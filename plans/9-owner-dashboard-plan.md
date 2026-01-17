# Plan: Owner Dashboard (Module 9)

## Module Information
- **Module:** 9
- **Name:** Owner Dashboard
- **Priority:** HIGH
- **Sprint:** 3-4
- **Story Points:** 24 (US-020: 8 + US-021: 10 + US-022: 6)
- **Dependencies:** Module 1 (Auth), Module 2 (API), Module 8 (Inquiry)
- **Related Clarifications:** Q9 (Owner registration), Q10 (Multiple campsites per owner), Q13 (Core analytics only)

---

## Overview

Implement owner dashboard with:
- Analytics overview (Q13: core metrics only)
- Listing management (multiple campsites - Q10)
- Photo and amenities management
- Inquiry management and replies
- Owner registration flow (Q9)

---

## Features

### 9.1 Owner Analytics Dashboard (US-020)
**Priority:** MEDIUM

**Core Metrics (Q13):**
- Search impressions (this month)
- Profile page views
- Booking clicks
- New inquiries (unread count)

**Frontend Components:**
```
src/app/dashboard/
├── page.tsx                   # Overview
├── layout.tsx                 # Dashboard layout
├── loading.tsx                # Skeleton
├── analytics/
│   └── page.tsx               # Detailed analytics
├── campsites/
│   ├── page.tsx               # Campsite list
│   ├── [id]/
│   │   ├── page.tsx           # Edit campsite
│   │   ├── photos/
│   │   │   └── page.tsx       # Manage photos
│   │   └── amenities/
│   │       └── page.tsx       # Manage amenities
│   └── new/
│       └── page.tsx           # Create campsite
└── inquiries/
    ├── page.tsx               # Inquiry list
    └── [id]/
        └── page.tsx           # Inquiry detail
```

**Dashboard Overview:**
```typescript
// src/app/dashboard/page.tsx
export default async function DashboardPage() {
  const { profile } = await getServerSession();

  if (profile.role !== 'owner' && profile.role !== 'admin') {
    redirect('/');
  }

  const stats = await getDashboardStats(profile.id);
  const recentInquiries = await getRecentInquiries(profile.id, 5);
  const campsites = await getOwnerCampsites(profile.id);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">สวัสดี, {profile.full_name}</h1>
        <p className="text-gray-600">ภาพรวมแคมป์ไซต์ของคุณ</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="การแสดงผลในค้นหา"
          value={stats.search_impressions}
          change={stats.search_impressions_change}
          icon={Search}
        />
        <StatCard
          title="เข้าชมหน้าแคมป์"
          value={stats.profile_views}
          change={stats.profile_views_change}
          icon={Eye}
        />
        <StatCard
          title="คลิกจอง"
          value={stats.booking_clicks}
          change={stats.booking_clicks_change}
          icon={MousePointer}
        />
        <StatCard
          title="ข้อความใหม่"
          value={stats.new_inquiries}
          icon={MessageSquare}
          highlight={stats.new_inquiries > 0}
        />
      </div>

      {/* Recent Inquiries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ข้อความล่าสุด</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/inquiries">ดูทั้งหมด</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <InquiryList inquiries={recentInquiries} compact />
        </CardContent>
      </Card>

      {/* Campsites Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>แคมป์ไซต์ของคุณ ({campsites.length})</CardTitle>
          <Button asChild>
            <Link href="/dashboard/campsites/new">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มแคมป์ไซต์
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <CampsiteTable campsites={campsites} />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Analytics Charts:**
```typescript
// src/components/dashboard/AnalyticsChart.tsx
interface AnalyticsChartProps {
  data: { date: string; value: number }[];
  title: string;
}

export function AnalyticsChart({ data, title }: AnalyticsChartProps) {
  // Use recharts or similar
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#16a34a"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### 9.2 Listing Management (US-021)
**Priority:** HIGH

**Edit Campsite Form:**
```typescript
// src/app/dashboard/campsites/[id]/page.tsx
export default async function EditCampsitePage({ params }: { params: { id: string } }) {
  const campsite = await getCampsiteForEdit(params.id);
  const provinces = await getProvinces();
  const campsiteTypes = await getCampsiteTypes();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">แก้ไข: {campsite.name}</h1>
        <Badge variant={campsite.status === 'approved' ? 'success' : 'warning'}>
          {STATUS_LABELS[campsite.status]}
        </Badge>
      </div>

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">ข้อมูลพื้นฐาน</TabsTrigger>
          <TabsTrigger value="photos">รูปภาพ</TabsTrigger>
          <TabsTrigger value="amenities">สิ่งอำนวยความสะดวก</TabsTrigger>
          <TabsTrigger value="accommodations">ประเภทที่พัก</TabsTrigger>
          <TabsTrigger value="attractions">สถานที่ใกล้เคียง</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <BasicInfoForm
            campsite={campsite}
            provinces={provinces}
            types={campsiteTypes}
          />
        </TabsContent>

        <TabsContent value="photos">
          <PhotosManager campsiteId={params.id} photos={campsite.photos} />
        </TabsContent>

        <TabsContent value="amenities">
          <AmenitiesManager
            campsiteId={params.id}
            selectedAmenities={campsite.amenities}
          />
        </TabsContent>

        <TabsContent value="accommodations">
          <AccommodationsManager
            campsiteId={params.id}
            accommodations={campsite.accommodations}
          />
        </TabsContent>

        <TabsContent value="attractions">
          <AttractionsManager
            campsiteId={params.id}
            attractions={campsite.nearby_attractions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Photo Manager:**
```typescript
// src/components/dashboard/PhotosManager.tsx
interface PhotosManagerProps {
  campsiteId: string;
  photos: CampsitePhoto[];
}

export function PhotosManager({ campsiteId, photos: initialPhotos }: PhotosManagerProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadCampsitePhoto(campsiteId, file);
        const newPhoto = await createCampsitePhoto(campsiteId, {
          url,
          alt_text: file.name,
          sort_order: photos.length,
        });
        setPhotos((prev) => [...prev, newPhoto]);
      }
      toast.success('อัปโหลดสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    await setPrimaryPhoto(campsiteId, photoId);
    setPhotos((prev) =>
      prev.map((p) => ({ ...p, is_primary: p.id === photoId }))
    );
  };

  const handleDelete = async (photoId: string) => {
    await deleteCampsitePhoto(campsiteId, photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleReorder = async (newOrder: CampsitePhoto[]) => {
    setPhotos(newOrder);
    await reorderCampsitePhotos(
      campsiteId,
      newOrder.map((p, i) => ({ id: p.id, sort_order: i }))
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>รูปภาพ ({photos.length})</CardTitle>
        <CardDescription>
          อัปโหลดรูปภาพแคมป์ไซต์ของคุณ (สูงสุด 20 รูป, ไม่เกิน 5MB ต่อรูป)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Upload dropzone */}
        <FileUploader
          accept="image/*"
          multiple
          maxSize={5 * 1024 * 1024}
          onUpload={handleUpload}
          disabled={uploading || photos.length >= 20}
        />

        {/* Photo grid with drag-and-drop reorder */}
        <DraggablePhotoGrid
          photos={photos}
          onReorder={handleReorder}
          onSetPrimary={handleSetPrimary}
          onDelete={handleDelete}
        />
      </CardContent>
    </Card>
  );
}
```

### 9.3 Inquiry Management (US-022)
**Priority:** HIGH

**Inquiry List:**
```typescript
// src/app/dashboard/inquiries/page.tsx
export default async function InquiriesPage() {
  const { profile } = await getServerSession();
  const searchParams = useSearchParams();

  const status = searchParams.get('status') || 'all';
  const page = Number(searchParams.get('page')) || 1;

  const { inquiries, total } = await getOwnerInquiries(profile.id, {
    status: status === 'all' ? undefined : status,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ข้อความ ({total})</h1>

      {/* Status filter */}
      <div className="flex gap-2">
        {['all', 'new', 'in_progress', 'resolved', 'closed'].map((s) => (
          <Button
            key={s}
            variant={status === s ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <Link href={`?status=${s}`}>{STATUS_LABELS[s]}</Link>
          </Button>
        ))}
      </div>

      {/* Inquiry list */}
      <div className="space-y-4">
        {inquiries.map((inquiry) => (
          <InquiryCard key={inquiry.id} inquiry={inquiry} />
        ))}
      </div>

      <Pagination current={page} total={Math.ceil(total / 20)} />
    </div>
  );
}
```

**Inquiry Detail & Reply:**
```typescript
// src/app/dashboard/inquiries/[id]/page.tsx
export default async function InquiryDetailPage({ params }: { params: { id: string } }) {
  const inquiry = await getInquiryDetail(params.id);

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/inquiries" className="text-primary">
        ← กลับไปรายการ
      </Link>

      {/* Inquiry info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{inquiry.guest_name}</CardTitle>
              <CardDescription>
                {inquiry.guest_email} • {inquiry.guest_phone}
              </CardDescription>
            </div>
            <Badge>{STATUS_LABELS[inquiry.status]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 text-sm text-gray-600">
            <span>ประเภท: {INQUIRY_TYPE_LABELS[inquiry.inquiry_type]}</span>
            {inquiry.check_in_date && (
              <span>
                วันที่: {formatDate(inquiry.check_in_date)} - {formatDate(inquiry.check_out_date)}
              </span>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="whitespace-pre-wrap">{inquiry.message}</p>
          </div>

          <p className="text-sm text-gray-500">
            ส่งเมื่อ {formatRelativeTime(inquiry.created_at)}
          </p>
        </CardContent>
      </Card>

      {/* Owner reply */}
      {inquiry.owner_reply ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">คำตอบของคุณ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{inquiry.owner_reply}</p>
            <p className="text-sm text-gray-500 mt-2">
              ตอบเมื่อ {formatRelativeTime(inquiry.replied_at)}
            </p>
          </CardContent>
        </Card>
      ) : (
        <InquiryReplyForm inquiryId={inquiry.id} />
      )}

      {/* Status actions */}
      <div className="flex gap-2">
        {inquiry.status !== 'resolved' && (
          <Button
            variant="outline"
            onClick={() => updateInquiryStatus(inquiry.id, 'resolved')}
          >
            <Check className="h-4 w-4 mr-2" />
            ทำเครื่องหมายว่าแก้ไขแล้ว
          </Button>
        )}
        {inquiry.status !== 'closed' && (
          <Button
            variant="ghost"
            onClick={() => updateInquiryStatus(inquiry.id, 'closed')}
          >
            ปิดข้อความ
          </Button>
        )}
      </div>
    </div>
  );
}
```

### 9.4 Create New Campsite
**Priority:** HIGH

```typescript
// src/app/dashboard/campsites/new/page.tsx
export default function NewCampsitePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CreateCampsiteData>>({});

  const handleSubmit = async () => {
    try {
      const campsite = await createCampsite(formData);
      toast.success('สร้างแคมป์ไซต์สำเร็จ! รอการอนุมัติจากแอดมิน');
      router.push(`/dashboard/campsites/${campsite.id}`);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">เพิ่มแคมป์ไซต์ใหม่</h1>

      {/* Step indicator */}
      <StepIndicator current={step} steps={['ข้อมูลพื้นฐาน', 'ที่ตั้ง', 'รูปภาพ', 'สิ่งอำนวยความสะดวก']} />

      {step === 1 && (
        <BasicInfoStep
          data={formData}
          onChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <LocationStep
          data={formData}
          onChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <PhotosStep
          data={formData}
          onChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <AmenitiesStep
          data={formData}
          onChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
          onBack={() => setStep(3)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
```

---

## Technical Design

### API Endpoints

```typescript
// Dashboard stats
// GET /api/dashboard/stats
interface DashboardStatsResponse {
  search_impressions: number;
  search_impressions_change: number;
  profile_views: number;
  profile_views_change: number;
  booking_clicks: number;
  booking_clicks_change: number;
  new_inquiries: number;
}

// Owner campsites
// GET /api/dashboard/campsites
// POST /api/dashboard/campsites
// PATCH /api/dashboard/campsites/:id
// DELETE /api/dashboard/campsites/:id

// Photo management
// POST /api/dashboard/campsites/:id/photos
// PATCH /api/dashboard/campsites/:id/photos/:photoId
// DELETE /api/dashboard/campsites/:id/photos/:photoId
// POST /api/dashboard/campsites/:id/photos/reorder

// Amenities management
// PUT /api/dashboard/campsites/:id/amenities

// Inquiry management
// GET /api/dashboard/inquiries
// GET /api/dashboard/inquiries/:id
// PATCH /api/dashboard/inquiries/:id (status, reply)
```

### Analytics Query

```sql
-- Get dashboard stats for owner
SELECT
  COUNT(*) FILTER (WHERE event_type = 'search_impression') as search_impressions,
  COUNT(*) FILTER (WHERE event_type = 'campsite_view') as profile_views,
  COUNT(*) FILTER (WHERE event_type = 'booking_click') as booking_clicks
FROM analytics_events
WHERE campsite_id IN (
  SELECT id FROM campsites WHERE owner_id = $1
)
AND created_at >= NOW() - INTERVAL '30 days';
```

---

## Test Cases

### Unit Tests
- [ ] Stats calculation correct
- [ ] Form validation works
- [ ] Photo upload validation
- [ ] Amenities toggle logic

### Integration Tests
- [ ] Only owner's campsites shown
- [ ] Photo upload stores correctly
- [ ] Inquiry reply sends email
- [ ] Status update persists

### E2E Tests (Playwright)
- [ ] Dashboard loads with stats
- [ ] Campsite list shows all owner's sites
- [ ] Edit form saves changes
- [ ] Photo upload works
- [ ] Inquiry reply sends successfully
- [ ] New campsite creation flow

---

## Definition of Done

- [ ] Dashboard overview shows core metrics (Q13)
- [ ] Campsite list for owner
- [ ] Edit campsite functional
- [ ] Photo upload and management
- [ ] Amenities management
- [ ] Inquiry list and reply
- [ ] New campsite creation (pending status - Q8)
- [ ] Mobile responsive
- [ ] Unit tests >80% coverage
- [ ] E2E tests passing

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Dashboard layout | 2 hours |
| Stats cards | 2 hours |
| Analytics charts | 3 hours |
| Campsite list | 2 hours |
| Edit campsite form | 4 hours |
| Photo manager | 4 hours |
| Amenities manager | 2 hours |
| Inquiry list | 2 hours |
| Inquiry detail & reply | 3 hours |
| New campsite wizard | 4 hours |
| Testing | 4 hours |
| **Total** | **~32 hours (4 days)** |
