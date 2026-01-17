import { render, screen, fireEvent } from '@testing-library/react';
import { CampsiteGallery } from '@/components/campsite/CampsiteGallery';
import type { CampsitePhoto } from '@campsite/shared';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return ({
    src,
    alt,
    fill,
    className,
    onClick,
    priority,
    sizes,
    loading,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    onClick?: () => void;
    priority?: boolean;
    sizes?: string;
    loading?: string;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onClick={onClick}
        data-fill={fill}
        data-priority={priority}
        data-sizes={sizes}
        data-loading={loading}
      />
    );
  };
});

// Mock GalleryLightbox component
jest.mock('@/components/campsite/GalleryLightbox', () => ({
  GalleryLightbox: ({
    isOpen,
    onClose,
    campsiteName,
    photos,
    initialIndex,
  }: {
    isOpen: boolean;
    onClose: () => void;
    campsiteName: string;
    photos: CampsitePhoto[];
    initialIndex: number;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="gallery-lightbox">
        <button onClick={onClose} data-testid="close-lightbox">
          Close
        </button>
        <div data-testid="lightbox-campsite-name">{campsiteName}</div>
        <div data-testid="lightbox-initial-index">{initialIndex}</div>
        <div data-testid="lightbox-photo-count">{photos.length}</div>
      </div>
    );
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="chevron-left">Left</span>,
  ChevronRight: () => <span data-testid="chevron-right">Right</span>,
}));

describe('CampsiteGallery', () => {
  const mockPhotos: CampsitePhoto[] = [
    {
      id: 'photo-1',
      url: 'https://example.com/photo1.jpg',
      alt_text: 'Beautiful campsite view',
      display_order: 1,
      uploaded_at: new Date('2024-01-01').toISOString(),
      campsite_id: 'campsite-1',
    },
    {
      id: 'photo-2',
      url: 'https://example.com/photo2.jpg',
      alt_text: 'Tent area',
      display_order: 2,
      uploaded_at: new Date('2024-01-02').toISOString(),
      campsite_id: 'campsite-1',
    },
    {
      id: 'photo-3',
      url: 'https://example.com/photo3.jpg',
      alt_text: 'Campfire spot',
      display_order: 3,
      uploaded_at: new Date('2024-01-03').toISOString(),
      campsite_id: 'campsite-1',
    },
  ];

  const campsiteName = 'Mountain View Camping';

  describe('Rendering', () => {
    it('renders main image correctly', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      const mainImage = screen.getAllByAltText('Beautiful campsite view')[0];
      expect(mainImage).toBeInTheDocument();
      expect(mainImage).toHaveAttribute('src', 'https://example.com/photo1.jpg');
      expect(mainImage).toHaveAttribute('data-priority', 'true');
    });

    it('renders thumbnail strip with all images', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      const thumbnails = screen.getAllByRole('button', { name: /View photo \d/ });
      expect(thumbnails).toHaveLength(3);
      expect(screen.getByRole('button', { name: 'View photo 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View photo 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View photo 3' })).toBeInTheDocument();
    });

    it('highlights current thumbnail with ring styling', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      const firstThumbnail = screen.getByRole('button', { name: 'View photo 1' });
      expect(firstThumbnail).toHaveClass('ring-2', 'ring-primary', 'ring-offset-2');
    });

    it('renders navigation arrows when multiple photos exist', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      expect(screen.getByRole('button', { name: 'Previous photo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next photo' })).toBeInTheDocument();
      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    it('renders image counter with correct format', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('does not render navigation arrows for single image', () => {
      const singlePhoto = [mockPhotos[0]];
      render(<CampsiteGallery photos={singlePhoto} campsiteName={campsiteName} />);

      expect(screen.queryByRole('button', { name: 'Previous photo' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument();
    });

    it('does not render thumbnail strip for single image', () => {
      const singlePhoto = [mockPhotos[0]];
      render(<CampsiteGallery photos={singlePhoto} campsiteName={campsiteName} />);

      expect(screen.queryByRole('button', { name: /View photo/ })).not.toBeInTheDocument();
    });

    it('does not render image counter for single image', () => {
      const singlePhoto = [mockPhotos[0]];
      render(<CampsiteGallery photos={singlePhoto} campsiteName={campsiteName} />);

      expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
    });

    it('renders placeholder for empty photos array', () => {
      render(<CampsiteGallery photos={[]} campsiteName={campsiteName} />);

      expect(screen.getByText('No photos available')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(
        <CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Navigation with arrows', () => {
    it('navigates to next image when clicking next arrow', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();

      const nextButton = screen.getByRole('button', { name: 'Next photo' });
      fireEvent.click(nextButton);

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
      const mainImages = screen.getAllByAltText('Tent area');
      expect(mainImages[0]).toHaveAttribute('src', 'https://example.com/photo2.jpg');
    });

    it('navigates to previous image when clicking previous arrow', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      const nextButton = screen.getByRole('button', { name: 'Next photo' });
      fireEvent.click(nextButton);
      expect(screen.getByText('2 / 3')).toBeInTheDocument();

      const prevButton = screen.getByRole('button', { name: 'Previous photo' });
      fireEvent.click(prevButton);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
      const mainImages = screen.getAllByAltText('Beautiful campsite view');
      expect(mainImages[0]).toHaveAttribute('src', 'https://example.com/photo1.jpg');
    });

    it('wraps to last image when clicking previous on first image', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();

      const prevButton = screen.getByRole('button', { name: 'Previous photo' });
      fireEvent.click(prevButton);

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
      const mainImages = screen.getAllByAltText('Campfire spot');
      expect(mainImages[0]).toHaveAttribute('src', 'https://example.com/photo3.jpg');
    });

    it('wraps to first image when clicking next on last image', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      const nextButton = screen.getByRole('button', { name: 'Next photo' });
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      expect(screen.getByText('3 / 3')).toBeInTheDocument();

      fireEvent.click(nextButton);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
      const mainImages = screen.getAllByAltText('Beautiful campsite view');
      expect(mainImages[0]).toHaveAttribute('src', 'https://example.com/photo1.jpg');
    });
  });

  describe('Thumbnail interactions', () => {
    it('changes main image when clicking thumbnail', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();

      const secondThumbnail = screen.getByRole('button', { name: 'View photo 2' });
      fireEvent.click(secondThumbnail);

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
      const mainImages = screen.getAllByAltText('Tent area');
      expect(mainImages[0]).toHaveAttribute('src', 'https://example.com/photo2.jpg');
    });

    it('updates thumbnail highlight when main image changes', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      const firstThumbnail = screen.getByRole('button', { name: 'View photo 1' });
      const secondThumbnail = screen.getByRole('button', { name: 'View photo 2' });

      expect(firstThumbnail).toHaveClass('ring-2');
      expect(secondThumbnail).not.toHaveClass('ring-2');

      fireEvent.click(secondThumbnail);

      expect(firstThumbnail).not.toHaveClass('ring-2');
      expect(secondThumbnail).toHaveClass('ring-2');
    });

    it('allows direct navigation to any image via thumbnails', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      const thirdThumbnail = screen.getByRole('button', { name: 'View photo 3' });
      fireEvent.click(thirdThumbnail);

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
      const mainImages = screen.getAllByAltText('Campfire spot');
      expect(mainImages[0]).toHaveAttribute('src', 'https://example.com/photo3.jpg');
    });
  });

  describe('Lightbox functionality', () => {
    it('opens lightbox when clicking main image', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      expect(screen.queryByTestId('gallery-lightbox')).not.toBeInTheDocument();

      const mainImages = screen.getAllByAltText('Beautiful campsite view');
      fireEvent.click(mainImages[0]);

      expect(screen.getByTestId('gallery-lightbox')).toBeInTheDocument();
    });

    it('passes correct initial index to lightbox', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      const nextButton = screen.getByRole('button', { name: 'Next photo' });
      fireEvent.click(nextButton);

      const mainImages = screen.getAllByAltText('Tent area');
      fireEvent.click(mainImages[0]);

      expect(screen.getByTestId('lightbox-initial-index')).toHaveTextContent('1');
    });

    it('passes all photos to lightbox', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      const mainImages = screen.getAllByAltText('Beautiful campsite view');
      fireEvent.click(mainImages[0]);

      expect(screen.getByTestId('lightbox-photo-count')).toHaveTextContent('3');
    });

    it('passes campsite name to lightbox', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      const mainImages = screen.getAllByAltText('Beautiful campsite view');
      fireEvent.click(mainImages[0]);

      expect(screen.getByTestId('lightbox-campsite-name')).toHaveTextContent('Mountain View Camping');
    });

    it('closes lightbox when onClose is triggered', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      const mainImages = screen.getAllByAltText('Beautiful campsite view');
      fireEvent.click(mainImages[0]);

      expect(screen.getByTestId('gallery-lightbox')).toBeInTheDocument();

      const closeButton = screen.getByTestId('close-lightbox');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('gallery-lightbox')).not.toBeInTheDocument();
    });

    it('opens lightbox at correct index when navigating before opening', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      const thirdThumbnail = screen.getByRole('button', { name: 'View photo 3' });
      fireEvent.click(thirdThumbnail);

      const mainImages = screen.getAllByAltText('Campfire spot');
      fireEvent.click(mainImages[0]);

      expect(screen.getByTestId('lightbox-initial-index')).toHaveTextContent('2');
    });
  });

  describe('Single image handling', () => {
    const singlePhoto = [mockPhotos[0]];

    it('renders single image correctly', () => {
      render(<CampsiteGallery photos={singlePhoto} campsiteName={campsiteName} />);

      const mainImage = screen.getByAltText('Beautiful campsite view');
      expect(mainImage).toBeInTheDocument();
      expect(mainImage).toHaveAttribute('src', 'https://example.com/photo1.jpg');
    });

    it('allows lightbox to open for single image', () => {
      render(<CampsiteGallery photos={singlePhoto} campsiteName={campsiteName} />);

      const mainImage = screen.getByAltText('Beautiful campsite view');
      fireEvent.click(mainImage);

      expect(screen.getByTestId('gallery-lightbox')).toBeInTheDocument();
      expect(screen.getByTestId('lightbox-initial-index')).toHaveTextContent('0');
    });

    it('maintains consistent layout for single image', () => {
      const { container } = render(<CampsiteGallery photos={singlePhoto} campsiteName={campsiteName} />);

      expect(container.querySelector('.aspect-video')).toBeInTheDocument();
      expect(container.querySelector('.rounded-xl')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides alt text for main image using photo alt_text', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      expect(screen.getAllByAltText('Beautiful campsite view')[0]).toBeInTheDocument();
    });

    it('provides fallback alt text when alt_text is missing', () => {
      const photoWithoutAlt = [
        {
          ...mockPhotos[0],
          alt_text: null,
        },
      ];
      render(<CampsiteGallery photos={photoWithoutAlt} campsiteName={campsiteName} />);

      expect(screen.getByAltText('Mountain View Camping photo 1')).toBeInTheDocument();
    });

    it('provides aria-labels for navigation buttons', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      expect(screen.getByRole('button', { name: 'Previous photo' })).toHaveAttribute('aria-label', 'Previous photo');
      expect(screen.getByRole('button', { name: 'Next photo' })).toHaveAttribute('aria-label', 'Next photo');
    });

    it('provides aria-labels for thumbnail buttons', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      mockPhotos.forEach((_, index) => {
        const thumbnail = screen.getByRole('button', { name: `View photo ${index + 1}` });
        expect(thumbnail).toHaveAttribute('aria-label', `View photo ${index + 1}`);
      });
    });
  });

  describe('Edge cases', () => {
    it('handles photos with undefined alt_text', () => {
      const photosWithUndefinedAlt = mockPhotos.map((photo) => ({
        ...photo,
        alt_text: undefined,
      }));

      render(<CampsiteGallery photos={photosWithUndefinedAlt} campsiteName={campsiteName} />);

      expect(screen.getByAltText('Mountain View Camping photo 1')).toBeInTheDocument();
    });

    it('handles large number of photos', () => {
      const manyPhotos = Array.from({ length: 12 }, (_, i) => ({
        id: `photo-${i + 1}`,
        url: `https://example.com/photo${i + 1}.jpg`,
        alt_text: `Photo ${i + 1}`,
        display_order: i + 1,
        uploaded_at: new Date().toISOString(),
        campsite_id: 'campsite-1',
      }));

      render(<CampsiteGallery photos={manyPhotos} campsiteName={campsiteName} />);

      expect(screen.getByText('1 / 12')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /View photo/ })).toHaveLength(12);
    });

    it('maintains state consistency during rapid navigation', () => {
      render(<CampsiteGallery photos={mockPhotos} campsiteName={campsiteName} />);

      const nextButton = screen.getByRole('button', { name: 'Next photo' });

      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });
});
