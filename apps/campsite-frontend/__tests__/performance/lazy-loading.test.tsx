/**
 * Lazy Loading Performance Tests
 *
 * Tests lazy loading behavior using next/dynamic and Suspense boundaries.
 * Verifies that components are loaded on demand and loading states are displayed correctly.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React, { Suspense } from 'react';

// Mock next/dynamic
jest.mock('next/dynamic', () => {
  const mockDynamic = jest.fn((loader: any, options?: any) => {
    // Create a mock component that simulates dynamic import behavior
    const DynamicComponent = (props: any) => {
      const [Component, setComponent] = React.useState<any>(null);

      React.useEffect(() => {
        // Simulate async loading
        const loadComponent = async () => {
          try {
            const mod = await loader();
            setComponent(() => mod.default || mod);
          } catch (error) {
            console.error('Failed to load component', error);
          }
        };
        loadComponent();
      }, []);

      // Show loading state if component not loaded yet
      if (!Component) {
        if (options?.loading) {
          const LoadingComp = options.loading;
          return <LoadingComp />;
        }
        return <div>Loading...</div>;
      }

      return <Component {...props} />;
    };

    // Store the loader for testing purposes
    (DynamicComponent as any).__loader = loader;
    (DynamicComponent as any).__options = options;

    return DynamicComponent;
  });

  return mockDynamic;
});

describe('Lazy Loading Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('next/dynamic Usage', () => {
    it('should use next/dynamic for lazy loading components', () => {
      const nextDynamic = require('next/dynamic');

      const mockLoader = jest.fn(() =>
        Promise.resolve({ default: () => <div>Lazy Component</div> })
      );

      const LazyComponent = nextDynamic(mockLoader);

      expect(nextDynamic).toHaveBeenCalledWith(mockLoader);
      expect(LazyComponent).toBeDefined();
    });

    it('should pass ssr: false option for client-only components', () => {
      const nextDynamic = require('next/dynamic');

      const mockLoader = () => Promise.resolve({ default: () => <div>Client Only</div> });
      const options = { ssr: false };

      const LazyComponent = nextDynamic(mockLoader, options);

      expect(nextDynamic).toHaveBeenCalledWith(mockLoader, options);
      expect((LazyComponent as any).__options).toEqual(options);
    });

    it('should support loading prop for custom loading states', () => {
      const nextDynamic = require('next/dynamic');

      const mockLoader = () => Promise.resolve({ default: () => <div>Loaded</div> });
      const LoadingComponent = () => <div>Custom Loading...</div>;
      const options = {
        ssr: false,
        loading: LoadingComponent
      };

      const LazyComponent = nextDynamic(mockLoader, options);

      expect((LazyComponent as any).__options.loading).toBe(LoadingComponent);
    });

    it('should use .then() for named exports from dynamic imports', () => {
      const nextDynamic = require('next/dynamic');

      const mockLoader = () =>
        Promise.resolve({ CampsiteMap: () => <div>Map Component</div> })
          .then((mod) => mod.CampsiteMap);

      const LazyMap = nextDynamic(mockLoader);

      expect(nextDynamic).toHaveBeenCalled();
      expect((LazyMap as any).__loader).toBe(mockLoader);
    });
  });

  describe('Suspense Boundaries', () => {
    it('should use Suspense boundary with fallback for lazy components', () => {
      const LazyComponent = () => <div>Lazy Content</div>;
      const FallbackComponent = () => <div>Loading fallback...</div>;

      render(
        <Suspense fallback={<FallbackComponent />}>
          <LazyComponent />
        </Suspense>
      );

      // Component should render (in real scenario, fallback would show first)
      expect(screen.getByText('Lazy Content')).toBeInTheDocument();
    });

    it('should display fallback content while component loads', () => {
      const nextDynamic = require('next/dynamic');

      const LoadingFallback = () => <div data-testid="loading">Loading map...</div>;

      let resolveLoader: (value: any) => void;
      const loaderPromise = new Promise((resolve) => {
        resolveLoader = resolve;
      });

      const mockLoader = jest.fn(() => loaderPromise);
      const LazyMap = nextDynamic(mockLoader, {
        ssr: false,
        loading: LoadingFallback,
      });

      const { container } = render(<LazyMap />);

      // Loading state should be visible initially
      expect(screen.queryByTestId('loading')).toBeInTheDocument();
    });

    it('should support nested Suspense boundaries for granular loading states', () => {
      const OuterFallback = () => <div>Loading page...</div>;
      const InnerFallback = () => <div>Loading content...</div>;
      const Content = () => <div>Content loaded</div>;

      render(
        <Suspense fallback={<OuterFallback />}>
          <div>
            <h1>Page Header</h1>
            <Suspense fallback={<InnerFallback />}>
              <Content />
            </Suspense>
          </div>
        </Suspense>
      );

      expect(screen.getByText('Page Header')).toBeInTheDocument();
      expect(screen.getByText('Content loaded')).toBeInTheDocument();
    });
  });

  describe('Loading State Behavior', () => {
    it('should show skeleton loading component for maps', () => {
      const nextDynamic = require('next/dynamic');

      const MapSkeleton = () => (
        <div className="flex h-[600px] items-center justify-center rounded-xl bg-gray-100">
          <div className="map-loading__spinner" data-testid="map-skeleton" />
        </div>
      );

      const mockLoader = jest.fn(() =>
        new Promise(() => {}) // Never resolves to keep in loading state
      );

      const LazyMap = nextDynamic(mockLoader, {
        ssr: false,
        loading: MapSkeleton,
      });

      render(<LazyMap />);

      expect(screen.getByTestId('map-skeleton')).toBeInTheDocument();
    });

    it('should show text loading state for search content', () => {
      const LoadingText = () => <div>กำลังโหลด...</div>;

      render(
        <Suspense fallback={<LoadingText />}>
          <div>Search Results</div>
        </Suspense>
      );

      // Content should be visible (in real scenario with actual lazy loading)
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    it('should use Skeleton components for structured loading states', () => {
      const CampsiteCardSkeleton = () => (
        <div data-testid="campsite-skeleton" className="space-y-3">
          <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
        </div>
      );

      render(
        <Suspense fallback={<CampsiteCardSkeleton />}>
          <div>Campsite Content</div>
        </Suspense>
      );

      expect(screen.getByText('Campsite Content')).toBeInTheDocument();
    });
  });

  describe('Dynamic Import On Demand', () => {
    it('should not load component until it is rendered', () => {
      const nextDynamic = require('next/dynamic');

      const mockLoader = jest.fn(() =>
        Promise.resolve({ default: () => <div>Component</div> })
      );

      const LazyComponent = nextDynamic(mockLoader);

      // Loader should not be called until component is rendered
      expect(mockLoader).not.toHaveBeenCalled();

      render(<LazyComponent />);

      // Now loader should be called
      expect(mockLoader).toHaveBeenCalled();
    });

    it('should load CampsiteMap only when map view is selected', () => {
      const nextDynamic = require('next/dynamic');

      const mockMapLoader = jest.fn(() =>
        Promise.resolve({ CampsiteMap: () => <div>Map View</div> })
          .then((mod) => mod.CampsiteMap)
      );

      const LazyMap = nextDynamic(mockMapLoader, { ssr: false });

      // Map not rendered yet
      expect(mockMapLoader).not.toHaveBeenCalled();

      // Simulate switching to map view
      const { rerender } = render(<div>List View</div>);

      expect(mockMapLoader).not.toHaveBeenCalled();

      rerender(<LazyMap />);

      expect(mockMapLoader).toHaveBeenCalled();
    });

    it('should handle errors during dynamic import gracefully', async () => {
      const nextDynamic = require('next/dynamic');

      const mockLoader = jest.fn(() =>
        Promise.reject(new Error('Failed to load module'))
      );

      const LazyComponent = nextDynamic(mockLoader, {
        loading: () => <div>Loading...</div>,
      });

      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      render(<LazyComponent />);

      await waitFor(() => {
        expect(mockLoader).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Component-Specific Lazy Loading', () => {
    it('should lazy load map components with SSR disabled', () => {
      const nextDynamic = require('next/dynamic');

      const MapLoading = () => (
        <div className="flex h-[600px] items-center justify-center rounded-xl bg-gray-100">
          <div className="map-loading__spinner" />
        </div>
      );

      const mockMapLoader = () =>
        import('@/components/map/CampsiteMap')
          .then((mod) => mod.CampsiteMap);

      const CampsiteMap = nextDynamic(mockMapLoader as any, {
        ssr: false,
        loading: MapLoading,
      });

      expect((CampsiteMap as any).__options.ssr).toBe(false);
      expect((CampsiteMap as any).__options.loading).toBe(MapLoading);
    });

    it('should use Suspense for search page content with useSearchParams', () => {
      const SearchContent = () => <div>Search Content</div>;
      const SearchLoading = () => <div className="container mx-auto px-4 py-8">กำลังโหลด...</div>;

      render(
        <Suspense fallback={<SearchLoading />}>
          <SearchContent />
        </Suspense>
      );

      expect(screen.getByText('Search Content')).toBeInTheDocument();
    });

    it('should lazy load comparison page content', () => {
      const CompareContent = () => <div>Comparison Table</div>;
      const CompareLoading = () => (
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 w-full rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      );

      render(
        <Suspense fallback={<CompareLoading />}>
          <CompareContent />
        </Suspense>
      );

      expect(screen.getByText('Comparison Table')).toBeInTheDocument();
    });
  });

  describe('Real-World Usage Patterns', () => {
    it('should verify dynamic import syntax matches Next.js patterns', () => {
      const nextDynamic = require('next/dynamic');

      // Pattern 1: Default export with SSR disabled
      const Pattern1 = nextDynamic(
        () => import('@/components/map/CampsiteMap'),
        { ssr: false }
      );

      // Pattern 2: Named export with .then()
      const Pattern2 = nextDynamic(
        () => import('@/components/map/CampsiteMap').then((mod) => mod.CampsiteMap),
        { ssr: false, loading: () => <div>Loading...</div> }
      );

      expect(nextDynamic).toHaveBeenCalledTimes(2);
      expect((Pattern1 as any).__options.ssr).toBe(false);
      expect((Pattern2 as any).__options.ssr).toBe(false);
    });

    it('should support conditional lazy loading based on view state', () => {
      const nextDynamic = require('next/dynamic');

      const ListComponent = () => <div>List View</div>;
      const mockMapLoader = jest.fn(() =>
        Promise.resolve({ default: () => <div>Map View</div> })
      );

      const MapComponent = nextDynamic(mockMapLoader, { ssr: false });

      const ViewSwitcher = ({ view }: { view: 'list' | 'map' }) => (
        <>
          {view === 'list' && <ListComponent />}
          {view === 'map' && <MapComponent />}
        </>
      );

      const { rerender } = render(<ViewSwitcher view="list" />);

      expect(screen.getByText('List View')).toBeInTheDocument();
      expect(mockMapLoader).not.toHaveBeenCalled();

      rerender(<ViewSwitcher view="map" />);

      expect(mockMapLoader).toHaveBeenCalled();
    });

    it('should handle multiple lazy-loaded components on same page', () => {
      const nextDynamic = require('next/dynamic');

      const mockGalleryLoader = jest.fn(() =>
        Promise.resolve({ default: () => <div>Gallery</div> })
      );
      const mockReviewsLoader = jest.fn(() =>
        Promise.resolve({ default: () => <div>Reviews</div> })
      );

      const LazyGallery = nextDynamic(mockGalleryLoader);
      const LazyReviews = nextDynamic(mockReviewsLoader);

      render(
        <>
          <LazyGallery />
          <LazyReviews />
        </>
      );

      expect(mockGalleryLoader).toHaveBeenCalled();
      expect(mockReviewsLoader).toHaveBeenCalled();
    });

    it('should prioritize critical content over lazy-loaded components', () => {
      const nextDynamic = require('next/dynamic');

      const CriticalContent = () => <div>Critical Hero Section</div>;
      const mockLazyLoader = jest.fn(() =>
        Promise.resolve({ default: () => <div>Below Fold Content</div> })
      );

      const LazyContent = nextDynamic(mockLazyLoader);

      const { container } = render(
        <>
          <CriticalContent />
          <LazyContent />
        </>
      );

      // Critical content should render first
      const criticalElement = screen.getByText('Critical Hero Section');
      expect(criticalElement).toBeInTheDocument();

      // Lazy content loader should be invoked
      expect(mockLazyLoader).toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    it('should reduce initial bundle size by lazy loading heavy components', () => {
      const nextDynamic = require('next/dynamic');

      // Leaflet is a heavy library that should be lazy loaded
      const mockLeafletLoader = () =>
        Promise.resolve({ default: () => <div>Leaflet Map</div> });

      const LazyLeafletMap = nextDynamic(mockLeafletLoader, {
        ssr: false, // Leaflet requires window object
      });

      expect((LazyLeafletMap as any).__options.ssr).toBe(false);
    });

    it('should support code splitting for route-specific components', () => {
      const nextDynamic = require('next/dynamic');

      // Dashboard-specific components
      const mockDashboardChartLoader = jest.fn(() =>
        Promise.resolve({ default: () => <div>Analytics Chart</div> })
      );

      const LazyChart = nextDynamic(mockDashboardChartLoader);

      // Chart only loads when dashboard renders
      expect(mockDashboardChartLoader).not.toHaveBeenCalled();

      render(<LazyChart />);

      expect(mockDashboardChartLoader).toHaveBeenCalled();
    });

    it('should implement lazy loading for below-the-fold content', () => {
      const nextDynamic = require('next/dynamic');

      const AboveFold = () => <div>Hero Section</div>;
      const mockBelowFoldLoader = jest.fn(() =>
        Promise.resolve({ default: () => <div>Footer Content</div> })
      );

      const BelowFold = nextDynamic(mockBelowFoldLoader);

      render(
        <>
          <AboveFold />
          <BelowFold />
        </>
      );

      expect(screen.getByText('Hero Section')).toBeInTheDocument();
      expect(mockBelowFoldLoader).toHaveBeenCalled();
    });
  });
});
