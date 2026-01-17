import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GalleryLightbox } from '@/components/campsite/GalleryLightbox';
import type { CampsitePhoto } from '@campsite/shared';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  ChevronLeft: () => <div data-testid="chevron-left-icon">ChevronLeft</div>,
  ChevronRight: () => <div data-testid="chevron-right-icon">ChevronRight</div>,
  ZoomIn: () => <div data-testid="zoom-in-icon">ZoomIn</div>,
  ZoomOut: () => <div data-testid="zoom-out-icon">ZoomOut</div>,
}));

describe('GalleryLightbox', () => {
  const mockPhotos: CampsitePhoto[] = [
    {
      id: '1',
      campsite_id: 'campsite-1',
      url: 'https://example.com/photo1.jpg',
      alt_text: 'Photo 1 description',
      display_order: 0,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      campsite_id: 'campsite-1',
      url: 'https://example.com/photo2.jpg',
      alt_text: 'Photo 2 description',
      display_order: 1,
      created_at: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      campsite_id: 'campsite-1',
      url: 'https://example.com/photo3.jpg',
      alt_text: null,
      display_order: 2,
      created_at: '2024-01-03T00:00:00Z',
    },
  ];

  const defaultProps = {
    photos: mockPhotos,
    initialIndex: 0,
    isOpen: true,
    onClose: jest.fn(),
    campsiteName: 'Test Campsite',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body overflow style
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = '';
  });

  describe('Modal Opening and Closing', () => {
    it('should render when isOpen is true', () => {
      render(<GalleryLightbox {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: 'Photo gallery' })).toBeInTheDocument();
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<GalleryLightbox {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog', { name: 'Photo gallery' })).not.toBeInTheDocument();
    });

    it('should not render when photos array is empty', () => {
      render(<GalleryLightbox {...defaultProps} photos={[]} />);

      expect(screen.queryByRole('dialog', { name: 'Photo gallery' })).not.toBeInTheDocument();
    });

    it('should prevent body scroll when open', () => {
      const { rerender } = render(<GalleryLightbox {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');

      rerender(<GalleryLightbox {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('');
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<GalleryLightbox {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: 'Close gallery' });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close modal when Escape key is pressed', () => {
      const onClose = jest.fn();
      render(<GalleryLightbox {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not handle keyboard events when modal is closed', () => {
      const onClose = jest.fn();
      render(<GalleryLightbox {...defaultProps} isOpen={false} onClose={onClose} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should navigate to next photo on ArrowRight key', () => {
      render(<GalleryLightbox {...defaultProps} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('should navigate to previous photo on ArrowLeft key', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={1} />);

      expect(screen.getByText('2 / 3')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should loop to last photo when pressing ArrowLeft on first photo', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={0} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('should loop to first photo when pressing ArrowRight on last photo', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={2} />);

      expect(screen.getByText('3 / 3')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should toggle zoom on Space key', () => {
      render(<GalleryLightbox {...defaultProps} />);

      const zoomButton = screen.getByRole('button', { name: 'Zoom in' });

      fireEvent.keyDown(window, { key: ' ' });

      expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    });
  });

  describe('Previous/Next Buttons', () => {
    it('should navigate to next photo when Next button is clicked', () => {
      render(<GalleryLightbox {...defaultProps} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();

      const nextButton = screen.getByRole('button', { name: 'Next photo' });
      fireEvent.click(nextButton);

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('should navigate to previous photo when Previous button is clicked', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={1} />);

      expect(screen.getByText('2 / 3')).toBeInTheDocument();

      const prevButton = screen.getByRole('button', { name: 'Previous photo' });
      fireEvent.click(prevButton);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should loop to last photo when clicking Previous on first photo', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={0} />);

      const prevButton = screen.getByRole('button', { name: 'Previous photo' });
      fireEvent.click(prevButton);

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('should loop to first photo when clicking Next on last photo', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={2} />);

      const nextButton = screen.getByRole('button', { name: 'Next photo' });
      fireEvent.click(nextButton);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should not render navigation buttons when only one photo', () => {
      render(<GalleryLightbox {...defaultProps} photos={[mockPhotos[0]]} />);

      expect(screen.queryByRole('button', { name: 'Previous photo' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument();
    });

    it('should reset zoom state when navigating', () => {
      render(<GalleryLightbox {...defaultProps} />);

      // Zoom in first
      const zoomButton = screen.getByRole('button', { name: 'Zoom in' });
      fireEvent.click(zoomButton);
      expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();

      // Navigate to next photo
      const nextButton = screen.getByRole('button', { name: 'Next photo' });
      fireEvent.click(nextButton);

      // Zoom should be reset
      expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    });
  });

  describe('Image Counter Display', () => {
    it('should display correct counter format "current / total"', () => {
      render(<GalleryLightbox {...defaultProps} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should update counter when navigating', () => {
      render(<GalleryLightbox {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: 'Next photo' });

      fireEvent.click(nextButton);
      expect(screen.getByText('2 / 3')).toBeInTheDocument();

      fireEvent.click(nextButton);
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('should show correct counter with single photo', () => {
      render(<GalleryLightbox {...defaultProps} photos={[mockPhotos[0]]} />);

      expect(screen.getByText('1 / 1')).toBeInTheDocument();
    });

    it('should respect initialIndex prop', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={2} />);

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('should reset to initialIndex when lightbox reopens', () => {
      const { rerender } = render(<GalleryLightbox {...defaultProps} initialIndex={0} />);

      // Navigate to second photo
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(screen.getByText('2 / 3')).toBeInTheDocument();

      // Close and reopen with different initialIndex
      rerender(<GalleryLightbox {...defaultProps} isOpen={false} initialIndex={0} />);
      rerender(<GalleryLightbox {...defaultProps} isOpen={true} initialIndex={2} />);

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });
  });

  describe('Touch Swipe Handling', () => {
    it('should navigate to previous photo on right swipe', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={1} />);

      const container = screen.getByRole('dialog').querySelector('.absolute.inset-0.flex') as HTMLElement;

      // Simulate swipe right (touchStart -> touchMove -> touchEnd)
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchMove(container, {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchEnd(container);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should navigate to next photo on left swipe', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={0} />);

      const container = screen.getByRole('dialog').querySelector('.absolute.inset-0.flex') as HTMLElement;

      // Simulate swipe left
      fireEvent.touchStart(container, {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(container);

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('should not navigate if swipe distance is below threshold', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={1} />);

      const container = screen.getByRole('dialog').querySelector('.absolute.inset-0.flex') as HTMLElement;

      // Simulate small swipe (below 50px threshold)
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchMove(container, {
        touches: [{ clientX: 130, clientY: 100 }],
      });

      fireEvent.touchEnd(container);

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('should not handle swipe when zoomed', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={1} />);

      // Zoom in
      const zoomButton = screen.getByRole('button', { name: 'Zoom in' });
      fireEvent.click(zoomButton);

      const container = screen.getByRole('dialog').querySelector('.absolute.inset-0.flex') as HTMLElement;

      // Try to swipe while zoomed
      fireEvent.touchStart(container, {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(container);

      // Should still be on photo 2
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('should reset touch state after touchEnd', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={0} />);

      const container = screen.getByRole('dialog').querySelector('.absolute.inset-0.flex') as HTMLElement;

      // First swipe
      fireEvent.touchStart(container, {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(container);

      expect(screen.getByText('2 / 3')).toBeInTheDocument();

      // Second swipe should work independently
      fireEvent.touchStart(container, {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(container);

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });
  });

  describe('Thumbnail Navigation', () => {
    it('should render thumbnails for all photos', () => {
      render(<GalleryLightbox {...defaultProps} />);

      const thumbnails = screen.getAllByRole('button', { name: /View photo \d/ });
      expect(thumbnails).toHaveLength(3);
    });

    it('should navigate to clicked thumbnail', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={0} />);

      const thumbnail3 = screen.getByRole('button', { name: 'View photo 3' });
      fireEvent.click(thumbnail3);

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('should not render thumbnails for single photo', () => {
      render(<GalleryLightbox {...defaultProps} photos={[mockPhotos[0]]} />);

      expect(screen.queryByRole('button', { name: /View photo/ })).not.toBeInTheDocument();
    });

    it('should reset zoom when thumbnail is clicked', () => {
      render(<GalleryLightbox {...defaultProps} />);

      // Zoom in
      const zoomButton = screen.getByRole('button', { name: 'Zoom in' });
      fireEvent.click(zoomButton);

      // Click thumbnail
      const thumbnail2 = screen.getByRole('button', { name: 'View photo 2' });
      fireEvent.click(thumbnail2);

      // Zoom should be reset
      expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    });
  });

  describe('Zoom Functionality', () => {
    it('should toggle zoom when zoom button is clicked', () => {
      render(<GalleryLightbox {...defaultProps} />);

      const zoomButton = screen.getByRole('button', { name: 'Zoom in' });
      fireEvent.click(zoomButton);

      expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    });

    it('should reset zoom when lightbox reopens', () => {
      const { rerender } = render(<GalleryLightbox {...defaultProps} />);

      // Zoom in
      const zoomButton = screen.getByRole('button', { name: 'Zoom in' });
      fireEvent.click(zoomButton);
      expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();

      // Close and reopen
      rerender(<GalleryLightbox {...defaultProps} isOpen={false} />);
      rerender(<GalleryLightbox {...defaultProps} isOpen={true} />);

      expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    });
  });

  describe('Image Display and Alt Text', () => {
    it('should display current photo with correct src', () => {
      render(<GalleryLightbox {...defaultProps} />);

      const image = screen.getByAltText('Photo 1 description');
      expect(image).toHaveAttribute('src', 'https://example.com/photo1.jpg');
    });

    it('should use fallback alt text when photo alt_text is null', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={2} />);

      const image = screen.getByAltText('Test Campsite photo 3');
      expect(image).toBeInTheDocument();
    });

    it('should display photo caption when alt_text exists', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={0} />);

      expect(screen.getByText('Photo 1 description')).toBeInTheDocument();
    });

    it('should not display caption when alt_text is null', () => {
      render(<GalleryLightbox {...defaultProps} initialIndex={2} />);

      // The photo has no alt_text, so no caption paragraph should be rendered
      // Only the alt attribute on the image itself
      const image = screen.getByAltText('Test Campsite photo 3');
      expect(image).toBeInTheDocument();

      // Caption paragraph should not exist for photos without alt_text
      const dialog = screen.getByRole('dialog');
      const captionParagraph = dialog.querySelector('.absolute.bottom-20 p');
      expect(captionParagraph).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<GalleryLightbox {...defaultProps} />);

      const dialog = screen.getByRole('dialog', { name: 'Photo gallery' });
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have proper button labels', () => {
      render(<GalleryLightbox {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Close gallery' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous photo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next photo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    });
  });
});
