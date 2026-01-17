import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AmenitiesFilter } from '@/components/search/AmenitiesFilter';
import type { Amenity } from '@campsite/shared';

// Mock the useAmenities hook
const mockUseAmenities = jest.fn();
jest.mock('@/hooks/useCampsites', () => ({
  useAmenities: () => mockUseAmenities(),
}));

// Mock the AmenityIcon component
jest.mock('@/components/ui/AmenityIcon', () => ({
  AmenityIcon: ({ icon, size }: { icon: string; size: string }) => (
    <span data-testid={`amenity-icon-${icon}`} data-size={size}>
      {icon}
    </span>
  ),
}));

describe('AmenitiesFilter Component', () => {
  const mockOnChange = jest.fn();

  const mockAmenitiesData: Record<string, Amenity[]> = {
    basic: [
      {
        id: '1',
        slug: 'wifi',
        name_th: 'WiFi',
        name_en: 'WiFi',
        icon: 'wifi',
        category: 'basic',
        is_active: true,
      },
      {
        id: '2',
        slug: 'parking',
        name_th: 'ที่จอดรถ',
        name_en: 'Parking',
        icon: 'parking',
        category: 'basic',
        is_active: true,
      },
    ],
    comfort: [
      {
        id: '3',
        slug: 'air-conditioning',
        name_th: 'เครื่องปรับอากาศ',
        name_en: 'Air Conditioning',
        icon: 'air-conditioning',
        category: 'comfort',
        is_active: true,
      },
    ],
    food: [
      {
        id: '4',
        slug: 'restaurant',
        name_th: 'ร้านอาหาร',
        name_en: 'Restaurant',
        icon: 'restaurant',
        category: 'food',
        is_active: true,
      },
    ],
  };

  beforeEach(() => {
    mockOnChange.mockClear();
    mockUseAmenities.mockReturnValue({
      amenities: mockAmenitiesData,
      isLoading: false,
      error: null,
    });
  });

  it('renders all amenity checkboxes grouped by category', () => {
    render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    // Check category headers
    expect(screen.getByText('สิ่งอำนวยความสะดวกพื้นฐาน')).toBeInTheDocument();
    expect(screen.getByText('ความสะดวกสบาย')).toBeInTheDocument();
    expect(screen.getByText('อาหารและเครื่องดื่ม')).toBeInTheDocument();

    // Basic category should be expanded by default
    expect(screen.getByText('WiFi')).toBeInTheDocument();
    expect(screen.getByText('ที่จอดรถ')).toBeInTheDocument();
  });

  it('each amenity has correct icon', () => {
    render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    // Check that icons are rendered with correct props
    expect(screen.getByTestId('amenity-icon-wifi')).toBeInTheDocument();
    expect(screen.getByTestId('amenity-icon-parking')).toBeInTheDocument();

    // Check icon size
    expect(screen.getByTestId('amenity-icon-wifi')).toHaveAttribute('data-size', 'sm');
  });

  it('clicking checkbox toggles selection', () => {
    render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    const wifiLabel = screen.getByText('WiFi').closest('label') as HTMLElement;
    const wifiCheckbox = wifiLabel.querySelector('input') as HTMLInputElement;
    expect(wifiCheckbox).not.toBeChecked();

    fireEvent.click(wifiCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(['wifi']);
  });

  it('multiple amenities can be selected', () => {
    const { rerender } = render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    // Select first amenity
    const wifiLabel = screen.getByText('WiFi').closest('label') as HTMLElement;
    const wifiCheckbox = wifiLabel.querySelector('input') as HTMLInputElement;
    fireEvent.click(wifiCheckbox);
    expect(mockOnChange).toHaveBeenCalledWith(['wifi']);

    // Rerender with first selection
    rerender(
      <AmenitiesFilter selectedAmenities={['wifi']} onChange={mockOnChange} />
    );

    // Select second amenity
    const parkingLabel = screen.getByText('ที่จอดรถ').closest('label') as HTMLElement;
    const parkingCheckbox = parkingLabel.querySelector('input') as HTMLInputElement;
    fireEvent.click(parkingCheckbox);
    expect(mockOnChange).toHaveBeenCalledWith(['wifi', 'parking']);
  });

  it('selected amenities are visually checked', () => {
    render(
      <AmenitiesFilter
        selectedAmenities={['wifi', 'parking']}
        onChange={mockOnChange}
      />
    );

    const wifiLabel = screen.getByText('WiFi').closest('label') as HTMLElement;
    const wifiCheckbox = wifiLabel.querySelector('input') as HTMLInputElement;
    const parkingLabel = screen.getByText('ที่จอดรถ').closest('label') as HTMLElement;
    const parkingCheckbox = parkingLabel.querySelector('input') as HTMLInputElement;

    expect(wifiCheckbox).toBeChecked();
    expect(parkingCheckbox).toBeChecked();

    // Check visual styling
    expect(wifiLabel).toHaveClass('bg-green-50', 'text-green-700');
  });

  it('onChange callback fires with updated array when deselecting', () => {
    render(
      <AmenitiesFilter
        selectedAmenities={['wifi', 'parking']}
        onChange={mockOnChange}
      />
    );

    const wifiLabel = screen.getByText('WiFi').closest('label') as HTMLElement;
    const wifiCheckbox = wifiLabel.querySelector('input') as HTMLInputElement;
    fireEvent.click(wifiCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(['parking']);
  });

  it('clear all button deselects all amenities', () => {
    render(
      <AmenitiesFilter
        selectedAmenities={['wifi', 'parking']}
        onChange={mockOnChange}
      />
    );

    const clearButton = screen.getByText(/ล้างทั้งหมด/);
    expect(clearButton).toBeInTheDocument();
    expect(clearButton).toHaveTextContent('ล้างทั้งหมด (2)');

    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('clear all button only appears when amenities are selected', () => {
    const { rerender } = render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    expect(screen.queryByText(/ล้างทั้งหมด/)).not.toBeInTheDocument();

    rerender(
      <AmenitiesFilter
        selectedAmenities={['wifi']}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText(/ล้างทั้งหมด/)).toBeInTheDocument();
  });

  it('categories can be expanded and collapsed', () => {
    render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    // Comfort category should be collapsed initially
    expect(screen.queryByText('เครื่องปรับอากาศ')).not.toBeInTheDocument();

    // Click to expand
    const comfortHeader = screen.getByText('ความสะดวกสบาย');
    fireEvent.click(comfortHeader);

    expect(screen.getByText('เครื่องปรับอากาศ')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(comfortHeader);

    expect(screen.queryByText('เครื่องปรับอากาศ')).not.toBeInTheDocument();
  });

  it('displays selected count badge on category header', () => {
    render(
      <AmenitiesFilter
        selectedAmenities={['wifi', 'parking']}
        onChange={mockOnChange}
      />
    );

    const basicCategoryHeader = screen.getByText('สิ่งอำนวยความสะดวกพื้นฐาน').parentElement;
    expect(basicCategoryHeader).toHaveTextContent('2');

    const badge = basicCategoryHeader?.querySelector('.bg-green-100');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('2');
  });

  it('category header shows no badge when no amenities selected', () => {
    render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    const basicCategoryHeader = screen.getByText('สิ่งอำนวยความสะดวกพื้นฐาน').parentElement;
    const badge = basicCategoryHeader?.querySelector('.bg-green-100');
    expect(badge).not.toBeInTheDocument();
  });

  it('shows loading skeleton when data is loading', () => {
    mockUseAmenities.mockReturnValue({
      amenities: {},
      isLoading: true,
      error: null,
    });

    render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    // Should show multiple skeleton elements
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error message when data fails to load', () => {
    mockUseAmenities.mockReturnValue({
      amenities: {},
      isLoading: false,
      error: 'Failed to fetch amenities',
    });

    render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    expect(screen.getByText('ไม่สามารถโหลดสิ่งอำนวยความสะดวกได้')).toBeInTheDocument();
  });

  it('displays help text about multi-select behavior', () => {
    render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    expect(
      screen.getByText('เลือกหลายรายการจะแสดงเฉพาะที่พักที่มีครบทุกรายการ')
    ).toBeInTheDocument();
  });

  it('basic category is expanded by default', () => {
    render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    // Items in basic category should be visible
    expect(screen.getByText('WiFi')).toBeInTheDocument();
    expect(screen.getByText('ที่จอดรถ')).toBeInTheDocument();

    // Items in other categories should not be visible
    expect(screen.queryByText('เครื่องปรับอากาศ')).not.toBeInTheDocument();
  });

  it('category chevron rotates when expanded', () => {
    render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    const comfortHeader = screen.getByText('ความสะดวกสบาย').parentElement;
    const chevron = comfortHeader?.querySelector('svg');

    // Initially not rotated
    expect(chevron).not.toHaveClass('rotate-180');

    // Click to expand
    fireEvent.click(screen.getByText('ความสะดวกสบาย'));

    // Now should be rotated
    expect(chevron).toHaveClass('rotate-180');
  });

  it('applies custom className', () => {
    const { container } = render(
      <AmenitiesFilter
        selectedAmenities={[]}
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('renders all categories in correct order', () => {
    render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    const categoryHeaders = screen.getAllByRole('button').filter(
      (button) => button.textContent?.includes('สิ่งอำนวยความสะดวก') ||
                 button.textContent?.includes('ความสะดวกสบาย') ||
                 button.textContent?.includes('อาหารและเครื่องดื่ม')
    );

    expect(categoryHeaders.length).toBe(3);
  });

  it('handles empty amenities data gracefully', () => {
    mockUseAmenities.mockReturnValue({
      amenities: {},
      isLoading: false,
      error: null,
    });

    render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    // Should render without errors
    expect(screen.getByText('สิ่งอำนวยความสะดวก')).toBeInTheDocument();
  });

  it('preserves category expansion state when selections change', () => {
    const { rerender } = render(
      <AmenitiesFilter selectedAmenities={[]} onChange={mockOnChange} />
    );

    // Expand comfort category
    fireEvent.click(screen.getByText('ความสะดวกสบาย'));
    expect(screen.getByText('เครื่องปรับอากาศ')).toBeInTheDocument();

    // Select an amenity
    rerender(
      <AmenitiesFilter
        selectedAmenities={['wifi']}
        onChange={mockOnChange}
      />
    );

    // Comfort category should still be expanded
    expect(screen.getByText('เครื่องปรับอากาศ')).toBeInTheDocument();
  });
});
