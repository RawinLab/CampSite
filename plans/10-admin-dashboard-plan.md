# Plan: Admin Dashboard (Module 10)

## Module Information
- **Module:** 10
- **Name:** Admin Dashboard
- **Priority:** HIGH
- **Sprint:** 4
- **Story Points:** 16
- **Dependencies:** Module 1 (Auth), Module 9 (Owner Dashboard)
- **Related Clarifications:** Q1 (Admin role), Q8 (Campsite approval), Q9 (Owner approval), Q11 (Review moderation)

---

## Overview

Implement admin dashboard for platform management:
- Campsite approval queue (Q8)
- Owner request approval (Q9)
- Review moderation (Q11: hide reported reviews)
- Platform analytics
- User management

---

## Features

### 10.1 Admin Layout & Navigation
**Priority:** CRITICAL

**Route Structure:**
```
src/app/admin/
├── page.tsx                   # Overview
├── layout.tsx                 # Admin layout
├── campsites/
│   ├── page.tsx               # All campsites
│   └── pending/
│       └── page.tsx           # Pending approval (Q8)
├── owner-requests/
│   └── page.tsx               # Owner requests (Q9)
├── reviews/
│   └── reported/
│       └── page.tsx           # Reported reviews (Q11)
├── users/
│   └── page.tsx               # User management
└── analytics/
    └── page.tsx               # Platform analytics
```

**Admin Layout:**
```typescript
// src/app/admin/layout.tsx
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getServerSession();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>

        <nav className="space-y-2">
          <NavLink href="/admin" icon={LayoutDashboard}>
            ภาพรวม
          </NavLink>
          <NavLink href="/admin/campsites/pending" icon={Clock} badge={pendingCount}>
            รออนุมัติ
          </NavLink>
          <NavLink href="/admin/owner-requests" icon={UserCheck} badge={ownerRequestCount}>
            คำขอเป็น Owner
          </NavLink>
          <NavLink href="/admin/reviews/reported" icon={Flag} badge={reportedCount}>
            รีวิวที่ถูกรายงาน
          </NavLink>
          <NavLink href="/admin/campsites" icon={Tent}>
            แคมป์ไซต์ทั้งหมด
          </NavLink>
          <NavLink href="/admin/users" icon={Users}>
            ผู้ใช้
          </NavLink>
          <NavLink href="/admin/analytics" icon={BarChart3}>
            สถิติ
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-100 p-8">
        {children}
      </main>
    </div>
  );
}
```

### 10.2 Campsite Approval Queue (Q8)
**Priority:** CRITICAL

**Pending Campsites List:**
```typescript
// src/app/admin/campsites/pending/page.tsx
export default async function PendingCampsitesPage() {
  const pendingCampsites = await getPendingCampsites();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">แคมป์ไซต์รออนุมัติ ({pendingCampsites.length})</h1>

      {pendingCampsites.length === 0 ? (
        <Card className="p-8 text-center">
          <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <p className="text-gray-600">ไม่มีแคมป์ไซต์รออนุมัติ</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingCampsites.map((campsite) => (
            <CampsiteApprovalCard key={campsite.id} campsite={campsite} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Approval Card:**
```typescript
// src/components/admin/CampsiteApprovalCard.tsx
interface CampsiteApprovalCardProps {
  campsite: PendingCampsite;
}

export function CampsiteApprovalCard({ campsite }: CampsiteApprovalCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveCampsite(campsite.id);
      toast.success('อนุมัติแล้ว');
      router.refresh();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await rejectCampsite(campsite.id, rejectReason);
      toast.success('ปฏิเสธแล้ว');
      setShowRejectDialog(false);
      router.refresh();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-6">
          {/* Photo */}
          <div className="w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={campsite.photos[0]?.url || '/placeholder.jpg'}
              alt={campsite.name}
              width={192}
              height={128}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{campsite.name}</h3>
                <p className="text-sm text-gray-600">
                  {campsite.province.name_th} • {campsite.type.name_th}
                </p>
              </div>
              <Badge variant="outline">
                ส่งเมื่อ {formatRelativeTime(campsite.created_at)}
              </Badge>
            </div>

            <p className="mt-2 text-sm text-gray-700 line-clamp-2">
              {campsite.description}
            </p>

            <div className="mt-2 text-sm text-gray-600">
              <p>Owner: {campsite.owner.full_name} ({campsite.owner.email})</p>
              <p>ราคา: ฿{campsite.price_min.toLocaleString()} - ฿{campsite.price_max.toLocaleString()}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/campsites/${campsite.id}`} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  ดูตัวอย่าง
                </Link>
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                อนุมัติ
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                variant="destructive"
                size="sm"
              >
                <X className="h-4 w-4 mr-1" />
                ปฏิเสธ
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ปฏิเสธแคมป์ไซต์</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="เหตุผลในการปฏิเสธ (ไม่บังคับ)"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                ยกเลิก
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
                {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                ยืนยันปฏิเสธ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
```

### 10.3 Owner Request Approval (Q9)
**Priority:** HIGH

**Owner Requests List:**
```typescript
// src/app/admin/owner-requests/page.tsx
export default async function OwnerRequestsPage() {
  const requests = await getOwnerRequests();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">คำขอเป็น Owner ({requests.length})</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ผู้ขอ</TableHead>
            <TableHead>ชื่อธุรกิจ</TableHead>
            <TableHead>เบอร์ติดต่อ</TableHead>
            <TableHead>วันที่ขอ</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead>การดำเนินการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{request.user.full_name}</p>
                  <p className="text-sm text-gray-500">{request.user.email}</p>
                </div>
              </TableCell>
              <TableCell>{request.business_name}</TableCell>
              <TableCell>{request.contact_phone}</TableCell>
              <TableCell>{formatDate(request.created_at)}</TableCell>
              <TableCell>
                <Badge variant={request.status === 'pending' ? 'warning' : request.status === 'approved' ? 'success' : 'destructive'}>
                  {REQUEST_STATUS_LABELS[request.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {request.status === 'pending' && (
                  <OwnerRequestActions request={request} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Approval Actions:**
```typescript
// src/components/admin/OwnerRequestActions.tsx
export function OwnerRequestActions({ request }: { request: OwnerRequest }) {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveOwnerRequest(request.id);
      // This will:
      // 1. Update request status to 'approved'
      // 2. Update user's role to 'owner'
      // 3. Send email notification to user
      toast.success('อนุมัติแล้ว - ผู้ใช้สามารถสร้างแคมป์ไซต์ได้แล้ว');
      router.refresh();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      await rejectOwnerRequest(request.id, reason);
      toast.success('ปฏิเสธแล้ว');
      router.refresh();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleApprove} disabled={isApproving}>
        <Check className="h-4 w-4 mr-1" />
        อนุมัติ
      </Button>
      <RejectDialog onReject={handleReject} />
    </div>
  );
}
```

### 10.4 Reported Reviews Moderation (Q11)
**Priority:** HIGH

**Reported Reviews List:**
```typescript
// src/app/admin/reviews/reported/page.tsx
export default async function ReportedReviewsPage() {
  const reportedReviews = await getReportedReviews();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">รีวิวที่ถูกรายงาน ({reportedReviews.length})</h1>

      {reportedReviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{review.user.full_name}</p>
                <p className="text-sm text-gray-500">
                  รีวิว: {review.campsite.name}
                </p>
              </div>
              <Badge variant="destructive">
                ถูกรายงาน {review.report_count} ครั้ง
              </Badge>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <StarRating value={review.rating_overall} size="sm" />
                <span className="text-sm text-gray-500">
                  {formatRelativeTime(review.created_at)}
                </span>
              </div>
              {review.title && <p className="font-medium">{review.title}</p>}
              <p className="text-gray-700">{review.content}</p>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => keepReview(review.id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                เก็บไว้ (ไม่มีปัญหา)
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => hideReview(review.id)}
              >
                <EyeOff className="h-4 w-4 mr-1" />
                ซ่อนรีวิว
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteReview(review.id)}
              >
                <Trash className="h-4 w-4 mr-1" />
                ลบถาวร
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### 10.5 Platform Analytics
**Priority:** MEDIUM

**Analytics Overview:**
```typescript
// src/app/admin/analytics/page.tsx
export default async function AnalyticsPage() {
  const stats = await getPlatformStats();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">สถิติแพลตฟอร์ม</h1>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="ผู้ใช้ทั้งหมด" value={stats.total_users} icon={Users} />
        <StatCard title="Owners" value={stats.total_owners} icon={UserCheck} />
        <StatCard title="แคมป์ไซต์" value={stats.total_campsites} icon={Tent} />
        <StatCard title="รีวิว" value={stats.total_reviews} icon={Star} />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ผู้ใช้ใหม่ (30 วัน)</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersChart data={stats.new_users_by_day} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>การค้นหา (30 วัน)</CardTitle>
          </CardHeader>
          <CardContent>
            <SearchesChart data={stats.searches_by_day} />
          </CardContent>
        </Card>
      </div>

      {/* Top campsites */}
      <Card>
        <CardHeader>
          <CardTitle>แคมป์ไซต์ยอดนิยม</CardTitle>
        </CardHeader>
        <CardContent>
          <TopCampsitesTable campsites={stats.top_campsites} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 10.6 Featured Campsites (Q2)
**Priority:** MEDIUM

**Manage Featured:**
```typescript
// src/components/admin/FeaturedManager.tsx
export function FeaturedManager() {
  const [featured, setFeatured] = useState<Campsite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFeatured = async (campsiteId: string, isFeatured: boolean) => {
    await updateCampsite(campsiteId, { is_featured: isFeatured });
    if (isFeatured) {
      toast.success('เพิ่มในรายการแนะนำแล้ว');
    } else {
      toast.success('นำออกจากรายการแนะนำแล้ว');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">แคมป์ไซต์แนะนำ ({featured.length})</h2>
        <AddFeaturedDialog onAdd={(id) => toggleFeatured(id, true)} />
      </div>

      <div className="grid gap-4">
        {featured.map((campsite) => (
          <div key={campsite.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
            <div className="flex items-center gap-4">
              <Image
                src={campsite.primary_photo}
                alt={campsite.name}
                width={80}
                height={60}
                className="rounded"
              />
              <div>
                <p className="font-medium">{campsite.name}</p>
                <p className="text-sm text-gray-500">{campsite.province.name_th}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFeatured(campsite.id, false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Technical Design

### API Endpoints

```typescript
// Admin-only endpoints (require role = 'admin')

// Campsite approval
// GET /api/admin/campsites/pending
// POST /api/admin/campsites/:id/approve
// POST /api/admin/campsites/:id/reject

// Owner requests
// GET /api/admin/owner-requests
// POST /api/admin/owner-requests/:id/approve
// POST /api/admin/owner-requests/:id/reject

// Review moderation
// GET /api/admin/reviews/reported
// POST /api/admin/reviews/:id/hide
// POST /api/admin/reviews/:id/unhide
// DELETE /api/admin/reviews/:id

// Featured management
// GET /api/admin/campsites/featured
// POST /api/admin/campsites/:id/feature
// DELETE /api/admin/campsites/:id/feature

// Platform analytics
// GET /api/admin/analytics
```

### Admin Middleware

```typescript
// apps/campsite-backend/src/middleware/adminGuard.ts
export const adminGuard = async (req: Request, res: Response, next: NextFunction) => {
  if (req.profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Usage
router.use('/admin', authMiddleware, adminGuard);
```

---

## Test Cases

### Unit Tests
- [ ] Admin guard middleware works
- [ ] Approval updates status correctly
- [ ] Role change on owner approval
- [ ] Review hide updates is_hidden

### Integration Tests
- [ ] Non-admin cannot access routes
- [ ] Campsite approval changes status
- [ ] Owner approval changes role
- [ ] Review hide excludes from public

### E2E Tests (Playwright)
- [ ] Admin can view pending campsites
- [ ] Approve flow works
- [ ] Reject flow works with reason
- [ ] Owner request approval works
- [ ] Review moderation works
- [ ] Featured toggle works

---

## Definition of Done

- [ ] Admin layout with navigation
- [ ] Campsite approval queue (Q8)
- [ ] Owner request approval (Q9)
- [ ] Review moderation (Q11)
- [ ] Featured management (Q2)
- [ ] Platform analytics
- [ ] Role protection enforced
- [ ] Unit tests >80% coverage
- [ ] E2E tests passing

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Admin layout | 2 hours |
| Campsite approval | 4 hours |
| Owner requests | 3 hours |
| Review moderation | 3 hours |
| Featured management | 2 hours |
| Platform analytics | 3 hours |
| API endpoints | 4 hours |
| Testing | 3 hours |
| **Total** | **~24 hours (3 days)** |
