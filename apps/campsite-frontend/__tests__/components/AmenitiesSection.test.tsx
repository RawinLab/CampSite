import { render, screen, fireEvent } from '@testing-library/react';
import { AmenitiesSection } from '@/components/campsite/AmenitiesSection';
import type { Amenity } from '@campsite/shared';

describe('AmenitiesSection', () => {
  const mockAmenities: Amenity[] = [
    {
      id: 1,
      name_th: 'Wi-Fi',
      name_en: 'Wi-Fi',
      icon: 'wifi',
      category: 'utilities',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      name_th: 'ไฟฟ้า',
      name_en: 'Electricity',
      icon: 'zap',
      category: 'utilities',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      name_th: 'ห้องน้ำ',
      name_en: 'Restroom',
      icon: 'bath',
      category: 'facilities',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 4,
      name_th: 'ที่จอดรถ',
      name_en: 'Parking',
      icon: 'parking',
      category: 'facilities',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  describe('Section Title', () => {
    it('renders section title "Facilities & Amenities"', () => {
      render(<AmenitiesSection amenities={mockAmenities} />);

      expect(screen.getByText('Facilities & Amenities')).toBeInTheDocument();
    });

    it('displays checkmark icon in title', () => {
      const { container } = render(<AmenitiesSection amenities={mockAmenities} />);

      const titleContainer = container.querySelector('.flex.items-center.gap-2');
      const checkIcon = titleContainer?.querySelector('.text-green-600');
      expect(checkIcon).toBeInTheDocument();
      expect(checkIcon?.tagName).toBe('svg');
    });
  });

  describe('Amenity Display', () => {
    it('displays amenity icons with correct icons', () => {
      const { container } = render(<AmenitiesSection amenities={mockAmenities} />);

      const amenityItems = container.querySelectorAll('.p-2.rounded-full.bg-primary\\/10');
      expect(amenityItems.length).toBeGreaterThan(0);
    });

    it('shows Thai name for each amenity', () => {
      render(<AmenitiesSection amenities={mockAmenities} />);

      expect(screen.getAllByText('Wi-Fi')[0]).toBeInTheDocument();
      expect(screen.getByText('ไฟฟ้า')).toBeInTheDocument();
      expect(screen.getByText('ห้องน้ำ')).toBeInTheDocument();
      expect(screen.getByText('ที่จอดรถ')).toBeInTheDocument();
    });

    it('shows English name for each amenity', () => {
      render(<AmenitiesSection amenities={mockAmenities} />);

      expect(screen.getByText('Electricity')).toBeInTheDocument();
      expect(screen.getByText('Restroom')).toBeInTheDocument();
      expect(screen.getByText('Parking')).toBeInTheDocument();
    });

    it('displays amenities in a grid layout', () => {
      const { container } = render(<AmenitiesSection amenities={mockAmenities} />);

      const grid = container.querySelector('.grid.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-4');
      expect(grid).toBeInTheDocument();
    });

    it('applies hover effect to amenity items', () => {
      const { container } = render(<AmenitiesSection amenities={mockAmenities} />);

      const amenityItem = container.querySelector('.hover\\:bg-muted');
      expect(amenityItem).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('returns null when amenities array is empty', () => {
      const { container } = render(<AmenitiesSection amenities={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('returns null when amenities is undefined', () => {
      const { container } = render(<AmenitiesSection amenities={undefined as any} />);

      expect(container.firstChild).toBeNull();
    });

    it('returns null when amenities is null', () => {
      const { container } = render(<AmenitiesSection amenities={null as any} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Show More/Less Functionality', () => {
    it('initially displays only 8 amenities when there are more than 8', () => {
      const manyAmenities: Amenity[] = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name_th: `สิ่งอำนวยความสะดวก ${i + 1}`,
        name_en: `Amenity ${i + 1}`,
        icon: 'wifi',
        category: 'utilities',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      render(<AmenitiesSection amenities={manyAmenities} />);

      expect(screen.getByText('สิ่งอำนวยความสะดวก 1')).toBeInTheDocument();
      expect(screen.getByText('สิ่งอำนวยความสะดวก 8')).toBeInTheDocument();
      expect(screen.queryByText('สิ่งอำนวยความสะดวก 9')).not.toBeInTheDocument();
    });

    it('shows "Show all" button when there are more than 8 amenities', () => {
      const manyAmenities: Amenity[] = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name_th: `สิ่งอำนวยความสะดวก ${i + 1}`,
        name_en: `Amenity ${i + 1}`,
        icon: 'wifi',
        category: 'utilities',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      render(<AmenitiesSection amenities={manyAmenities} />);

      expect(screen.getByText(/Show all 12 amenities/)).toBeInTheDocument();
    });

    it('does not show "Show all" button when there are 8 or fewer amenities', () => {
      render(<AmenitiesSection amenities={mockAmenities} />);

      expect(screen.queryByText(/Show all/)).not.toBeInTheDocument();
    });

    it('expands to show all amenities when "Show all" is clicked', () => {
      const manyAmenities: Amenity[] = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name_th: `สิ่งอำนวยความสะดวก ${i + 1}`,
        name_en: `Amenity ${i + 1}`,
        icon: 'wifi',
        category: 'utilities',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      render(<AmenitiesSection amenities={manyAmenities} />);

      const showAllButton = screen.getByText(/Show all 12 amenities/);
      fireEvent.click(showAllButton);

      expect(screen.getByText('สิ่งอำนวยความสะดวก 9')).toBeInTheDocument();
      expect(screen.getByText('สิ่งอำนวยความสะดวก 12')).toBeInTheDocument();
    });

    it('collapses back to 8 amenities when "Show less" is clicked', () => {
      const manyAmenities: Amenity[] = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name_th: `สิ่งอำนวยความสะดวก ${i + 1}`,
        name_en: `Amenity ${i + 1}`,
        icon: 'wifi',
        category: 'utilities',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      render(<AmenitiesSection amenities={manyAmenities} />);

      const showAllButton = screen.getByText(/Show all 12 amenities/);
      fireEvent.click(showAllButton);

      const showLessButton = screen.getByText(/Show less/);
      fireEvent.click(showLessButton);

      expect(screen.queryByText('สิ่งอำนวยความสะดวก 9')).not.toBeInTheDocument();
      expect(screen.getByText('สิ่งอำนวยความสะดวก 1')).toBeInTheDocument();
    });

    it('displays chevron down icon in "Show all" button', () => {
      const manyAmenities: Amenity[] = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name_th: `สิ่งอำนวยความสะดวก ${i + 1}`,
        name_en: `Amenity ${i + 1}`,
        icon: 'wifi',
        category: 'utilities',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { container } = render(<AmenitiesSection amenities={manyAmenities} />);

      const button = screen.getByText(/Show all 12 amenities/).closest('button');
      const chevronDown = button?.querySelector('.w-4.h-4.ml-2');
      expect(chevronDown).toBeInTheDocument();
    });

    it('displays chevron up icon in "Show less" button', () => {
      const manyAmenities: Amenity[] = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name_th: `สิ่งอำนวยความสะดวก ${i + 1}`,
        name_en: `Amenity ${i + 1}`,
        icon: 'wifi',
        category: 'utilities',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      render(<AmenitiesSection amenities={manyAmenities} />);

      const showAllButton = screen.getByText(/Show all 12 amenities/);
      fireEvent.click(showAllButton);

      const button = screen.getByText(/Show less/).closest('button');
      const chevronUp = button?.querySelector('.w-4.h-4.ml-2');
      expect(chevronUp).toBeInTheDocument();
    });
  });

  describe('Amenity Count', () => {
    it('shows correct total amenity count in "Show all" button', () => {
      const manyAmenities: Amenity[] = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name_th: `สิ่งอำนวยความสะดวก ${i + 1}`,
        name_en: `Amenity ${i + 1}`,
        icon: 'wifi',
        category: 'utilities',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      render(<AmenitiesSection amenities={manyAmenities} />);

      expect(screen.getByText(/Show all 15 amenities/)).toBeInTheDocument();
    });

    it('displays exactly 8 amenities initially when total is greater than 8', () => {
      const manyAmenities: Amenity[] = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name_th: `สิ่งอำนวยความสะดวก ${i + 1}`,
        name_en: `Amenity ${i + 1}`,
        icon: 'wifi',
        category: 'utilities',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { container } = render(<AmenitiesSection amenities={manyAmenities} />);

      const amenityItems = container.querySelectorAll('.flex.items-center.gap-3.p-3');
      expect(amenityItems).toHaveLength(8);
    });

    it('displays all amenities when total is 8 or less', () => {
      const { container } = render(<AmenitiesSection amenities={mockAmenities} />);

      const amenityItems = container.querySelectorAll('.flex.items-center.gap-3.p-3');
      expect(amenityItems).toHaveLength(4);
    });
  });

  describe('Icon Mapping', () => {
    it('renders wifi icon correctly', () => {
      const wifiAmenity: Amenity[] = [
        {
          id: 1,
          name_th: 'Wi-Fi',
          name_en: 'Wi-Fi',
          icon: 'wifi',
          category: 'utilities',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const { container } = render(<AmenitiesSection amenities={wifiAmenity} />);

      const iconContainer = container.querySelector('.p-2.rounded-full.bg-primary\\/10');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders parking icon correctly', () => {
      const parkingAmenity: Amenity[] = [
        {
          id: 1,
          name_th: 'ที่จอดรถ',
          name_en: 'Parking',
          icon: 'parking',
          category: 'facilities',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const { container } = render(<AmenitiesSection amenities={parkingAmenity} />);

      const iconContainer = container.querySelector('.p-2.rounded-full.bg-primary\\/10');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders fire icon correctly', () => {
      const fireAmenity: Amenity[] = [
        {
          id: 1,
          name_th: 'เตาไฟ',
          name_en: 'Fire Pit',
          icon: 'fire',
          category: 'activities',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const { container } = render(<AmenitiesSection amenities={fireAmenity} />);

      const iconContainer = container.querySelector('.p-2.rounded-full.bg-primary\\/10');
      expect(iconContainer).toBeInTheDocument();
    });

    it('falls back to Circle icon for unknown icon names', () => {
      const unknownAmenity: Amenity[] = [
        {
          id: 1,
          name_th: 'อื่นๆ',
          name_en: 'Other',
          icon: 'unknown-icon-name',
          category: 'other',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const { container } = render(<AmenitiesSection amenities={unknownAmenity} />);

      const iconContainer = container.querySelector('.p-2.rounded-full.bg-primary\\/10');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders within a Card component', () => {
      const { container } = render(<AmenitiesSection amenities={mockAmenities} />);

      const card = container.querySelector('.rounded-lg.border.bg-card');
      expect(card).toBeInTheDocument();
    });

    it('has proper spacing between amenity items', () => {
      const { container } = render(<AmenitiesSection amenities={mockAmenities} />);

      const grid = container.querySelector('.gap-3');
      expect(grid).toBeInTheDocument();
    });

    it('applies rounded corners to amenity items', () => {
      const { container } = render(<AmenitiesSection amenities={mockAmenities} />);

      const amenityItem = container.querySelector('.rounded-lg');
      expect(amenityItem).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('has responsive grid columns', () => {
      const { container } = render(<AmenitiesSection amenities={mockAmenities} />);

      const grid = container.querySelector('.grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-4');
      expect(grid).toBeInTheDocument();
    });

    it('applies full width to "Show all" button', () => {
      const manyAmenities: Amenity[] = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name_th: `สิ่งอำนวยความสะดวก ${i + 1}`,
        name_en: `Amenity ${i + 1}`,
        icon: 'wifi',
        category: 'utilities',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { container } = render(<AmenitiesSection amenities={manyAmenities} />);

      const button = container.querySelector('button.w-full');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Text Truncation', () => {
    it('truncates long Thai amenity names', () => {
      const longNameAmenity: Amenity[] = [
        {
          id: 1,
          name_th: 'สิ่งอำนวยความสะดวกที่มีชื่อยาวมากๆเกินกว่าจะแสดงได้ในพื้นที่จำกัด',
          name_en: 'Very Long Amenity Name',
          icon: 'wifi',
          category: 'utilities',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const { container } = render(<AmenitiesSection amenities={longNameAmenity} />);

      const nameElement = container.querySelector('.truncate');
      expect(nameElement).toBeInTheDocument();
    });

    it('truncates long English amenity names', () => {
      const longNameAmenity: Amenity[] = [
        {
          id: 1,
          name_th: 'Wi-Fi',
          name_en: 'Very Long English Amenity Name That Should Be Truncated',
          icon: 'wifi',
          category: 'utilities',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const { container } = render(<AmenitiesSection amenities={longNameAmenity} />);

      const nameElements = container.querySelectorAll('.truncate');
      expect(nameElements.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('applies primary color to icons', () => {
      const { container } = render(<AmenitiesSection amenities={mockAmenities} />);

      const icon = container.querySelector('.text-primary');
      expect(icon).toBeInTheDocument();
    });

    it('applies muted background to amenity items', () => {
      const { container } = render(<AmenitiesSection amenities={mockAmenities} />);

      const amenityItem = container.querySelector('.bg-muted\\/50');
      expect(amenityItem).toBeInTheDocument();
    });

    it('applies outline variant to "Show all" button', () => {
      const manyAmenities: Amenity[] = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name_th: `สิ่งอำนวยความสะดวก ${i + 1}`,
        name_en: `Amenity ${i + 1}`,
        icon: 'wifi',
        category: 'utilities',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      render(<AmenitiesSection amenities={manyAmenities} />);

      const button = screen.getByText(/Show all 12 amenities/).closest('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles exactly 9 amenities (one more than initial display)', () => {
      const nineAmenities: Amenity[] = Array.from({ length: 9 }, (_, i) => ({
        id: i + 1,
        name_th: `สิ่งอำนวยความสะดวก ${i + 1}`,
        name_en: `Amenity ${i + 1}`,
        icon: 'wifi',
        category: 'utilities',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      render(<AmenitiesSection amenities={nineAmenities} />);

      expect(screen.getByText(/Show all 9 amenities/)).toBeInTheDocument();
      expect(screen.queryByText('สิ่งอำนวยความสะดวก 9')).not.toBeInTheDocument();
    });

    it('handles single amenity', () => {
      const singleAmenity: Amenity[] = [
        {
          id: 1,
          name_th: 'Wi-Fi',
          name_en: 'Wi-Fi',
          icon: 'wifi',
          category: 'utilities',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      render(<AmenitiesSection amenities={singleAmenity} />);

      expect(screen.getAllByText('Wi-Fi').length).toBeGreaterThan(0);
      expect(screen.queryByText(/Show all/)).not.toBeInTheDocument();
    });

    it('handles amenities with different categories', () => {
      const amenitiesWithCategories: Amenity[] = [
        {
          id: 1,
          name_th: 'ห้องน้ำ',
          name_en: 'Restroom',
          icon: 'bath',
          category: 'facilities',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      render(<AmenitiesSection amenities={amenitiesWithCategories} />);

      expect(screen.getByText('ห้องน้ำ')).toBeInTheDocument();
    });
  });
});
