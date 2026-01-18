import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingSidebar } from '@/components/campsite/BookingSidebar';
import type { CampsiteDetail } from '@campsite/shared';

// Mock fetch globally
global.fetch = jest.fn();

describe('BookingButton', () => {
  const baseCampsite: CampsiteDetail = {
    id: 'campsite-1',
    name: 'Test Campsite',
    slug: 'test-campsite',
    description: 'Test description',
    province: 'Bangkok',
    district: 'Test District',
    sub_district: 'Test Sub',
    postal_code: '10000',
    latitude: 13.7563,
    longitude: 100.5018,
    min_price: 500,
    max_price: 1500,
    check_in_time: '14:00',
    check_out_time: '11:00',
    facilities: [],
    accommodation_types: [],
    images: [],
    average_rating: 4.5,
    review_count: 10,
    is_active: true,
    approved_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner: {
      id: 'owner-1',
      full_name: 'Test Owner',
      email: 'owner@test.com',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  describe('Rendering states', () => {
    it('renders booking link when URL available', () => {
      const campsite = {
        ...baseCampsite,
        booking_url: 'https://booking.example.com',
      };

      render(<BookingSidebar campsite={campsite} />);

      const button = screen.getByRole('button', { name: /book now/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('renders phone link when no URL but phone available', () => {
      const campsite = {
        ...baseCampsite,
        phone: '0812345678',
      };

      render(<BookingSidebar campsite={campsite} />);

      const link = screen.getByRole('link', { name: /call to book/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'tel:0812345678');
    });

    it('renders disabled state when neither available', () => {
      render(<BookingSidebar campsite={baseCampsite} />);

      const button = screen.getByRole('button', { name: /no booking available/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('shows proper button text for booking URL', () => {
      const campsite = {
        ...baseCampsite,
        booking_url: 'https://booking.example.com',
      };

      render(<BookingSidebar campsite={campsite} />);

      expect(screen.getByText('Book Now')).toBeInTheDocument();
    });

    it('shows proper button text for phone', () => {
      const campsite = {
        ...baseCampsite,
        phone: '0812345678',
      };

      render(<BookingSidebar campsite={campsite} />);

      expect(screen.getByText('Call to Book')).toBeInTheDocument();
    });

    it('shows proper button text when disabled', () => {
      render(<BookingSidebar campsite={baseCampsite} />);

      expect(screen.getByText('No Booking Available')).toBeInTheDocument();
    });
  });

  describe('External link behavior', () => {
    it('opens booking URL in new tab with security attributes', async () => {
      const user = userEvent.setup();
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();

      const campsite = {
        ...baseCampsite,
        booking_url: 'https://booking.example.com',
      };

      render(<BookingSidebar campsite={campsite} />);

      const button = screen.getByRole('button', { name: /book now/i });
      await user.click(button);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://booking.example.com',
        '_blank',
        'noopener,noreferrer'
      );

      windowOpenSpy.mockRestore();
    });

    it('prefers booking URL over phone when both available', () => {
      const campsite = {
        ...baseCampsite,
        booking_url: 'https://booking.example.com',
        phone: '0812345678',
      };

      render(<BookingSidebar campsite={campsite} />);

      // Should show "Book Now" button, not "Call to Book"
      expect(screen.getByText('Book Now')).toBeInTheDocument();
      expect(screen.queryByText('Call to Book')).not.toBeInTheDocument();
    });
  });

  describe('Phone link', () => {
    it('phone link has tel: protocol', () => {
      const campsite = {
        ...baseCampsite,
        phone: '0812345678',
      };

      render(<BookingSidebar campsite={campsite} />);

      const link = screen.getByRole('link', { name: /call to book/i });
      expect(link).toHaveAttribute('href', 'tel:0812345678');
    });

    it('phone number formatted correctly in link', () => {
      const campsite = {
        ...baseCampsite,
        phone: '02-123-4567',
      };

      render(<BookingSidebar campsite={campsite} />);

      const link = screen.getByRole('link', { name: /call to book/i });
      expect(link).toHaveAttribute('href', 'tel:02-123-4567');
    });

    it('handles phone number with spaces', () => {
      const campsite = {
        ...baseCampsite,
        phone: '081 234 5678',
      };

      render(<BookingSidebar campsite={campsite} />);

      const link = screen.getByRole('link', { name: /call to book/i });
      expect(link).toHaveAttribute('href', 'tel:081 234 5678');
    });
  });

  describe('Analytics tracking', () => {
    it('calls analytics on booking URL click', async () => {
      const user = userEvent.setup();
      jest.spyOn(window, 'open').mockImplementation();

      const campsite = {
        ...baseCampsite,
        booking_url: 'https://booking.example.com',
      };

      render(<BookingSidebar campsite={campsite} />);

      const button = screen.getByRole('button', { name: /book now/i });
      await user.click(button);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/track'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            campsite_id: 'campsite-1',
            event_type: 'booking_click',
          }),
        })
      );
    });

    it('calls analytics on phone click', async () => {
      const user = userEvent.setup();

      const campsite = {
        ...baseCampsite,
        phone: '0812345678',
      };

      render(<BookingSidebar campsite={campsite} />);

      const link = screen.getByRole('link', { name: /call to book/i });
      await user.click(link);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/track'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            campsite_id: 'campsite-1',
            event_type: 'booking_click',
          }),
        })
      );
    });

    it('does not block user action if analytics fails', async () => {
      const user = userEvent.setup();
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const campsite = {
        ...baseCampsite,
        booking_url: 'https://booking.example.com',
      };

      render(<BookingSidebar campsite={campsite} />);

      const button = screen.getByRole('button', { name: /book now/i });
      await user.click(button);

      // Should still open the booking URL even if analytics fails
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://booking.example.com',
        '_blank',
        'noopener,noreferrer'
      );

      windowOpenSpy.mockRestore();
    });

    it('does not call analytics when no booking option available', async () => {
      const user = userEvent.setup();

      render(<BookingSidebar campsite={baseCampsite} />);

      const button = screen.getByRole('button', { name: /no booking available/i });

      // Button is disabled, so click should not trigger
      expect(button).toBeDisabled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Additional UI elements', () => {
    it('renders Send Inquiry button', () => {
      render(<BookingSidebar campsite={baseCampsite} />);

      const inquiryButton = screen.getByRole('button', { name: /send inquiry/i });
      expect(inquiryButton).toBeInTheDocument();
    });

    it('calls onInquiry callback when inquiry button clicked', async () => {
      const user = userEvent.setup();
      const onInquiry = jest.fn();

      render(<BookingSidebar campsite={baseCampsite} onInquiry={onInquiry} />);

      const inquiryButton = screen.getByRole('button', { name: /send inquiry/i });
      await user.click(inquiryButton);

      expect(onInquiry).toHaveBeenCalledTimes(1);
    });

    it('displays price range', () => {
      render(<BookingSidebar campsite={baseCampsite} />);

      expect(screen.getByText(/price per night/i)).toBeInTheDocument();
    });

    it('displays rating when reviews exist', () => {
      render(<BookingSidebar campsite={baseCampsite} />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('10 reviews')).toBeInTheDocument();
    });
  });
});
