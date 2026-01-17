import { render, screen } from '@testing-library/react';
import { CampsiteCard } from '@/components/search/CampsiteCard';
import type { CampsiteCard as CampsiteCardType } from '@campsite/shared';

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return ({
    src,
    alt,
    fill,
    className,
    sizes,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    sizes?: string;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} data-fill={fill} data-sizes={sizes} />;
  };
});

describe('CampsiteCard', () => {
  const mockCampsite: CampsiteCardType = {
    id: 'campsite-001',
    name: 'Mountain View Camping',
    description: 'Beautiful camping site with stunning mountain views and fresh air',
    slug: 'mountain-view-camping',
    campsite_type: 'camping',
    province: {
      id: 1,
      name_th: 'เชียงใหม่',
      name_en: 'Chiang Mai',
      slug: 'chiang-mai',
    },
    min_price: 500,
    max_price: 1500,
    average_rating: 4.5,
    review_count: 123,
    is_featured: false,
    thumbnail_url: 'https://example.com/thumbnail.jpg',
    amenities: ['wifi', 'parking', 'restroom'],
  };

  describe('Rendering Basic Information', () => {
    it('renders campsite name', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      expect(screen.getByText('Mountain View Camping')).toBeInTheDocument();
    });

    it('renders campsite photo with correct src and alt', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      const image = screen.getByAltText('Mountain View Camping');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/thumbnail.jpg');
    });

    it('renders placeholder when no thumbnail_url', () => {
      const campsiteWithoutImage: CampsiteCardType = {
        ...mockCampsite,
        thumbnail_url: null,
      };

      render(<CampsiteCard campsite={campsiteWithoutImage} />);

      const placeholder = screen.getByRole('link').querySelector('.bg-gray-100');
      expect(placeholder).toBeInTheDocument();
      expect(screen.queryByAltText('Mountain View Camping')).not.toBeInTheDocument();
    });

    it('displays province name in Thai', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      expect(screen.getByText('เชียงใหม่')).toBeInTheDocument();
    });

    it('renders campsite description', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      expect(
        screen.getByText('Beautiful camping site with stunning mountain views and fresh air')
      ).toBeInTheDocument();
    });
  });

  describe('Campsite Type Badge', () => {
    it('shows campsite type badge for camping', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      expect(screen.getByText('แคมป์ปิ้ง')).toBeInTheDocument();
    });

    it('shows campsite type badge for glamping', () => {
      const glampingCampsite: CampsiteCardType = {
        ...mockCampsite,
        campsite_type: 'glamping',
      };

      render(<CampsiteCard campsite={glampingCampsite} />);

      expect(screen.getByText('แกลมปิ้ง')).toBeInTheDocument();
    });

    it('shows campsite type badge for tented-resort', () => {
      const tentedResortCampsite: CampsiteCardType = {
        ...mockCampsite,
        campsite_type: 'tented-resort',
      };

      render(<CampsiteCard campsite={tentedResortCampsite} />);

      expect(screen.getByText('รีสอร์ทเต็นท์')).toBeInTheDocument();
    });

    it('shows campsite type badge for bungalow', () => {
      const bungalowCampsite: CampsiteCardType = {
        ...mockCampsite,
        campsite_type: 'bungalow',
      };

      render(<CampsiteCard campsite={bungalowCampsite} />);

      expect(screen.getByText('บังกะโล')).toBeInTheDocument();
    });

    it('shows campsite type badge for cabin', () => {
      const cabinCampsite: CampsiteCardType = {
        ...mockCampsite,
        campsite_type: 'cabin',
      };

      render(<CampsiteCard campsite={cabinCampsite} />);

      expect(screen.getByText('กระท่อม')).toBeInTheDocument();
    });

    it('shows campsite type badge for rv-caravan', () => {
      const rvCampsite: CampsiteCardType = {
        ...mockCampsite,
        campsite_type: 'rv-caravan',
      };

      render(<CampsiteCard campsite={rvCampsite} />);

      expect(screen.getByText('RV/คาราวาน')).toBeInTheDocument();
    });
  });

  describe('Rating and Reviews', () => {
    it('displays average rating with one decimal place', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('shows review count in parentheses', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      expect(screen.getByText('(123)')).toBeInTheDocument();
    });

    it('displays star icon for rating', () => {
      const { container } = render(<CampsiteCard campsite={mockCampsite} />);

      const starIcon = container.querySelector('.text-yellow-400');
      expect(starIcon).toBeInTheDocument();
      expect(starIcon?.tagName).toBe('svg');
    });

    it('formats rating with zero decimal correctly', () => {
      const campsiteWithWholeRating: CampsiteCardType = {
        ...mockCampsite,
        average_rating: 5,
      };

      render(<CampsiteCard campsite={campsiteWithWholeRating} />);

      expect(screen.getByText('5.0')).toBeInTheDocument();
    });

    it('handles zero reviews', () => {
      const campsiteNoReviews: CampsiteCardType = {
        ...mockCampsite,
        average_rating: 0,
        review_count: 0,
      };

      render(<CampsiteCard campsite={campsiteNoReviews} />);

      expect(screen.getByText('0.0')).toBeInTheDocument();
      expect(screen.getByText('(0)')).toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('displays price range in Thai Baht format', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      expect(screen.getByText('฿500 - ฿1,500')).toBeInTheDocument();
    });

    it('displays single price when min and max are equal', () => {
      const singlePriceCampsite: CampsiteCardType = {
        ...mockCampsite,
        min_price: 1000,
        max_price: 1000,
      };

      render(<CampsiteCard campsite={singlePriceCampsite} />);

      expect(screen.getByText('฿1,000')).toBeInTheDocument();
      expect(screen.queryByText('฿1,000 - ฿1,000')).not.toBeInTheDocument();
    });

    it('formats prices with thousand separators', () => {
      const expensiveCampsite: CampsiteCardType = {
        ...mockCampsite,
        min_price: 10000,
        max_price: 25000,
      };

      render(<CampsiteCard campsite={expensiveCampsite} />);

      expect(screen.getByText('฿10,000 - ฿25,000')).toBeInTheDocument();
    });

    it('displays "เริ่มต้น" (starting from) label', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      expect(screen.getByText('เริ่มต้น')).toBeInTheDocument();
    });
  });

  describe('Link to Detail Page', () => {
    it('links to campsite detail page using slug', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/campsites/mountain-view-camping');
    });

    it('links to campsite detail page using id when slug is missing', () => {
      const campsiteWithoutSlug: CampsiteCardType = {
        ...mockCampsite,
        slug: '',
      };

      render(<CampsiteCard campsite={campsiteWithoutSlug} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/campsites/campsite-001');
    });
  });

  describe('Featured Badge', () => {
    it('shows featured badge when campsite is featured', () => {
      const featuredCampsite: CampsiteCardType = {
        ...mockCampsite,
        is_featured: true,
      };

      render(<CampsiteCard campsite={featuredCampsite} />);

      expect(screen.getByText('แนะนำ')).toBeInTheDocument();
    });

    it('does not show featured badge when campsite is not featured', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      expect(screen.queryByText('แนะนำ')).not.toBeInTheDocument();
    });
  });

  describe('Handling Missing Optional Data', () => {
    it('handles null thumbnail_url gracefully', () => {
      const campsiteNoImage: CampsiteCardType = {
        ...mockCampsite,
        thumbnail_url: null,
      };

      render(<CampsiteCard campsite={campsiteNoImage} />);

      expect(screen.getByText('Mountain View Camping')).toBeInTheDocument();
      expect(screen.queryByAltText('Mountain View Camping')).not.toBeInTheDocument();
    });

    it('handles empty description', () => {
      const campsiteNoDescription: CampsiteCardType = {
        ...mockCampsite,
        description: '',
      };

      render(<CampsiteCard campsite={campsiteNoDescription} />);

      expect(screen.getByText('Mountain View Camping')).toBeInTheDocument();
    });

    it('handles very long campsite name with line-clamp', () => {
      const longNameCampsite: CampsiteCardType = {
        ...mockCampsite,
        name: 'Very Long Campsite Name That Should Be Truncated With Ellipsis When Displayed',
      };

      const { container } = render(<CampsiteCard campsite={longNameCampsite} />);

      const nameElement = container.querySelector('.line-clamp-1');
      expect(nameElement).toBeInTheDocument();
      expect(nameElement).toHaveTextContent(
        'Very Long Campsite Name That Should Be Truncated With Ellipsis When Displayed'
      );
    });

    it('handles very long description with line-clamp', () => {
      const longDescriptionCampsite: CampsiteCardType = {
        ...mockCampsite,
        description:
          'This is a very long description that should be truncated to two lines maximum with ellipsis when displayed in the card component to maintain consistent card heights',
      };

      const { container } = render(<CampsiteCard campsite={longDescriptionCampsite} />);

      const descriptionElement = container.querySelector('.line-clamp-2');
      expect(descriptionElement).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className when provided', () => {
      const { container } = render(
        <CampsiteCard campsite={mockCampsite} className="custom-class" />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('applies hover styles', () => {
      const { container } = render(<CampsiteCard campsite={mockCampsite} />);

      const card = container.querySelector('.hover\\:shadow-lg');
      expect(card).toBeInTheDocument();
    });

    it('applies group hover effect on image', () => {
      const { container } = render(<CampsiteCard campsite={mockCampsite} />);

      const image = container.querySelector('.group-hover\\:scale-105');
      expect(image).toBeInTheDocument();
    });

    it('applies group hover effect on name', () => {
      const { container } = render(<CampsiteCard campsite={mockCampsite} />);

      const name = container.querySelector('.group-hover\\:text-green-600');
      expect(name).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides alt text for images', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      const image = screen.getByAltText('Mountain View Camping');
      expect(image).toBeInTheDocument();
    });

    it('uses semantic link element', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('maintains proper heading hierarchy', () => {
      const { container } = render(<CampsiteCard campsite={mockCampsite} />);

      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Mountain View Camping');
    });
  });

  describe('Image Responsive Sizing', () => {
    it('includes responsive sizes attribute', () => {
      const { container } = render(<CampsiteCard campsite={mockCampsite} />);

      const image = container.querySelector('[data-sizes]');
      expect(image).toHaveAttribute(
        'data-sizes',
        '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
      );
    });

    it('uses fill layout for image', () => {
      const { container } = render(<CampsiteCard campsite={mockCampsite} />);

      const image = container.querySelector('[data-fill="true"]');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders within a Card component', () => {
      const { container } = render(<CampsiteCard campsite={mockCampsite} />);

      const card = container.querySelector('.overflow-hidden');
      expect(card).toBeInTheDocument();
    });

    it('has proper aspect ratio for image container', () => {
      const { container } = render(<CampsiteCard campsite={mockCampsite} />);

      const imageContainer = container.querySelector('.aspect-\\[4\\/3\\]');
      expect(imageContainer).toBeInTheDocument();
    });

    it('displays all required sections', () => {
      render(<CampsiteCard campsite={mockCampsite} />);

      expect(screen.getByText('Mountain View Camping')).toBeInTheDocument();
      expect(screen.getByText('เชียงใหม่')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('฿500 - ฿1,500')).toBeInTheDocument();
    });
  });
});
