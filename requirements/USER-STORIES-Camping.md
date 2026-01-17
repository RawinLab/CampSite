# 👥 User Stories & Acceptance Criteria
## Camping Thailand Platform

**Document Version:** 1.1
**Last Updated:** January 17, 2026
**Format:** Gherkin + User Story Template

---

## MVP vs PHASE 2 SCOPE

### MVP (4-6 weeks)
All user stories **except** the following:

### Phase 2 (deferred)
| Story | Feature | Reason |
|-------|---------|--------|
| US-005 | Date Availability Filter | Complex booking/calendar system |

---

## TABLE OF CONTENTS

0. [EPIC 0: Project Setup](#epic-0-project-setup)
1. [EPIC 1: Search & Discovery](#epic-1-search--discovery)
2. [EPIC 2: Campsite Details & Information](#epic-2-campsite-details--information)
3. [EPIC 3: Reviews & Social Proof](#epic-3-reviews--social-proof)
4. [EPIC 4: Maps & Location](#epic-4-maps--location)
5. [EPIC 5: User Authentication & Profile](#epic-5-user-authentication--profile)
6. [EPIC 6: Wishlist & Favorites](#epic-6-wishlist--favorites)
7. [EPIC 7: Contact & Booking](#epic-7-contact--booking)
8. [EPIC 8: Admin Dashboard](#epic-8-admin-dashboard)

---

## EPIC 0: PROJECT SETUP

### US-000: Developer sets up monorepo development environment

**As a** developer
**I want to** set up the Turborepo monorepo structure
**So that** I can develop frontend and backend in a unified codebase

**Acceptance Criteria:**
```gherkin
Feature: Monorepo Development Environment
  Scenario: Developer clones and sets up project
    Given developer has Node.js 18+ and pnpm installed
    When they clone the repository
    And run "pnpm install"
    Then all dependencies install across workspaces
    And no version conflicts occur

  Scenario: Developer runs development servers
    Given project is set up
    When developer runs "pnpm dev"
    Then Turborepo starts both apps concurrently:
      | apps/campsite-frontend on port 3000 |
      | apps/campsite-backend on port 4000  |
    And hot reload works for both apps
    And shared packages are linked

  Scenario: Developer builds for production
    Given project is set up
    When developer runs "pnpm build"
    Then Turborepo builds in correct order:
      | 1. packages/shared (dependencies first) |
      | 2. apps/campsite-backend              |
      | 3. apps/campsite-frontend             |
    And build cache is utilized for unchanged packages

  Scenario: Developer runs tests
    Given project is set up
    When developer runs "pnpm test"
    Then tests run across all packages
    And coverage reports generated per package
    And combined coverage available
```

**Project Structure:**
```
campsite/
├── apps/
│   ├── campsite-frontend/    # Next.js 14+ (App Router)
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.js
│   └── campsite-backend/     # Node.js + Express/Fastify
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared/               # Shared types, utilities
│   │   ├── src/
│   │   └── package.json
│   ├── ui/                   # Shared UI components (optional)
│   └── config/               # ESLint, TypeScript, Prettier
│       ├── eslint/
│       ├── typescript/
│       └── package.json
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .gitignore
```

**Definition of Done:**
- ✅ Turborepo configured with proper task dependencies
- ✅ pnpm workspaces configured
- ✅ Shared TypeScript configs working
- ✅ ESLint + Prettier shared configs
- ✅ Hot reload working for both apps
- ✅ Build caching functional
- ✅ README with setup instructions

**Story Points:** 5
**Priority:** CRITICAL
**Sprint:** 0 (Setup)

---

## EPIC 1: SEARCH & DISCOVERY

### US-001: User searches for camping sites by location

**As a** traveler planning a weekend trip  
**I want to** search for camping sites by province or region  
**So that** I can find camps near my desired destination  

**Acceptance Criteria:**
```gherkin
Feature: Search Camping Sites by Location
  Scenario: User searches by province name
    Given a user is on the search page
    When they enter "Chiang Mai" in the search field
    And click the "Search" button
    Then the system displays camping sites in Chiang Mai province
    And results are sorted by relevance
    And the map centers on Chiang Mai coordinates
    And pagination shows 20 results per page
    And search completes in less than 500ms

  Scenario: User receives autocomplete suggestions
    Given a user is on the search page
    When they type "Chi" in the search field
    Then autocomplete suggestions appear:
      | Chiang Mai        |
      | Chiang Rai        |
      | Chumphon          |
    And user can click to select a suggestion

  Scenario: User searches for invalid province
    Given a user enters "Notreal Province"
    When they click "Search"
    Then an error message appears: "No results found for Notreal Province"
    And suggestions for similar provinces are shown
    And the map does not change

  Scenario: User searches on mobile
    Given a user on mobile device
    When they enter province name and search
    Then results display in single column layout
    And map view is optional toggle button
    And keyboard dismisses after search
```

**Definition of Done:**
- ✅ Autocomplete works for all 77 Thai provinces
- ✅ Search queries return results in <500ms
- ✅ Map zooms to correct coordinates
- ✅ Mobile layout tested (iPhone 12, Samsung A51)
- ✅ Unit tests: >80% coverage
- ✅ Integration test: Database query optimized
- ✅ Error handling for network failures

**Story Points:** 5  
**Priority:** CRITICAL  
**Sprint:** 1  
**Dependencies:** Database migration complete

---

### US-002: User filters camps by type

**As a** specific traveler  
**I want to** filter camping sites by accommodation type  
**So that** I can find camps matching my preference (camping vs glamping, etc.)  

**Acceptance Criteria:**
```gherkin
Feature: Filter by Campsite Type
  Scenario: User selects single type filter
    Given a user is viewing search results
    When they click the "Type" filter dropdown
    Then they see options:
      | Camping       |
      | Glamping      |
      | Tented Resort |
      | Bungalow      |
    When they click "Glamping"
    Then only glamping sites display
    And filter badge shows "Type: Glamping"
    And result count updates to show filtered number

  Scenario: User selects multiple types
    Given filters available on search page
    When user clicks "Glamping" checkbox
    And also clicks "Tented Resort" checkbox
    Then results show BOTH glamping AND tented resort sites
    And filter badge shows "Type: 2 selected"
    And results count shows total matching sites

  Scenario: Results update in real-time
    Given a user has type filter applied
    When they change the filter selection
    Then results update in <300ms
    And no page refresh occurs
    And scroll position preserved

  Scenario: Filter state persists in URL
    Given a user filters by type
    When they copy the current URL
    And share it with a friend
    Then friend clicks link and sees same filters applied
    And URL contains: ?types=glamping,tented-resort

  Scenario: User clears filters
    Given a user has type filters applied
    When they click "Clear Filters"
    Then all type selections removed
    And results show all site types
    And URL reverts to base search URL
```

**Definition of Done:**
- ✅ Multi-select filter functional
- ✅ Real-time filtering without page refresh
- ✅ Performance: <300ms update time
- ✅ URL parameters reflect selected filters
- ✅ Clear button removes all selections
- ✅ Mobile UI: filters as chips/buttons
- ✅ E2E tests: Playwright test suite

**Story Points:** 3  
**Priority:** CRITICAL  
**Sprint:** 1  

---

### US-003: User filters camps by price range

**As a** budget-conscious traveler  
**I want to** filter camping sites by price per night  
**So that** I can find affordable options within my budget  

**Acceptance Criteria:**
```gherkin
Feature: Filter by Price Range
  Scenario: User sets price range with slider
    Given search results page displayed
    When user clicks "Price" filter
    Then a dual-slider appears
    And shows range: ฿0 - ฿10,000
    And displays min/max text inputs

  Scenario: User drags slider to set budget
    Given price slider displayed
    When user drags min slider to ฿500
    And drags max slider to ฿2,000
    Then results filter to show camps with prices in that range
    And display updates in <300ms
    And text inputs update to show ฿500 - ฿2,000

  Scenario: User validates min < max
    Given sliders displayed
    When user attempts to set min > max
    Then system prevents invalid range
    And shows tooltip: "Minimum cannot exceed maximum"

  Scenario: Filter displays in results
    Given price filter applied (฿100-฿500)
    When user views results
    Then each camp shows price within range
    And filter badge shows "Price: ฿100 - ฿500"
    And result count updates

  Scenario: User inputs price manually
    Given price range input fields visible
    When user types "1500" in min field
    And "3000" in max field
    And presses Enter
    Then results filter to that range
    And sliders adjust to match inputs
```

**Definition of Done:**
- ✅ Slider works smoothly without lag
- ✅ Price validation prevents min > max
- ✅ Results refresh in <300ms
- ✅ Mobile touch controls responsive
- ✅ Thai Baht symbol displays correctly
- ✅ Keyboard navigation supported
- ✅ Accessibility: ARIA labels present

**Story Points:** 4  
**Priority:** CRITICAL  
**Sprint:** 1  

---

### US-004: User filters camps by amenities

**As a** traveler with specific needs  
**I want to** filter camping sites by available amenities  
**So that** I can find camps with facilities I require (WiFi, AC, hot water, etc.)  

**Acceptance Criteria:**
```gherkin
Feature: Filter by Amenities
  Scenario: User selects multiple amenities
    Given search results displayed
    When user clicks "Amenities" filter
    Then checkboxes appear for:
      | ☐ WiFi              |
      | ☐ Electricity       |
      | ☐ AC                |
      | ☐ Hot Water         |
      | ☐ Private Bathroom  |
      | ☐ Restaurant        |
      | ☐ Kitchen           |
      | ☐ Parking           |

  Scenario: AND logic applied to amenities
    Given amenities filter available
    When user selects "WiFi" checkbox
    And also selects "AC" checkbox
    Then only camps with BOTH WiFi AND AC display
    And filter badge shows "WiFi, AC (2 filters)"
    And result count updates

  Scenario: Real-time filter update
    Given filters displayed
    When user clicks an amenity checkbox
    Then results update in <300ms
    And no page reload
    And scroll position maintained

  Scenario: Icons display in results
    Given amenities filter applied
    When viewing results
    Then amenity icons display in each card:
      | WiFi icon, AC icon, etc. |
    And icons are recognizable and accessible

  Scenario: Mobile amenities filter
    Given user on mobile device
    When user clicks "Amenities"
    Then filter appears as modal or bottom sheet
    And checkboxes stack vertically
    And easy to tap (min 44x44px)
```

**Definition of Done:**
- ✅ All 8 amenities fully functional
- ✅ AND logic correctly applied (must have all)
- ✅ Amenity icons display and scale correctly
- ✅ Filter state saved in URL
- ✅ Mobile responsive layout
- ✅ Performance: <300ms filter response
- ✅ Accessibility: Checkboxes properly labeled

**Story Points:** 5  
**Priority:** CRITICAL  
**Sprint:** 1  

---

### US-005: User filters camps by date availability ⏳ PHASE 2

**As a** forward planner
**I want to** search for camps available on specific dates
**So that** I can find available accommodations for my trip

> **Note:** This feature is deferred to Phase 2 due to complexity. MVP will show all campsites without real-time availability filtering.  

**Acceptance Criteria:**
```gherkin
Feature: Filter by Availability Dates
  Scenario: User selects check-in and check-out dates
    Given search page displayed
    When user clicks "Check-in" date field
    Then calendar picker appears
    And past dates are disabled (grayed out)
    When user selects Feb 15, 2026
    Then "Check-out" field becomes active
    And user can select Feb 17, 2026 (must be > check-in)

  Scenario: System calculates stay duration
    Given check-in: Feb 15, 2026
    And check-out: Feb 17, 2026
    When user views results
    Then page shows "2 nights"
    And price calculation shown: price_per_night × 2
    And total estimated cost displayed

  Scenario: Only available camps shown
    Given dates: Feb 15-17 selected
    When user searches
    Then only camps with availability on ALL dates appear
    And camps with bookings those dates hidden
    And "Not available" status shown elsewhere

  Scenario: Mobile date picker
    Given user on mobile device
    When they click date field
    Then mobile-optimized date picker appears
    And dates easily selectable with touch
    And calendar scrollable if needed

  Scenario: User clears date filter
    Given dates selected
    When user clicks "X" on date fields
    Then dates cleared
    And results show all camps (all dates)
    And calendar resets to today
```

**Definition of Done:**
- ✅ Calendar picker intuitive and usable
- ✅ Past dates properly disabled
- ✅ Check-out > check-in validation
- ✅ Mobile-friendly date picker
- ✅ Availability data from DB accurate
- ✅ Date format consistent (YYYY-MM-DD)
- ✅ URL preserves date parameters
- ✅ E2E test coverage for all date scenarios

**Story Points:** 6
**Priority:** PHASE 2 (deferred from MVP)
**Sprint:** Phase 2

---

## EPIC 2: CAMPSITE DETAILS & INFORMATION

### US-006: User views detailed campsite information

**As a** interested traveler  
**I want to** view comprehensive information about a specific campsite  
**So that** I can make an informed booking decision  

**Acceptance Criteria:**
```gherkin
Feature: View Campsite Detail Page
  Scenario: User clicks on campsite from results
    Given search results displayed
    When user clicks a campsite card
    Then detail page loads
    And shows all campsite information:
      | Campsite name                    |
      | Full description                 |
      | Full address with coordinates    |
      | Contact: Phone, Email, Website   |
      | Social media links               |
      | Check-in/check-out times         |
      | Overall rating & review count    |
      | Gallery with images              |
      | Amenities checklist              |
      | Accommodation types & pricing    |
      | Nearby attractions               |
      | Reviews section                  |
      | Contact form                     |

  Scenario: Hero image displays prominently
    Given detail page loaded
    When page first appears
    Then large hero image displays at top
    And campsite name overlaid on image
    And rating displayed
    And "Save to Wishlist" button visible
    And "Book Now" CTA button visible

  Scenario: Page loads progressively
    Given user on 4G connection
    When detail page loads
    Then hero image loads first (placeholder shown initially)
    And main content loads
    And images lazy load as user scrolls
    And page fully load in <1.5 seconds

  Scenario: Mobile layout responsive
    Given user on mobile device
    When they view detail page
    Then text readable without horizontal scroll
    And images scale to fit screen
    And buttons touch-friendly (>44x44px)
    And single column layout
    And sticky header with key info

  Scenario: Share campsite
    Given detail page displayed
    When user clicks "Share" button
    Then share options appear:
      | Facebook          |
      | Twitter           |
      | Copy Link         |
      | WhatsApp          |
    And shared link includes campsite info
```

**Definition of Done:**
- ✅ All fields display correctly from DB
- ✅ External links open in new tabs
- ✅ Images load with blur-up placeholders
- ✅ Lazy loading for below-fold images
- ✅ Page load time <1.5s on 4G
- ✅ Mobile tested on iPhone 12, Samsung A51
- ✅ Accessibility: Alt text on all images
- ✅ SEO: Meta tags for social sharing

**Story Points:** 8  
**Priority:** CRITICAL  
**Sprint:** 1-2  

---

### US-007: User views campsite photo gallery

**As a** visual traveler  
**I want to** view high-quality photos of the campsite  
**So that** I can see what the campsite actually looks like  

**Acceptance Criteria:**
```gherkin
Feature: Photo Gallery
  Scenario: User views gallery on detail page
    Given detail page loaded
    When user sees gallery section
    Then displays:
      | Main large image          |
      | Thumbnail strip (5-8)     |
      | Image counter "3/12"      |
      | Navigation arrows         |

  Scenario: User navigates with thumbnails
    Given gallery visible
    When user clicks on thumbnail
    Then main image updates
    And counter updates (e.g., "5/12")
    And transition smooth (200ms)

  Scenario: User opens lightbox
    Given gallery displayed
    When user clicks main image
    Then fullscreen lightbox modal opens
    And displays current image centered
    And shows next/prev arrows
    And shows close button
    And image fills available space

  Scenario: Lightbox navigation
    Given lightbox open with image
    When user clicks next arrow
    Then next image loads with animation
    And counter updates
    And arrows stay accessible
    When user presses keyboard arrow right
    Then next image loads (desktop)
    When user swipes left on mobile
    Then next image loads

  Scenario: Image optimization
    Given multiple high-res images
    When gallery loads
    Then images compressed (<100KB each)
    And lazy loaded below fold
    And WebP format with JPG fallback
    And EXIF data removed (privacy)
```

**Definition of Done:**
- ✅ Gallery loads 3-5 images initially
- ✅ Lightbox smooth transitions
- ✅ Touch swipe gestures work
- ✅ Keyboard shortcuts functional (desktop)
- ✅ Images optimized (<100KB)
- ✅ No EXIF data in images
- ✅ Tested on slow 3G connection

**Story Points:** 5  
**Priority:** HIGH  
**Sprint:** 2  

---

### US-008: User views accommodation types and pricing

**As a** budget planner  
**I want to** see different accommodation types and their prices  
**So that** I can choose the option best suited to my budget and needs  

**Acceptance Criteria:**
```gherkin
Feature: Accommodation Types & Pricing
  Scenario: User views accommodation options
    Given detail page loaded
    When user scrolls to "Accommodation Types" section
    Then displays table/cards showing:
      | Accommodation Name (Twin Tent, Glamping Dome) |
      | Capacity (2 persons)                           |
      | Price per night (฿1,500)                      |
      | Brief description                             |
      | Amenities included (bed, fan, AC)             |
      | "Select" or "Book Now" button                 |

  Scenario: Price formatting
    Given accommodation list displayed
    When viewing prices
    Then prices formatted with:
      | Thai Baht symbol: ฿              |
      | Thousand separator: 1,500        |
      | No decimal if whole number       |
    And prices match database values

  Scenario: User selects accommodation
    Given accommodation options visible
    When user clicks "Select" button
    Then accommodation highlights/becomes active
    And booking flow begins OR redirects to external booking

  Scenario: Special pricing applied
    Given campsite has special rates
    When user checks specific dates
    Then prices reflect:
      | Weekday discount (if applicable)  |
      | Holiday premium (if applicable)   |
      | Minimum stay discount             |
    And pricing displayed clearly

  Scenario: Mobile layout
    Given user on mobile device
    When viewing accommodations
    Then table converts to card layout
    And card stacks vertically
    And price prominent on each card
    And buttons large enough to tap
```

**Definition of Done:**
- ✅ All accommodation types from DB display
- ✅ Pricing formats with Thai Baht (฿)
- ✅ Amenity icons display correctly
- ✅ Responsive on all screen sizes
- ✅ Price calculations account for discounts
- ✅ Click tracking for analytics
- ✅ Database queries optimized

**Story Points:** 5  
**Priority:** CRITICAL  
**Sprint:** 2  

---

## EPIC 3: REVIEWS & SOCIAL PROOF

### US-009: User views campsite reviews and ratings

**As a** decision maker  
**I want to** read reviews and see ratings from other travelers  
**So that** I can assess campsite quality before booking  

**Acceptance Criteria:**
```gherkin
Feature: View Reviews & Ratings
  Scenario: User views overall rating
    Given detail page loaded
    When user scrolls to "Reviews" section
    Then displays:
      | Overall rating: 4.5/5 stars      |
      | Total reviews: "24 reviews"      |
      | Rating breakdown:                |
      |   Cleanliness: 4.6/5 (with bars)|
      |   Staff: 4.7/5                  |
      |   Facilities: 4.3/5             |
      |   Value for Money: 4.2/5        |

  Scenario: User views individual reviews
    Given reviews section loaded
    When user scrolls through reviews
    Then each review shows:
      | Author name (or "Anonymous")         |
      | Star rating (1-5 stars with color)   |
      | Review date ("2 weeks ago" format)  |
      | Reviewer type badge (Family, etc.)  |
      | Review text (expandable if long)    |
      | Helpful count with upvote button    |
      | "Verified booking" badge (if true)  |
      | Review photos (if included)         |

  Scenario: User sorts reviews
    Given reviews displayed
    When user clicks "Sort" dropdown
    Then options appear:
      | Most recent  |
      | Most helpful |
      | Highest rating |
      | Lowest rating |
    When user selects option
    Then reviews reorder accordingly
    And update in <300ms

  Scenario: User filters reviews by type
    Given reviews displayed
    When user clicks "Filter by type"
    Then filter options appear:
      | All reviews       |
      | Family trips      |
      | Couple trips      |
      | Solo travelers    |
      | Group trips       |
    When user selects option
    Then displays only matching reviews

  Scenario: Helpful count interaction
    Given reviews displayed
    When user clicks thumbs-up (👍) on review
    Then helpful count increments
    And button becomes highlighted
    And only one vote per user per review allowed
```

**Definition of Done:**
- ✅ Ratings aggregation logic correct
- ✅ Review timestamps formatted correctly
- ✅ Sorting functional without page refresh
- ✅ Filtering displays correct subset
- ✅ Verified booking badge accurate
- ✅ Helpful count updates when clicked
- ✅ Photos in reviews display correctly
- ✅ Pagination: 5 reviews per page, "Load More" button

**Story Points:** 7  
**Priority:** HIGH  
**Sprint:** 2  

---

### US-010: User submits a review

**As a** satisfied/unsatisfied traveler  
**I want to** share my experience via a review  
**So that** other travelers can learn from my visit  

**Acceptance Criteria:**
```gherkin
Feature: Submit Review
  Scenario: Logged-in user submits review
    Given user is logged in
    When they scroll to reviews section
    And click "Write a Review" button
    Then review form modal appears with fields:
      | Overall rating (1-5 stars) - Required    |
      | Cleanliness (1-5 stars) - Optional      |
      | Staff (1-5 stars) - Optional            |
      | Facilities (1-5 stars) - Optional       |
      | Value for Money (1-5 stars) - Optional  |
      | Reviewer type (dropdown) - Required     |
      | Review title (max 100 chars)            |
      | Review text (20-500 chars) - Required   |
      | Photo upload (up to 5) - Optional       |
      | Submit button                           |

  Scenario: Form validation
    Given review form displayed
    When user clicks submit without overall rating
    Then error message: "Please select a rating"
    And form not submitted
    When user enters 10 chars of text
    Then warning: "Review must be at least 20 characters"
    When user enters 501 chars
    Then warning: "Maximum 500 characters"

  Scenario: Photo upload
    Given photo upload field visible
    When user clicks to upload
    Then file picker opens
    When user selects valid image (JPEG/PNG, <5MB)
    Then preview displays
    When user selects invalid file (>5MB or wrong format)
    Then error message: "Maximum 5MB, supported formats: JPG, PNG"

  Scenario: Successful submission
    Given all required fields filled correctly
    When user clicks "Submit Review"
    Then success message: "Review submitted successfully!"
    And form clears
    And review appears at top of list with "pending" badge
    And notification sent to campsite owner

  Scenario: Non-logged-in user tries to review
    Given user NOT logged in
    When they click "Write a Review"
    Then modal appears: "Please log in to submit a review"
    And "Log In" button provided
    And after login, redirected back to review form
```

**Definition of Done:**
- ✅ Form validation prevents invalid submissions
- ✅ Photo upload with preview working
- ✅ Character counters display accurately
- ✅ Star rating selection intuitive
- ✅ Review stored in DB with user_id
- ✅ Owner notified via email
- ✅ Mobile form layout responsive
- ✅ Moderation queue implemented for admin review

**Story Points:** 8  
**Priority:** HIGH  
**Sprint:** 3  

---

## EPIC 4: MAPS & LOCATION

### US-011: User views campsites on interactive map

**As a** visual learner  
**I want to** see camping sites on a map  
**So that** I can understand geographic distribution and find nearby options  

**Acceptance Criteria:**
```gherkin
Feature: Interactive Map View
  Scenario: User accesses map view
    Given search results page displayed
    When user clicks "Map View" tab or button
    Then map loads showing:
      | Thailand map centered          |
      | Campsite markers with colors   |
      | Marker clusters (when zoomed out) |
      | Zoom controls (+/-)            |
      | Full screen button             |

  Scenario: Markers color-coded by type
    Given map displayed
    When viewing markers
    Then colors indicate:
      | 🔴 Red: Camping           |
      | 🟢 Green: Glamping        |
      | 🟠 Orange: Tented Resort  |
      | 🟡 Yellow: Bungalow       |

  Scenario: Marker clustering
    Given user zoomed out (showing full Thailand)
    When map displays markers
    Then nearby markers cluster together
    And cluster shows count (e.g., "47")
    When user zooms in
    Then clusters ungroup
    And individual markers show

  Scenario: Infowindow on marker click
    Given map with markers displayed
    When user clicks on marker
    Then infowindow popup appears showing:
      | Campsite name              |
      | Thumbnail image            |
      | Rating & price             |
      | "View Details" button      |

  Scenario: Sync with filters
    Given map and list view both shown
    When user applies filter (e.g., Glamping only)
    Then map markers update to show only glamping
    And list results also filter
    And cluster counts recalculate

  Scenario: Mobile map interaction
    Given user on mobile device
    When viewing map
    Then can zoom with pinch gesture
    And can pan by dragging
    And infowindow fits on screen
    And tap "View Details" → opens detail page
```

**Definition of Done:**
- ✅ Map library integrated (Leaflet + leaflet.markercluster)
- ✅ Markers render for all camp types
- ✅ Clustering algorithm working
- ✅ Infowindow displays relevant info
- ✅ Filter sync with list view
- ✅ Mobile touch controls responsive
- ✅ Performance smooth (<60ms render)
- ✅ Accessibility: keyboard controls available

**Story Points:** 10  
**Priority:** HIGH  
**Sprint:** 3  

---

### US-012: User checks distance to attractions

**As a** activity-focused traveler  
**I want to** see nearby attractions and their distances  
**So that** I can plan activities around the campsite  

**Acceptance Criteria:**
```gherkin
Feature: Nearby Attractions
  Scenario: User views attractions
    Given detail page loaded
    When user scrolls to "Nearby Attractions" section
    Then list displays with columns:
      | Attraction name (e.g., Doi Pui Viewpoint) |
      | Distance (8.5 km)                         |
      | Type (Hiking, Waterfall, Bird-watching)  |
      | Difficulty (Easy/Moderate/Hard)          |
      | Brief description                        |
      | "Get Directions" button                   |

  Scenario: User gets directions
    Given attractions list displayed
    When user clicks "Get Directions"
    Then external maps app opens in new tab (Google Maps/Apple Maps)
    And route from campsite to attraction shown
    And estimated travel time displayed

  Scenario: Mobile directions
    Given user on mobile device
    When they click "Get Directions"
    Then native maps app opens (Google Maps/Apple Maps if installed)
    Or web-based maps opens as fallback
    And navigation starts automatically

  Scenario: No attractions data
    Given camp has zero nearby attractions
    Then placeholder message: "No nearby attractions added yet"
    And encouragement to visit
```

**Definition of Done:**
- ✅ Attraction data populated in DB
- ✅ Distance calculations accurate
- ✅ Difficulty levels consistent
- ✅ Google Maps integration working
- ✅ Mobile deep linking functional
- ✅ Tested with various attractions

**Story Points:** 4  
**Priority:** MEDIUM  
**Sprint:** 3  

---

## EPIC 5: USER AUTHENTICATION & PROFILE

### US-013: User signs up with email

**As a** new traveler  
**I want to** create an account with email and password  
**So that** I can access personalized features and save preferences  

**Acceptance Criteria:**
```gherkin
Feature: User Registration
  Scenario: User navigates to signup
    Given user is on homepage
    When they click "Sign Up" or "Register" button
    Then signup page/modal appears with form:
      | Email address (required)           |
      | Full name (required)               |
      | Password (required, min 8 chars)  |
      | Confirm password (required)       |
      | Terms & privacy checkbox          |
      | Sign Up button                    |

  Scenario: User enters valid data
    Given signup form displayed
    When user enters:
      | Email: john@example.com                |
      | Name: John Smith                       |
      | Password: SecurePass123 (8+ chars)    |
      | Confirm: SecurePass123                |
      | Checks terms & privacy checkbox       |
    And clicks "Sign Up"
    Then form validates (no empty fields, format checks)
    And password hashed and stored securely
    And user account created
    And verification email sent
    And success message: "Check your email to verify account"
    And redirected to verification page

  Scenario: Email verification
    Given verification email sent
    When user receives email
    Then email contains verification link
    When user clicks link
    Then email marked as verified
    And user redirected to login
    And message: "Email verified! You can now log in."

  Scenario: Password validation
    Given signup form displayed
    When user enters password < 8 characters
    Then error: "Password must be at least 8 characters"
    When user enters "password" as password
    Then warning: "Password is too common, please choose stronger"

  Scenario: Mismatched passwords
    Given form displayed
    When user enters:
      | Password: SecurePass123  |
      | Confirm: SecurePass124   |
    And clicks Sign Up
    Then error: "Passwords do not match"
    And form not submitted

  Scenario: Email already exists
    Given email already registered
    When user attempts signup with that email
    Then error: "This email is already registered"
    And link to login provided

  Scenario: Mobile signup
    Given user on mobile device
    When they access signup
    Then form optimized for mobile:
      | Single column layout       |
      | Large input fields        |
      | Easy-to-tap button        |
      | Keyboard doesn't hide form |
```

**Definition of Done:**
- ✅ Email validation (RFC 5322)
- ✅ Password hashing (bcrypt with salt)
- ✅ Email verification link expires in 24 hours
- ✅ Rate limiting on signup (prevent abuse)
- ✅ CAPTCHA on form (optional but recommended)
- ✅ Terms & privacy links functional
- ✅ Mobile form responsive
- ✅ Error messages user-friendly

**Story Points:** 8  
**Priority:** CRITICAL  
**Sprint:** 1  

---

### US-014: User logs in

**As a** returning traveler  
**I want to** log in with my email and password  
**So that** I can access my saved data and reviews  

**Acceptance Criteria:**
```gherkin
Feature: User Login
  Scenario: User accesses login page
    Given user is on login page
    When they see login form with fields:
      | Email address        |
      | Password            |
      | "Log In" button      |
      | "Forgot password" link |

  Scenario: Successful login
    Given valid email and password entered
    When user clicks "Log In"
    Then credentials validated against hash
    And JWT token generated
    And token stored in secure cookie
    And user redirected to homepage/previous page
    And welcome message: "Welcome back, [Name]!"
    And user menu shows their name in header

  Scenario: Wrong password
    Given incorrect password entered
    When user clicks "Log In"
    Then error after 2s: "Invalid email or password"
    And form remains displayed
    And failed attempt logged (security audit)

  Scenario: Non-existent email
    Given email never registered
    When user attempts login
    Then same error for security: "Invalid email or password"

  Scenario: Account lockout
    Given 5 failed login attempts
    When user tries 6th attempt
    Then error: "Account locked for 15 minutes"
    And email sent to account owner
    And option to reset password

  Scenario: Password reset flow
    Given login page displayed
    When user clicks "Forgot Password"
    Then form appears to enter email
    When user enters registered email
    And clicks "Send Reset Link"
    Then email sent with password reset link
    And link valid for 24 hours
    And user can set new password via link

  Scenario: OAuth login
    Given login page with social buttons
    When user clicks "Continue with Google"
    Then Google OAuth flow begins
    And user authorizes
    And logged in if account exists or created if new
    And user redirected to homepage
```

**Definition of Done:**
- ✅ Credentials checked against hashed password
- ✅ JWT token valid for 1 hour
- ✅ Refresh token valid for 7 days
- ✅ Secure HTTP-only cookies
- ✅ CSRF protection enabled
- ✅ Failed login attempts logged
- ✅ Rate limiting (max 10 attempts/hour per IP)
- ✅ Mobile login works smoothly

**Story Points:** 6  
**Priority:** CRITICAL  
**Sprint:** 1  

---

### US-015: User views and edits profile

**As a** registered user  
**I want to** view and edit my profile information  
**So that** I can keep my details current and manage preferences  

**Acceptance Criteria:**
```gherkin
Feature: User Profile Management
  Scenario: User accesses profile
    Given user logged in
    When they click profile icon in header
    Then dropdown menu appears:
      | "My Profile"    |
      | "My Wishlist"   |
      | "My Reviews"    |
      | "Settings"      |
      | "Log Out"       |

  Scenario: User views profile
    Given user clicks "My Profile"
    When profile page loads
    Then displays:
      | Profile avatar                |
      | Full name                     |
      | Email address                 |
      | Phone number (optional)       |
      | Bio/About me (optional)       |
      | Registration date             |
      | "Edit" button                 |

  Scenario: User edits profile
    Given profile page displayed
    When user clicks "Edit"
    Then form becomes editable:
      | Full name (can change)           |
      | Phone number (can change)        |
      | Bio (can change)                 |
      | Avatar upload (can change)       |
      | Email (display-only, no change)  |
      | "Save" & "Cancel" buttons        |

  Scenario: User updates phone number
    Given edit form displayed
    When user changes phone number
    And clicks "Save"
    Then validation: phone format checked
    And data saved to database
    And success message: "Profile updated successfully"
    And form returns to read-only mode

  Scenario: User uploads avatar
    Given avatar field visible
    When user clicks to upload
    Then file picker opens
    When user selects image (<5MB)
    Then preview shows selected image
    When user clicks "Save"
    Then image compressed to 300x300px
    And old image deleted
    And new image stored in Supabase Storage
    And success confirmation shown

  Scenario: Mobile profile editing
    Given user on mobile
    When accessing profile edit
    Then form optimized for mobile:
      | Single column layout    |
      | Large input fields      |
      | Avatar preview visible  |
      | Easy-to-tap button      |
```

**Definition of Done:**
- ✅ All fields optional except name
- ✅ Image upload with preview
- ✅ Image compression & optimization
- ✅ Data validation before saving
- ✅ Mobile form responsive
- ✅ Profile visible to others (optional feature)
- ✅ Privacy settings available

**Story Points:** 5  
**Priority:** MEDIUM  
**Sprint:** 2  

---

## EPIC 6: WISHLIST & FAVORITES

### US-016: User saves campsites to wishlist

**As a** indecisive traveler  
**I want to** save interesting campsites to review later  
**So that** I can compare options before booking  

**Acceptance Criteria:**
```gherkin
Feature: Wishlist Management
  Scenario: User saves campsite
    Given campsite card or detail page displayed
    When user sees heart icon (❤️ outline)
    And clicks it
    Then icon fills in (❤️ solid red)
    And "Saved" toast appears briefly
    And campsite added to wishlist (backend)
    And wishlist count increments in header

  Scenario: User removes from wishlist
    Given campsite with filled heart icon
    When user clicks heart icon
    Then icon unfills (❤️ outline)
    And "Removed from wishlist" toast appears
    And campsite removed from database
    And wishlist count decrements

  Scenario: Non-logged-in user saves
    Given user NOT logged in
    When they click heart icon
    Then modal appears: "Please log in to save favorites"
    And "Log In" button provided
    And after login, save attempt completes

  Scenario: User views wishlist
    Given user clicks profile → "My Wishlist"
    When wishlist page loads
    Then displays:
      | All saved campsites in grid    |
      | "No saved campsites" if empty  |
      | Wishlist count in header       |
      | Remove button per campsite     |

  Scenario: Heart icon reflects saved status
    Given user saves a campsite
    When they navigate away and return
    Then heart icon still filled
    And shows campsite is saved (across all pages)

  Scenario: Mobile wishlist
    Given user on mobile
    When viewing wishlist
    Then displays in single-column layout
    And heart icon prominent
    And easy to remove items
```

**Definition of Done:**
- ✅ Wishlist syncs across tabs/devices in real-time (optional)
- ✅ Wishlist persists across sessions
- ✅ Wishlist displayed in user dashboard
- ✅ Heart icon animated on click
- ✅ Mobile icon touch-friendly (>44x44px)
- ✅ Share wishlist feature (link generation) - Phase 2

**Story Points:** 5  
**Priority:** MEDIUM  
**Sprint:** 3  

---

### US-017: User compares campsites

**As a** analytical traveler  
**I want to** compare 2-3 campsites side-by-side  
**So that** I can make the best choice based on attributes  

**Acceptance Criteria:**
```gherkin
Feature: Campsite Comparison
  Scenario: User accesses comparison
    Given user has 2+ saved campsites
    When they visit wishlist page
    Then "Compare" button appears
    When user selects checkboxes for 2-3 camps
    And clicks "Compare Selected"
    Then comparison page loads

  Scenario: Comparison table displays
    Given comparison page loaded
    Then displays table with:
      | Camp names as columns        |
      | Rows for each attribute:     |
      |   Type (Camping, Glamping)   |
      |   Price range               |
      |   Amenities (✓ or ✗)       |
      |   Rating & reviews          |
      |   Location/Distance         |
      |   Accommodation types       |
      |   Nearby attractions        |

  Scenario: Mobile comparison layout
    Given user on mobile
    When viewing comparison
    Then layout adapted:
      | First camp always visible    |
      | Horizontal scroll for others |
      | Or tab-based view (Camp 1 | 2 | 3) |

  Scenario: User books from comparison
    Given comparison table displayed
    When user clicks "Book" button
    Then booking link opens (new tab)
    And comparison stays visible

  Scenario: Comparison limits
    Given user tries to select 4 camps
    When attempting to compare
    Then message: "Maximum 3 camps can be compared"
    And only first 3 selectable
```

**Definition of Done:**
- ✅ Comparison table displays all attributes
- ✅ Mobile layout readable
- ✅ Easy filtering/reordering
- ✅ Comparison shareable via URL
- ✅ Max 3 camps comparison enforced
- ✅ Responsive design tested

**Story Points:** 6  
**Priority:** MEDIUM  
**Sprint:** 3  

---

## EPIC 7: CONTACT & BOOKING

### US-018: User sends inquiry to campsite

**As a** interested traveler  
**I want to** send a direct inquiry to the campsite  
**So that** I can ask specific questions before booking  

**Acceptance Criteria:**
```gherkin
Feature: Contact Inquiry
  Scenario: User opens inquiry form
    Given campsite detail page displayed
    When user scrolls to contact section
    Then sees:
      | Campsite contact info           |
      | "Send Inquiry" button           |
      | "Book Now" button               |

  Scenario: User fills inquiry form
    Given user clicks "Send Inquiry"
    Then modal/form appears with:
      | Your name (pre-filled if logged in)    |
      | Your email (pre-filled if logged in)   |
      | Your phone number                      |
      | Inquiry type dropdown:                 |
      |   - Booking inquiry               |
      |   - General question              |
      |   - Complaint                     |
      |   - Other                        |
      | Message (20-2000 chars)                |
      | Send Message button               |

  Scenario: Form validation
    Given inquiry form displayed
    When user tries to submit without required fields
    Then error message for each field
    When user enters invalid email
    Then error: "Please enter valid email"
    When user enters <20 characters
    Then warning: "Message too short"

  Scenario: Successful submission
    Given all fields filled correctly
    When user clicks "Send Message"
    Then form validates and submits
    And confirmation: "Message sent successfully"
    And form clears
    And inquiry stored in database
    And email sent to campsite owner within 1 minute
    And confirmation email sent to user

  Scenario: Non-logged-in user submits
    Given user NOT logged in
    When they fill and submit inquiry
    Then message stored
    And user shown: "Message sent! Response will be sent to [email]"

  Scenario: Owner receives inquiry
    Given inquiry submitted
    When campsite owner receives email
    Then email includes:
      | Campsite name              |
      | Guest name & contact info  |
      | Full inquiry message       |
      | Link to reply in dashboard |

  Scenario: Mobile inquiry form
    Given user on mobile device
    When opening inquiry form
    Then form optimized:
      | Single column layout    |
      | Large input fields      |
      | Keyboard doesn't hide submit button |
      | Easy-to-tap buttons     |
```

**Definition of Done:**
- ✅ Form validation working
- ✅ Email sent to owner within 1 minute
- ✅ Inquiry stored in DB
- ✅ User receives confirmation
- ✅ Phone number validated (Thai format)
- ✅ Message sanitized (prevent XSS)
- ✅ Rate limiting (max 5 inquiries/24 hours)
- ✅ Mobile form responsive

**Story Points:** 7  
**Priority:** HIGH  
**Sprint:** 3  

---

### US-019: User clicks through to external booking

**As a** ready-to-book traveler  
**I want to** easily access the campsite's booking page  
**So that** I can complete my reservation quickly  

**Acceptance Criteria:**
```gherkin
Feature: External Booking Integration
  Scenario: User books with external link
    Given detail page loaded
    When user finds accommodation of interest
    And clicks "Book Now" button
    Then browser opens campsite's booking URL (new tab)
    And campsite owner's booking site loads
    And click tracked in analytics

  Scenario: No booking URL configured
    Given campsite has no online booking
    When user clicks "Book Now"
    Then message: "Booking not available online. Please call [phone]"
    And phone number is clickable (tel: link on mobile)

  Scenario: Mobile booking
    Given user on mobile
    When clicking "Book Now"
    When campsite has mobile app
    Then offer: "Open in app?" (if app installed)
    Or default to mobile browser

  Scenario: Analytics tracking
    Given user clicks "Book Now"
    Then recorded:
      | Click timestamp       |
      | Campsite ID          |
      | User ID (if logged)  |
      | Source page          |
    And metrics updated for owner dashboard

  Scenario: Post-booking review prompt
    Given user completes booking externally
    When they return to camping-thailand.com
    When scrolling to reviews
    Then encouraged: "Share your experience with a review"
    And link to write review provided
```

**Definition of Done:**
- ✅ External booking link configured
- ✅ Click tracked for analytics
- ✅ New tab opens (doesn't navigate away)
- ✅ Mobile deep linking works
- ✅ Fallback to phone if no online booking
- ✅ Link validation (no broken URLs)

**Story Points:** 3  
**Priority:** CRITICAL  
**Sprint:** 2  

---

## EPIC 8: ADMIN DASHBOARD

### US-020: Owner views campsite analytics

**As a** campsite owner  
**I want to** view analytics about my campsite's performance  
**So that** I can track bookings and make informed business decisions  

**Acceptance Criteria:**
```gherkin
Feature: Owner Analytics Dashboard
  Scenario: Owner accesses dashboard
    Given owner is logged in
    When they click "Dashboard" menu
    Then dashboard overview page displays:
      | Welcome message with camp name      |
      | Key metrics cards:                 |
      |   - Search impressions (this month)|
      |   - Profile page views             |
      |   - Clicks to booking              |
      |   - New inquiries (unread badge)   |

  Scenario: View detailed metrics
    Given dashboard loaded
    When owner scrolls to analytics section
    Then displays charts:
      | Search impressions graph (30 days)    |
      | Click-through rate trend            |
      | Inquiry volume chart                |
      | Top search keywords table           |
      | Conversion funnel (impression→booking) |

  Scenario: Date range selection
    Given analytics displayed
    When owner clicks date range selector
    Then options appear:
      | Last 7 days    |
      | Last 30 days   |
      | Last 90 days   |
      | Custom range   |
    When selected, metrics update for period

  Scenario: Export analytics
    Given analytics displayed
    When owner clicks "Export"
    Then file download begins:
      | CSV format with all metrics |
      | Includes date range selected |
      | Ready to import to spreadsheet |
```

**Definition of Done:**
- ✅ Metrics calculated accurately
- ✅ Charts display correctly
- ✅ Data updates in real-time
- ✅ Date range filtering works
- ✅ Export functionality operational
- ✅ Mobile dashboard readable

**Story Points:** 8  
**Priority:** MEDIUM  
**Sprint:** 3-4  

---

### US-021: Owner manages campsite listing

**As a** campsite owner  
**I want to** update my campsite information easily  
**So that** my listing stays current and accurate  

**Acceptance Criteria:**
```gherkin
Feature: Listing Management
  Scenario: Owner edits basic info
    Given owner dashboard displayed
    When owner clicks on their campsite
    Then management page opens showing:
      | Campsite name (editable)        |
      | Description (editable)         |
      | Location/address (editable)    |
      | Contact info (editable)        |
      | Website URL (editable)         |
      | Social media links (editable)  |
      | "Save" & "Cancel" buttons      |

  Scenario: Owner uploads photos
    Given management page displayed
    When owner scrolls to "Photos" section
    Then displays current photo gallery
    When owner clicks "Add Photos"
    Then file upload dialog opens
    When owner selects photos
    Then previews display
    When owner clicks "Upload"
    Then photos stored in Supabase Storage
    And gallery updates

  Scenario: Owner manages amenities
    Given management page displayed
    When owner scrolls to "Amenities"
    Then checkboxes for all amenities appear
    When owner checks "WiFi"
    And unchecks "Restaurant"
    And clicks "Save"
    Then amenities updated in database
    And public listing updates

  Scenario: Owner sets availability
    Given management page displayed
    When owner scrolls to "Availability"
    Then calendar appears
    When owner clicks dates to mark unavailable
    Then modal shows reason (maintenance, booked, etc.)
    When owner confirms
    Then calendar updates
    And public availability affected
```

**Definition of Done:**
- ✅ All fields editable with validation
- ✅ Photo upload with preview
- ✅ Changes save successfully
- ✅ Public listing updates immediately
- ✅ Form recovery on error (data not lost)
- ✅ Mobile editing interface

**Story Points:** 10  
**Priority:** HIGH  
**Sprint:** 3-4  

---

### US-022: Owner manages booking inquiries

**As a** campsite owner  
**I want to** view and respond to booking inquiries  
**So that** I can communicate with potential guests  

**Acceptance Criteria:**
```gherkin
Feature: Inquiry Management
  Scenario: Owner views inquiry list
    Given owner dashboard displayed
    When they click "Bookings & Inquiries"
    Then inquiry list page shows:
      | New inquiries (sorted by date)     |
      | Inquiry preview (first 50 chars)   |
      | Status badge (new, responded, etc.)|
      | Guest name & date                  |

  Scenario: Owner reads full inquiry
    Given inquiry list displayed
    When owner clicks on inquiry
    Then detail page shows:
      | Full inquiry text          |
      | Guest name & contact info  |
      | Inquiry type               |
      | Dates interested           |
      | Timestamp                  |

  Scenario: Owner replies to inquiry
    Given inquiry detail page displayed
    When owner clicks "Reply"
    Then reply form appears
    When owner types response
    And clicks "Send Reply"
    Then email sent to guest within 1 minute
    And inquiry marked as "responded"
    And response time tracked (metric)

  Scenario: Owner follows up
    Given inquiry with no response from guest
    When 3 days pass with no booking
    Then owner sees "Follow-up available" reminder
    When owner clicks "Send Follow-up"
    Then reminder email sent to guest

  Scenario: Mobile inquiry management
    Given owner on mobile
    When viewing inquiries
    Then list and detail view optimized
    And easy to read and reply
    And timestamps clear
```

**Definition of Done:**
- ✅ Inquiry list displays all pending
- ✅ Reply email sent promptly
- ✅ Status updates accurate
- ✅ Response time metrics tracked
- ✅ Mobile interface usable
- ✅ Search/filter available

**Story Points:** 6  
**Priority:** HIGH  
**Sprint:** 3  

---

**End of User Stories Document**

---

## Appendix: Story Point Scale

| Points | Complexity | Time Estimate |
|--------|-----------|---------------|
| **1-2** | Trivial | <1 day |
| **3-5** | Small | 1-3 days |
| **5-8** | Medium | 1-2 weeks |
| **8-13** | Large | 2-3 weeks |
| **13+** | Epic | >3 weeks, break down |

## Appendix: Priority Levels

- **CRITICAL:** Must have for MVP, blocks other work
- **HIGH:** Important, included in MVP
- **MEDIUM:** Nice to have, Phase 2
- **LOW:** Future consideration

---