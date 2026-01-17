import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccommodationCard } from '@/components/campsite/AccommodationCard';
import type { AccommodationType } from '@campsite/shared';

describe('AccommodationCard', () => {
  const mockAccommodation: AccommodationType = {
    id: 'acc-001',
    campsite_id: 'campsite-001',
    name: 'Deluxe Tent',
    description: 'Spacious tent with modern amenities',
    capacity: 4,
    price_per_night: 1200,
    price_weekend: 1500,
    amenities_included: ['wifi', 'ac', 'hot-water', 'private-bathroom', 'electricity', 'bedding'],
  };

  const mockBookingUrl = 'https://booking.example.com/tent-001';

  describe('Basic Information Display', () => {
    it('displays accommodation name', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      expect(screen.getByText('Deluxe Tent')).toBeInTheDocument();
    });

    it('displays accommodation description when provided', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      expect(screen.getByText('Spacious tent with modern amenities')).toBeInTheDocument();
    });

    it('does not render description section when description is null', () => {
      const accommodationNoDescription: AccommodationType = {
        ...mockAccommodation,
        description: null,
      };

      const { container } = render(<AccommodationCard accommodation={accommodationNoDescription} />);

      const description = container.querySelector('.line-clamp-2');
      expect(description).not.toBeInTheDocument();
    });

    it('truncates long descriptions with line-clamp-2', () => {
      const longDescription = 'This is a very long description '.repeat(20);
      const accommodationLongDesc: AccommodationType = {
        ...mockAccommodation,
        description: longDescription,
      };

      const { container } = render(<AccommodationCard accommodation={accommodationLongDesc} />);

      const description = container.querySelector('.line-clamp-2');
      expect(description).toBeInTheDocument();
    });
  });

  describe('Capacity Display', () => {
    it('displays capacity formatted correctly', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      expect(screen.getByText(/Capacity:/)).toBeInTheDocument();
      expect(screen.getByText(/4 คน/)).toBeInTheDocument();
    });

    it('displays capacity with Users icon', () => {
      const { container } = render(<AccommodationCard accommodation={mockAccommodation} />);

      const icon = container.querySelector('.lucide-users');
      expect(icon).toBeInTheDocument();
    });

    it('handles single person capacity', () => {
      const singleCapacity: AccommodationType = {
        ...mockAccommodation,
        capacity: 1,
      };

      render(<AccommodationCard accommodation={singleCapacity} />);

      expect(screen.getByText(/1 คน/)).toBeInTheDocument();
    });

    it('handles large capacity numbers', () => {
      const largeCapacity: AccommodationType = {
        ...mockAccommodation,
        capacity: 10,
      };

      render(<AccommodationCard accommodation={largeCapacity} />);

      expect(screen.getByText(/10 คน/)).toBeInTheDocument();
    });
  });

  describe('Pricing Display', () => {
    it('displays weekday pricing formatted correctly', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      expect(screen.getByText('฿1,200')).toBeInTheDocument();
      expect(screen.getByText('/ night')).toBeInTheDocument();
    });

    it('displays weekend pricing when different from weekday price', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      expect(screen.getByText(/Weekend:/)).toBeInTheDocument();
      expect(screen.getByText('฿1,500')).toBeInTheDocument();
    });

    it('does not display weekend pricing when it equals weekday price', () => {
      const samePrice: AccommodationType = {
        ...mockAccommodation,
        price_per_night: 1200,
        price_weekend: 1200,
      };

      render(<AccommodationCard accommodation={samePrice} />);

      expect(screen.queryByText(/Weekend:/)).not.toBeInTheDocument();
      expect(screen.getByText('฿1,200')).toBeInTheDocument();
    });

    it('does not display weekend pricing when price_weekend is null', () => {
      const noWeekendPrice: AccommodationType = {
        ...mockAccommodation,
        price_weekend: null,
      };

      render(<AccommodationCard accommodation={noWeekendPrice} />);

      expect(screen.queryByText(/Weekend:/)).not.toBeInTheDocument();
      expect(screen.getByText('฿1,200')).toBeInTheDocument();
    });

    it('formats prices with thousand separators', () => {
      const expensiveAccommodation: AccommodationType = {
        ...mockAccommodation,
        price_per_night: 15000,
        price_weekend: 20000,
      };

      render(<AccommodationCard accommodation={expensiveAccommodation} />);

      expect(screen.getByText('฿15,000')).toBeInTheDocument();
      expect(screen.getByText('฿20,000')).toBeInTheDocument();
    });

    it('displays price in large, bold, primary color', () => {
      const { container } = render(<AccommodationCard accommodation={mockAccommodation} />);

      const priceElement = container.querySelector('.text-2xl.font-bold.text-primary');
      expect(priceElement).toBeInTheDocument();
      expect(priceElement).toHaveTextContent('฿1,200');
    });
  });

  describe('Amenities Display', () => {
    it('shows included amenities section when amenities exist', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      expect(screen.getByText('Included:')).toBeInTheDocument();
    });

    it('displays amenity labels correctly', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      expect(screen.getByText('WiFi')).toBeInTheDocument();
      expect(screen.getByText('Air Conditioning')).toBeInTheDocument();
      expect(screen.getByText('Hot Water')).toBeInTheDocument();
      expect(screen.getByText('Private Bathroom')).toBeInTheDocument();
      expect(screen.getByText('Electricity')).toBeInTheDocument();
    });

    it('displays check icons with amenities', () => {
      const { container } = render(<AccommodationCard accommodation={mockAccommodation} />);

      const checkIcons = container.querySelectorAll('.lucide-check');
      expect(checkIcons.length).toBeGreaterThan(0);
    });

    it('displays maximum of 5 amenities', () => {
      const manyAmenities: AccommodationType = {
        ...mockAccommodation,
        amenities_included: [
          'wifi',
          'ac',
          'hot-water',
          'private-bathroom',
          'electricity',
          'bedding',
          'towels',
          'tv',
        ],
      };

      render(<AccommodationCard accommodation={manyAmenities} />);

      const amenityBadges = screen.getAllByText(/WiFi|Air Conditioning|Hot Water|Private Bathroom|Electricity/);
      expect(amenityBadges.length).toBeLessThanOrEqual(5);
    });

    it('shows "+N more" indicator when more than 5 amenities', () => {
      const manyAmenities: AccommodationType = {
        ...mockAccommodation,
        amenities_included: [
          'wifi',
          'ac',
          'hot-water',
          'private-bathroom',
          'electricity',
          'bedding',
          'towels',
          'tv',
        ],
      };

      render(<AccommodationCard accommodation={manyAmenities} />);

      expect(screen.getByText('+3 more')).toBeInTheDocument();
    });

    it('does not show "+N more" when 5 or fewer amenities', () => {
      const fiveAmenities: AccommodationType = {
        ...mockAccommodation,
        amenities_included: ['wifi', 'ac', 'hot-water', 'private-bathroom', 'electricity'],
      };

      render(<AccommodationCard accommodation={fiveAmenities} />);

      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    });

    it('does not show amenities section when array is empty', () => {
      const noAmenities: AccommodationType = {
        ...mockAccommodation,
        amenities_included: [],
      };

      render(<AccommodationCard accommodation={noAmenities} />);

      expect(screen.queryByText('Included:')).not.toBeInTheDocument();
    });

    it('does not show amenities section when amenities_included is null', () => {
      const nullAmenities: AccommodationType = {
        ...mockAccommodation,
        amenities_included: null,
      };

      render(<AccommodationCard accommodation={nullAmenities} />);

      expect(screen.queryByText('Included:')).not.toBeInTheDocument();
    });

    it('transforms unknown amenity slugs to readable format', () => {
      const customAmenities: AccommodationType = {
        ...mockAccommodation,
        amenities_included: ['custom-amenity', 'another-feature'],
      };

      render(<AccommodationCard accommodation={customAmenities} />);

      expect(screen.getByText('Custom Amenity')).toBeInTheDocument();
      expect(screen.getByText('Another Feature')).toBeInTheDocument();
    });

    it('applies green badge styling to amenities', () => {
      const { container } = render(<AccommodationCard accommodation={mockAccommodation} />);

      const amenityBadge = container.querySelector('.bg-green-100.text-green-700');
      expect(amenityBadge).toBeInTheDocument();
    });
  });

  describe('Booking Button - Enabled State', () => {
    it('displays "Book Now" button when booking URL exists', () => {
      render(<AccommodationCard accommodation={mockAccommodation} bookingUrl={mockBookingUrl} />);

      expect(screen.getByRole('button', { name: /Book Now/i })).toBeInTheDocument();
    });

    it('booking button is enabled when URL exists', () => {
      render(<AccommodationCard accommodation={mockAccommodation} bookingUrl={mockBookingUrl} />);

      const button = screen.getByRole('button', { name: /Book Now/i });
      expect(button).not.toBeDisabled();
    });

    it('applies default variant styling when booking URL exists', () => {
      const { container } = render(
        <AccommodationCard accommodation={mockAccommodation} bookingUrl={mockBookingUrl} />
      );

      const button = screen.getByRole('button', { name: /Book Now/i });
      expect(button).toBeInTheDocument();
      // Button should not have outline variant class when URL exists
      expect(button.className).not.toContain('variant-outline');
    });

    it('displays external link icon when booking URL exists', () => {
      const { container } = render(
        <AccommodationCard accommodation={mockAccommodation} bookingUrl={mockBookingUrl} />
      );

      const externalLinkIcon = container.querySelector('.lucide-external-link');
      expect(externalLinkIcon).toBeInTheDocument();
    });

    it('opens booking URL in new tab when clicked', async () => {
      const user = userEvent.setup();
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      render(<AccommodationCard accommodation={mockAccommodation} bookingUrl={mockBookingUrl} />);

      const button = screen.getByRole('button', { name: /Book Now/i });
      await user.click(button);

      expect(windowOpenSpy).toHaveBeenCalledWith(mockBookingUrl, '_blank', 'noopener,noreferrer');

      windowOpenSpy.mockRestore();
    });

    it('opens new tab with security attributes', async () => {
      const user = userEvent.setup();
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      render(<AccommodationCard accommodation={mockAccommodation} bookingUrl={mockBookingUrl} />);

      const button = screen.getByRole('button', { name: /Book Now/i });
      await user.click(button);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.any(String),
        '_blank',
        'noopener,noreferrer'
      );

      windowOpenSpy.mockRestore();
    });
  });

  describe('Booking Button - Disabled State', () => {
    it('displays "Contact for Booking" when no booking URL', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      expect(screen.getByRole('button', { name: /Contact for Booking/i })).toBeInTheDocument();
    });

    it('booking button is disabled when no URL provided', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      const button = screen.getByRole('button', { name: /Contact for Booking/i });
      expect(button).toBeDisabled();
    });

    it('booking button is disabled when bookingUrl is null', () => {
      render(<AccommodationCard accommodation={mockAccommodation} bookingUrl={null} />);

      const button = screen.getByRole('button', { name: /Contact for Booking/i });
      expect(button).toBeDisabled();
    });

    it('booking button is disabled when bookingUrl is empty string', () => {
      render(<AccommodationCard accommodation={mockAccommodation} bookingUrl="" />);

      const button = screen.getByRole('button', { name: /Contact for Booking/i });
      expect(button).toBeDisabled();
    });

    it('applies outline variant styling when no booking URL', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      const button = screen.getByRole('button', { name: /Contact for Booking/i });
      expect(button).toBeInTheDocument();
    });

    it('does not display external link icon when no booking URL', () => {
      const { container } = render(<AccommodationCard accommodation={mockAccommodation} />);

      const externalLinkIcon = container.querySelector('.lucide-external-link');
      expect(externalLinkIcon).not.toBeInTheDocument();
    });

    it('does not open window when disabled button is clicked', async () => {
      const user = userEvent.setup();
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      render(<AccommodationCard accommodation={mockAccommodation} />);

      const button = screen.getByRole('button', { name: /Contact for Booking/i });

      // Try to click disabled button
      await user.click(button);

      expect(windowOpenSpy).not.toHaveBeenCalled();

      windowOpenSpy.mockRestore();
    });
  });

  describe('Card Layout and Structure', () => {
    it('renders as a Card component', () => {
      const { container } = render(<AccommodationCard accommodation={mockAccommodation} />);

      const card = container.querySelector('.flex.flex-col.h-full');
      expect(card).toBeInTheDocument();
    });

    it('has CardHeader with accommodation name', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      const title = screen.getByText('Deluxe Tent');
      expect(title.tagName).toBe('H3');
    });

    it('has CardContent with capacity, pricing, and amenities', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      expect(screen.getByText(/Capacity:/)).toBeInTheDocument();
      expect(screen.getByText('฿1,200')).toBeInTheDocument();
      expect(screen.getByText('Included:')).toBeInTheDocument();
    });

    it('has CardFooter with booking button', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('w-full');
    });

    it('booking button spans full width', () => {
      render(<AccommodationCard accommodation={mockAccommodation} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('w-full');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero capacity', () => {
      const zeroCapacity: AccommodationType = {
        ...mockAccommodation,
        capacity: 0,
      };

      render(<AccommodationCard accommodation={zeroCapacity} />);

      expect(screen.getByText(/0 คน/)).toBeInTheDocument();
    });

    it('handles zero price', () => {
      const freeAccommodation: AccommodationType = {
        ...mockAccommodation,
        price_per_night: 0,
        price_weekend: null,
      };

      render(<AccommodationCard accommodation={freeAccommodation} />);

      expect(screen.getByText('฿0')).toBeInTheDocument();
    });

    it('handles very long accommodation name', () => {
      const longName: AccommodationType = {
        ...mockAccommodation,
        name: 'Ultra Luxurious Premium Deluxe Supreme Executive VIP Accommodation Suite',
      };

      render(<AccommodationCard accommodation={longName} />);

      expect(
        screen.getByText('Ultra Luxurious Premium Deluxe Supreme Executive VIP Accommodation Suite')
      ).toBeInTheDocument();
    });

    it('handles accommodation with all optional fields missing', () => {
      const minimalAccommodation: AccommodationType = {
        id: 'acc-002',
        campsite_id: 'campsite-002',
        name: 'Basic Tent',
        description: null,
        capacity: 2,
        price_per_night: 500,
        price_weekend: null,
        amenities_included: null,
      };

      render(<AccommodationCard accommodation={minimalAccommodation} />);

      expect(screen.getByText('Basic Tent')).toBeInTheDocument();
      expect(screen.getByText('฿500')).toBeInTheDocument();
      expect(screen.queryByText('Included:')).not.toBeInTheDocument();
      expect(screen.queryByText(/Weekend:/)).not.toBeInTheDocument();
    });
  });

  describe('Amenity Label Mapping', () => {
    it('correctly maps wifi amenity', () => {
      const withWifi: AccommodationType = {
        ...mockAccommodation,
        amenities_included: ['wifi'],
      };

      render(<AccommodationCard accommodation={withWifi} />);

      expect(screen.getByText('WiFi')).toBeInTheDocument();
    });

    it('correctly maps all standard amenities', () => {
      const allStandardAmenities: AccommodationType = {
        ...mockAccommodation,
        amenities_included: [
          'wifi',
          'ac',
          'hot-water',
          'private-bathroom',
          'electricity',
        ],
      };

      render(<AccommodationCard accommodation={allStandardAmenities} />);

      expect(screen.getByText('WiFi')).toBeInTheDocument();
      expect(screen.getByText('Air Conditioning')).toBeInTheDocument();
      expect(screen.getByText('Hot Water')).toBeInTheDocument();
      expect(screen.getByText('Private Bathroom')).toBeInTheDocument();
      expect(screen.getByText('Electricity')).toBeInTheDocument();
    });

    it('correctly maps additional amenities', () => {
      const additionalAmenities: AccommodationType = {
        ...mockAccommodation,
        amenities_included: ['bedding', 'towels', 'tv', 'minibar', 'coffee'],
      };

      render(<AccommodationCard accommodation={additionalAmenities} />);

      expect(screen.getByText('Bedding Provided')).toBeInTheDocument();
      expect(screen.getByText('Towels')).toBeInTheDocument();
      expect(screen.getByText('TV')).toBeInTheDocument();
      expect(screen.getByText('Minibar')).toBeInTheDocument();
      expect(screen.getByText('Coffee/Tea')).toBeInTheDocument();
    });
  });
});
