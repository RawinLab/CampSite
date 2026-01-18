# Performance Tests

This directory contains Lighthouse-style performance tests for the Campsite platform using Playwright.

## Test Files

### T050: Homepage Performance (`lighthouse-home.test.ts`)
Tests the homepage for:
- Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- Performance metrics (TTFB, FCP, TTI)
- Accessibility compliance (score > 90)
- Best Practices compliance (score > 90)
- SEO optimization (score > 90)
- Resource optimization (JS, CSS, images, fonts)

### T051: Campsite Detail Page (`lighthouse-campsite.test.ts`)
Tests campsite detail pages for:
- Core Web Vitals with image gallery considerations
- Image optimization (lazy loading, modern formats)
- Map loading performance
- Structured data validation (JSON-LD)
- Interactive element responsiveness
- Resource hints optimization

### T052: Search Page (`lighthouse-search.test.ts`)
Tests the search page for:
- Search results loading performance (< 2s)
- Filter interaction responsiveness (< 500ms)
- Pagination performance (< 1s)
- URL state management
- Mobile responsiveness
- Empty state performance

## Running Tests

### Run all performance tests
```bash
cd tests/performance
npx playwright test
```

### Run specific test file
```bash
npx playwright test lighthouse-home.test.ts
```

### Run with UI mode
```bash
npx playwright test --ui
```

### Run with debug mode
```bash
npx playwright test --debug
```

### Run from project root
```bash
pnpm test:performance
# or
npx playwright test --config=tests/performance/playwright.config.ts
```

## Performance Thresholds

### Core Web Vitals
| Metric | Homepage | Campsite Detail | Search |
|--------|----------|-----------------|--------|
| LCP    | < 2.5s   | < 3.0s          | < 2.5s |
| FID    | < 100ms  | < 100ms         | < 100ms|
| CLS    | < 0.1    | < 0.15          | < 0.1  |

### Additional Metrics
| Metric | Threshold |
|--------|-----------|
| TTFB   | < 800ms   |
| FCP    | < 1.8s    |
| TTI    | < 3.8s    |

### Resource Limits
| Resource Type | Limit |
|---------------|-------|
| Total Resources | < 60-80 |
| JS Bundles | < 15-20 |
| CSS Files | < 10-15 |
| Images | < 30-50 |
| Total Transfer | < 2-3MB |

## Understanding Results

### Performance Score Estimation
These tests use the Performance API to measure real metrics instead of simulated Lighthouse scores. The mapping is:
- **Good (90+)**: All metrics within thresholds
- **Needs Improvement (50-89)**: Some metrics exceed thresholds
- **Poor (<50)**: Multiple critical metrics exceed thresholds

### Accessibility Checks
Tests verify:
- Image alt attributes
- Heading hierarchy
- Form labels
- ARIA attributes
- Landmark regions
- Focus management

### SEO Checks
Tests verify:
- Page title (present, proper length)
- Meta description (present, proper length)
- Canonical URL
- Open Graph tags
- Structured data (JSON-LD)
- H1 element (single, descriptive)

### Best Practices Checks
Tests verify:
- DOCTYPE declaration
- Character encoding
- External link security (rel="noopener")
- Image sizing optimization
- Deprecated API usage

## CI/CD Integration

These tests can be run in CI with:

```yaml
- name: Run Performance Tests
  run: |
    cd tests/performance
    npx playwright test
  env:
    BASE_URL: http://localhost:3090
```

## Notes

1. **Sequential Execution**: Tests run sequentially (not parallel) for accurate performance measurements.

2. **Browser Consistency**: Tests run only on Chromium for consistent metrics across runs.

3. **Network Conditions**: Tests assume stable network. Consider using throttling for more realistic mobile testing.

4. **Server Warmup**: First test may have higher metrics due to cold start. Consider running a warmup request.

5. **Caching**: Tests measure uncached performance. Browser cache is cleared between test files.
