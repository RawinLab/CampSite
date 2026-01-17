# Plan: Contact & Inquiry (Module 8)

## Module Information
- **Module:** 8
- **Name:** Contact & Inquiry
- **Priority:** HIGH
- **Sprint:** 3
- **Story Points:** 10 (US-018: 7 + US-019: 3)
- **Dependencies:** Module 1 (Authentication), Module 4 (Campsite Detail)
- **Related Clarifications:** Q12 (Essential emails only), Q18 (Rate limiting only)

---

## Overview

Implement contact and inquiry system:
- Inquiry form on campsite detail page
- Rate limiting (5 per user per 24 hours - Q18)
- Email notifications to owner and user (Q12)
- External booking link click tracking
- Owner inquiry management

---

## Features

### 8.1 Send Inquiry (US-018)
**Priority:** HIGH

**Inquiry Form Fields:**
- Name (pre-filled if logged in)
- Email (pre-filled if logged in)
- Phone number (optional)
- Inquiry type (dropdown)
- Message (20-2000 chars)
- Check-in date (optional)
- Check-out date (optional)

**Frontend Components:**
```
src/components/inquiry/
├── InquiryForm.tsx           # Main form component
├── InquiryDialog.tsx         # Modal wrapper
├── InquiryConfirmation.tsx   # Success message
└── InquiryRateLimit.tsx      # Rate limit warning
```

**Inquiry Form:**
```typescript
// src/components/inquiry/InquiryForm.tsx
const INQUIRY_TYPES = [
  { value: 'booking', label: 'สอบถามการจอง' },
  { value: 'general', label: 'คำถามทั่วไป' },
  { value: 'complaint', label: 'ร้องเรียน' },
  { value: 'other', label: 'อื่นๆ' },
];

interface InquiryFormProps {
  campsiteId: string;
  campsiteName: string;
  onSuccess?: () => void;
}

export function InquiryForm({ campsiteId, campsiteName, onSuccess }: InquiryFormProps) {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      guest_name: profile?.full_name || '',
      guest_email: user?.email || '',
      guest_phone: profile?.phone || '',
      inquiry_type: 'general',
      message: '',
    },
  });

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);
    try {
      await submitInquiry({
        campsite_id: campsiteId,
        ...data,
      });

      toast.success('ส่งข้อความสำเร็จ!');
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      if (error.status === 429) {
        toast.error('คุณส่งข้อความครบ 5 ครั้งแล้ววันนี้');
      } else {
        toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <FormField
            control={form.control}
            name="guest_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ชื่อ *</FormLabel>
                <Input {...field} placeholder="ชื่อของคุณ" />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="guest_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>อีเมล *</FormLabel>
                <Input {...field} type="email" placeholder="email@example.com" />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Phone */}
        <FormField
          control={form.control}
          name="guest_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>เบอร์โทรศัพท์</FormLabel>
              <Input {...field} placeholder="0812345678" />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Inquiry Type */}
        <FormField
          control={form.control}
          name="inquiry_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ประเภทคำถาม *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INQUIRY_TYPES.map((type) => (
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

        {/* Dates (optional) */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="check_in_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>วันเช็คอิน</FormLabel>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  minDate={new Date()}
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="check_out_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>วันเช็คเอาท์</FormLabel>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  minDate={form.watch('check_in_date') || new Date()}
                />
              </FormItem>
            )}
          />
        </div>

        {/* Message */}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ข้อความ * (20-2000 ตัวอักษร)</FormLabel>
              <Textarea
                {...field}
                rows={5}
                placeholder="เขียนข้อความถึงเจ้าของแคมป์..."
              />
              <div className="flex justify-between text-sm text-gray-500">
                <FormMessage />
                <span>{field.value?.length || 0}/2000</span>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              กำลังส่ง...
            </>
          ) : (
            'ส่งข้อความ'
          )}
        </Button>
      </form>
    </Form>
  );
}
```

### 8.2 Rate Limiting (Q18)
**Priority:** CRITICAL

**Implementation:**
- 5 inquiries per user per 24 hours
- Rate limit by user ID (logged in) or IP (guest)
- No CAPTCHA needed

**Backend Middleware:**
```typescript
// apps/campsite-backend/src/middleware/inquiryRateLimit.ts
import rateLimit from 'express-rate-limit';

export const inquiryRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 inquiries per window
  keyGenerator: (req) => {
    // Use user ID if logged in, otherwise IP
    return req.profile?.id || req.ip;
  },
  message: {
    error: 'Rate limit exceeded',
    message: 'คุณส่งข้อความครบ 5 ครั้งแล้ววันนี้ กรุณาลองใหม่ในวันพรุ่งนี้',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to inquiry route
router.post(
  '/inquiries',
  inquiryRateLimit,
  validate(inquirySchema),
  submitInquiry
);
```

### 8.3 Email Notifications (Q12)
**Priority:** HIGH

**Essential Emails Only:**
1. Email verification (signup) - handled by Supabase Auth
2. Inquiry received (to owner) ✓
3. Inquiry reply (to user) ✓
4. Password reset - handled by Supabase Auth

**Email Service:**
```typescript
// apps/campsite-backend/src/services/emailService.ts
import Mailgun from 'mailgun.js';
import formData from 'form-data';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY!,
});

const DOMAIN = process.env.MAILGUN_DOMAIN!;

export async function sendInquiryNotification(
  to: string,
  data: {
    campsiteName: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    inquiryType: string;
    message: string;
    checkInDate?: string;
    checkOutDate?: string;
    dashboardUrl: string;
  }
) {
  await mg.messages.create(DOMAIN, {
    from: 'Camping Thailand <noreply@camping-thailand.com>',
    to: [to],
    subject: `📩 มีข้อความใหม่สำหรับ ${data.campsiteName}`,
    template: 'inquiry-notification',
    'h:X-Mailgun-Variables': JSON.stringify(data),
  });
}

export async function sendInquiryConfirmation(
  to: string,
  data: {
    guestName: string;
    campsiteName: string;
    message: string;
  }
) {
  await mg.messages.create(DOMAIN, {
    from: 'Camping Thailand <noreply@camping-thailand.com>',
    to: [to],
    subject: `✅ ข้อความของคุณถูกส่งแล้ว - ${data.campsiteName}`,
    template: 'inquiry-confirmation',
    'h:X-Mailgun-Variables': JSON.stringify(data),
  });
}

export async function sendInquiryReply(
  to: string,
  data: {
    guestName: string;
    campsiteName: string;
    ownerReply: string;
    originalMessage: string;
  }
) {
  await mg.messages.create(DOMAIN, {
    from: 'Camping Thailand <noreply@camping-thailand.com>',
    to: [to],
    subject: `💬 ${data.campsiteName} ตอบกลับข้อความของคุณ`,
    template: 'inquiry-reply',
    'h:X-Mailgun-Variables': JSON.stringify(data),
  });
}
```

### 8.4 External Booking (US-019)
**Priority:** CRITICAL

**Click Tracking:**
```typescript
// src/components/campsite/BookingButton.tsx
interface BookingButtonProps {
  campsiteId: string;
  bookingUrl: string | null;
  phone: string | null;
}

export function BookingButton({ campsiteId, bookingUrl, phone }: BookingButtonProps) {
  const trackBookingClick = async () => {
    // Track analytics event
    await trackEvent('booking_click', { campsite_id: campsiteId });
  };

  if (bookingUrl) {
    return (
      <Button asChild className="w-full" onClick={trackBookingClick}>
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 mr-2" />
          จองเลย
        </a>
      </Button>
    );
  }

  if (phone) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600 text-center">
          ไม่รับจองออนไลน์ กรุณาโทรจอง
        </p>
        <Button asChild variant="outline" className="w-full">
          <a href={`tel:${phone}`}>
            <Phone className="h-4 w-4 mr-2" />
            {phone}
          </a>
        </Button>
      </div>
    );
  }

  return (
    <Button disabled className="w-full">
      ไม่มีข้อมูลการจอง
    </Button>
  );
}
```

---

## Technical Design

### API Endpoints

```typescript
// POST /api/inquiries
interface CreateInquiryDto {
  campsite_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  inquiry_type: 'booking' | 'general' | 'complaint' | 'other';
  message: string;
  check_in_date?: string;
  check_out_date?: string;
}

interface CreateInquiryResponse {
  id: string;
  status: 'new';
  message: string;
}

// POST /api/analytics/event
interface TrackEventDto {
  event_type: EventType;
  campsite_id?: string;
  metadata?: Record<string, any>;
}
```

### Inquiry Controller

```typescript
// apps/campsite-backend/src/controllers/inquiryController.ts
export async function submitInquiry(req: Request, res: Response) {
  const body = createInquirySchema.parse(req.body);

  // Get campsite with owner info
  const { data: campsite } = await supabase
    .from('campsites')
    .select('*, owner:profiles(id, email, full_name)')
    .eq('id', body.campsite_id)
    .single();

  if (!campsite) {
    return res.status(404).json({ error: 'Campsite not found' });
  }

  // Create inquiry
  const { data: inquiry, error } = await supabase
    .from('inquiries')
    .insert({
      campsite_id: body.campsite_id,
      user_id: req.profile?.id || null,
      guest_name: body.guest_name,
      guest_email: body.guest_email,
      guest_phone: body.guest_phone,
      inquiry_type: body.inquiry_type,
      message: body.message,
      check_in_date: body.check_in_date,
      check_out_date: body.check_out_date,
      status: 'new',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Send emails (non-blocking)
  Promise.all([
    // Email to owner
    sendInquiryNotification(campsite.owner.email, {
      campsiteName: campsite.name,
      guestName: body.guest_name,
      guestEmail: body.guest_email,
      guestPhone: body.guest_phone,
      inquiryType: body.inquiry_type,
      message: body.message,
      checkInDate: body.check_in_date,
      checkOutDate: body.check_out_date,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/inquiries/${inquiry.id}`,
    }),
    // Confirmation to user
    sendInquiryConfirmation(body.guest_email, {
      guestName: body.guest_name,
      campsiteName: campsite.name,
      message: body.message,
    }),
  ]).catch(console.error);

  // Track analytics
  trackAnalyticsEvent({
    event_type: 'inquiry_sent',
    campsite_id: body.campsite_id,
    user_id: req.profile?.id,
    metadata: { inquiry_type: body.inquiry_type },
  });

  return res.status(201).json({
    id: inquiry.id,
    status: 'new',
    message: 'ส่งข้อความสำเร็จ',
  });
}
```

### Zod Schemas

```typescript
// packages/shared/src/schemas/inquiry.ts
export const inquiryFormSchema = z.object({
  campsite_id: z.string().uuid(),
  guest_name: z.string().min(3, 'ชื่อต้องมีอย่างน้อย 3 ตัวอักษร'),
  guest_email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  guest_phone: z
    .string()
    .regex(/^0[0-9]{9}$/, 'รูปแบบเบอร์โทรไม่ถูกต้อง')
    .optional()
    .or(z.literal('')),
  inquiry_type: z.enum(['booking', 'general', 'complaint', 'other']),
  message: z
    .string()
    .min(20, 'ข้อความต้องมีอย่างน้อย 20 ตัวอักษร')
    .max(2000, 'ข้อความต้องไม่เกิน 2000 ตัวอักษร'),
  check_in_date: z.string().optional(),
  check_out_date: z.string().optional(),
}).refine(
  (data) => {
    if (data.check_in_date && data.check_out_date) {
      return new Date(data.check_out_date) > new Date(data.check_in_date);
    }
    return true;
  },
  {
    message: 'วันเช็คเอาท์ต้องหลังวันเช็คอิน',
    path: ['check_out_date'],
  }
);
```

---

## Test Cases

### Unit Tests
- [ ] Form schema validates correctly
- [ ] Phone validation (Thai format)
- [ ] Date validation (checkout > checkin)
- [ ] Message length validation

### Integration Tests
- [ ] Inquiry created in database
- [ ] Email sent to owner
- [ ] Confirmation email sent to user
- [ ] Rate limiting enforced (429 on 6th request)
- [ ] Analytics event tracked

### E2E Tests (Playwright)
- [ ] Form validates required fields
- [ ] Form submits successfully
- [ ] Success message displayed
- [ ] Form clears after submit
- [ ] Rate limit message shown after 5 requests
- [ ] External booking link opens new tab
- [ ] Phone link works on mobile
- [ ] Pre-filled fields for logged-in users

---

## Definition of Done

- [ ] Inquiry form functional
- [ ] Rate limiting working (5/24h - Q18)
- [ ] Email to owner sent within 1 minute
- [ ] Confirmation email to user
- [ ] Phone number validated (Thai format)
- [ ] Message sanitized (XSS prevention)
- [ ] Booking click tracked
- [ ] Mobile form responsive
- [ ] Unit tests >80% coverage
- [ ] E2E tests passing

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Inquiry form UI | 3 hours |
| Form validation | 2 hours |
| API endpoint | 2 hours |
| Rate limiting | 2 hours |
| Email service | 3 hours |
| Email templates | 2 hours |
| Booking button | 1 hour |
| Analytics tracking | 1 hour |
| Testing | 3 hours |
| **Total** | **~19 hours (2-3 days)** |
