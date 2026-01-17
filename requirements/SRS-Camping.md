# 📋 Software Requirements Specification (SRS)
## Camping Thailand Platform

**Document Version:** 1.0  
**Last Updated:** January 17, 2026  
**Author:** Technical Lead  
**Status:** Draft → Implementation

---

## TABLE OF CONTENTS

1. [Introduction](#introduction)
2. [Overall Description](#overall-description)
3. [Specific Requirements](#specific-requirements)
4. [External Interface Requirements](#external-interface-requirements)
5. [System Features](#system-features)
6. [Other Non-Functional Requirements](#other-non-functional-requirements)
7. [Appendices](#appendices)

---

## INTRODUCTION

### Purpose
This Software Requirements Specification (SRS) provides detailed technical requirements for the Camping Thailand web platform. It serves as the agreement between Product and Engineering teams.

### Scope
- **In Scope:**
  - Turborepo monorepo setup
  - `apps/campsite-frontend` - Next.js web application (MVP)
  - `apps/campsite-backend` - Node.js API server
  - `packages/shared` - Shared utilities and types
  - Supabase integration, Firebase hosting, Admin dashboard
- **Out of Scope (Phase 2):** Mobile app, internal payment processing, SMS notifications
- **Users:** Travelers, Campsite Owners, Admins

### Document Conventions
- **MUST:** Mandatory requirement
- **SHOULD:** Highly desired requirement
- **MAY:** Optional requirement
- **[ID]:** Requirement identifier (e.g., REQ-001)

### Intended Audience
- Development team
- QA/Testing team
- Product team
- Project managers

---

## OVERALL DESCRIPTION

### Product Perspective
The Camping Thailand platform is a new web application built as a **Turborepo monorepo** that integrates with:

#### Project Structure
```
campsite/
├── apps/
│   ├── campsite-frontend/    # Next.js 14+ web application
│   └── campsite-backend/     # Node.js + Express + TypeScript API server
├── packages/
│   ├── shared/               # Shared types, utilities, Zod schemas
│   ├── ui/                   # Shared UI components (optional)
│   └── config/               # Shared ESLint, TypeScript configs
├── turbo.json
└── package.json
```

#### External Integrations
- **Supabase:** PostgreSQL database + Supabase Auth (JWT, OAuth) + Storage + Row Level Security
- **Firebase App Hosting:** Next.js frontend deployment + CDN
- **Google Cloud Run:** Express backend API deployment (serverless, auto-scaling)
- **Leaflet + Plugins:** Location and mapping services (OpenStreetMap)
- **Email Services:** Mailgun for transactional notifications
- **Payment (Phase 2):** Stripe/Omise for bookings

### Product Functions
1. **Discovery:** Search, filter, and discover camping sites
2. **Information:** View detailed campsite information
3. **Social Proof:** Review and rating system
4. **Engagement:** Wishlist, comparison, inquiries
5. **Management:** Admin dashboard for owners
6. **Analytics:** Performance tracking

### User Characteristics

#### Traveler Users
- Tech Comfort: High to Medium
- Frequency: 2-4 times per month
- Device: Mobile (60%), Desktop (40%)
- Search Pattern: Browse, Filter, Compare, Book

#### Owner Users
- Tech Comfort: Low to Medium
- Frequency: Daily to Weekly
- Device: Desktop (70%), Mobile (30%)
- Tasks: Listing management, inquiry handling, analytics

#### Admin Users
- Tech Comfort: High
- Frequency: As needed
- Device: Desktop (100%)
- Tasks: Moderation, support, analytics

### Constraints
- Mobile-first design required
- Load time <2 seconds
- Uptime 99.9%
- Support Thai language + English
- GDPR compliant data handling

### Assumptions and Dependencies
- Users have stable internet connection (3G minimum)
- Users have modern browser (Chrome 90+, Safari 14+)
- Leaflet and OpenStreetMap available
- Supabase and Firebase operational

---

## SPECIFIC REQUIREMENTS

### Functional Requirements

#### [REQ-F001] User Registration & Authentication

**Requirement ID:** REQ-F001  
**Priority:** CRITICAL  
**Status:** In-Scope MVP  

**Description:**
System MUST allow users to create accounts and authenticate.

**Details:**
```
REQ-F001.1: Users MUST be able to sign up with:
  - Email address
  - Password (min 8 characters)
  - Full name
  - Phone number (optional)
  - Accept terms & privacy checkbox

REQ-F001.2: System MUST send verification email after signup
  - Email MUST include verification link
  - Link MUST expire in 24 hours
  - User MUST click link before using account features

REQ-F001.3: Users MUST be able to log in with email & password
  - Invalid credentials MUST show generic error (for security)
  - Account MUST lock after 5 failed attempts (15 min lockout)
  - "Forgot password" link MUST initiate password reset flow

REQ-F001.4: System MUST support OAuth login
  - Google OAuth MUST be supported
  - Facebook OAuth SHOULD be supported (Phase 2)

REQ-F001.5: Authentication tokens MUST:
  - JWT tokens valid for 1 hour (access token)
  - Refresh tokens valid for 7 days
  - Tokens stored in secure HTTP-only cookies
  - CSRF protection enabled on all forms
```

**Acceptance Criteria:**
- ✅ Sign up form validates and stores user securely
- ✅ Verification email received within 1 minute
- ✅ Login works with valid credentials
- ✅ Invalid credentials fail gracefully
- ✅ OAuth redirects complete authorization flow
- ✅ Token refresh works transparently to user

---

#### [REQ-F002] Campsite Discovery & Search

**Requirement ID:** REQ-F002  
**Priority:** CRITICAL  
**Status:** In-Scope MVP  

**Description:**
System MUST provide comprehensive search and discovery capabilities.

**Details:**
```
REQ-F002.1: Search by Location
  - User MUST be able to enter province name
  - Autocomplete MUST suggest matching provinces
  - Search MUST return results in <500ms
  - Results MUST be paginated (20 per page)
  - Map MUST center on searched location

REQ-F002.2: Filtering System
  - System MUST support simultaneous filters:
    ✓ Province (dropdown)
    ✓ Type (multi-select: camping, glamping, tented-resort, bungalow)
    ✓ Price range (slider: ฿0-10,000)
    ✓ Amenities (multi-select: WiFi, AC, Restaurant, etc.)
    ✓ Date range (calendar picker for availability)
    ✓ Capacity (min-max guests)
  - Filters MUST apply with AND logic (all must match)
  - Filters MUST update results in real-time (<300ms)
  - Filter state MUST be reflected in URL params (for sharing)
  - "Clear filters" button MUST reset all filters

REQ-F002.3: Search Results Display
  - Results MUST show:
    ✓ Campsite name, image, price, rating
    ✓ Short description (max 100 chars)
    ✓ Location (province, district)
    ✓ Amenities icons
    ✓ Number of reviews
  - Results MUST be sortable by:
    ✓ Relevance (default)
    ✓ Price (low to high, high to low)
    ✓ Rating (highest first)
    ✓ Newest listings
  - Results grid MUST be responsive:
    ✓ Desktop: 3 columns
    ✓ Tablet: 2 columns
    ✓ Mobile: 1 column

REQ-F002.4: Map View
  - Map MUST display all campsite markers
  - Markers MUST be color-coded by type:
    ✓ Red (#FF4444): Camping
    ✓ Green (#44FF44): Glamping
    ✓ Orange (#FF8844): Tented Resort
    ✓ Yellow (#FFFF44): Bungalow
  - Markers MUST cluster when zoomed out (cluster count shown)
  - Clicking marker MUST show infowindow with:
    ✓ Campsite name
    ✓ Thumbnail image
    ✓ Rating & review count
    ✓ Price range
    ✓ "View Details" link
  - Map filters MUST sync with list filters
```

**Acceptance Criteria:**
- ✅ Search returns results in <500ms
- ✅ All filters work independently and in combination
- ✅ Results update in real-time
- ✅ URL shareable with filters preserved
- ✅ Map markers cluster correctly
- ✅ Mobile map interaction smooth
- ✅ No horizontal scroll on mobile

---

#### [REQ-F003] Campsite Detail Page

**Requirement ID:** REQ-F003  
**Priority:** CRITICAL  
**Status:** In-Scope MVP  

**Description:**
System MUST provide comprehensive detailed information about each campsite.

**Details:**
```
REQ-F003.1: Hero Section
  - Large header image/banner
  - Campsite name, rating, review count
  - "Save to Wishlist" button (heart icon)
  - "Contact Now" / "Book Now" button

REQ-F003.2: Photo Gallery
  - Main image carousel
  - Thumbnail strip (5-8 images visible)
  - Image counter (e.g., "3/15 photos")
  - Lightbox modal on click
  - Navigation with Previous/Next buttons
  - Keyboard navigation support (arrow keys)
  - Touch swipe support (mobile)
  - Image lazy loading

REQ-F003.3: Campsite Information Section
  MUST display:
  - Full description (text)
  - Address with GPS coordinates
  - Phone number (clickable tel: link on mobile)
  - Email address (clickable mailto: link)
  - Website URL (link target="_blank")
  - Social media links (Facebook, Instagram)
  - Check-in time / Check-out time
  - Minimum & Maximum stay duration

REQ-F003.4: Amenities Section
  MUST display:
  - Grid/list of amenities with icons
  - Amenities: WiFi, Electricity, AC, Hot Water, Private Bathroom, 
    Shared Bathroom, Restaurant, Kitchen, Parking, Shower
  - Green checkmark (✓) for present amenities
  - Gray X (✗) for missing amenities
  - Custom amenities if available (sauna, pool, yoga, etc.)

REQ-F003.5: Accommodation Types
  MUST display:
  - Table/card showing each accommodation type:
    ✓ Type name (Twin Tent, Glamping Dome, Safari Tent, etc.)
    ✓ Capacity (number of guests)
    ✓ Price per night
    ✓ Brief description
    ✓ Amenities included (icons)
  - "Select" or "Book Now" button per type

REQ-F003.6: Nearby Attractions
  MUST display:
  - List of nearby attractions with:
    ✓ Attraction name
    ✓ Distance in km
    ✓ Category (hiking, waterfall, temple, etc.)
    ✓ Difficulty level (Easy/Moderate/Hard)
    ✓ Brief description
    ✓ "Get Directions" button (opens Google Maps)

REQ-F003.7: Reviews Section
  MUST display:
  - Overall rating (1-5 stars, rounded to 1 decimal)
  - Review count
  - Rating breakdown (Cleanliness, Staff, Facilities, Value)
  - Individual reviews with:
    ✓ Author name (or "Anonymous")
    ✓ Star rating with color coding
    ✓ Review date ("2 weeks ago" format)
    ✓ Reviewer type badge (Family/Couple/Solo/Group)
    ✓ Review text (expandable if >500 chars)
    ✓ Helpful count with upvote button
    ✓ Verified booking badge
    ✓ Review photos (if any)
  - Sort options: Most Recent, Most Helpful, Highest/Lowest Rating
  - Filter by reviewer type
  - "Write a Review" button (if logged in)
  - Pagination: 5 reviews per page, "Load More" button

REQ-F003.8: Contact & Booking Section
  MUST display:
  - Contact information summary
  - "Send Inquiry" button (opens modal form)
  - "Book Now" button (redirects to external booking site)
  - Contact form fields:
    ✓ Name (pre-filled if logged in)
    ✓ Email (pre-filled if logged in)
    ✓ Phone number
    ✓ Inquiry type dropdown
    ✓ Message text area
    ✓ Submit button
```

**Acceptance Criteria:**
- ✅ Page loads in <1.5s on 4G
- ✅ All sections load with placeholder content initially
- ✅ Images lazy load as user scrolls
- ✅ Mobile layout single column
- ✅ Contact form validates before submission
- ✅ Links functional and open in correct context

---

#### [REQ-F004] Review System

**Requirement ID:** REQ-F004  
**Priority:** HIGH  
**Status:** In-Scope MVP  

**Description:**
System MUST allow authenticated users to submit and view reviews.

**Details:**
```
REQ-F004.1: Review Submission
  User MUST be logged in to submit review
  Review form MUST include:
  - Overall rating: 1-5 stars (required)
  - Cleanliness rating: 1-5 stars (optional)
  - Staff rating: 1-5 stars (optional)
  - Facilities rating: 1-5 stars (optional)
  - Value for money rating: 1-5 stars (optional)
  - Reviewer type: Dropdown (Family/Couple/Solo/Group, required)
  - Review title: Text field (max 100 chars)
  - Review text: Text area (min 20, max 500 chars, required)
  - Photo upload: File upload (up to 5 photos, max 5MB each)
  - Submit button

REQ-F004.2: Review Validation
  MUST validate:
  - Overall rating selected
  - Review text >= 20 characters
  - Photo files < 5MB and valid format (jpg, png, webp)
  - Email format if provided
  - Phone format if provided (Thai format)

REQ-F004.3: Review Storage
  MUST store review with:
  - Campsite ID
  - User ID
  - Ratings (overall + sub-ratings)
  - Review text (sanitized)
  - Photos (compressed, stored in Supabase Storage)
  - Reviewer type
  - Visited date
  - Created timestamp
  - Moderation status (pending, approved, rejected)
  - Helpful count (initialized to 0)
  - IP address (for fraud detection)

REQ-F004.4: Review Display
  MUST show:
  - Reviews sorted by: Most Recent, Most Helpful, Rating
  - Filter by reviewer type
  - Pagination: 5 reviews per page with "Load More"
  - Overall rating calculated from all reviews
  - Rating breakdown (distribution chart, optional)
  - Helpful count with upvote (one per user per review)
  - Verified booking badge (if internal booking)
  - Report inappropriate review link

REQ-F004.5: Moderation Queue
  MUST implement:
  - All new reviews in pending status
  - Admin dashboard showing pending reviews
  - One-click approve/reject
  - Spam detection (keyword filtering)
  - Manual moderation queue
  - Approval within 24 hours (SLA)

REQ-F004.6: Owner Review Responses
  SHOULD allow owners to:
  - View all reviews for their camp
  - Reply to reviews
  - Mark reviews as "Addressed" or "Helpful"
```

**Acceptance Criteria:**
- ✅ Form validation prevents invalid submissions
- ✅ Reviews stored securely with user attribution
- ✅ Moderation queue functional
- ✅ Overall rating calculation accurate
- ✅ Mobile form responsive and usable
- ✅ Photos optimized before storage

---

#### [REQ-F005] User Profile & Wishlist

**Requirement ID:** REQ-F005  
**Priority:** HIGH  
**Status:** In-Scope MVP  

**Description:**
System MUST provide user profile management and wishlist functionality.

**Details:**
```
REQ-F005.1: User Profile
  Logged-in users MUST be able to:
  - View their profile (name, email, phone, bio, avatar)
  - Edit profile (all fields except email)
  - Upload/change avatar image
  - View registration date
  - View account preferences
  - Delete account (with confirmation)

REQ-F005.2: Profile Privacy
  Users SHOULD be able to:
  - Set profile to public or private
  - Choose what information is visible
  - Hide from search results (optional)

REQ-F005.3: Wishlist Management
  Users MUST be able to:
  - Click heart icon on campsite card to "Save"
  - View their complete wishlist (My Wishlist page)
  - Remove camps from wishlist
  - See wishlist count in header
  - Access wishlist from profile menu
  - Wishlist MUST persist across sessions
  - Wishlist MUST sync across tabs in real-time (optional)

REQ-F005.4: Wishlist Features
  Wishlist page MUST show:
  - Grid of saved campsite cards
  - Sort options: Saved date, Rating, Price
  - Filter by campsite type
  - "Compare Selected" button (when 2+ selected)
  - "Remove from wishlist" button per camp
  - Empty state message with recommendations
  - Share wishlist link (generate shareable URL, phase 2)

REQ-F005.5: Campsite Comparison
  Comparison feature MUST allow:
  - Select 2-3 camps from wishlist
  - Display comparison table with:
    ✓ Camp names (columns)
    ✓ Attributes (rows): Type, Price, Amenities, Rating, etc.
    ✓ Amenities shown as checkmarks
    ✓ Prices formatted with currency
  - Mobile: Scrollable table or tab-based view
  - "Book" button per camp to view details
  - Highlight differences option
```

**Acceptance Criteria:**
- ✅ Profile edit form validates and saves
- ✅ Avatar image compressed before storage
- ✅ Wishlist persists across sessions
- ✅ Heart icon reflects saved status in real-time
- ✅ Comparison table displays all attributes correctly
- ✅ Mobile comparison readable

---

#### [REQ-F006] Contact & Inquiry Management

**Requirement ID:** REQ-F006  
**Priority:** HIGH  
**Status:** In-Scope MVP  

**Description:**
System MUST manage communication between travelers and campsite owners.

**Details:**
```
REQ-F006.1: Inquiry Submission
  Contact form MUST include:
  - Name field (required, min 3 chars)
  - Email field (required, valid format)
  - Phone field (optional, Thai format validation)
  - Inquiry type: Dropdown (Booking/General/Complaint/Other)
  - Message: Text area (required, min 20, max 2000 chars)
  - Check-in date (optional, date picker)
  - Check-out date (optional, date picker)
  - reCAPTCHA verification (optional for security)
  - Submit button

REQ-F006.2: Inquiry Validation
  MUST validate:
  - All required fields filled
  - Email format correct
  - Phone format correct (if provided)
  - Message length within limits
  - Check-out date > check-in date (if both provided)
  - Spam detection (keywords, URL count)
  - Rate limiting: Max 5 inquiries per user per 24 hours

REQ-F006.3: Inquiry Storage
  MUST store:
  - Campsite ID
  - User ID (if logged in) or email
  - Visitor name & contact info
  - Inquiry type
  - Message (sanitized)
  - Dates interested
  - Timestamp
  - Status (new, in-progress, resolved, closed)
  - IP address (for abuse detection)

REQ-F006.4: Email Notifications
  MUST send:
  - Confirmation email to user: "Thanks for your inquiry"
  - Notification email to owner: "New inquiry from [name]"
    ✓ Include full inquiry details
    ✓ Include "Reply" link
    ✓ Include dashboard link
  - All emails sent within 1 minute

REQ-F006.5: Owner Management
  Owners MUST be able to:
  - View all inquiries (dashboard)
  - Filter by: New, Responded, Resolved, Closed
  - Sort by: Newest, Oldest
  - Click to read full inquiry
  - Reply via text form
  - Mark as resolved/closed
  - See response time metrics
  - Search inquiries by guest name/email

REQ-F006.6: Guest Follow-up
  System SHOULD:
  - Send reminder email to guest after 3 days (if no booking)
  - Track inquiry to booking conversion
  - Collect feedback from completed bookings
```

**Acceptance Criteria:**
- ✅ Contact form validates all fields
- ✅ Confirmation email sent to user
- ✅ Owner notification email sent with full details
- ✅ Owner can reply through dashboard
- ✅ Rate limiting prevents spam
- ✅ Inquiry persists with correct status

---

### Non-Functional Requirements

#### [REQ-NF001] Performance

**Requirement ID:** REQ-NF001  
**Priority:** CRITICAL  

```
REQ-NF001.1: Page Load Times
  - Homepage: <2 seconds (first load)
  - Search results: <1 second (cached)
  - Campsite detail: <1.5 seconds
  - Dashboard: <2 seconds
  - Mobile (4G): <3 seconds

REQ-NF001.2: Web Vitals (Google Core Web Vitals)
  - Largest Contentful Paint (LCP): <2.5 seconds
  - First Input Delay (FID): <100 milliseconds
  - Cumulative Layout Shift (CLS): <0.1
  - Time to First Byte (TTFB): <600ms

REQ-NF001.3: API Response Times
  - Search: <500ms
  - List operations: <200ms
  - Detail view: <300ms
  - Form submission: <1000ms
  - 95th percentile response time

REQ-NF001.4: Image Optimization
  - All images <100KB after compression
  - Lazy loading for below-fold images
  - Responsive images (srcset) for different screen sizes
  - WebP format with JPG fallback

REQ-NF001.5: Caching Strategy
  - Static assets: 1 month cache
  - API responses: 5 minutes cache
  - User data: No cache (always fresh)
  - Map tiles: 7 days cache
```

**Acceptance Criteria:**
- ✅ Load time <2s on 4G network
- ✅ Core Web Vitals all green
- ✅ No performance regressions with each deploy
- ✅ Lighthouse score >90

---

#### [REQ-NF002] Security

**Requirement ID:** REQ-NF002  
**Priority:** CRITICAL  

```
REQ-NF002.1: Data Protection
  - All data transmitted via HTTPS/TLS 1.3+
  - Passwords hashed with bcrypt (10+ rounds)
  - Sensitive data encrypted at rest
  - PII never logged (email, phone, address)
  - GDPR compliant data processing
  - User data deletion on account removal

REQ-NF002.2: Authentication & Authorization (Supabase Auth)
  - Supabase Auth for all authentication flows
  - JWT tokens (1 hour validity) + Refresh tokens (7 days)
  - Refresh token rotation handled by Supabase
  - Session timeout: 1 hour inactivity
  - Secure HTTP-only cookies
  - CSRF tokens on all state-changing requests
  - Google OAuth 2.0 via Supabase Auth
  - Row-level security (RLS) policies in Supabase database

REQ-NF002.3: Input Validation
  - All user inputs validated server-side
  - SQL injection prevention (parameterized queries)
  - XSS prevention (input sanitization, CSP headers)
  - Rate limiting on all endpoints
  - File upload validation (size, type, malware scanning)

REQ-NF002.4: API Security
  - API key rotation (if used)
  - Rate limiting: 100 requests per minute per IP
  - DDoS protection via Cloudflare or similar
  - API documentation without sensitive info
  - Encrypted API responses (HTTPS)

REQ-NF002.5: Compliance
  - OWASP Top 10 compliance
  - Security headers: CSP, X-Frame-Options, X-Content-Type-Options
  - Regular security audits (quarterly)
  - Penetration testing (annual)
  - Vulnerability disclosure program
  - Privacy policy and terms updated
```

**Acceptance Criteria:**
- ✅ No SQL injection vulnerabilities
- ✅ No XSS vulnerabilities
- ✅ HTTPS enforced
- ✅ Passwords stored securely
- ✅ Security headers present
- ✅ GDPR data deletion works

---

#### [REQ-NF003] Scalability & Availability

**Requirement ID:** REQ-NF003  
**Priority:** CRITICAL  

```
REQ-NF003.1: Uptime & Reliability
  - System availability: 99.9% uptime SLA
  - Recovery Time Objective (RTO): 1 hour
  - Recovery Point Objective (RPO): 30 minutes
  - Health check: Every 5 minutes
  - Automated backups: Every 6 hours
  - Disaster recovery tested quarterly

REQ-NF003.2: Scalability
  - Support 10,000+ concurrent users (MVP)
  - Database: 1M+ records minimum
  - Auto-scaling based on traffic
  - Load balancing across instances
  - CDN for static content (Firebase global CDN)
  - Database read replicas (if needed)

REQ-NF003.3: Monitoring & Alerting
  - Error rate monitoring (Sentry)
  - Performance monitoring (New Relic or similar)
  - Uptime monitoring (StatusCake or similar)
  - Alert on: High errors, Slow response, Downtime
  - Logging: Central log aggregation
  - Metrics: CPU, memory, database connections

REQ-NF003.4: Database Scaling
  - Supabase database: Vertical scaling as needed
  - Connection pooling: pgBouncer
  - Query optimization: Index on frequently searched columns
  - Archival strategy: Move old data to cold storage (Year 2)
```

**Acceptance Criteria:**
- ✅ 99.9% uptime achieved
- ✅ Auto-scaling triggers on load
- ✅ Database responses consistent
- ✅ Monitoring dashboards active
- ✅ Alert system functional

---

#### [REQ-NF004] Usability & Accessibility

**Requirement ID:** REQ-NF004  
**Priority:** HIGH  

```
REQ-NF004.1: Mobile Responsiveness
  - Mobile-first design approach
  - Responsive from 320px to 2560px
  - Touch-friendly buttons: Min 44x44px
  - No horizontal scroll needed on mobile
  - Readable text without pinch-to-zoom
  - Input fields: Max width 100% on mobile

REQ-NF004.2: Accessibility (WCAG 2.1 Level AA)
  - Alt text on all images
  - Form labels properly associated
  - Color contrast: Min 4.5:1 for normal text
  - Keyboard navigation fully supported
  - Focus indicators visible
  - Screen reader compatible
  - ARIA labels where needed
  - No keyboard traps
  - Skip navigation link

REQ-NF004.3: Internationalization
  - Thai language (default)
  - English language support
  - Thai Baht (฿) currency display
  - Date format: DD/MM/YYYY (Thai style)
  - Number format: Thai separator (1,234.50)
  - Thai phone number validation
  - Language switcher in header

REQ-NF004.4: User Experience
  - Loading states with spinners
  - Error messages: User-friendly, non-technical
  - Success feedback: Toast notifications
  - Form validation: Real-time feedback
  - Undo/Redo: For critical actions
  - Empty states: Helpful messages + recommendations
```

**Acceptance Criteria:**
- ✅ Mobile layout responsive and usable
- ✅ Accessibility audit: No critical issues
- ✅ Keyboard navigation works throughout
- ✅ Thai and English content displays correctly
- ✅ Color contrast meets WCAG AA standards

---

## EXTERNAL INTERFACE REQUIREMENTS

### [REQ-EI001] User Interfaces

**Homepage**
- Hero section with search
- Featured campsites carousel
- Category showcase
- Testimonials
- Footer with links

**Search Page**
- Filters sidebar (desktop) / modal (mobile)
- Results grid
- Map toggle button
- Sorting options
- Pagination

**Campsite Detail Page**
- Hero image with gallery
- Sticky header
- Amenities checklist
- Reviews section
- Contact form
- "Book Now" CTA

**Admin Dashboard**
- Sidebar navigation
- Overview cards (metrics)
- Listings table
- Inquiries list
- Analytics charts

### [REQ-EI002] Hardware Interfaces
- **Input:** Keyboard, mouse, touch screen
- **Output:** Screen display (web browser)
- **Network:** Internet (broadband, mobile, WiFi)

### [REQ-EI003] Software Interfaces

#### Database Interface (Supabase PostgreSQL)
- REST API auto-generated
- GraphQL endpoint available
- Row-Level Security (RLS) policies
- Connection limit: 10 concurrent per user

#### Third-Party APIs
- **Leaflet + Plugins:** Maps display, clustering (leaflet.markercluster)
- **OpenStreetMap / Nominatim:** Geocoding services
- **Mailgun API:** Transactional emails
- **Firebase:** Hosting, Cloud Run, Analytics

#### Browser APIs
- Geolocation API (for map centering)
- Local Storage (for user preferences)
- IndexedDB (for offline data, optional)
- Service Workers (for offline support, phase 2)

### [REQ-EI004] Communication Interfaces
- HTTPS/TLS 1.3 for all communication
- Email: SMTP via Mailgun
- Real-time updates: Supabase Realtime (optional)
- Webhooks: For email delivery notifications

---

## SYSTEM FEATURES

### Feature Set 1: Core Discovery
- ✅ Full-text search
- ✅ Advanced filtering
- ✅ Interactive maps
- ✅ Sorting options
- ✅ Pagination

### Feature Set 2: Information & Social Proof
- ✅ Detailed listing pages
- ✅ Photo galleries
- ✅ Review system
- ✅ Rating aggregation
- ✅ Contact information

### Feature Set 3: User Engagement
- ✅ User registration & auth
- ✅ Wishlist management
- ✅ Campsite comparison
- ✅ Inquiry submission
- ✅ Review submission

### Feature Set 4: Owner Tools
- ✅ Basic dashboard
- ✅ Listing management
- ✅ Inquiry viewing
- ✅ Analytics overview

---

## OTHER NON-FUNCTIONAL REQUIREMENTS

### [REQ-NF005] Compatibility

```
REQ-NF005.1: Browser Support
  - Chrome 90+ (Windows, Mac, Linux)
  - Firefox 88+ (Windows, Mac, Linux)
  - Safari 14+ (Mac, iOS)
  - Edge 90+ (Windows)
  - Mobile browsers: Chrome, Firefox, Safari

REQ-NF005.2: Device Support
  - Desktop: 1024px+ width
  - Tablet: 768px-1023px width
  - Mobile: 320px-767px width
  - Tested on 50+ devices
  - Portrait and landscape orientations

REQ-NF005.3: OS Compatibility
  - Windows 10+
  - macOS 10.14+
  - iOS 12+
  - Android 8+
```

### [REQ-NF006] Maintainability

```
REQ-NF006.1: Monorepo Architecture (Turborepo)
  - apps/campsite-frontend: Next.js 14+ application (Firebase App Hosting)
  - apps/campsite-backend: Node.js + Express + TypeScript API server (Cloud Run)
  - packages/shared: Shared TypeScript types, Zod schemas, utilities
  - packages/config: Shared ESLint, TypeScript, Prettier configs
  - Turborepo for task orchestration and caching
  - pnpm for package management

REQ-NF006.2: Code Quality
  - ESLint configured (shared config in packages/config)
  - Prettier formatting enforced
  - TypeScript strict mode
  - JSDoc comments on functions
  - Code review process
  - Husky + lint-staged for pre-commit hooks

REQ-NF006.3: Documentation
  - README.md for setup (root + each app)
  - API documentation (Swagger/OpenAPI)
  - Database schema docs
  - Component Storybook
  - Deployment guides
  - Runbooks for common issues

REQ-NF006.4: Testing
  - Unit tests: >80% coverage (per app)
  - Integration tests: Critical flows
  - E2E tests: User journeys (Playwright)
  - Performance tests: Load testing
  - Accessibility tests: Axe, WAVE
```

### [REQ-NF007] Supportability

```
REQ-NF007.1: Error Handling
  - Graceful error messages
  - Error logging (Sentry)
  - User-friendly error pages
  - Fallback UI (no white screen)
  - Network error handling

REQ-NF007.2: Support Channels
  - In-app support: Chat (phase 2)
  - Email support: support@camping-thailand.com
  - FAQ page
  - Status page: status.camping-thailand.com
  - Social media support

REQ-NF007.3: Monitoring
  - Server uptime monitoring
  - Error tracking (Sentry)
  - Performance monitoring
  - User analytics (Firebase)
  - Database health checks
```

---

## APPENDICES

### A. Glossary

| Term | Definition |
|------|-----------|
| **MVP** | Minimum Viable Product - Core features only |
| **RLS** | Row-Level Security - Database-level access control |
| **JWT** | JSON Web Token - Stateless authentication |
| **API** | Application Programming Interface |
| **HTTPS** | HTTP Secure - Encrypted web communication |
| **GDPR** | General Data Protection Regulation |
| **WCAG** | Web Content Accessibility Guidelines |
| **SLA** | Service Level Agreement |
| **RTO** | Recovery Time Objective |
| **RPO** | Recovery Point Objective |
| **CTR** | Click-Through Rate |
| **UX** | User Experience |

### B. References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- Google Core Web Vitals: https://web.dev/vitals/
- RFC 5322 (Email): https://tools.ietf.org/html/rfc5322
- GDPR Compliance: https://gdpr-info.eu/

### C. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-17 | Tech Lead | Initial SRS document |

---

**End of SRS**