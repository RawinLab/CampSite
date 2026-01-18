import { render, screen } from '@testing-library/react';
import {
  CampsiteCardSkeleton,
  CampsiteCardsGridSkeleton,
} from '@/components/skeletons/CampsiteCardSkeleton';
import {
  HeroSectionSkeleton,
  DescriptionSkeleton,
  QuickInfoSkeleton,
  GallerySkeleton,
  AmenitiesSkeleton,
  AccommodationsSkeleton,
  AttractionsSkeleton,
  ContactSkeleton,
  SidebarSkeleton,
} from '@/components/skeletons/CampsiteDetailSkeleton';
import { SearchResultsSkeleton } from '@/components/skeletons/SearchResultsSkeleton';

describe('CampsiteCardSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<CampsiteCardSkeleton />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders image skeleton with correct aspect ratio', () => {
    const { container } = render(<CampsiteCardSkeleton />);

    const imageSkeleton = container.querySelector('.aspect-\\[4\\/3\\]');
    expect(imageSkeleton).toBeInTheDocument();
  });

  it('renders name skeleton', () => {
    const { container } = render(<CampsiteCardSkeleton />);

    const nameSkeleton = container.querySelector('.h-5.w-3\\/4');
    expect(nameSkeleton).toBeInTheDocument();
  });

  it('renders location skeleton', () => {
    const { container } = render(<CampsiteCardSkeleton />);

    const locationSkeleton = container.querySelector('.h-4.w-1\\/2');
    expect(locationSkeleton).toBeInTheDocument();
  });

  it('renders description skeletons', () => {
    const { container } = render(<CampsiteCardSkeleton />);

    const descriptionSkeletons = container.querySelectorAll('.space-y-2 > .animate-pulse');
    expect(descriptionSkeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders rating skeleton', () => {
    const { container } = render(<CampsiteCardSkeleton />);

    const ratingSkeletons = container.querySelectorAll('.h-4.w-4, .h-4.w-12');
    expect(ratingSkeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders price skeletons', () => {
    const { container } = render(<CampsiteCardSkeleton />);

    const priceSkeletons = container.querySelectorAll('.h-3.w-10, .h-5.w-20');
    expect(priceSkeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('applies custom className when provided', () => {
    const { container } = render(<CampsiteCardSkeleton className="custom-class" />);

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('renders within a Card component', () => {
    const { container } = render(<CampsiteCardSkeleton />);

    const card = container.querySelector('.overflow-hidden');
    expect(card).toBeInTheDocument();
  });
});

describe('CampsiteCardsGridSkeleton', () => {
  it('renders correct count of skeleton items with default count', () => {
    const { container } = render(<CampsiteCardsGridSkeleton />);

    const skeletons = container.querySelectorAll('.overflow-hidden');
    expect(skeletons.length).toBe(6);
  });

  it('renders custom count of skeleton items', () => {
    const { container } = render(<CampsiteCardsGridSkeleton count={9} />);

    const skeletons = container.querySelectorAll('.overflow-hidden');
    expect(skeletons.length).toBe(9);
  });

  it('renders single skeleton item', () => {
    const { container } = render(<CampsiteCardsGridSkeleton count={1} />);

    const skeletons = container.querySelectorAll('.overflow-hidden');
    expect(skeletons.length).toBe(1);
  });

  it('renders grid layout', () => {
    const { container } = render(<CampsiteCardsGridSkeleton />);

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
  });

  it('applies custom className when provided', () => {
    const { container } = render(<CampsiteCardsGridSkeleton className="custom-grid-class" />);

    const grid = container.querySelector('.custom-grid-class');
    expect(grid).toBeInTheDocument();
  });

  it('renders zero items when count is 0', () => {
    const { container } = render(<CampsiteCardsGridSkeleton count={0} />);

    const skeletons = container.querySelectorAll('.overflow-hidden');
    expect(skeletons.length).toBe(0);
  });
});

describe('CampsiteDetailSkeleton', () => {
  describe('HeroSectionSkeleton', () => {
    it('renders hero section skeleton', () => {
      const { container } = render(<HeroSectionSkeleton />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('renders image grid skeleton', () => {
      const { container } = render(<HeroSectionSkeleton />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('md:grid-cols-4', 'md:grid-rows-2');
    });

    it('renders title skeleton', () => {
      const { container } = render(<HeroSectionSkeleton />);

      const titleSkeleton = container.querySelector('.h-10.w-80');
      expect(titleSkeleton).toBeInTheDocument();
    });

    it('renders location and other info skeletons', () => {
      const { container } = render(<HeroSectionSkeleton />);

      const infoSkeletons = container.querySelectorAll('.h-5');
      expect(infoSkeletons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders action button skeletons', () => {
      const { container } = render(<HeroSectionSkeleton />);

      const buttonSkeletons = container.querySelectorAll('.h-10.w-10');
      expect(buttonSkeletons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('DescriptionSkeleton', () => {
    it('renders description skeleton', () => {
      const { container } = render(<DescriptionSkeleton />);

      const card = container.querySelector('.space-y-4');
      expect(card).toBeInTheDocument();
    });

    it('renders header skeleton', () => {
      const { container } = render(<DescriptionSkeleton />);

      const headerSkeleton = container.querySelector('.h-6.w-48');
      expect(headerSkeleton).toBeInTheDocument();
    });

    it('renders badge skeleton', () => {
      const { container } = render(<DescriptionSkeleton />);

      const badgeSkeleton = container.querySelector('.h-6.w-24.rounded-full');
      expect(badgeSkeleton).toBeInTheDocument();
    });

    it('renders text line skeletons', () => {
      const { container } = render(<DescriptionSkeleton />);

      const textSkeletons = container.querySelectorAll('.space-y-2 > .animate-pulse');
      expect(textSkeletons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('QuickInfoSkeleton', () => {
    it('renders quick info skeleton', () => {
      const { container } = render(<QuickInfoSkeleton />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('renders 3 info card skeletons', () => {
      const { container } = render(<QuickInfoSkeleton />);

      const cards = container.querySelectorAll('.p-4');
      expect(cards.length).toBe(3);
    });

    it('renders icon skeletons in each card', () => {
      const { container } = render(<QuickInfoSkeleton />);

      const iconSkeletons = container.querySelectorAll('.h-10.w-10.rounded-lg');
      expect(iconSkeletons.length).toBe(3);
    });
  });

  describe('GallerySkeleton', () => {
    it('renders gallery skeleton', () => {
      const { container } = render(<GallerySkeleton />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('renders title skeleton', () => {
      const { container } = render(<GallerySkeleton />);

      const titleSkeleton = container.querySelector('.h-6.w-24');
      expect(titleSkeleton).toBeInTheDocument();
    });

    it('renders main image skeleton', () => {
      const { container } = render(<GallerySkeleton />);

      const imageSkeleton = container.querySelector('.aspect-video');
      expect(imageSkeleton).toBeInTheDocument();
    });

    it('renders thumbnail skeletons', () => {
      const { container } = render(<GallerySkeleton />);

      const thumbnailSkeletons = container.querySelectorAll('.w-20.h-16.rounded-lg');
      expect(thumbnailSkeletons.length).toBe(5);
    });
  });

  describe('AmenitiesSkeleton', () => {
    it('renders amenities skeleton', () => {
      const { container } = render(<AmenitiesSkeleton />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('renders 8 amenity item skeletons', () => {
      const { container } = render(<AmenitiesSkeleton />);

      const items = container.querySelectorAll('.bg-muted\\/50');
      expect(items.length).toBe(8);
    });

    it('renders icon skeletons for each amenity', () => {
      const { container } = render(<AmenitiesSkeleton />);

      const iconSkeletons = container.querySelectorAll('.h-8.w-8.rounded-full');
      expect(iconSkeletons.length).toBe(8);
    });
  });

  describe('AccommodationsSkeleton', () => {
    it('renders accommodations skeleton', () => {
      const { container } = render(<AccommodationsSkeleton />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('renders 3 accommodation card skeletons', () => {
      const { container } = render(<AccommodationsSkeleton />);

      const cards = container.querySelectorAll('.space-y-4');
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('renders tag skeletons in each card', () => {
      const { container } = render(<AccommodationsSkeleton />);

      const tagSkeletons = container.querySelectorAll('.h-6.w-16.rounded-full');
      expect(tagSkeletons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('AttractionsSkeleton', () => {
    it('renders attractions skeleton', () => {
      const { container } = render(<AttractionsSkeleton />);

      const card = container.querySelector('.space-y-3');
      expect(card).toBeInTheDocument();
    });

    it('renders 3 attraction item skeletons', () => {
      const { container } = render(<AttractionsSkeleton />);

      const items = container.querySelectorAll('.flex.gap-4.p-4');
      expect(items.length).toBe(3);
    });

    it('renders icon skeletons for each attraction', () => {
      const { container } = render(<AttractionsSkeleton />);

      const iconSkeletons = container.querySelectorAll('.h-12.w-12.rounded-lg');
      expect(iconSkeletons.length).toBe(3);
    });
  });

  describe('ContactSkeleton', () => {
    it('renders contact skeleton', () => {
      const { container } = render(<ContactSkeleton />);

      const card = container.querySelector('.space-y-4');
      expect(card).toBeInTheDocument();
    });

    it('renders 3 contact item skeletons', () => {
      const { container } = render(<ContactSkeleton />);

      const items = container.querySelectorAll('.flex.items-center.gap-3.p-3');
      expect(items.length).toBe(3);
    });

    it('renders icon skeletons for each contact method', () => {
      const { container } = render(<ContactSkeleton />);

      const iconSkeletons = container.querySelectorAll('.h-10.w-10.rounded-full');
      expect(iconSkeletons.length).toBe(3);
    });
  });

  describe('SidebarSkeleton', () => {
    it('renders sidebar skeleton', () => {
      const { container } = render(<SidebarSkeleton />);

      const card = container.querySelector('.sticky.top-4');
      expect(card).toBeInTheDocument();
    });

    it('renders price skeletons', () => {
      const { container } = render(<SidebarSkeleton />);

      const priceSkeletons = container.querySelectorAll('.h-3.w-20, .h-8.w-32');
      expect(priceSkeletons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders button skeletons', () => {
      const { container } = render(<SidebarSkeleton />);

      const buttonSkeletons = container.querySelectorAll('.h-11.w-full');
      expect(buttonSkeletons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders info text skeletons', () => {
      const { container } = render(<SidebarSkeleton />);

      const infoSkeletons = container.querySelectorAll('.h-4.w-48, .h-4.w-36');
      expect(infoSkeletons.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('SearchResultsSkeleton', () => {
  it('renders search results skeleton', () => {
    const { container } = render(<SearchResultsSkeleton />);

    const mainContainer = container.querySelector('.container');
    expect(mainContainer).toBeInTheDocument();
  });

  it('renders page header skeletons', () => {
    const { container } = render(<SearchResultsSkeleton />);

    const headerSkeletons = container.querySelectorAll('.h-8.w-48, .h-5.w-72');
    expect(headerSkeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders search bar skeleton', () => {
    const { container } = render(<SearchResultsSkeleton />);

    const searchBarSkeletons = container.querySelectorAll('.h-10');
    expect(searchBarSkeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders filter sidebar skeleton for desktop', () => {
    const { container } = render(<SearchResultsSkeleton />);

    const sidebar = container.querySelector('.w-64.shrink-0.lg\\:block');
    expect(sidebar).toBeInTheDocument();
  });

  it('renders type filter skeleton', () => {
    const { container } = render(<SearchResultsSkeleton />);

    const typeFilters = container.querySelectorAll('.h-8.w-20.rounded-full');
    expect(typeFilters.length).toBe(4);
  });

  it('renders price filter skeleton', () => {
    const { container } = render(<SearchResultsSkeleton />);

    const priceFilterTitle = container.querySelector('.h-5.w-24');
    expect(priceFilterTitle).toBeInTheDocument();

    const priceRangeSkeletons = container.querySelectorAll('.h-5.w-16');
    expect(priceRangeSkeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders amenities filter skeleton', () => {
    const { container } = render(<SearchResultsSkeleton />);

    const amenitiesTitle = container.querySelector('.h-5.w-40');
    expect(amenitiesTitle).toBeInTheDocument();

    const amenitySkeletons = container.querySelectorAll('.h-12.w-full.rounded-lg');
    expect(amenitySkeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders results header skeleton', () => {
    const { container } = render(<SearchResultsSkeleton />);

    const resultsHeader = container.querySelector('.h-5.w-40');
    expect(resultsHeader).toBeInTheDocument();
  });

  it('renders card grid skeleton with 6 items', () => {
    const { container } = render(<SearchResultsSkeleton />);

    const cards = container.querySelectorAll('.overflow-hidden');
    expect(cards.length).toBe(6);
  });

  it('renders pagination skeleton', () => {
    const { container } = render(<SearchResultsSkeleton />);

    const paginationButtons = container.querySelectorAll('.h-10.w-10');
    expect(paginationButtons.length).toBeGreaterThanOrEqual(5);
  });

  it('renders results area with proper layout', () => {
    const { container } = render(<SearchResultsSkeleton />);

    const resultsArea = container.querySelector('.flex-1');
    expect(resultsArea).toBeInTheDocument();
  });

  it('renders divider skeletons in filter sidebar', () => {
    const { container } = render(<SearchResultsSkeleton />);

    const dividers = container.querySelectorAll('.h-px.w-full');
    expect(dividers.length).toBeGreaterThanOrEqual(2);
  });
});
