# Google Places API Integration - Clarified Requirements

**Document Version:** 1.0
**Last Updated:** January 18, 2026
**Feature:** Module 12 - Google Places Data Ingestion

---

## Clarifications Made

### Q1: Sync Frequency - How often should we sync data?

**Question:** ควร sync ข้อมูลจาก Google Places API บ่อยแค่ไหน?

**Answer:** **Weekly sync (ทุกสัปดาห์)**

**Impact:**
- Default schedule: Every Sunday at 2:00 AM (cron: `0 2 * * 0`)
- Configurable via environment variable: `GOOGLE_PLACES_SYNC_SCHEDULE`
- Admin can trigger manual sync anytime via dashboard
- Incremental sync option to only fetch updated/new places

**Reasoning:**
- Weekly balances freshness with API cost (~$100-150/month)
- Off-peak timing (Sunday 2 AM) minimizes disruption
- Allows for manual trigger when needed (e.g., after major updates)

---

### Q2: Automatic vs Manual Import - Should AI-processed places import automatically?

**Question:** หลัง AI ประมวลผลแล้ว ควร import เข้า campsites โดยอัตโนมัติหรือต้อง admin approve ก่อน?

**Answer:** **Manual Admin Approval Required**

**Impact:**
- All imports must be reviewed and approved by admin
- Admin can edit data before importing
- Admin can assign imported campsites to owner accounts
- Bulk approval available for high-confidence candidates
- System tracks who approved what and when

**Reasoning:**
- Prevents low-quality or incorrect data from entering production
- Allows duplicate verification before creating records
- Gives control over what appears on the platform
- Enables owner assignment for proper management

**Data Flow:**
```
Google Places API → Raw Data → AI Processing → Candidates → Admin Review → Campsites (approved)
```

---

### Q3: Duplicate Handling - How should duplicates be detected and handled?

**Question:** จะ handle ข้อมูลที่ซ้ำกับ campsites ที่มีอยู่แล้วยังไง?

**Answer:** **Multi-factor Deduplication with AI Confidence Scoring**

**Impact:**
- Deduplication checks:
  1. **Name similarity** (fuzzy matching, Thai/English)
  2. **Location proximity** (within 500m)
  3. **Phone number match**
  4. **Website URL match**
  5. **Address similarity**

- AI assigns duplicate confidence score (0-1)
- Candidates marked as `is_duplicate` with `duplicate_of_campsite_id`
- Admin sees:
  - Duplicate warning
  - Side-by-side comparison
  - Similarity score breakdown
  - Option to link instead of create new

**Reasoning:**
- Multiple factors reduce false positives
- AI scoring helps prioritize review
- Admin makes final decision
- Can update existing campsites instead of creating duplicates

---

### Q4: Data Ownership - Who owns imported campsites?

**Question:** ที่พักที่ import จาก Google Places ควร assign owner ให้ใคร?

**Answer:** **Unassigned (owner_id = NULL) by default**

**Impact:**
- Imported campsites have `owner_id = NULL`
- Admin can assign to owner later
- Owners can "claim" their campsites via verification process
- System admin can edit/manage unassigned campsites

**Reasoning:**
- Google Places data doesn't include owner info
- Can't assume ownership without verification
- Allows owner claim flow in future
- Admin retains control over imported data

**Future Enhancement (Phase 2):**
- Owner claim flow: Submit proof → Admin verifies → Assigned

---

### Q5: Review Data - Should we import Google reviews?

**Question:** ควร import review จาก Google Places มาด้วยหรือไม่?

**Answer:** **NO - Do not import Google reviews as user reviews**

**Impact:**
- Store Google reviews in `google_places_reviews` table (raw data only)
- Do NOT create records in `reviews` table
- Display Google reviews separately as "Google Reviews" section
- User reviews remain platform-generated only

**Reasoning:**
- Google Terms of Service may not allow republishing as own
- Can't verify authenticity of Google reviewers
- No user accounts to link reviews to
- Platform wants authentic reviews from real users

**UI Implementation:**
```
Campsite Detail Page:
├── User Reviews (from our users)
└── Google Reviews (displayed with attribution, not editable)
```

---

### Q6: Photo Storage - Where should we store Google Places photos?

**Question:** รูปภาพจาก Google Places ควรเก็บไว้ที่ไหน?

**Answer:** **Supabase Storage (dedicated bucket)**

**Impact:**
- Create new bucket: `google-places-photos`
- Folder structure: `{place_id}/original/` and `{place_id}/thumbnails/`
- Download photos during sync phase
- Store local URLs in `google_places_photos` table
- Generate thumbnails (max-width: 400px)
- Original photos kept for full quality

**Storage Policy:**
- Limit to 3 photos per place (most recent/highest rated)
- Auto-compress: Original max 2MB, Thumbnail max 100KB
- RLS: Public read for thumbnails, admin write access
- CDN: Use Supabase CDN for delivery

**Reasoning:**
- Reduces dependency on Google's photo URLs (can expire)
- Faster loading from our own CDN
- Can optimize/compress images
- Full control over display

---

### Q7: Province Detection - How to match Thai provinces from coordinates?

**Question:** จะ match จังหวัดไทยจากพิกัด GPS ยังไง?

**Answer:** **Point-in-Polygon with Province Boundaries**

**Impact:**
- Use existing `provinces` table with latitude/longitude
- Calculate distance from coordinates to province center
- Match to nearest province within 100km radius
- Fallback: Use Google's geocoding API for address parsing

**Algorithm:**
```typescript
async function matchProvince(lat: number, lng: number): Promise<Province> {
  // 1. Find nearest province by center distance
  const nearest = await provinces
    .orderBy({ lat, lng }, { mode: 'nearest' })
    .limit(1)
    .single();

  // 2. If distance > 100km, use geocoding
  if (nearest.distance_km > 100) {
    const address = await geocode(lat, lng);
    return matchByName(address.province);
  }

  return nearest;
}
```

**Reasoning:**
- Center distance is fast and mostly accurate
- Geocoding fallback for edge cases
- Existing provinces table has coordinates for all 77 provinces

---

### Q8: Campsite Type Classification - How to classify imported campsites?

**Question:** จะ classify ว่าเป็น camping/glamping/etc. ยังไง?

**Answer:** **AI Classification with Confidence Score**

**Impact:**
- AI analyzes: name, description, photos, price level, amenities
- Maps to existing `campsite_types`:
  - 1: Camping (แคมป์ปิ้ง)
  - 2: Glamping (แกลมปิ้ง)
  - 3: Tented Resort (รีสอร์ทเต็นท์)
  - 4: Bungalow (บังกะโล)

- Returns `suggested_type_id` with confidence
- Admin can override before import
- Type shown in candidate review

**AI Prompts:**
```
Analyze this camping site and classify:
- Name: "Mountain View Glamping"
- Description: "Luxury tents with AC"
- Price Level: 3 ($$$)
- Photos: [tents with amenities]

Return: type_id (1-4) and confidence (0-1)
```

---

### Q9: API Cost Management - How to prevent overspending?

**Question:** จะป้องกันไม่ให้ API cost เกิน budget ยังไง?

**Answer:** **Multiple Safeguards**

**Impact:**
- **Request Quotas:**
  - `GOOGLE_PLACES_MAX_PLACES_PER_SYNC=5000`
  - Track requests in `sync_logs`
  - Stop sync if quota exceeded

- **Cost Alerts:**
  - Alert if estimated cost > $80
  - Daily cost monitoring
  - Dashboard shows current month spend

- **Incremental Sync:**
  - Only sync changed/new places after initial full sync
  - Reduces monthly cost by ~60%

- **Configuration:**
  ```env
  GOOGLE_PLACES_MAX_REQUESTS_PER_SYNC=10000
  GOOGLE_PLACES_MAX_COST_PER_SYNC=80.00
  GOOGLE_PLACES_ALERT_COST=50.00
  ```

**Reasoning:**
- Prevents surprise bills
- Allows budget control
- Incremental sync reduces ongoing costs

---

### Q10: Error Handling - What happens when sync fails?

**Question:** ถ้า sync ล้มเหลว ควรทำไง?

**Answer:** **Retry with Exponential Backoff + Logging**

**Impact:**
- **Retry Strategy:**
  - Transient errors: Retry up to 3 times with exponential backoff
  - Permanent errors: Log and continue
  - Partial failure: Complete successful items, log failures

- **Error Tracking:**
  - `sync_logs.error_message`: Summary
  - `sync_logs.error_details`: Full error JSON
  - Individual place errors in `google_places_raw.sync_status = 'failed'`

- **Recovery:**
  - Admin can re-run sync for failed places only
  - Manual retry option in dashboard
  - Alert admin on sync failure

**Error Types:**
```typescript
enum SyncErrorType {
  TRANSIENT = 'transient', // Retry: rate limit, timeout
  PERMANENT = 'permanent', // Skip: invalid API key, not found
  PARTIAL = 'partial'      // Some succeeded, some failed
}
```

---

### Q11: AI Processing Trigger - When should AI process raw places?

**Question:** AI ควร process ข้อมูลเมื่อไหร่?

**Answer:** **Two Options: Auto after sync OR Manual trigger**

**Impact:**
- **Default:** Auto-process after successful sync
- **Manual:** Admin can trigger anytime via dashboard
- **Incremental:** Only process new/updated places

**Configuration:**
```env
GOOGLE_PLACES_AUTO_PROCESS_AFTER_SYNC=true
```

**Reasoning:**
- Auto: Keeps candidates ready for review
- Manual: Allows control if needed
- Incremental: Saves API costs (OpenAI)

---

### Q12: Data Freshness - How to show users data is from Google Places?

**Question:** ควรบอก user ว่าข้อมูลมาจาก Google Places หรือไม่?

**Answer:** **YES - Transparent Attribution**

**Impact:**
- Display "Data provided by Google Places" badge on imported campsites
- Show "Last updated: {date}" from sync
- Differentiate imported vs owner-verified data
- Encourage owners to claim and verify listings

**UI Implementation:**
```tsx
<CampsiteDetail>
  {campsite.owner_id === null && (
    <Badge variant="info">
      Data from Google Places • Last updated: {formatDate(updated_at)}
    </Badge>
  )}
</CampsiteDetail>
```

**Reasoning:**
- Transparency builds trust
- Sets expectations about accuracy
- Encourages owner engagement
- Required by Google Places API ToS

---

### Q13: Thai Language Support - How to handle Thai names/descriptions?

**Question:** จะ handle ข้อมูลภาษาไทยยังไง?

**Answer:** **Dual-Language Storage with AI Translation**

**Impact:**
- Search in both English and Thai
- Store both names if available:
  - `name_en`: From English search
  - `name_th`: From Thai search or AI translation

- AI extracts Thai names from raw data
- Falls back to translation if Thai not available
- Search works in both languages

**Schema:**
```typescript
interface ProcessedCampsiteData {
  name: string; // Primary (English or Thai)
  name_th?: string; // Thai name if available
  description: string; // English
  description_th?: string; // Thai if available
}
```

---

### Q14: Sync Concurrency - Can multiple syncs run simultaneously?

**Question:** สามารถรัน sync พร้อมกันได้ไหม?

**Answer:** **NO - One sync at a time**

**Impact:**
- Queue subsequent sync requests
- Show "sync in progress" status
- Admin can cancel running sync
- FIFO queue for manual triggers

**Implementation:**
```typescript
async function startSync(config: SyncConfig): Promise<SyncLog> {
  const runningSync = await getRunningSync();
  if (runningSync) {
    throw new Error('Sync already in progress. Try again later.');
  }
  // Start sync...
}
```

**Reasoning:**
- Prevents API quota issues
- Avoids duplicate data
- Simplifies error handling

---

### Q15: Incremental Sync - How to determine what's updated?

**Question:** จะรู้ได้ยังไงว่า campsite ไหน update แล้ว?

**Answer:** **Compare with last sync + Track Google's timestamp**

**Impact:**
- Store `data_fetched_at` on each `google_places_raw`
- On subsequent syncs:
  - Check if Google's data changed
  - Update if different
  - Mark for re-processing if significant changes

- **Significant Change Detection:**
  - Name changed
  - Location moved >100m
  - Status changed (closed/permanently closed)
  - Rating changed >0.5

**Reasoning:**
- Reduces API costs
- Only process what changed
- Keeps data fresh efficiently

---

## Summary of Key Decisions

| Decision | Choice | Impact |
|----------|--------|--------|
| **Sync Frequency** | Weekly (Sunday 2 AM) | Balances freshness & cost |
| **Import Approval** | Manual admin approval | Quality control |
| **Duplicate Detection** | Multi-factor + AI scoring | Accuracy |
| **Data Ownership** | Unassigned (NULL) | Owner claim flow |
| **Google Reviews** | Store raw, don't import | Legal & UX |
| **Photo Storage** | Supabase Storage | Control & speed |
| **Province Match** | Distance + geocoding | Accuracy |
| **Type Classification** | AI-based | Automation |
| **Cost Control** | Quotas + alerts | Budget management |
| **Error Handling** | Retry + logging | Reliability |
| **AI Trigger** | Auto after sync | Efficiency |
| **Data Attribution** | Show Google badge | Transparency |
| **Thai Support** | Dual-language | Local UX |
| **Concurrency** | One sync at a time | Simplicity |
| **Incremental Sync** | Change detection | Cost savings |

---

## Related Documents
- [PRD-GooglePlaces-Integration.md](./PRD-GooglePlaces-Integration.md) - Product requirements
- [SRS-GooglePlaces-Integration.md](./SRS-GooglePlaces-Integration.md) - Technical specifications
- [CLARIFICATIONS.md](./CLARIFICATIONS.md) - General clarifications

---

**End of Clarifications - Google Places API Integration**
